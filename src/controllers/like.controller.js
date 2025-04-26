import mongoose, {isValidObjectId} from "mongoose";
import { Like } from "../models/like.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Video } from "../models/video.model.js";


const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError("Invalid video id",400)
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400,"video not found")
    }

    const existingLike = await Like.findOne({
        video:videoId,
        likedBy: req.user._id
    })
    let message;
    let like;
    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)
        
        message = "Unliked the video";
        like = null;
        await Video.findByIdAndUpdate(videoId, {
            $inc: { totalLikes: -1 }
        })

    }else{
        like = await Like.create({
            video: videoId,
            likedBy: req.user._id
        })

        const liked = await Video.findByIdAndUpdate(videoId,{
            $inc:{
                totalLikes:1}
        })
        
        message = "liked the video"
    }
 return res
 .status(200)
 .json(new ApiResponse(200,like,message))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if(!commentId || !isValidObjectId(commentId)){
        throw new ApiError("Invalid comment id",400)
    }
    const existingLike = await Like.findOne({
        comment:commentId,
        likedBy: req.user._id
    })
    let message;
    let like;       
    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)
        
        message = "Unliked the comment";
        like = null;
    }else{
        like = await Like.create({
            comment: commentId,
            likedBy: req.user._id
        })
        

        message = "liked the comment"
    }

    return res  
    .status(200)
    .json(new ApiResponse(200,like,message))


})

export {toggleVideoLike,toggleCommentLike};