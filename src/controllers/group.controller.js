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

const getGroupById = asyncHandler( async (req, res) => {})

const updateGroup = asyncHandler( async (req, res) => {})

const deleteGroup = asyncHandler( async (req, res) => {})

//move group from one instance to another

export {
    createNewGroup,
    getGroupById,
    updateGroup,
    deleteGroup
}