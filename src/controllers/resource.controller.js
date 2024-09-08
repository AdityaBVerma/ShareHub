import mongoose, { isValidObjectId } from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import { Instance } from "../models/instance.model.js";
import { Group } from "../models/group.model.js";
import { ApiError } from "../utils/ApiError.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { Doc } from "../models/doc.model.js";
import { Image } from "../models/image.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs"

const publishResource = asyncHandler( async (req, res) => {
    const { groupId, instanceId, resourcetype } = req.params
    const { password, title } = req.body
    const localpath = req.file?.path

    if (!(instanceId && isValidObjectId(instanceId))) {
        if (fs.existsSync(localpath)) {
            fs.unlinkSync(localpath)
        }
        throw new ApiError(400, "Invalid instanceId")
    }
    if (!(groupId && isValidObjectId(groupId))) {
        if (fs.existsSync(localpath)) {
            fs.unlinkSync(localpath)
        }
        throw new ApiError(400, "Invalid Group Id")
    }
    const instance = await Instance.findById(instanceId)
    if (!instance) {
        if (fs.existsSync(localpath)) {
            fs.unlinkSync(localpath)
        }
        throw new ApiError(404 , "Instance not found")
    }
    if (instance.owner.toString()!==req.user._id.toString()) {
        if (instance.isPrivate==="private") {
            if (!password || password.trim()==="") {
                if (fs.existsSync(localpath)) {
                    fs.unlinkSync(localpath)
                }
                throw new ApiError(400, "Password is required")
            }
            if (password) {
                const isPasswordCorrect = await instance.isPasswordCorrect(password)
                if (!isPasswordCorrect) {
                    if (fs.existsSync(localpath)) {
                        fs.unlinkSync(localpath)
                    }
                    throw new ApiError(400, "Incorrect Password")
                }
            }
        }
    }
    if (!resourcetype || resourcetype.trim()==="") {
        if (fs.existsSync(localpath)) {
            fs.unlinkSync(localpath)
        }
        throw new ApiError(400, "resourcetype is required")
    }
    if (!["videos", "images", "docs"].find((resource) => (resource === resourcetype))) {
        if (fs.existsSync(localpath)) {
            fs.unlinkSync(localpath)
        }
        throw new ApiError(400, "Invalid resourceType");
    }

    if (!localpath) {
        throw new ApiError(400, `${resourcetype} file is required`)
    }
    const file = await uploadOnCloudinary(localpath)
    if (!file) {
        throw new ApiError(400, "Could'nt upload file on cloudinary")
    }
    let resource
    switch (resourcetype) {
        case 'videos': 
                resource = await Video.create({
                    title,
                    owner: req.user._id,
                    group: groupId,
                    videofile: {url: file.url, public_id: file.public_id}
                })
            break;
        case 'docs': 
                resource = await Doc.create({
                    title,
                    owner: req.user._id,
                    group: groupId,
                    docfile: {url: file.url, public_id: file.public_id}
                })
            break;
        case 'images': 
                resource = await Image.create({
                    title,
                    owner: req.user._id,
                    group: groupId,
                    imagefile: {url: file.url, public_id: file.public_id}
                })
            break;
    }

    return res
    .status(200)
    .json(new ApiResponse(200, resource, `Resource of type ${resourcetype} created sucessfully`))

})

