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



export {getChannelStats}