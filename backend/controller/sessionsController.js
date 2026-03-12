// backend/controller/sessionsController.js
import UserActiveSession from "../models/UserActiveSession.js";
import { logActivity } from "./activityLogController.js";

function minExpiry(forcedLogoutAt, jwtExpiresAt) {
  if (forcedLogoutAt && jwtExpiresAt) {
    return forcedLogoutAt.getTime() <= jwtExpiresAt.getTime()
      ? forcedLogoutAt
      : jwtExpiresAt;
  }
  return forcedLogoutAt || jwtExpiresAt || null;
}

export async function getMySession(req, res) {
  const userId = req.user?.id || req.user?._id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  if (req.query?.track === "1") {
    await logActivity({
      userId,
      action: "SESSION_CHECK",
      resourceType: "user",
      resourceId: userId,
      metadata: { path: "/api/sessions/me" },
    });
  }

  const active = await UserActiveSession.findOne({
    userId,
    isActive: true,
  }).sort({ createdAt: -1 });

  if (!active) return res.json({ active: false });

  const expiresAt = minExpiry(active.forcedLogoutAt, active.jwtExpiresAt);

  return res.json({
    active: true,
    loginAt: active.loginAt,
    forcedLogoutAt: active.forcedLogoutAt,
    jwtExpiresAt: active.jwtExpiresAt,
    expiresAt,
    remainingMs: expiresAt
      ? Math.max(0, expiresAt.getTime() - Date.now())
      : null,
  });
}