const getResourceById = asyncHandler( async (req, res) => {
    const { resourceId, instanceId, resourcetype } = req.params
    const { password } = req.body
    if (!(instanceId && isValidObjectId(instanceId))) {
        throw new ApiError(400, "Invalid instanceId")
    }
    if (!(resourceId && isValidObjectId(resourceId))) {
        throw new ApiError(400, "Invalid Resource Id")
    }
    const instance = await Instance.findById(instanceId)
    if (!instance) {
        throw new ApiError(404 , "Instance not found")
    }
    let resource
    switch (resourcetype) {
        case 'videos':
            resource = await Video.findById(resourceId)
            break;
        case 'images':
            resource = await Image.findById(resourceId)
            break;
        case 'docs':
            resource = await Doc.findById(resourceId)
            break;
        default:
            throw new ApiError(400, "invalid Resource type")
    }
    if (instance.owner.toString() !== req.user._id.toString() && resource.owner.toString() !== req.user._id.toString()) {
        if (instance.isPrivate==="private") {
            if (!password || password.trim()==="") {
                throw new ApiError(400, "Password is required")
            }
            const isPasswordCorrect = await instance.isPasswordCorrect(password)
            if (!isPasswordCorrect) {
                throw new ApiError(400, "Incorrect Password")
            }
        }
    }
    const resourceLookup = {
        $lookup:{
            from:"users",
            localField:"owner",
            foreignField: "_id",
            as: "owners",
            pipeline:[
                {
                    $project: {
                        username: 1,
                        email: 1,
                        fullname: 1,
                        avatar: 1,
                        coverImage: 1
                    }
                }
            ]
        }
    }
    let fetchedResource
    switch (resourcetype) {
        case 'videos': 
                fetchedResource = await Video.aggregate([
                    {
                        $match:{
                            _id: new mongoose.Types.ObjectId(resourceId)
                        }
                    },
                    resourceLookup
                ])
            break;
        case 'docs': 
                fetchedResource = await Doc.aggregate([
                    {
                        $match:{
                            _id: new mongoose.Types.ObjectId(resourceId)
                        }
                    },
                    resourceLookup
                ])
            break;
        case 'images': 
                fetchedResource = await Image.aggregate([
                    {
                        $match:{
                            _id: new mongoose.Types.ObjectId(resourceId)
                        }
                    },
                    resourceLookup
                ])
            break;
    }
    if (!fetchedResource.length) {
        throw new ApiError(400, "Could'nt fetch resource")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, fetchedResource[0], "Resource feteched successfully"))

})

const updateResource = asyncHandler( async (req, res) => {
    const { resourceId, instanceId, resourcetype } = req.params
    const { title } = req.body
    if (!(instanceId && isValidObjectId(instanceId))) {
        throw new ApiError(400, "Invalid instanceId")
    }
    if (!(resourceId && isValidObjectId(resourceId))) {
        throw new ApiError(400, "Invalid Resource Id")
    }
    const instance = await Instance.findById(instanceId)
    if (!instance) {
        throw new ApiError(404 , "Instance not found")
    }
    if (!title || title.trim()==="") {
        throw new ApiError(400, "Title is required")
    }
    let resource;
    switch (resourcetype) {
        case 'videos':
            resource = await Video.findById(resourceId);
            break;
        case 'images':
            resource = await Image.findById(resourceId);
            break;
        case 'docs':
            resource = await Doc.findById(resourceId);
            break;
        default:
            throw new ApiError(400, "Invalid Resource type");
    }
    if (!resource) {
        throw new ApiError(404, "Resource not found");
    }
    if (instance.owner.toString() !== req.user._id.toString() && resource.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized request to update resource")
    }

    let updatedResource
    switch (resourcetype) {
        case 'videos':
            updatedResource = await Video.findByIdAndUpdate(
                resourceId,
                {
                    $set:{
                        title:title
                    }
                },
                {
                    new: true
                }
            )
            break;
        case 'images':
            updatedResource = await Image.findByIdAndUpdate(
                resourceId,
                {
                    $set:{
                        title:title
                    }
                },
                {
                    new: true
                }
            )
            break;
        case 'docs':
            updatedResource = await Doc.findByIdAndUpdate(
                resourceId,
                {
                    $set:{
                        title:title
                    }
                },
                {
                    new: true
                }
            )
            break;
        default:
            throw new ApiError(400, "invalid Resource type")
    }
    if (!updatedResource) {
        throw new ApiError(404, "Couldn't update resource")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, updatedResource, "Resource updated successfully"))
})

