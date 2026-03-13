// backend/controller/authControl.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModels.js";
import { logActivity } from "../utils/logActivity.js";

import UserActiveSession from "../models/UserActiveSession.js";
import { applyLoginPolicy } from "../utils/sessionPolicy.js";

const JWT_SECRET = process.env.JWT_SECRET || "devsecret";
const TOKEN_EXPIRY_SECONDS = 24 * 60 * 60; // 24h

const digitsOnly = (s = "") => String(s || "").replace(/\D/g, "");

export const login = async (req, res) => {
  try {
    const { email, employeeId, password } = req.body || {};

    if (!password || (!email && !employeeId)) {
      return res.status(400).json({
        success: false,
        message: "Password and (email or employeeId) are required.",
      });
    }

    if (email && employeeId) {
      return res.status(400).json({
        success: false,
        message: "Send either email or employeeId (not both).",
      });
    }

    let user = null;
    let loginMode = "";

    if (employeeId) {
      loginMode = "employeeId";
      const emp = digitsOnly(employeeId).padStart(3, "0");

      user = await userModel
        .findOne({ employeeId: emp, deleted: { $ne: true } })
        .lean();

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid employeeId or password.",
        });
      }

      if (user.disabled) {
        return res.status(403).json({
          success: false,
          message: "Your account is disabled. Please contact administrator.",
        });
      }

      if (user.role !== "user") {
        return res.status(403).json({
          success: false,
          message: "Admins must login using email and password.",
        });
      }
    }

    if (email) {
      loginMode = "email";
      const e = String(email || "")
        .trim()
        .toLowerCase();

      user = await userModel
        .findOne({ email: e, deleted: { $ne: true } })
        .lean();

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password.",
        });
      }

      if (user.disabled) {
        return res.status(403).json({
          success: false,
          message: "Your account is disabled. Please contact administrator.",
        });
      }

      if (user.role === "user") {
        return res.status(403).json({
          success: false,
          message: "Users must login using employeeId and password.",
        });
      }
    }

    const ok = await bcrypt.compare(String(password), user.password);
    if (!ok) {
      return res.status(401).json({
        success: false,
        message:
          loginMode === "employeeId"
            ? "Invalid employeeId or password."
            : "Invalid email or password.",
      });
    }

    const departments = Array.isArray(user.departments)
      ? user.departments
      : user.department
        ? [user.department]
        : [];

    const safeUser = {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      employeeId: user.employeeId,
      role: user.role || "user",
      department: departments[0] || null,
      departments,
      disabled: !!user.disabled,
      createdAt: user.createdAt,
    };

    const jwtExpiresAt = new Date(Date.now() + TOKEN_EXPIRY_SECONDS * 1000);

    await UserActiveSession.updateMany(
      { userId: user._id, isActive: true },
      { $set: { isActive: false, logoutAt: new Date() } },
    );

    const policy = await applyLoginPolicy({
      userId: user._id,
      jwtExpiresAt,
    });

    if (!policy.ok) {
      return res.status(403).json({
        success: false,
        message: policy.reason || "Login not allowed by schedule policy.",
      });
    }

    const token = jwt.sign(
      {
        id: safeUser.id,
        role: safeUser.role,
        departments: safeUser.departments,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    await userModel.updateOne(
      { _id: user._id },
      { $addToSet: { tokens: token } },
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure:
        process.env.NODE_ENV === "production" && process.env.ELECTRON !== "true",
      maxAge: TOKEN_EXPIRY_SECONDS * 1000,
    });

    await logActivity({
      req,
      userId: user._id,
      action: "LOGIN",
      resourceType: "user",
      resourceId: user._id,
      metadata: {
        loginMode,
        email: user.email,
        employeeId: user.employeeId,
        role: user.role,
        scheduleMode: policy.scheduleMode || null,
        forcedLogoutAt: policy.forcedLogoutAt || null,
        jwtExpiresAt,
      },
    });

    return res.json({
      success: true,
      token,
      user: safeUser,
      session: {
        scheduleMode: policy.scheduleMode,
        forcedLogoutAt: policy.forcedLogoutAt,
        jwtExpiresAt,
      },
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during login.",
    });
  }
};

export const logout = async (req, res) => {
  try {
    const token =
      req.cookies?.token || req.headers.authorization?.split(" ")[1];

    let payload = null;
    if (token) {
      try {
        payload = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
      } catch {
        payload = null;
      }
    }

    if (payload?.id) {
      const user = await userModel.findById(payload.id).lean();

      if (user && Array.isArray(user.tokens) && user.tokens.includes(token)) {
        await UserActiveSession.updateMany(
          { userId: payload.id, isActive: true },
          { $set: { isActive: false, logoutAt: new Date() } },
        );

        await logActivity({
          userId: payload.id,
          action: "LOGOUT",
          resourceType: "user",
          resourceId: payload.id,
          metadata: {},
        });

        await userModel.updateOne(
          { _id: payload.id },
          { $pull: { tokens: token } },
        );
      }
    }

    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax",
      secure:
        process.env.NODE_ENV === "production" && process.env.ELECTRON !== "true",
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("logout error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during logout.",
    });
  }
};
