import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import {
  logActivity,
  getTodayActivityStats,
  getOverallActivityStats,
} from "../controller/activityLogController.js";

const router = express.Router();

router.get("/stats/overall", requireAuth, getOverallActivityStats);
router.get("/stats/today", requireAuth, getTodayActivityStats);

router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      action,
      resourceType,
      resourceId,
      metadata: incomingMetadata,
    } = req.body;

    const envAccessFrom = process.env.ELECTRON === "true" ? "App" : "Web";
    const userAgent = String(req.headers["user-agent"] || "").toLowerCase();

    const accessFrom =
      String(
        incomingMetadata?.accessFrom || incomingMetadata?.platform || "",
      ).trim() || (userAgent.includes("electron") ? "App" : envAccessFrom);

    const metadata = {
      ...(incomingMetadata || {}),
      accessFrom,
    };

    await logActivity({
      userId,
      action,
      resourceType,
      resourceId,
      metadata,
      accessFrom,
    });

    res.status(201).json({ success: true });
  } catch (err) {
    console.error("Activity route log failed:", err);
    res.status(500).json({ message: "Activity log failed" });
  }
});

export default router;
