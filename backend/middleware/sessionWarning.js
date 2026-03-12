// middleware/sessionWarning.js
import UserActiveSession from "../models/UserActiveSession.js";

function minExpiry(forcedLogoutAt, jwtExpiresAt) {
  if (forcedLogoutAt && jwtExpiresAt) {
    return forcedLogoutAt.getTime() <= jwtExpiresAt.getTime()
      ? forcedLogoutAt
      : jwtExpiresAt;
  }
  return forcedLogoutAt || jwtExpiresAt || null;
}

export default async function sessionWarning(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) return next();

    const active = await UserActiveSession.findOne({
      userId,
      isActive: true,
    }).sort({ createdAt: -1 });

    if (!active) return next();

    const expiresAt = minExpiry(active.forcedLogoutAt, active.jwtExpiresAt);
    if (!expiresAt) return next();

    const remainingMs = expiresAt.getTime() - Date.now();
    if (remainingMs <= 0) {
      active.isActive = false;
      active.logoutAt = new Date();
      await active.save();

      res.clearCookie("token", {
        httpOnly: true,
        sameSite: "lax",
        secure:
          process.env.NODE_ENV === "production" &&
          process.env.ELECTRON !== "true",
      });

      res.setHeader("X-Session-Expired", "1");
      req.user = null;

      return res
        .status(401)
        .json({ success: false, message: "Session expired" });
    }

    const twoHours = 2 * 60 * 60 * 1000;
    const oneHour = 1 * 60 * 60 * 1000;

    if (remainingMs <= twoHours) res.setHeader("X-Session-Warn-2h", "1");
    if (remainingMs <= oneHour) res.setHeader("X-Session-Warn-1h", "1");

    res.setHeader("X-Session-Expires-At", expiresAt.toISOString());
    res.setHeader("X-Session-Remaining-MS", String(remainingMs));

    return next();
  } catch {
    return next();
  }
}
