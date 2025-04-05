
import dotenv from 'dotenv';
import connectDB from './db/index.js';
import {app} from './app.js';
dotenv.config({path: './.env'});
connectDB()
.then(()=>{
    app.on("error",(err)=>{
        console.log("error: ",err)
        throw err
    })
    app.listen(process.env.PORT|| 8000,()=>{
        console.log(`server is listening on port ${process.env.PORT}`);
        
    })
})
.catch((err)=>{
    console.log("MongoDb connection failed: ",err);
    
})
















/*
import express from 'express';

;(async()=>{
    try{
       await mongoose.connect(`{process.env.MONGODB_URI}`)
       app.on("error",(err)=>{
        console.log("error: ",err)
        throw err

       })

       app.listen(process.env.PORT,()=>{
        console.log(`Server is running on port ${process.env.PORT}`);
       })
    }catch(err){
        console.error(err)
        throw err
    }
})()

*/