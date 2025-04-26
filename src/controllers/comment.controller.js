import mongoose, {isValidObjectId} from "mongoose";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Video } from "../models/video.model.js";


const getVideoComments = asyncHandler(async(req,res)=>{

    const {videoId} = req.params
    const {page =1, limit = 10} = req.query
    const pageNumber = parseInt(page)
    const limitNumber = parseInt(limit)
    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400,"invalid video id")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400,"Video not found")
    }


const comments = await Comment.aggregate([
    {
        $match:{
            video: new mongoose.Types.ObjectId(videoId)
        }
    },
    {
        $sort:{
            createdAt:-1
        }
    },{
        $lookup:{
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"owner",
            pipeline:[

                {
                    $project:{
                        _id:1,
                        fullName:1,
                        username:1
                    }
                }
            ]
        }
    },{
        $unwind:"$owner"
    },
    {
        $lookup:{
            from:"likes",
            localField:"_id",
            foreignField:"comment",
            as:"commentLike",
            pipeline:[{
                $lookup:{
                    from:"users",
                    localField:"likedBy",
                    foreignField:"_id",
                    as:"user",
                    pipeline:[{
                        $project:{
                            _id:1,
                            fullName:1,
                            username:1,
                            avatar:1
                        }
                    }]
                }
            }
            ,
            {
                $unwind:"$user"
            },{
                $project:{
                    _id:1,
                    user:1
                }
            }
        ]
        }
    },
    {
        $addFields: {
            likesCount: { $size: "$commentLike" },
            // Check if current user has liked this comment
            isLiked: {
                $cond: {
                    if: { $eq: [{ $type: req.user }, "missing"] },
                    then: false,
                    else: {
                        $in: [
                            new mongoose.Types.ObjectId(req.user?._id),
                            "$commentLike.likedBy"
                        ]
                    }
                }
            },
            // Get up to 5 recent likers
            recentLikers: { $slice: ["$commentLike.user", 0, 5] }
        }
    },
    
    {
        $skip:(pageNumber - 1) * limitNumber
    },{
        $limit:limitNumber
    },{
        $project:{
            _id:1,
            content:1,
            owner:1,
            video:1,
            commentLike:1,
            likesCount:1,
            createdAt:1,
            updatedAt:1
        }
    }
])


const totalComments = await Comment.countDocuments({
    video: videoId
})

const hasCommented = req.user ? 
await Comment.exists({
    video: videoId,
    owner: req.user._id
}) : false;

return res
.status(200)
.json(new ApiResponse(200,{
    comments,
    totalComments,
    hasCommented: !!hasCommented,
    page: pageNumber,
    limit: limitNumber,
    totalPages: Math.ceil(totalComments / limitNumber),
    hasNextPage: pageNumber < Math.ceil(totalComments / limitNumber),
    hasPrevPage: pageNumber > 1
},"Comments fetched successfully"))

})

const addComment = asyncHandler(async(req,res)=>{
    const {videoId}  = req.params
    const {content} = req.body

    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400,"invalid video id")
    }

    if(!content){
        throw new ApiError(400,"Content required")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400,"Video not found")
    }
    const comment = await Comment.create({
        content,
        video:videoId,
        owner:req.user._id
    })

    const createdComment = await Comment.aggregate([

        {
            $match:{
                _id: comment._id
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[{
                    $project:{
                        _id:1,
                        fullName:1,
                        username:1,
                        avatar:1
                    }
                }]
            }
        },{
            $unwind:"$owner"
        }
    ])

    return res 
    .status(200)
    .json(new ApiResponse(201,createdComment,"Comment added successfully"))
})


const updateComment = asyncHandler(async(req,res)=>{
    const {commentId} = req.params;
    const {content} = req.body

    if(!commentId || !isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid Comment ID")
    }

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(400,"Comment not found")
    }
    if(comment.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403,"You can not update this comment")
    }

    const updateComment = await Comment.findByIdAndUpdate(commentId,
        {
            $set:{
                content
            }
        },
        {
            new:true,
            runValidators:true
        }
    ).populate("owner", "_id fullName username ")

    return res
    .status(200)
    .json(new ApiResponse(200,updateComment,"Comment updated successfully"))
})

const deleteComment  =asyncHandler(async(req,res)=>{
    const {commentId} = req.params

    if(!commentId || !isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid Comment ID")
    }

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(400,"Comment not found")
    }
    if(comment.owner.toString() !== req.user._id ){
        const video = await Video.findById(comment.video)
       if(!video|| video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(400,"You can't delete the comment")
       }

    }


    await Comment.findByIdAndDelete(commentId)
    return res 
    .status(200)
    .json(new ApiResponse(200),null,"comment deleted successfully")
})

export {getVideoComments,addComment,updateComment,deleteComment};