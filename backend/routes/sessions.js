import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import { getMySession } from "../controller/sessionsController.js";

const router = express.Router();

router.get("/me", requireAuth, getMySession);

export default router;
