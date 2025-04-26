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
            fs.unlinkSync(localFilePath) 
            return response
            
        } catch (error) {
            fs.unlinkSync(localFilePath) 
            return null
        }
      
    }

    const deleteFromCloudinary = async(publicId, resourceType = "image") => {
        try {
            if(!publicId) return null;
            
            const result = await cloudinary.uploader.destroy(publicId, {
                resource_type: resourceType,
                invalidate: true  
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
           
            
            
            if (!url.includes('cloudinary.com')) {
                return null;
            }
            
            
            const urlWithoutParams = url.split('?')[0];
            
           
            const parts = urlWithoutParams.split('/');
            
            
            let uploadIndex = parts.indexOf('upload');
            if (uploadIndex === -1) {
               
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
            
            
            const versionIndex = parts[uploadIndex + 1].startsWith('v') ? uploadIndex + 1 : uploadIndex;
            const publicIdParts = parts.slice(versionIndex + 1);
            
            
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