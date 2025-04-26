import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getChannelStats } from "../controllers/dashboard.controller.js";

export const router = Router();
router.use(verifyJWT);

router.route("/").get(getChannelStats)

export default router;