const deleteResource = asyncHandler( async (req, res) => {
    const { resourceId, instanceId, resourcetype } = req.params

    if (!(instanceId && isValidObjectId(instanceId))) {
        throw new ApiError(400, "Invalid instanceId")
    }
    if (!(resourceId && isValidObjectId(resourceId))) {
        throw new ApiError(400, "Invalid Resource Id")
    }

    const instance = await Instance.findById(instanceId)
    if (!instance) {
        throw new ApiError(404 , "Instance not found")
    }

    let resource;
    let cloudinaryType;
    let resourcePublicId;
    switch (resourcetype) {
        case 'videos':
            resource = await Video.findById(resourceId);
            cloudinaryType = "video"
            resourcePublicId = resource.videofile.public_id
            break;
        case 'images':
            resource = await Image.findById(resourceId);
            cloudinaryType = "image"
            resourcePublicId = resource.imagefile.public_id
            break;
        case 'docs':
            resource = await Doc.findById(resourceId);
            cloudinaryType = "raw"
            resourcePublicId = resource.docfile.public_id
            break;
        default:
            throw new ApiError(400, "Invalid Resource type");
    }
    if (!resource) {
        throw new ApiError(404, "Resource not found");
    }

    if (instance.owner.toString() !== req.user._id.toString() && resource.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized request to delete resource")
    }

    const deletedResourceFromCloudinary = await deleteFromCloudinary(resourcePublicId, cloudinaryType)
    if (!deletedResourceFromCloudinary) {
        throw new ApiError(400, "Couldn't delete resource from cloudinary")
    }

    let deletedResource
    switch (resourcetype) {
        case 'videos':
            deletedResource = await Video.findByIdAndDelete(resourceId)
            break;
        case 'images':
            deletedResource = await Image.findByIdAndDelete(resourceId)
            break;
        case 'docs':
            deletedResource = await Doc.findByIdAndDelete(resourceId)
            break;
        default:
            throw new ApiError(400, "invalid Resource type")
    }
    if (!deletedResource) {
        throw new ApiError(404, "Couldn't delete resource")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Resource deleted successfully"))
})

const moveResource = asyncHandler( async (req, res) => {
    const { resourceId, instanceId, resourcetype } = req.params
    const { fromGroupId, toGroupId } = req.body
    if (!(instanceId && isValidObjectId(instanceId))) {
        throw new ApiError(400, "Invalid instanceId")
    }
    if (!(resourceId && isValidObjectId(resourceId))) {
        throw new ApiError(400, "Invalid Resource Id")
    }
    if (!(fromGroupId && isValidObjectId(fromGroupId))) {
        throw new ApiError(400, "Invalid fromGroupId Id")
    }
    if (!(toGroupId && isValidObjectId(toGroupId))) {
        throw new ApiError(400, "Invalid toGroupId Id")
    }
    if (fromGroupId.toString() === toGroupId.toString()) {
        throw new ApiError(400, "No change is required")
    }
    const instance = await Instance.findById(instanceId)
    if (!instance) {
        throw new ApiError(404 , "Instance not found")
    }
    let resource;
    switch (resourcetype) {
        case 'videos':
            resource = await Video.findById(resourceId);
            break;
        case 'images':
            resource = await Image.findById(resourceId);
            break;
        case 'docs':
            resource = await Doc.findById(resourceId);
            break;
        default:
            throw new ApiError(400, "Invalid Resource type");
    }
    if (!resource) {
        throw new ApiError(404, "Resource not found");
    }
    if (instance.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized request to move resource")
    }
    let movedResource
    switch (resourcetype) {
        case 'videos':
            movedResource = await Video.findByIdAndUpdate(
                resourceId,
                {
                    $set:{
                        group: toGroupId
                    }
                },
                {
                    new: true
                }
            )
            break;
        case 'images':
            movedResource = await Image.findByIdAndUpdate(
                resourceId,
                {
                    $set:{
                        group: toGroupId
                    }
                },
                {
                    new: true
                }
            )
            break;
        case 'docs':
            movedResource = await Doc.findByIdAndUpdate(
                resourceId,
                {
                    $set:{
                        group: toGroupId
                    }
                },
                {
                    new: true
                }
            )
            break;
        default:
            throw new ApiError(400, "invalid Resource type")
    }
    if (!movedResource) {
        throw new ApiError(404, "Couldn't move resource")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, movedResource, "Resource moved successfully"))

})// if fromGroup and to group instancee owner are the same then only add

export {
    publishResource,
    getResourceById,
    updateResource,
    deleteResource,
    moveResource
}