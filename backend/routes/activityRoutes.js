import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import { logActivity, getTodayActivityStats, getOverallActivityStats, } from "../controller/activityLogController.js";

const router = express.Router();

router.get("/stats/overall", requireAuth, getOverallActivityStats);
router.get("/stats/today", requireAuth, getTodayActivityStats);
router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { action, resourceType, resourceId, metadata } = req.body;

    await logActivity({
      userId,
      action,
      resourceType,
      resourceId,
      metadata,
    });

    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Activity log failed" });
  }
});

export default router;
