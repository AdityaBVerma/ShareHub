import asyncHandler from "../utils/asyncHandler.js";
import { Instance } from "../models/instance.model.js";
import { Group } from "../models/group.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { Doc } from "../models/doc.model.js";
import { Image } from "../models/image.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const getAllResourcesOfGroup = asyncHandler( async (req, res) => {})

const publishResource = asyncHandler( async (req, res) => {
    const { groupId, instanceId, resourcetype } = req.params
    const { password, title } = req.body
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
    if (resourcetype.trim()==="") {
        throw new ApiError(400, "resourcetype is required")
    }
    if (!["videos", "images", "docs"].find((resource) => (resource === resourcetype))) {
        throw new ApiError(400, "Invalid resourceType");
    }
    const localpath = req.file?.path
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

const getResourceById = asyncHandler( async (req, res) => {})

const updateResource = asyncHandler( async (req, res) => {})

const deleteResource = asyncHandler( async (req, res) => {})


export {
    getAllResourcesOfGroup,
    publishResource,
    getResourceById,
    updateResource,
    deleteResource
}