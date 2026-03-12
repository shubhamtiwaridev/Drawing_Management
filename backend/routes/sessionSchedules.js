import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";
import {
  upsertSchedule,
  getActiveSchedules,
  cleanupUserSessions,
} from "../controller/sessionScheduleController.js";

const router = express.Router();

router.post("/upsert", requireAuth, requireAdmin, upsertSchedule);
router.get("/", requireAuth, requireAdmin, getActiveSchedules);
router.delete("/cleanup/:userId", requireAuth, requireAdmin, cleanupUserSessions);

export default router;
