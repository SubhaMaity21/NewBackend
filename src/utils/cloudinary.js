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


    const deleteFromCloudinary = async(publicId)=>{
        try {
            if(!publicId) return null
            const result = await cloudinary.uploader.destroy(publicId)
            return result
        } catch (error) {
            throw new ApiError(500,error.message)
        }
    }




    const extractPublicId = (url)=>{
        if(!url){
            return null
        }

        try {
              
    const urlParts = url.split('/');
    const fileNameWithExtension = urlParts[urlParts.length - 1];
    const publicId = fileNameWithExtension.split('.')[0];
    
    // If the file is in a folder, include the folder path
    const uploadIndex = urlParts.indexOf('upload');
    if (uploadIndex !== -1 && uploadIndex < urlParts.length - 2) {
      const pathParts = urlParts.slice(uploadIndex + 2);
      return pathParts.join('/').split('.')[0]; 
    }
    
    return publicId;
        } catch (error) {
            throw new ApiError(500,error.message)
        }
    }

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