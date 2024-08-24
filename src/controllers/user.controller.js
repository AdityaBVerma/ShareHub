import asyncHandler from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const registerUser = asyncHandler( async (req, res) => {
    const {username, email, fullName, password} = req.body

    if(
        [username, email, fullName, password].some((field) => field?.trim()==="")
    ){
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [ { username }, { email }]
    })

    if(existedUser){
        throw new ApiError(400, "The user with this email and username aldready exists")
    }

    const avatarLocalPath = req.files?.avatar[0].path
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar){
        throw new ApiError(400, "error uploading avatar on cloudinary")
    }

    let coverImage
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        const coverImageLocalPath = await req.files.coverImage[0].path
        coverImage = await uploadOnCloudinary(coverImageLocalPath)
        if(!coverImage){
            throw new ApiError(400, "error uploading coverImage on cloudinary")
        }
    }
    
    const user = await User.create({
        fullName,
        email,
        username: username.toLowerCase(),
        password,
        avatar: {url: avatar?.url, public_id: avatar?.public_id},
        coverImage : {url: coverImage?.url || "", public_id: coverImage?.public_id || ""}
    })
    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    if(!createdUser){
        throw new ApiError(400, "Something went wrong while registering the user")
    }

    return res.status(201).json(new ApiResponse(201, createdUser, "User created successfull"))


})

const loginUser = asyncHandler( async (req, res) => {})

const logoutUser = asyncHandler( async (req, res) => {})

const refreshAccessToken = asyncHandler( async (req, res) => {})

const changeCurrentPassword = asyncHandler( async (req, res) => {})

const getCurrentUser = asyncHandler( async (req, res) => {})

const updateAccountDetails = asyncHandler( async (req, res) => {})

const updateUserAvatar = asyncHandler( async (req, res) => {})

const updateUserCoverImage = asyncHandler( async (req, res) => {})

const getUserChannelProfile = asyncHandler( async (req, res) => {})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
}