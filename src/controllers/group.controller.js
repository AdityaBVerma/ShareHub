import { isValidObjectId } from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Instance } from "../models/instance.model.js"
import { Group } from "../models/group.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createNewGroup = asyncHandler( async (req, res) => {
    const {instanceId} = req.params
    const { password, name } = req.body
    if (!(instanceId && isValidObjectId(instanceId))) {
        throw new ApiError(400, "Invalid instance Id")
    }
    const instance = await Instance.findById(instanceId)
    if (instance.owner.toString()!==req.user._id.toString()) {
        if (instance.isPrivate === "private") {
            if (!password || password.trim() === "") {
                throw new ApiError(400, "Password is required");
            }
            const isPasswordCorrect = await instance.isPasswordCorrect(password);
            if (!isPasswordCorrect) {
                throw new ApiError(400, "Invalid password");
            }
        }
    }
    if (name.trim()==="") {
        throw new ApiError(400, "name is required")
    }
    const group = await Group.create(
        {
            name: name.trim(),
            ownedInstance: instanceId,
            owner: req.user._id
        }
    )
    if (!group) {
        throw new ApiError(400, "Error in creating a group")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, group, "Group created successfully"))
})

const getGroupById = asyncHandler( async (req, res) => {
    const { instanceId, groupId } = req.params
    const { password } = req.body
    if (!(instanceId && isValidObjectId(instanceId))) {
        throw new ApiError(400, "Invalid instanceId")
    }
    if (!(groupId && isValidObjectId(groupId))) {
        throw new ApiError(400, "Invalid Group Id")
    }
    const instance = await Instance.findById(instanceId)
    if (!instance) {
        throw new ApiError(404 , "Instance not found")
    }
    if (instance.owner.toString()!==req.user._id.toString()) {
        if (instance.isPrivate==="private") {
            if (!password || password.trim()==="") {
                throw new ApiError(400, "Password is required")
            }
            if (password) {
                const isPasswordCorrect = await instance.isPasswordCorrect(password)
                if (!isPasswordCorrect) {
                    throw new ApiError(400, "Incorrect Password")
                }
            }
        }
    }
    const group = await Group.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(groupId)
            }
        },
        {
            $lookup:{
                from: "docs",
                localField: "_id",
                foreignField: "group",
                as:"docs",
                pipeline:[
                    {
                        $project: {
                            title:1,
                            docfile:1
                        }
                    },
                    {
                        $sort:{
                            createdAt: -1
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "_id",
                foreignField: "group",
                as:"videos",
                pipeline: [
                    {
                        $project: {
                            title: 1,
                            videofile: 1
                        }
                    },
                    {
                        $sort: {
                            createdAt: -1
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from:"images",
                localField: "_id",
                foreignField:"group",
                as:"images",
                pipeline:[
                    {
                        $project:{
                            title:1,
                            imagefile:1
                        }
                    },
                    {
                        $sort:{
                            createdAt: -1
                        }
                    }
                ]
            }
        }
    ])
    if (!group.length) {
        throw new ApiError(400, "Couldn't get group")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, group[0], "Group fetched successfully"))
})

const updateGroup = asyncHandler( async (req, res) => {
    const { instanceId, groupId } = req.params
    const { name, password } = req.body
    if (!(instanceId && isValidObjectId(instanceId))) {
        throw new ApiError(400, "Invalid instanceId")
    }
    if (!(groupId && isValidObjectId(groupId))) {
        throw new ApiError(400, "Invalid Group Id")
    }
    const instance = await Instance.findById(instanceId)
    if (!instance) {
        throw new ApiError(404 , "Instance not found")
    }
    if (instance.owner.toString()!==req.user._id.toString()) {
        if (instance.isPrivate==="private") {
            if (!password || password.trim()==="") {
                throw new ApiError(400, "Password is required")
            }
            if (password) {
                const isPasswordCorrect = await instance.isPasswordCorrect(password)
                if (!isPasswordCorrect) {
                    throw new ApiError(400, "Incorrect Password")
                }
            }
        }
    }
    if (!name || name.trim()==="") {
        throw new ApiError(400, "New Name is required")
    }
    const updatedGroup = await Group.findByIdAndUpdate(
        groupId,
        {
            $set:{
                name: name
            }
        },
        {
            new:true
        }
    ).select("-docfiles -imagefiles -videofiles")

    if (!updatedGroup) {
        throw new ApiError(400, "Could'nt update group")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, updatedGroup, "Group Updated successfully"))
})

const deleteGroup = asyncHandler( async (req, res) => {})

//move group from one instance to another

//get group collaborators

export {
    createNewGroup,
    getGroupById,
    updateGroup,
    deleteGroup
}