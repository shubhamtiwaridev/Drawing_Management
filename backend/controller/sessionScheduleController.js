// controller/sessionScheduleController.js
import UserSessionSchedule from "../models/UserSessionSchedule.js";
import UserActiveSession from "../models/UserActiveSession.js";
import { parseUiDateTime } from "../utils/sessionTime.js";
import { logActivity } from "./activityLogController.js";

function assertNotPastMonth(dateObj) {
  const now = new Date();
  const curYM = now.getFullYear() * 100 + (now.getMonth() + 1);
  const pickedYM = dateObj.getFullYear() * 100 + (dateObj.getMonth() + 1);
  return pickedYM >= curYM;
}

function validateFuture(dateObj, label) {
  if (!dateObj) return `${label} date+time required`;
  if (dateObj.getTime() < Date.now()) {
    return `${label} date+time cannot be in the past`;
  }
  if (!assertNotPastMonth(dateObj)) {
    return `${label} month cannot be before current month`;
  }

  return null;
}

function minDate(a, b) {
  if (a && b) return a.getTime() <= b.getTime() ? a : b;
  return a || b || null;
}

export async function upsertSchedule(req, res) {
  try {
    const { userId, mode, login, logout, windowStart, windowEnd, note } =
      req.body || {};

    if (!userId || !mode) {
      return res.status(400).json({ message: "userId and mode are required" });
    }

    let loginAt = null;
    let logoutAt = null;
    let ws = null;
    let we = null;

    if (mode === "LOGIN_ONLY") {
      loginAt = parseUiDateTime(login);
      const err = validateFuture(loginAt, "Login");
      if (err) return res.status(400).json({ message: err });
    }

    if (mode === "LOGIN_LOGOUT") {
      loginAt = parseUiDateTime(login);
      logoutAt = parseUiDateTime(logout);

      const e1 = validateFuture(loginAt, "Login");
      if (e1) return res.status(400).json({ message: e1 });

      const e2 = validateFuture(logoutAt, "Logout");
      if (e2) return res.status(400).json({ message: e2 });

      if (logoutAt.getTime() < loginAt.getTime()) {
        return res
          .status(400)
          .json({ message: "Logout cannot be before Login" });
      }
    }

    if (mode === "LOGOUT_ONLY") {
      logoutAt = parseUiDateTime(logout);
      const err = validateFuture(logoutAt, "Logout");
      if (err) return res.status(400).json({ message: err });
    }

    if (mode === "PERIOD_JWT") {
      ws = parseUiDateTime(windowStart);
      we = parseUiDateTime(windowEnd);

      const e1 = validateFuture(ws, "Window start");
      if (e1) return res.status(400).json({ message: e1 });

      const e2 = validateFuture(we, "Window end");
      if (e2) return res.status(400).json({ message: e2 });

      if (we.getTime() < ws.getTime()) {
        return res
          .status(400)
          .json({ message: "Window end cannot be before start" });
      }
    }
    await UserSessionSchedule.updateMany(
      { userId, isActive: true },
      { $set: { isActive: false } },
    );

    const created = await UserSessionSchedule.create({
      userId,
      mode,
      loginAt,
      logoutAt,
      windowStart: ws,
      windowEnd: we,
      note: note || "",
      isActive: true,
    });

    // ✅ Apply schedule immediately to current active session (if exists)
    const active = await UserActiveSession.findOne({
      userId,
      isActive: true,
    }).sort({ createdAt: -1 });

    if (active) {
      let scheduleEnd = null;
      if (mode === "LOGIN_LOGOUT" || mode === "LOGOUT_ONLY")
        scheduleEnd = logoutAt;
      if (mode === "PERIOD_JWT") scheduleEnd = we;

      if (scheduleEnd) {
        active.forcedLogoutAt = minDate(
          scheduleEnd,
          active.jwtExpiresAt || null,
        );
        await active.save();
      }
    }

    const actorId = req.user?.id || req.user?._id;
    if (actorId) {
      await logActivity({
        userId: actorId,
        action: "SCHEDULE_UPSERT",
        resourceType: "user",
        resourceId: userId,
        metadata: {
          scheduleId: created?._id,
          mode,
          loginAt,
          logoutAt,
          windowStart: ws,
          windowEnd: we,
          note: note || "",
        },
      });
    }

    return res.json({ ok: true, schedule: created });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Failed to save schedule" });
  }
}

export async function getActiveSchedules(_req, res) {
  const list = await UserSessionSchedule.find({ isActive: true }).sort({
    createdAt: -1,
  });
  res.json(list);
}

export async function cleanupUserSessions(req, res) {
  const { userId } = req.params;

  await UserSessionSchedule.deleteMany({ userId });
  await UserActiveSession.deleteMany({ userId });
  const actorId = req.user?.id || req.user?._id;
  if (actorId) {
    await logActivity({
      userId: actorId,
      action: "SCHEDULE_CLEANUP",
      resourceType: "user",
      resourceId: userId,
      metadata: { cleared: true },
    });
  }

  res.json({ ok: true });
}
