import { Router } from "express";
import { getAllVideos, publishAVideo, getVideoById,updateVideo, updateThumbnail,deleteVideo } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


export const router = Router();
router.use(verifyJWT);


router.route("/publish").post(
    
    upload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 }
    ]),
    publishAVideo
);

router.route("/c/:videoId")
.get(getVideoById)
.patch(updateVideo)
.put(
    upload.single("thumbnail"),
    updateThumbnail)
.delete(deleteVideo)
router.route("/video").get(getAllVideos);

export default router;
