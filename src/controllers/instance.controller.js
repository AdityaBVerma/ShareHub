import mongoose, { isValidObjectId } from "mongoose";
import { Instance } from "../models/instance.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"


const getUserInstances = asyncHandler( async (req, res) => {
    const {userId} = req.params
    if (!(userId && isValidObject(userId))) {
        throw new ApiError(400, "Invalid User Id")
    }
    const instances = await Instance.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from: "groups",
                localField: "groups",
                foreignField: "_id",
                as: "groups",
                pipeline:[
                    {
                        $project: {
                            name: 1
                        }
                    }
                ]
            }
        },
        {
            $sort:{
                createdAt: 1
            }
        }
    ])
    if (!instances.length) {
        throw new ApiError(404, "No instances found at present")
    }
    return res
    .status(200)
    .json( new ApiResponse(200, instances, "instances fetched successfully"))
})

const createNewInstance = asyncHandler( async (req, res) => {
    const {title, password, description, isPrivate} = req.body
    const allowedPrivacy = ["public", "private"]
    if (!allowedPrivacy.includes(isPrivate)) {
        throw new ApiError(400, "Inctance must be either public or private")
    }
    if(!(isPrivate == "private" && password)){
        throw new ApiError(400, "Password is required")
    }
    const thubmnailLocalPath = req.file?.path
    if (title.trim()==="") {
        throw new ApiError(400, "Instance title needed")
    }
    let thumbnail
    if (thubmnailLocalPath) {
        thumbnail = await uploadOnCloudinary(thumbnail)
    }
    const instance = await Instance.create({
        title,
        password: isPrivate === "private" ? password : undefined, 
        description,
        thumbnail: thumbnail ? { url: thumbnail.url, public_id: thumbnail.public_id } : undefined,
    });

    if(!instance){
        throw new ApiError(400, "Instance not created")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, instance, "Instance created successfully"))

})

const changeInstancePassword = asyncHandler( async (req, res) => {
    const {oldPassword, newPassword} = req.body
    const {instanceId} = req.params

    if (!(instanceId && isValidObjectId(instanceId))) {
        throw new ApiError(400, "Invalid Instance Id")
    }

    const instance = await Instance.findById(instanceId)
    if(!instance){
        throw new ApiError(404, "Instance not found")
    }

    if (instance.owner.toString()!==req.user._id.toString()) {
        throw new ApiError(400, "You cannot perform this task")
    }

    const isPasswordCorrect = await instance.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "invalid old password")
    }

    instance.password = newPassword
    await instance.save({validateBeforeSave: false})

    return res
    .status(200)
    .json( new ApiResponse(200, {}, "Instance Password changed successfully"))

})

const getInstanceById = asyncHandler( async (req, res) => {
    const {password}  = req.body
    const {instanceId} = req.params
    if (!(instanceId && isValidObjectId(instanceId))) {
        throw new ApiError(400, "Invalid instance Id")
    }
    const instance = await Instance.findById(instanceId)
    if (!instance) {
        throw new ApiError(400, "Instance not found")
    }
    if (instance.isPrivate==="private" && password.trim()==="") {
        throw new ApiError(400, "Password is required")
    }
    if (instance.isPrivate==="private" && password.trim()!=="") {
        const isPasswordCorrect = await instance.isPasswordCorrect(password)
        if(!isPasswordCorrect){
            throw new ApiError(400, "Invalid password")
        }
    }
    const fetchedInstance = await Instance.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(instanceId)
            }
        },
        {
            $lookup:{
                from: "groups",
                localField: "groups",
                foreignField: "_id",
                as: "groups",
                pipeline:[
                    {
                        $lookup: {
                            from:"images",
                            localField:"imagefiles",
                            foreignField: "_id",
                            as: "images",
                            pipeline:[
                                {
                                    $project: {
                                        title: 1
                                    }
                                },
                                {
                                    $sort: {
                                        createdAt: -1
                                    }
                                },
                                {
                                    $limit: 5
                                }
                            ]
                        }
                    },
                    {
                        $lookup: {
                            from:"videos",
                            localField:"videofiles",
                            foreignField: "_id",
                            as: "videos",
                            pipeline:[
                                {
                                    $project: {
                                        title: 1
                                    }
                                },
                                {
                                    $sort: {
                                        createdAt: -1
                                    }
                                },
                                {
                                    $limit: 5
                                }
                            ]
                        }
                    },
                    {
                        $lookup: {
                            from:"docs",
                            localField:"docfiles",
                            foreignField: "_id",
                            as: "docs",
                            pipeline:[
                                {
                                    $project: {
                                        title: 1
                                    }
                                },
                                {
                                    $sort: {
                                        createdAt: -1
                                    }
                                },
                                {
                                    $limit: 5
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])
    if(!fetchedInstance.length){
        throw new ApiError(400, "Couldn'nt fetch Instance")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, fetchedInstance[0], "Instance fetched successfully"))
})

const updateInstance = asyncHandler( async (req, res) => {
    const {title}  = req.body
    const {instanceId} = req.params
    if (!(instanceId && isValidObjectId(instanceId))) {
        throw new ApiError(400, "invalid instance id")
    }
    const instance = await Instance.findById(instanceId)
    if (!instance) {
        throw new ApiError(400, "instance not found")
    }
    if(instance.owner.toString()!==req.user._id.toString()){
        throw new ApiError(400, "You cannot perform this action")
    }
    const thumbnailLocalPath = req.file?.path
    let thumbnail
    if (thumbnailLocalPath) {
        await deleteFromCloudinary(instance.thumbnail.public_id)
        thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    }
    const updatedInstance = await Instance.findByIdAndUpdate(
        instanceId,
        {
            $set: {
                title,
                thumbnail:{url: thumbnail?.url, public_id: thumbnail?.public_id}
            }
        },
        {
            new: true
        }
    ).select("-password")

    if(!updatedInstance){
        throw new ApiError(400, "could'nt update instance")
    }

    return res
    .status(200)
    .json( new ApiResponse(200, updatedInstance, "Instance updated successfully"))

})

const deleteInstance = asyncHandler( async (req, res) => {})

const toggleVisibilityStatus = asyncHandler(async (req, res) => {})

export {
    getUserInstances,
    createNewInstance,
    getInstanceById,
    updateInstance,
    deleteInstance,
    toggleVisibilityStatus,
    changeInstancePassword
}