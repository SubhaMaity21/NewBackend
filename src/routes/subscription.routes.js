import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";

export const router = Router();
router.use(verifyJWT);

router.route("/toggleSubscription/c/:channelId").post(toggleSubscription);
router.route("/getSubscribers/c/:channelId").get(getUserChannelSubscribers);

export default router;