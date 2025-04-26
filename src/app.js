
import express, { urlencoded } from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({
    limit:"16kb"
}))
app.use(urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//routes import

import userRoutes from "./routes/user.routes.js";
import videoRoutes from "./routes/video.route.js";
import likeRoutes from "./routes/like.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

// routes declaration
app.use("/api/v1/users",userRoutes)
app.use("/api/v1/videos",videoRoutes)
app.use("/api/v1/like",likeRoutes)
app.use("/api/v1/comment",commentRoutes)
app.use("/api/v1/subscription",subscriptionRoutes)
app.use("/api/v1/dashboard",dashboardRoutes)


export {app};