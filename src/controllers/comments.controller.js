import { isValidObjectId } from "mongoose"
import asyncHandler from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { Instance } from "../models/instance.model.js"
import { Comment } from "../models/comment.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const getInstanceComments = asyncHandler( async (req, res) => {})

const addComments = asyncHandler( async (req, res) => {
    const { content, password } = req.body
    const { instanceId } = req.params
    if (!(instanceId && isValidObjectId(instanceId))) {
        throw new ApiError(400, "Invalid Instance Id")
    }
    if (!content || content.trim()==="") {
        throw new ApiError(400, "Content is required")
    }
    const instance = await Instance.findById(instanceId)
    if (!instance) {
        throw new ApiError(404, "Instance not found")
    }
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
    const comment = await Comment.create({
        content,
        instance: instanceId,
        commentOwner: req.user._id
    })
    if (!comment) {
        throw new ApiError(400, "Comment could not be created")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment made successfully"))
})

const updateComments = asyncHandler( async (req, res) => {
    const { content, password } = req.body
    const { instanceId, commentId } = req.params
    if (!(instanceId && isValidObjectId(instanceId))) {
        throw new ApiError(400, "Invalid Instance Id")
    }
    if (!(commentId && isValidObjectId(commentId))) {
        throw new ApiError(400, "Invalid Comment Id")
    }
    if (!content || content.trim()==="") {
        throw new ApiError(400, "Content is required")
    }
    const instance = await Instance.findById(instanceId)
    if (!instance) {
        throw new ApiError(404, "Instance not found")
    }
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }
    if (instance.owner.toString()!==req.user._id.toString() || comment.commentOwner.toString() !== req.user._id.toString()) {
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
    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content: content,
                isEdited: true
            }
        },
        {
            new: true
        }
    )
    if (!updatedComment) {
        throw new ApiError(404, "Couldn't update comment")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment Updated successfully"))
})

const deleteComments = asyncHandler( async (req, res) => {})

export {
    getInstanceComments,
    addComments,
    updateComments,
    deleteComments
}