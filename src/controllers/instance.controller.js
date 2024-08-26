import { Instance } from "../models/instance.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js";

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

const createNewInstance = asyncHandler( async (req, res) => {})

//const changeInstancePassword = asyncHandler( async (req, res) => {})

const getInstanceById = asyncHandler( async (req, res) => {})

const updateInstance = asyncHandler( async (req, res) => {})

const deleteInstance = asyncHandler( async (req, res) => {})

const toggleVisibilityStatus = asyncHandler(async (req, res) => {})

export {
    getUserInstances,
    createNewInstance,
    getInstanceById,
    updateInstance,
    deleteInstance,
    toggleVisibilityStatus
}