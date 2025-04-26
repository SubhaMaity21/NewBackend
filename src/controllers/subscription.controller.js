import mongoose, {isValidObjectId} from "mongoose";
import { Like } from "../models/like.model.js";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Comment } from "../models/comment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Video } from "../models/video.model.js";

const toggleSubscription = asyncHandler(async (req, res) => {

    const {channelId} = req.params
    if(!channelId || !isValidObjectId(channelId)){
        throw new ApiError("Invalid channel id",400)
    }
    const channel = await User.findById(channelId)
    if(!channel){
        throw new ApiError(400,"channel not found")
    }

    const existingSubscription = await Subscription.findOne({
        channel:channelId,
        subscriber: req.user._id
    })
    let message;
    let subscription;       
    if(existingSubscription){
        await Subscription.findByIdAndDelete(existingSubscription._id)
        
        message = "Unsubscribed from the channel";
        subscription = null;

    }else{
        subscription = await Subscription.create({
            channel: channelId,
            subscriber: req.user._id
        })
        

        message = "Subscribed to the channel"
    }
 return res
 .status(200)
 .json(new ApiResponse(200,subscription,message))

})


const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const {page=1,limit=10} = req.query
    const pageNumber =  parseInt(page)
    const limitNumber = parseInt(limit)
    if(!channelId || !isValidObjectId(channelId)){
        throw new ApiError("Invalid channel id",400)
    }
    const channel = await User.findById(channelId)
    if(!channel){
        throw new ApiError(400,"channel not found")
    }
    const subscriber = await Subscription.aggregate([
        {
            $match:{
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },{
            $sort:{
                createdAt:-1
            }
        },
        
        {
            $skip: (pageNumber - 1) * limitNumber
        },
        
        {
            $limit: limitNumber
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscriber",
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
            $unwind:"$subscriber"
        },{
            $project:{
                _id:1,
                subscriber:1,
                createdAt:1,
                updatedAt:1
            }
        }

    ])

    const totalSubscribers = await Subscription.countDocuments({
        channel:channelId
    })
    const totalPages = Math.ceil(totalSubscribers / limitNumber)

    return res 
    .status(200)
    .json(new ApiResponse(200,{
        subscriber,
        totalSubscribers,
        totalPages
    }))
})

export {toggleSubscription,getUserChannelSubscribers}



