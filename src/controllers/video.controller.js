import mongoose , {isValidObjectId} from "mongoose";
import { Video } from "../models/video.model.js";
import {User} from "../models/user.model.js";
import {Comment} from "../models/comment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { deleteFromCloudinary, extractPublicId, uploadOnCloudinary } from "../utils/cloudinary.js";


// get All the videos

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    const pipeline = [];
// match with is published or not
    pipeline.push({
        $match:{
            isPublished:true
        }
    })

// filter by owner if user id is provided

if(userId){

   if(!isValidObjectId(userId)){
    throw new ApiError("Invalid user id",400)
   }

   pipeline.push({
    $match:{
        owner:  mongoose.Types.ObjectId(userId)
    }
   });
    
}


if(query){
    pipeline.push({
        $match:{
            $or:[
                {title:{$regex:query, $options:"i"}},
                {description:{$regex:query, $options:"i"}}
            ]
        }
    })
}

pipeline.push({
    $lookup:{
        from:"users",
        localField:"owner",
        foreignField:"_id",
        as:"owner",
        pipeline:[
            {
                $project:{
                    fullName:1,
                    username:1,
                    avatar:1
                }
            }
        ]
    }
})

pipeline.push({
    $unwind:"$owner"
})

if(sortBy && ["title","createdAt", "updatedAt", "views"].includes(sortBy)){
    pipeline.push({
        $sort:{
            [sortBy]: sortType === "desc" ? -1 : 1
        }
    })

}else{

    // deafault newest first
    pipeline.push({
        $sort:{
            createdAt:-1
        }
    })
}


const videoAggregation = Video.aggregate(pipeline);

const videos = await Video.aggregatePaginate(
    videoAggregation,
    {
        page: pageNumber,
        limit: limitNumber,
        customLabels: {
            totalDocs: "totalVideos",
            docs: "videos"
        }
    }
)

if (videos.videos.length ==0){
    return res
    .status(200)
    .json(new ApiResponse({
        success: true,
        message: "No videos found",
        data: []
    }))
}

res
.status(200)
.json(new ApiResponse(200,videos,"videoes feteched successfully"))

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    if(!title || !description){
        throw new ApiError(400,"Title and description are required");
    }

    const videoLocalPath = req.files?.videoFile?.[0].path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0].path;
    if(!videoLocalPath || !thumbnailLocalPath){
        throw new ApiError(400,"Video and thumbnail are required");
    }
    const videoFile = await uploadOnCloudinary(videoLocalPath);
    if (!videoFile) {
        throw new ApiError(500, "Failed to upload video file");
    }
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail) {
        throw new ApiError(500, "Failed to upload thumbnail");
    }

    const video = await Video.create({
        title,
        description,
        videoFile:videoFile.url,
        thumbnail:thumbnail.url,
        duration:videoFile.duration,
        owner:req.user._id,
        isPublished:true
    })

    const createVideo = await Video.findById(video._id).populate(
        "owner","fullName username avatar"
    )

    if(!createVideo){
        throw new ApiError(404,"Video failed to create")
    }

    return res 
    .status(201)
    .json(new ApiResponse(201,createVideo,"Video created successfully"))

})


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video id")
    }

    const pipeline = []
    // check if video is published or not
    pipeline.push({
        $match:{
            _id:new mongoose.Types.ObjectId(videoId),
            isPublished:true
        }
    })
    
    // check for owner details

 


pipeline.push({
    $lookup:{
        from:"users",
        localField:"owner",
        foreignField:"_id",
        as:"owner",
        pipeline:[{
            $project:{
                
                fullName:1
            }
        }]
    }
})

pipeline.push({
    $unwind:"$owner"
})

pipeline.push({
    $lookup:{
        from:"likes",
        localField:"_id",
        foreignField:"video",
        as:"likes",
        pipeline:[
            {
                $lookup:{
                    from:"users",
                    localField:"likedBy",
                    foreignField:"_id",
                    as:"user",
                    pipeline:[{
                        $project:{
                            username:1,
                            fullName:1,
                            avatar:1
                        }
                    }]
                }
            },
            {
                $unwind:"$user"
            },{
                $project:{
                    _id:1,
                    user:1,
                    createdAt:1
                }
            }
        ]
    }
})


    

    pipeline.push({
        $addFields:{
            likesCount:{
                $size:"$likes"
            },
            isLiked:{
                $cond:{
                    if:{
                        $in:[new mongoose.Types.ObjectId(req.user._id), "$likes.user._id"]
                    
                },
                then:true,
                else:false
            }
        },
        recentLiker:{
            $slice:["$likes.user",0,4]
        }
        }
    })


   
   



    pipeline.push({
        $project:{
            title:1,
            description:1,
            videoFile:1,
            thumbnail:1,
            owner:1,
            views:1,
            duration:1,
            isPublished:1,
            likesCount:1,
            isLiked:1,
            //recentLikers:1,
            likes:1,
            likedBy:1,
            createdAt:1,
            updatedAt:1
        }
    })

    // execute the aggeragation

    const video = await Video.aggregate(pipeline)
   // In the getVideoById function:

