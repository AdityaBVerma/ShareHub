import asyncHandler from "../utils/asyncHandler.js";

const getAllInstances = asyncHandler( async (req, res) => {})

const createNewInstance = asyncHandler( async (req, res) => {})

//const changeInstancePassword = asyncHandler( async (req, res) => {})

const getInstanceById = asyncHandler( async (req, res) => {})

const updateInstance = asyncHandler( async (req, res) => {})

const deleteInstance = asyncHandler( async (req, res) => {})

const toggleVisibilityStatus = asyncHandler(async (req, res) => {})

export {
    getAllInstances,
    createNewInstance,
    getInstanceById,
    updateInstance,
    deleteInstance,
    toggleVisibilityStatus
}