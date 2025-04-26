import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { toggleCommentLike, toggleVideoLike } from "../controllers/like.controller.js";

export const router = Router();
router.use(verifyJWT);

router.route("/c/:videoId").post(toggleVideoLike);
router.route("/comment/c/:commentId").post(toggleCommentLike);

export default router;