if(video[0].owner._id.toString() !== req.user._id.toString()){
    // Increment view count
    await Video.findByIdAndUpdate(videoId,
        {
            $inc:{views:1}
        }
    )
    
    video[0].views += 1;
  
    try {
        // First ensure the watchHistory field exists as an array
        await User.updateOne(
            { _id: req.user._id, watchHistory: { $exists: false } },
            { $set: { watchHistory: [] } }
        );
        
        // Then remove the video if it exists in the array
        const pullResult = await User.updateOne(
            { _id: req.user._id },
            { $pull: { watchHistory: new mongoose.Types.ObjectId(videoId) } }
            
            
        );
        console.log("pull result",pullResult);
        // Finally add it to the beginning 
        const pushResult =await User.updateOne(
            { _id: req.user._id },
            { 
                $push: { 
                    watchHistory: { 
                        $each: [new mongoose.Types.ObjectId(videoId)],
                        $position: 0
                    } 
                } 
            }
        );
        console.log("push result",pushResult);
        const rawUser= await User.findById(req.user._id)
        console.log(rawUser.watchHistory)
        console.log(`Added video ${videoId} to watch history`);

        // await User.updateOne(
        //     {_id:req.user._id},
        //     {$set:{watchHistory:[]}}
            
        // )

        // await User.updateOne(
        //     {
        //         _id:req.user._id
        //     },{
        //         $pull:{watchHistory:new mongoose.Types.ObjectId(videoId)}
        //     }
        // )

        // await User.updateOne(
        //     {_id:req.user._id},
        //     {
        //         $push:{
        //             watchhistory:{
        //                 $each:[new mongoose.Types.ObjectId(videoId)],
        //                 $position:0
        //             }
        //         }
        //     }
        // )
    } catch (error) {
        console.error("Error updating watch history:", error);
        // Continue execution even if watch history update fails
    }
}
const totalComments = await Comment.countDocuments({
    video: videoId
})



    return res
    .status(200)
    .json(new ApiResponse(200, {video,totalComments},"video fetched successfully"))

})


const updateVideo = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    const {title,description}= req.body
  
    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400,"video id invalid")
    }
    if(!title && !description){
        throw new ApiError(400,"Title or description is required")
    }
    // const video = await Video.findById(videoId)
   const details = await Video.findByIdAndUpdate(videoId,
    {  
        $set:{
            title:title  ,
            description: description ,
        }
    } ,
    {
        new:true
    }
   )
   return res 
   .status(200)
   .json(new ApiResponse(200,details,"user details updated successfully"))


})

const updateThumbnail = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    const thumbnailLocalPath = req.file?.path
    if(!thumbnailLocalPath){
        throw new ApiError(400,"Thumbnail is required")
    }

    const oldVideo = await Video.findById(videoId);
    const oldThumbnail = oldVideo.thumbnail;

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if (!thumbnail) {
        throw new ApiError(500, "Failed to upload thumbnail");
    }
    const video = await Video.findByIdAndUpdate(videoId,
        {
            $set:{
                thumbnail:thumbnail.url
            }
        },
        {
            new:true
        }
    )

    if(oldVideo){
        const publicId = extractPublicId(oldThumbnail)
        if(!publicId){
            throw new ApiError(400,"Invalid thumbnail id")
        }else{
            console.log(publicId);
            await deleteFromCloudinary(publicId)
            
        }
    }


    return res 
    .status(200)
    .json( new ApiResponse(200,video,"Thumbail updated successfully"))
})


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400,"invalid video id")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400,"video not found")
    }

    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403,"You are not allowed to delete this video")
    }

    const videoPublicid = await extractPublicId(video.videoFile)
    const thumbnailPublicid = await extractPublicId(video.thumbnail)

    try {
        if(videoPublicid){
            await deleteFromCloudinary(videoPublicid)
        }
        if(thumbnailPublicid){
            await deleteFromCloudinary(thumbnailPublicid)
        }
    } catch (error) {
        console.log(error)
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId)
    if(!deletedVideo){
        throw new ApiError(400,"video not found")
    }

    return res
.status(200)
.json( new ApiResponse(200,{},"video delted  successfully"))
})






export {publishAVideo,getAllVideos,getVideoById,updateVideo,updateThumbnail,deleteVideo};