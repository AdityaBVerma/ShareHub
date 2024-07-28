import asyncHandler from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler( async (req, res) => {
    res.status(200).json({
        message: "works fine !!"
    })
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