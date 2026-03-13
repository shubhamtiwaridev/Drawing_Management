// middleware/auth.js
import jwt from "jsonwebtoken";
import userModel from "../models/userModels.js";

const JWT_SECRET = process.env.JWT_SECRET || "devsecret";

export default async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const tokenFromHeader =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

    const token = tokenFromHeader || req.cookies?.token || null;

    if (!token) {
      req.user = null;
      return next();
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      req.user = null;
      return next();
    }

    if (!payload?.id) {
      req.user = null;
      return next();
    }

    const user = await userModel.findById(payload.id).lean();
    if (!user || user.deleted || user.disabled) {
      req.user = null;
      return next();
    }

    if (!Array.isArray(user.tokens) || !user.tokens.includes(token)) {
      req.user = null;
      return next();
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role || "user",
      firstName: user.firstName,
      lastName: user.lastName,
      departments: Array.isArray(user.departments) ? user.departments : [],
      employeeId: user.employeeId,
      mobile: user.mobile,
    };

    return next();
  } catch (err) {
    console.warn("Auth middleware error:", err?.message || err);
    req.user = null;
    return next();
  }
}
