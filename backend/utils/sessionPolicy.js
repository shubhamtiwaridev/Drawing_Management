// utils/sessionPolicy.js
import UserSessionSchedule from "../models/UserSessionSchedule.js";
import UserActiveSession from "../models/UserActiveSession.js";
import { addHours } from "./sessionTime.js";

function minDate(a, b) {
  if (a && b) return a.getTime() <= b.getTime() ? a : b;
  return a || b || null;
}

export async function applyLoginPolicy({ userId, jwtExpiresAt }) {
  const now = new Date();

  const schedule = await UserSessionSchedule.findOne({
    userId,
    isActive: true,
  }).sort({ createdAt: -1 });

  if (!schedule) {
    const active = await UserActiveSession.create({
      userId,
      loginAt: now,
      jwtExpiresAt: jwtExpiresAt || null,
      forcedLogoutAt: null,
      isActive: true,
    });

    return {
      ok: true,
      scheduleMode: null,
      forcedLogoutAt: null,
      activeSession: active,
    };
  }

  // ✅ FIXED: LOGOUT_ONLY should ALLOW login, but force logout at logoutAt (if future)
  if (schedule.mode === "LOGOUT_ONLY") {
    if (!schedule.logoutAt) {
      return {
        ok: false,
        reason: "Logout-only schedule invalid (missing logoutAt).",
      };
    }

    // If logout time already passed -> disable schedule and allow normal login
    if (now.getTime() >= schedule.logoutAt.getTime()) {
      schedule.isActive = false;
      await schedule.save();

      const active = await UserActiveSession.create({
        userId,
        loginAt: now,
        jwtExpiresAt: jwtExpiresAt || null,
        forcedLogoutAt: null,
        isActive: true,
      });

      return {
        ok: true,
        scheduleMode: null,
        forcedLogoutAt: null,
        activeSession: active,
      };
    }

    const forcedLogoutAt = minDate(schedule.logoutAt, jwtExpiresAt || null);

    const active = await UserActiveSession.create({
      userId,
      loginAt: now,
      jwtExpiresAt: jwtExpiresAt || null,
      forcedLogoutAt,
      isActive: true,
    });

    return {
      ok: true,
      scheduleMode: "LOGOUT_ONLY",
      forcedLogoutAt,
      activeSession: active,
    };
  }

  if (schedule.mode === "LOGIN_ONLY") {
    if (!schedule.loginAt) {
      return { ok: false, reason: "Schedule invalid (missing loginAt)." };
    }

    if (now.getTime() < schedule.loginAt.getTime()) {
      return {
        ok: false,
        reason: "Login allowed only at/after scheduled login time.",
      };
    }

    const forced12h = addHours(now, 12);
    const forcedLogoutAt = minDate(forced12h, jwtExpiresAt || null);

    const active = await UserActiveSession.create({
      userId,
      loginAt: now,
      jwtExpiresAt: jwtExpiresAt || null,
      forcedLogoutAt,
      isActive: true,
    });

    return {
      ok: true,
      scheduleMode: "LOGIN_ONLY",
      forcedLogoutAt,
      activeSession: active,
    };
  }

  if (schedule.mode === "LOGIN_LOGOUT") {
    if (!schedule.loginAt || !schedule.logoutAt) {
      return { ok: false, reason: "Schedule invalid (missing login/logout)." };
    }

    if (now.getTime() < schedule.loginAt.getTime()) {
      return {
        ok: false,
        reason: "Login allowed only at/after scheduled login time.",
      };
    }

    // ✅ FIX: use >= so at exact logout time, login not allowed
    if (now.getTime() >= schedule.logoutAt.getTime()) {
      return {
        ok: false,
        reason: "Login not allowed after scheduled logout time.",
      };
    }

    const forcedLogoutAt = minDate(schedule.logoutAt, jwtExpiresAt || null);

    const active = await UserActiveSession.create({
      userId,
      loginAt: now,
      jwtExpiresAt: jwtExpiresAt || null,
      forcedLogoutAt,
      isActive: true,
    });

    return {
      ok: true,
      scheduleMode: "LOGIN_LOGOUT",
      forcedLogoutAt,
      activeSession: active,
    };
  }

  if (schedule.mode === "PERIOD_JWT") {
    if (!schedule.windowStart || !schedule.windowEnd) {
      return {
        ok: false,
        reason: "Schedule invalid (missing period window).",
      };
    }

    // ✅ FIX: use >= for end boundary
    if (
      now.getTime() < schedule.windowStart.getTime() ||
      now.getTime() >= schedule.windowEnd.getTime()
    ) {
      return {
        ok: false,
        reason: "Login allowed only inside scheduled period.",
      };
    }

    const forcedLogoutAt = minDate(schedule.windowEnd, jwtExpiresAt || null);

    const active = await UserActiveSession.create({
      userId,
      loginAt: now,
      jwtExpiresAt: jwtExpiresAt || null,
      forcedLogoutAt,
      isActive: true,
    });

    return {
      ok: true,
      scheduleMode: "PERIOD_JWT",
      forcedLogoutAt,
      activeSession: active,
    };
  }

  const active = await UserActiveSession.create({
    userId,
    loginAt: now,
    jwtExpiresAt: jwtExpiresAt || null,
    forcedLogoutAt: null,
    isActive: true,
  });

  return {
    ok: true,
    scheduleMode: null,
    forcedLogoutAt: null,
    activeSession: active,
  };
}
