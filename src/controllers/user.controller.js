import asyncHandler from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async (userid) =>{
    try {
        const user = await User.findById(userid)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
    
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Unable to generate access and refresh tokens")
    }
}

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

const loginUser = asyncHandler( async (req, res) => {
    const {username, email, password} = req.body

    const user = await User.findOne({
        $or: [{username}, {email}]
    })
    if (!user) {
        throw new ApiError(404, "user with this email or username not found")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "incorrect password")
    }

    const {refreshToken, accessToken} = await generateAccessAndRefreshToken(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "User Logged in successfully"
        )
    )
})

const logoutUser = asyncHandler( async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refreshToken: 1
            }
        },
        {
            new : true
        }
    )
    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiError(
            200,
            {},
            "User logged out"
        )
    )
})

const refreshAccessToken = asyncHandler( async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(400, "Refresh token not provided")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(404, "User not found")
        }
    
        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        const {newRefreshToken, accessToken} = await generateAccessAndRefreshToken(user._id)
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshtoken: newRefreshToken
                },
                "Access Token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(400, error?.message || "Error in refreshing tokens")
    }

})

const changeCurrentPassword = asyncHandler( async (req, res) => {
    const { oldPassword, newPassword} = req.body
    const user = await User.findById(req.user._id)
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Incorrect old Password")
    }
    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200 , {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler( async (req, res) => {
    return res
    .status(200)
    .json(new ApiError(200, req.user, "User fetched successfully"))
})

const updateAccountDetails = asyncHandler( async (req, res) => {
    const {fullName, email} = req.body
    if (!fullName || !email) {
        throw new ApiError(400, "both fullname and email are required")
    }
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullName: fullName,
                email: email
            }
        },
        {
            new: true
        }
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler( async (req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(404, "avatar image is required")
    }

    const user = await User.findById(req.user._id)
    const previousAvatar = user.avatar
    if (previousAvatar) {
        await deleteFromCloudinary(previousAvatar.public_id)
    }

    const newAvatar = await uploadOnCloudinary(avatarLocalPath)
    if (!newAvatar) {
        throw new ApiError(400, "Error in uploading avatar")
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                avatar: {url: newAvatar.url, public_id: newAvatar.public_id}
            }
        },
        {
            new: true
        }
    ).select("-password")

    if (!updatedUser) {
        throw new ApiError(400, "could not update the avatar")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler( async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(404, "CoverImage not found")
    }
    const user = await User.findById(req.user._id)
    const previousCoverImage = user.coverImage
    if (previousCoverImage.public_id) {
        await deleteFromCloudinary(previousCoverImage.public_id)
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage) {
        throw new ApiError(400, "Error in uploading CoverImage")
    }
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                coverImage: {url: coverImage.url, public_id: coverImage.public_id}
            }
        },
        {
            new: true
        }
    ).select("-password")
    if (!updatedUser) {
        throw new ApiError(400, "could not update the avatar")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Avatar updated successfully"))
})

const getUserChannelProfile = asyncHandler( async (req, res) => {
    const username = req.params.username
    if (username.trim()==="") {
        throw new ApiError(400, "Invalid username")
    }
    const user = await User.aggregate([
        {
            $match: {
                username: username.toLowerCase()
            }
        },
        {
            $lookup:{
                from: "instances",
                localField: "_id",
                foreignField: "owner",
                as: "instances"
            }
        },
        {
            $lookup:{
                from:"images",
                localField:"_id",
                foreignField:"owner",
                as: "images"
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"_id",
                foreignField:"owner",
                as: "videos"
            }
        },
        {
            $lookup:{
                from:"docs",
                localField:"_id",
                foreignField:"owner",
                as: "docs"
            }
        },
        {
            $addFields:{
                instanceCount:{
                    $size: "$instances"
                },
                imageCount:{
                    $size: "$images"
                },
                videoCount:{
                    $size: "$videos"
                },
                docCount:{
                    $size: "$docs"
                }
            }
        },
        {
            $project:{
                fullName: 1,
                username: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                instanceCount: 1,
                imageCount: 1,
                videoCount: 1,
                docCount: 1
            }
        }
    ])

    if (!user.length) {
        throw new ApiError(400, "channel does not exist")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, user[0], "User profile fetched successfully")
    )
})


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