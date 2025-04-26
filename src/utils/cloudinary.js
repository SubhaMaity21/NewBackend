import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"
import { ApiError } from './ApiError.js';




    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET 
    })


    const uploadOnCloudinary = async (localFilePath) =>{
       try {
            if(!localFilePath) return null
        const response = await  cloudinary.uploader.upload(localFilePath,{
                resource_type:"auto"
            })
            fs.unlinkSync(localFilePath) // remove the locally stored file
            return response
            
        } catch (error) {
            fs.unlinkSync(localFilePath) // remove the locally stored file
            return null
        }
      
    }

    const deleteFromCloudinary = async(publicId, resourceType = "image") => {
        try {
            if(!publicId) return null;
            
            const result = await cloudinary.uploader.destroy(publicId, {
                resource_type: resourceType,
                invalidate: true  // <- This forces CDN cache invalidation
            });
            
            return result;
        } catch (error) {
            console.error("Error deleting from Cloudinary:", error);
            throw new ApiError(500, error.message);
        }
    };




    const extractPublicId = (url) => {
        if (!url) return null;
        
        try {
            // For URLs with version number like:
            // https://res.cloudinary.com/demo/image/upload/v1234567890/folder/image.jpg
            
            // First, check if it's a Cloudinary URL
            if (!url.includes('cloudinary.com')) {
                return null;
            }
            
            // Remove any query parameters
            const urlWithoutParams = url.split('?')[0];
            
            // Split by '/'
            const parts = urlWithoutParams.split('/');
            
            // Find the 'upload' segment
            const uploadIndex = parts.indexOf('upload');
            if (uploadIndex === -1) {
                // Try other resource types
                const resourceTypes = ['video', 'raw', 'image'];
                for (const type of resourceTypes) {
                    const typeIndex = parts.indexOf(type);
                    if (typeIndex !== -1) {
                        uploadIndex = typeIndex;
                        break;
                    }
                }
                
                if (uploadIndex === -1) {
                    return null; // Not a standard Cloudinary URL
                }
            }
            
            // Get everything after 'upload' and the version number (if exists)
            const versionIndex = parts[uploadIndex + 1].startsWith('v') ? uploadIndex + 1 : uploadIndex;
            const publicIdParts = parts.slice(versionIndex + 1);
            
            // Join the parts and remove file extension
            const publicId = publicIdParts.join('/').split('.')[0];
            
            return publicId;
        } catch (error) {
            console.error("Error extracting public ID:", error);
            return null;
        }
    };
     // Upload an image
    //     const uploadResult = await cloudinary.uploader
    //     .upload(
    //         'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
    //             public_id: 'shoes',
    //         }
    //     )
    //     .catch((error) => {
    //         console.log(error);
    //     });
     
    


     export {uploadOnCloudinary,deleteFromCloudinary,extractPublicId}