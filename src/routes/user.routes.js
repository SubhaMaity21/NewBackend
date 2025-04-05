import { Router } from "express";
import {loginUser, 
    logoutUser, 
    registerUser,
    refreshAccessToken,
    changeCurrentPassword,
    updateAccountDetails,
    updateAvatar,
     getuserChannelprofile, 
     getCurrentuser, 
     getWatchHistory}  from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router()

router.route("/register").post(
    upload.fields([
        {name:"avatar",maxCount:1},
        
        {name:"coverImage",maxCount:1}
    ])
    ,registerUser,loginUser)



router.route("/login").post(loginUser)

// securedUser 
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentuser)

router.route("/update").patch(verifyJWT,updateAccountDetails)
router.route("/update-avatar").patch(
    verifyJWT,upload.single("avatar"),
    updateAvatar)
router.route("/c/:username").get(verifyJWT,getuserChannelprofile)
router.route("/history").get(verifyJWT,getWatchHistory)
export default router;