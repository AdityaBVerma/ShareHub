import mongoose, { isValidObjectId } from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Instance } from "../models/instance.model.js"
import { Group } from "../models/group.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { deleteResourcesFromCloudinary } from "../utils/cloudinary.js";

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
    const existedGroup = await Group.findOne({name})
    if(existedGroup){
        throw new ApiError(400, "The Group with this name aldready exists")
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

const deleteGroup = asyncHandler( async (req, res) => {
    const { instanceId, groupId } = req.params
    if (!(instanceId && isValidObjectId(instanceId))) {
        throw new ApiError(400, "Invalid instanceId")
    }
    if (!(groupId && isValidObjectId(groupId))) {
        throw new ApiError(400, "Invalid Group Id")
    }
    const instance = await Instance.findById(instanceId)
    const group = await Group.findById(groupId)
    if (!instance) {
        throw new ApiError(404 , "Instance not found")
    }
    if (!group) {
        throw new ApiError(404 , "Group not found")
    }
    if (instance.owner.toString()!==req.user._id.toString() || group.owner.toString()!==req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized request")
    }
    const fetchedGroup = await Group.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(groupId)
            }
        },
        {
            $lookup:{
                from:"docs",
                localField:"_id",
                foreignField:"group",
                as: "docs",
                pipeline:[
                    {
                        $project:{
                            docfile: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"_id",
                foreignField:"group",
                as: "videos",
                pipeline:[
                    {
                        $project:{
                            videofile: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from:"images",
                localField:"_id",
                foreignField:"group",
                as: "images",
                pipeline:[
                    {
                        $project:{
                            imagefile: 1
                        }
                    }
                ]
            }
        }
    ])
    if (!fetchedGroup) {
        throw new ApiError(404, "No group found to delete")
    }
    await deleteResourcesFromCloudinary(fetchedGroup[0].docs, "docs")
    await deleteResourcesFromCloudinary(fetchedGroup[0].images, "images")
    await deleteResourcesFromCloudinary(fetchedGroup[0].videos, "videos")

    const deletedImages = await Image.deleteMany({
        group: groupId
    })
    const deletedVideos = await Video.deleteMany({
        group: groupId
    })
    const deletedDocs = await Doc.deleteMany({
        group: groupId
    })
    const deletedGroups = await Group.deleteOne({ _id: groupId })
    const ApiMessage = `${deletedGroups.deletedCount} group(s) deleted. ${deletedImages.deletedCount} images deleted.${deletedVideos.deletedCount} videos deleted. ${deletedDocs.deletedCount} docs deleted.`
    return res
    .status(200)
    .json(new ApiResponse(200, {}, ApiMessage))
})

const moveGroup = asyncHandler( async (req, res) => {
    const { groupId } = req.params
    const { fromInstanceId, toInstanceId } = req.body
    if (!(groupId && isValidObjectId(groupId))) {
        throw new ApiError(400, "invalid group ID")
    }
    if (!(fromInstanceId && isValidObjectId(fromInstanceId))) {
        throw new ApiError(400, "invalid fromInstance ID")
    }
    if (!(toInstanceId && isValidObjectId(toInstanceId))) {
        throw new ApiError(400, "invalid toInstance ID")
    }
    if (fromInstanceId.toString() === toInstanceId.toString()) {
        throw new ApiError(400, "The group is already in the target instance")
    }
    const fromInstance = await Instance.findById(fromInstanceId)
    const toInstance = await Instance.findById(toInstanceId)
    if (!(fromInstance.owner.toString()===toInstance.owner.toString() && toInstance.owner.toString()===req.user._id.toString())) {
        throw new ApiError(403, "Unauthorized request")
    }
    const group = await Group.findById(groupId);
    if (!group || group.ownedInstance.toString() !== fromInstanceId.toString()) {
        throw new ApiError(400, "Group does not belong to the specified fromInstance");
    }
    const movedGroup = await Group.findByIdAndUpdate(
        groupId,
        {
            $set:{
                ownedInstance: toInstanceId
            }
        },
        {
            new :true
        }
    ).select("-docfiles -imagefiles -videofiles")
    if (!movedGroup) {
        throw new ApiError(400, "Could'nt move group")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, movedGroup, `group moved from ${fromInstance.title} to ${toInstance.title}`))

})

const getGroupCollaborators = asyncHandler( async (req, res) => {
    const { groupId } = req.params
    if (!(groupId && isValidObjectId(groupId))) {
        throw new ApiError(400, "Invalid group id")
    }

    const group = await Group.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(groupId)
            }
        },
        {
            $lookup:{
                from:"docs",
                localField:"_id",
                foreignField:"group",
                as: "docs",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owners",
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
            $lookup:{
                from:"videos",
                localField:"_id",
                foreignField:"group",
                as: "videos",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owners",
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
            $lookup:{
                from:"images",
                localField:"_id",
                foreignField:"group",
                as: "images",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owners",
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
            $addFields:{
                allUsers:{
                    $reduce:{
                        input:{
                            //concat all arrays into one array containing all owners
                            $concatArrays:[
                                    { $map: {input: "$docs", as:"doc", in:"$$doc.owner"}},
                                    { $map: {input: "$videos", as:"video", in:"$$video.owner"}},
                                    { $map: {input: "$images", as:"image", in:"$$image.owner"}},
                            ]
                        },
                        initialValue: [],
                        //take the union of owners so none can repeat
                        // $$ value is the prev and $$this is the current
                        in:{
                            $setUnion: ["$$value", "$$this"]
                        }
                    }
                }
            }
        }
    ])

    if (!group.length) {
        throw new ApiError(404, "Could'nt get group details")
    }
    
    return res
    .status(200)
    .json(new ApiResponse(200, group[0].allUsers, "All group colaborators found"))
})

export {
    createNewGroup,
    getGroupById,
    updateGroup,
    deleteGroup,
    moveGroup,
    getGroupCollaborators
}