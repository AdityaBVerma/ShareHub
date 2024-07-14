import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: CLOUDINARY_API_KEY, 
    api_secret: CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(localFilePath){
            const response = await cloudinary.uploader.upload(localFilePath,{
                resource_type: "auto"
            })
            console.log("the file is successfully uploaded on cloudinary at url: ", response.url)
            fs.unlinkSync(localFilePath)
            return response
        }
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null
    }
}

const deleteFromCloudinary = async(public_id) => {
    try {
        const response = await cloudinary.uploader.destroy(public_id, {
            resource_type: "auto"
        })
    
        console.log("file successfully deleted form cloudinary", response)
        
        return response
    } catch (error) {
        console.log("Error deleting this file from cloudinary :", error.message)
    }
}

export {
    uploadOnCloudinary,
    deleteFromCloudinary,
}