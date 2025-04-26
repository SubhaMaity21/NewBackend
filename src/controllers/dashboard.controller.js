import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async(req,res)=>{
    const userId = req.user._id

    const videoStats = await Video.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group:{
                _id:null,
                totalVideoes:{$sum:1},
                totalViews:{$sum:"$views"}
            }
        }

    ])
    
    const likeStats = await Like.aggregate([
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"videoDetails"
            }
        },
        {
            $match:{
                "videoDetails.owner": new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group:{
                _id:null,
                totalLikes:{$sum:1}
            }
        }
      
    ])

    
    const subscriberStats = await Subscription.aggregate([
       
        {
            $match:{
                channel:new mongoose.Types.ObjectId(userId)
            }
        },{
            $count:"totalSubscribers"
        }
    ])

    const stats = {
        totalVideoes: videoStats[0]?.totalVideoes || 0,
        totalViews: videoStats[0]?.totalViews || 0,
        totalLikes: likeStats[0]?.totalLikes || 0,
        totalSubs: subscriberStats[0]?.totalSubscribers || 0
    }


    return res
    .status(200)
    .json(new ApiResponse(200,{stats},"channel data fetched successfully"))
})

const getLikedVideos = asyncHandler(async(req, res) => {
    const userId = req.user._id;
    const {pageNumber, limitNumber} = req.query;
    const page = parseInt(pageNumber) || 1;
    const limit = parseInt(limitNumber) || 5;
    const skip = (page - 1) * limit;

    
    const videoCount = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails"
            }
        },
        {
            
            $match: {
                "videoDetails": { $ne: [] }
            }
        },
        {
            $count: "total"
        }
    ]);

    const totalLikedVideos = videoCount[0]?.total || 0;

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        _id: 1,
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: { $first: "$owner" }
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            title: 1,
                            thumbnail: 1,
                            videoFile: 1,
                            duration: 1,
                            views: 1,
                            owner: 1,
                            createdAt: 1
                        }
                    }
                ]
            }
        },
        {
            
            $match: {
                "videoDetails": { $ne: [] }
            }
        },
        {
            $unwind: "$videoDetails"
        },
        {
            $skip: skip
        },
        {
            $limit: limit
        },
        {
            $project: {
                _id: 1,
                video: 1, 
                videoDetails: 1
            }
        }
    ]);

  

    return res
        .status(200)
        .json(new ApiResponse(
            200, 
            {
                likedVideos,
                totalLikedVideos,
                currentPage: page,
                totalPages: Math.ceil(totalLikedVideos / limit),
                hasMore: page < Math.ceil(totalLikedVideos / limit)
            }, 
            "Liked videos fetched successfully"
        ));
});


export {getChannelStats,getLikedVideos}