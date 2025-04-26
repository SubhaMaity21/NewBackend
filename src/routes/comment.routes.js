import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addComment,
    deleteComment,
    getVideoComments,
    updateComment } from "../controllers/comment.controller.js";

export const router = Router();
router.use(verifyJWT);

router.route("/c/:videoId").post(addComment).get(getVideoComments);
router.route("/c/:commentId").put(updateComment).delete(deleteComment);

export default router;