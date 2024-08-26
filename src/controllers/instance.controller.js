import { Instance } from "../models/instance.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"


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