import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import { openFile } from "../controller/drawingController.js";

const router = express.Router();

router.get("/open/:drawingId/:fileKey", requireAuth, openFile);
router.get("/open/:drawingId", requireAuth, openFile);

export default router;
