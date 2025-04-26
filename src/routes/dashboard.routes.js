import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getChannelStats, getLikedVideos } from "../controllers/dashboard.controller.js";

export const router = Router();
router.use(verifyJWT);

router.route("/").get(getChannelStats)
router.route("/likedVideos").get(getLikedVideos)

export default router;