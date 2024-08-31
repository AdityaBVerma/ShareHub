import mongoose, { isValidObjectId } from "mongoose";
import { Instance } from "../models/instance.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadOnCloudinary, deleteResourcesFromCloudinary } from "../utils/cloudinary.js"
import { Group } from "../models/group.model.js";
import { Image } from "../models/image.model.js";
import { Doc } from "../models/doc.model.js";
import { Video } from "../models/video.model.js";


const getUserInstances = asyncHandler( async (req, res) => {
    const {userId} = req.params
    if (!(userId && isValidObjectId(userId))) {
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
                localField: "_id",
                foreignField: "ownedInstance",
                as: "groups",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "users",
                            pipeline: [
                                {
                                    $project:{
                                        username: 1,
                                        avatar: 1,
                                        email: 1
                                    }
                                }
                            ]
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

const deleteInstance = asyncHandler( async (req, res) => {
    const {instanceId} = req.params
    if (!(instanceId && isValidObjectId(instanceId))) {
        throw new ApiError(400, "invalid instance id")
    }
    const instance = await Instance.findById(instanceId)
    if (instance.owner.toString()!==req.user._id.toString()) {
        throw new ApiError(400, "Unauthorized request")
    }
    // delete all resources and groups in it
    const fetchedInstance = await Instance.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId(instanceId)
            }
        },
        {
            $lookup: {
                from: "groups",
                localField: "_id",
                foreignField: "ownedInstance",
                as: "groups",
                pipeline: [
                    {
                        $lookup:{
                            from:"docs",
                            localField: "_id",
                            foreignField: "group",
                            as: "docs"
                        }
                    },
                    {
                        $lookup:{
                            from:"images",
                            localField: "_id",
                            foreignField: "group",
                            as: "images"
                        }
                    },
                    {
                        $lookup:{
                            from:"videos",
                            localField: "_id",
                            foreignField: "group",
                            as: "videos"
                        }
                    },
                ]
            }
        },
        {
            $lookup:{
                from:"comments",
                localField: "_id",
                foreignField: "commentOwner",
                as: "comments"
            }
        },
    ])
    if (!fetchedInstance.length) {
        throw new ApiError(400, "groups of the instance not found")
    }
    const instanceData = fetchedInstance[0]
    const docCollection = instanceData.groups.flatMap((groups)=>(groups.docs))
    const imageCollection = instanceData.groups.flatMap((groups)=>(groups.images))
    const videoCollection = instanceData.groups.flatMap((groups)=>(groups.videos))
    await deleteResourcesFromCloudinary(docCollection, 'document');
    await deleteResourcesFromCloudinary(imageCollection, 'image');
    await deleteResourcesFromCloudinary(videoCollection, 'video');
    
    const deletedGroups = await Group.deleteMany({ ownedInstance: instanceId })
    const deletedComments = await Comment.deleteMany({instance: instanceId})
    const groupId = fetchedInstance.groups.map((groups)=>(groups._id))
    const deletedImages = await Image.deleteMany({
        group: {$in : groupId}
    })
    const deletedVideos = await Video.deleteMany({
        group: {$in : groupId}
    })
    const deletedDocs = await Doc.deleteMany({
        group: {$in : groupId}
    })
    await Instance.findByIdAndDelete(instanceId);
    const ApiMessage = `${deletedGroups.deletedCount} groups deleted. ${deletedComments.deletedCount} comments deleted. ${deletedImages.deletedCount} images deleted.${deletedVideos.deletedCount} videos deleted. ${deletedDocs.deletedCount} docs deleted.`
    return res
    .status(200)
    .json(new ApiResponse(200, {}, ApiMessage))
})

const toggleVisibilityStatus = asyncHandler(async (req, res) => {
    const { instanceId } = req.params
    const {password} = req.body
    if (!(instanceId && isValidObjectId(instanceId))) {
        throw new ApiError(400, "Not a valid instance id")
    }
    const instance = await Instance.findById(instanceId)
    if (!instance) {
        throw new ApiError(404, "Instance not found")
    }
    if (instance.owner.toString()!==req.user._id.toString()) {
        throw new ApiError(401, "Unauthorized request")
    }
    if(instance.isPrivate==="public" && !password){
        throw new ApiError(400, "Password is required")
    }
    const updatedInstance = await Instance.findByIdAndUpdate(
        instanceId,
        {
            $set:{
                isPrivate: (instance.isPrivate === "public")? "private" : "public",
                password: (instance.isPrivate === "public")? password : ""
            }
        },
        {
            new: true
        }
    ).select("-password")

    if (!updatedInstance) {
        throw new ApiError(400, "There was a problem changing visibility status")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updatedInstance, "Visibility status changed successfully"))
})

export {
    getUserInstances,
    createNewInstance,
    getInstanceById,
    updateInstance,
    deleteInstance,
    toggleVisibilityStatus,
    changeInstancePassword
}