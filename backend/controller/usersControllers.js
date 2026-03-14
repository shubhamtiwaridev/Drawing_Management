// backend/controller/usersControllers.js
import userModel from "../models/userModels.js";
import bcrypt from "bcryptjs";
import Department from "../models/departmentModel.js";
import UserActiveSession from "../models/UserActiveSession.js";
import UserSessionSchedule from "../models/UserSessionSchedule.js";
import mongoose from "mongoose";
import { logActivity } from "./activityLogController.js";

function normalizeDepartments(u) {
  if (!u) return [];
  if (Array.isArray(u.departments) && u.departments.length)
    return u.departments;
  if (Array.isArray(u.department)) return u.department;
  if (typeof u.department === "string" && u.department.trim())
    return [u.department.trim()];
  return [];
}

function parseBool(v) {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v.toLowerCase() === "true";
  return undefined;
}

export const listUsers = async (req, res) => {
  try {
    const filter = { deleted: { $ne: true } };

    if (req.query.role && req.query.role !== "all") {
      filter.role = req.query.role;
    }

    const users = await userModel.find(filter).sort({ createdAt: -1 }).lean();
    const safe = users.map((u) => {
      const departments = normalizeDepartments(u);
      return {
        id: u._id.toString(),
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        employeeId: u.employeeId,
        role: u.role,
        departments,
        department: departments[0] || null,
        disabled: !!u.disabled,
        createdAt: u.createdAt,
      };
    });
    res.json(safe);
  } catch (err) {
    console.error("listUsers error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getUser = async (req, res) => {
  try {
    const u = await userModel.findById(req.params.id).lean();
    if (!u || u.deleted) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    const departments = normalizeDepartments(u);

    res.json({
      id: u._id.toString(),
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      employeeId: u.employeeId,
      role: u.role,
      departments,
      department: departments[0] || null,
      disabled: !!u.disabled,
      createdAt: u.createdAt,
    });
  } catch (err) {
    console.error("getUser error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getMe = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }
    const u = await userModel.findById(req.user.id).lean();
    if (!u || u.deleted) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    
    const departments = normalizeDepartments(u);

    return res.json({
      id: u._id.toString(),
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      employeeId: u.employeeId,
      role: u.role,
      departments,
      department: departments[0] || null,
      disabled: !!u.disabled,
      createdAt: u.createdAt,
    });
  } catch (err) {
    console.error("getMe error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const createUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      employeeId,
      department,
      departments,
      disabled,
    } = req.body;

    if (!firstName || !lastName || !password || (role !== "user" && !email)) {
      return res.status(400).json({
        success: false,
        message:
          "firstName/lastName/password required (email required for admin roles)",
      });
    }

    const emailRaw = String(email || "").trim();
    const normalizedEmail = emailRaw ? emailRaw.toLowerCase() : undefined;

    const empSafe = String(employeeId || "")
      .replace(/\D/g, "")
      .slice(0, 3);
    if (role !== "superadmin") {
      if (empSafe.length !== 3) {
        return res.status(400).json({
          success: false,
          message: "Employee ID is required (3 digits) for this role.",
        });
      }
    }

    const or = [];
    if (normalizedEmail) or.push({ email: normalizedEmail });
    if (empSafe) or.push({ employeeId: empSafe });

    if (or.length) {
      const existing = await userModel.findOne({ $or: or }).lean();
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Email or Employee ID exists",
        });
      }
    }

    let deps = [];
    if (Array.isArray(departments)) {
      deps = departments.map((d) => String(d).trim()).filter(Boolean);
    } else if (typeof department === "string" && department.trim()) {
      deps = [department.trim()];
    }

    const finalEmployeeId =
      role === "superadmin" ? undefined : empSafe.padStart(3, "0");

    const hashed = await bcrypt.hash(String(password), 10);

    const disabledParsed = parseBool(disabled);

    const createPayload = {
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      password: hashed,
      role,
      employeeId: finalEmployeeId,
      departments: deps,
      department: deps[0] || null,
      disabled: typeof disabledParsed === "boolean" ? disabledParsed : false,
    };

    if (normalizedEmail) createPayload.email = normalizedEmail;

    const user = await userModel.create(createPayload);

    await logActivity({
      userId: req.user?.id,
      action: "CREATE_USER",
      resourceType: "user",
      resourceId: user._id,
      metadata: {
        createdUserEmail: user.email,
        createdUserRole: user.role,
        employeeId: user.employeeId,
        departments: deps,
        disabled: !!user.disabled,

        targetUserId: user._id.toString(),
        targetEmail: user.email,
        targetName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        targetEmployeeId: user.employeeId,
        targetRole: user.role,
      },
    });

    const obj = user.toObject();
    delete obj.password;

    return res.status(201).json({
      ...obj,
      id: user._id.toString(),
    });
  } catch (err) {
    console.error("createUser error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user id" });
    }

    const existing = await userModel.findById(id).lean();
    if (!existing || existing.deleted) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    const viewerRole = String(req.user?.role || "").toLowerCase();
    const targetRole = String(existing.role || "").toLowerCase();

    if (targetRole === "superadmin" && viewerRole !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to modify Super Admin.",
      });
    }

    if (
      req.user?.id &&
      req.user.id === id &&
      Object.prototype.hasOwnProperty.call(req.body || {}, "disabled")
    ) {
      return res.status(400).json({
        success: false,
        message: "You cannot disable your own account.",
      });
    }

    const update = { ...req.body };

    if ("mobile" in update) delete update.mobile;

    let passwordChanged = false;

    if (typeof update.password === "string") {
      const p = update.password.trim();

      if (!p) {
        delete update.password;
      } else {
        update.password = await bcrypt.hash(p, 10);
        passwordChanged = true;
      }
    }

    if (Object.prototype.hasOwnProperty.call(update, "disabled")) {
      const b = parseBool(update.disabled);
      if (typeof b === "boolean") update.disabled = b;
      else delete update.disabled;
    }

    const user = await userModel
      .findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    const disabledChanged =
      Object.prototype.hasOwnProperty.call(update, "disabled") &&
      Boolean(existing.disabled) !== Boolean(user.disabled);

    if (disabledChanged && user.disabled) {
      await UserActiveSession.updateMany(
        { userId: id, isActive: true },
        { $set: { isActive: false, logoutAt: new Date() } },
      );

      await userModel.updateOne({ _id: id }, { $set: { tokens: [] } });
    }

    await logActivity({
      userId: req.user?.id,
      action: "UPDATE_USER",
      resourceType: "user",
      resourceId: user._id,
      metadata: {
        updatedFields: Object.keys(req.body || {}).filter(
          (k) => k !== "password",
        ),
        passwordChanged,
        disabledChanged,
        disabled: !!user.disabled,

        targetEmail: user.email,
        targetRole: user.role,

        targetUserId: user._id.toString(),
        targetName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        targetEmployeeId: user.employeeId,
      },
    });

    const departments = normalizeDepartments(user);

    return res.json({
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      employeeId: user.employeeId,
      role: user.role,
      departments,
      department: departments[0] || null,
      disabled: !!user.disabled,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error("updateUser error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { hard } = req.query;
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user id" });
    }

    const target = await userModel.findById(userId).lean();
    if (!target) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    await UserActiveSession.deleteMany({ userId });
    await UserSessionSchedule.deleteMany({ userId });

    if (hard === "true") {
      await userModel.findByIdAndDelete(userId);

      await logActivity({
        userId: req.user?.id,
        action: "DELETE_USER",
        resourceType: "user",
        resourceId: userId,
        metadata: {
          hardDelete: true,
          targetEmail: target.email,
          targetRole: target.role,
          employeeId: target.employeeId,
          targetUserId: target._id.toString(),
          targetName:
            `${target.firstName || ""} ${target.lastName || ""}`.trim(),
          targetEmployeeId: target.employeeId,
        },
      });

      return res.json({ success: true });
    }

    await userModel.findByIdAndUpdate(userId, { deleted: true });

    await logActivity({
      userId: req.user?.id,
      action: "DELETE_USER",
      resourceType: "user",
      resourceId: userId,
      metadata: {
        hardDelete: false,
        targetEmail: target.email,
        targetRole: target.role,
        employeeId: target.employeeId,
        targetUserId: target._id.toString(),
        targetName: `${target.firstName || ""} ${target.lastName || ""}`.trim(),
        targetEmployeeId: target.employeeId,
      },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("deleteUser error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAssignedDepartments = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id).lean();
    if (!user || user.deleted) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const deptNames = normalizeDepartments(user);
    if (!deptNames.length) {
      return res.json({ success: true, departmentIds: [] });
    }

    const departments = await Department.find({
      name: { $in: deptNames },
    }).lean();

    const departmentIds = departments.map((d) => d._id.toString());

    return res.json({ success: true, departmentIds });
  } catch (err) {
    console.error("getAssignedDepartments error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getTotalUsersCount = async (_req, res) => {
  try {
    const count = await userModel.countDocuments({ deleted: { $ne: true } });
    res.json({ success: true, totalUsers: count });
  } catch (err) {
    console.error("getTotalUsersCount error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch total users count" });
  }
};

export const getUsersCountByRole = async (_req, res) => {
  try {
    const results = await userModel.aggregate([
      { $match: { deleted: { $ne: true } } },
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    const roleCounts = { superadmin: 0, admin: 0, subadmin: 0, user: 0 };

    results.forEach((r) => {
      if (Object.prototype.hasOwnProperty.call(roleCounts, r._id)) {
        roleCounts[r._id] = r.count;
      }
    });

    const total = Object.values(roleCounts).reduce((a, b) => a + b, 0);

    res.json({ success: true, roles: roleCounts, total });
  } catch (err) {
    console.error("getUsersCountByRole error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch users by role" });
  }
};
