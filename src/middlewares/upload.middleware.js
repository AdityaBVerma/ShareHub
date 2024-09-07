import { ApiError } from "../utils/ApiError.js"
import asyncHandler from "../utils/asyncHandler.js"
import { upload } from "./multer.middleware.js"

export const uploadType = asyncHandler( (req, res, next) => {
    const {resourcetype} = req.params
    let fieldname
    switch (resourcetype) {
        case 'videos':
            fieldname = 'videofile'
            break;
        case 'images':
            fieldname = 'imagefile'
            break;
        case 'docs':
            fieldname = 'docfile'
            break;
        default:
            throw new ApiError(400, "Wrong resourcetype in upload middleware")
            
    }
    upload.single(fieldname)(req, res, (err) => {
        if (err) {
            console.log("Multer error:", err); 
            return next(new ApiError(400, err?.message || "Error in upload multer"));
        }
        if (!req.file) {
            return next(new ApiError(400, "Upload not successful"));
        }
        next()
    })
})