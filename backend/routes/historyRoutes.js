import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireAdmin from "../middleware/requireAdmin.js"; 
import {getDrawingHistory,getAllHistory,deleteHistoryEvent,} from "../controller/historyController.js";

const router = express.Router();

router.get("/:drawingId", requireAuth, getDrawingHistory);

router.get("/", requireAuth, requireAdmin, getAllHistory);

router.delete(
  "/event/:eventId",
  requireAuth,
  requireAdmin,
  deleteHistoryEvent
);



export default router;
