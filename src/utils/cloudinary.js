import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(localFilePath){
            const response = await cloudinary.uploader.upload(localFilePath,{
                resource_type: "auto"
            })
            console.log("the file is successfully uploaded on cloudinary at url: ", response.url)
            if (fs.existsSync(localFilePath)) {
                fs.unlinkSync(localFilePath);
            }
            return response
        }
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null
    }
}

const deleteFromCloudinary = async(public_id, resource_type) => {
    try {
        const response = await cloudinary.uploader.destroy(public_id, {
            resource_type: resource_type || "auto"
        })
    
        console.log("file successfully deleted form cloudinary", response)
        
        return response
    } catch (error) {
        console.log("Error deleting this file from cloudinary :", error.message)
    }
}

const deleteResourcesFromCloudinary = async (resource, type) => {
    let resource_types
    switch (type) {
        case 'images':
            resource_types = 'image'
            break;
        case 'videos':
            resource_types = 'video'
            break;
        case 'docs':
            resource_types = 'raw'
            break;
        default:
            resource_types = 'auto'
            break;
    }
    let count = 0;
    if( resource.length > 0){
        for(const resources of resource){
            let resourcePublicId;
            switch (type) {
                case 'images':
                    resourcePublicId = resources.imagefile?.public_id
                    break;
                case 'videos':
                    resourcePublicId = resources.videofile?.public_id
                    break;
                case 'docs':
                    resourcePublicId = resources.docfile?.public_id
                    break;
            }
            if (resourcePublicId) {
                await deleteFromCloudinary(resourcePublicId, resource_types)
                count++
            }
        }
        console.log(`All ${count} ${type} resources deleted from Cloudinary.`);
    } else {
        console.log(`No ${type} resources to delete.`);
    }
    
}

export {
    uploadOnCloudinary,
    deleteFromCloudinary,
    deleteResourcesFromCloudinary,
}