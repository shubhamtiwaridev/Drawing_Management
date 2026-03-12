import mongoose from "mongoose";
import ActivityLog from "../models/activityLogModel.js";
import "../models/userModels.js";

const IST_OFFSET_MINUTES = 330;

const normalizeEnumAction = (v) =>
  String(v || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

const normalizeResourceType = (v) =>
  String(v || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const getStartOfTodayIST_asUTCDate = () => {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const ist = new Date(utcMs + IST_OFFSET_MINUTES * 60_000);
  ist.setHours(0, 0, 0, 0);
  const istStartUtcMs = ist.getTime() - IST_OFFSET_MINUTES * 60_000;
  return new Date(istStartUtcMs);
};

export const logActivity = async ({
  userId,
  action,
  resourceType,
  resourceId,
  metadata = {},
}) => {
  try {
    if (!userId || !action || !resourceType || !resourceId) return;

    const normAction = normalizeEnumAction(action);
    const normType = normalizeResourceType(resourceType);
    if (!mongoose.Types.ObjectId.isValid(String(userId))) return;
    if (!mongoose.Types.ObjectId.isValid(String(resourceId))) return;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const resourceObjectId = new mongoose.Types.ObjectId(resourceId);

    let actor = null;

    try {
      const User = mongoose.model("User");
      const u = await User.findById(userObjectId)
        .select("firstName lastName email employeeId role")
        .lean();

      if (u) {
        actor = {
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          email: u.email || "",
          employeeId: u.employeeId || "",
          role: u.role || "",
        };
      }
    } catch {}

    const event = {
      action: normAction,
      resourceType: normType,
      resourceId: resourceObjectId,
      metadata: { ...(metadata || {}), ...(actor ? { actor } : {}) },
      createdAt: new Date(),
    };

    await ActivityLog.findOneAndUpdate(
      { userId: userObjectId },
      {
        $setOnInsert: { userId: userObjectId },
        $push: { events: { $each: [event], $slice: -5000 } },
      },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
  } catch (err) {
    console.error("Activity log failed:", err);
  }
};

const mapActionToKey = (action) => {
  switch (action) {
    case "CREATE_DRAWING":
    case "CREATE_USER":
    case "CREATE_DEPARTMENT":
      return "created";
    case "OPEN":
      return "opened";
    case "UPDATE_DRAWING":
    case "UPDATE_USER":
    case "UPDATE_DEPARTMENT":
    case "ENABLE_USER":
    case "DISABLE_USER":
      return "updated";
    case "DELETE_DRAWING":
    case "DELETE_USER":
    case "DELETE_DEPARTMENT":
      return "deleted";
    case "SEARCH":
      return "searched";
    default:
      return null;
  }
};

export const getTodayActivityStats = async (_req, res) => {
  try {
    const startOfTodayIST = getStartOfTodayIST_asUTCDate();
    const stats = await ActivityLog.aggregate([
      { $unwind: "$events" },
      { $match: { "events.createdAt": { $gte: startOfTodayIST } } },
      { $group: { _id: "$events.action", count: { $sum: 1 } } },
    ]);

    const result = {
      created: 0,
      opened: 0,
      updated: 0,
      deleted: 0,
      searched: 0,
    };

    for (const row of stats) {
      const key = mapActionToKey(row._id);
      if (key) result[key] += row.count;
    }
    return res.json({ success: true, today: result });
  } catch (err) {
    console.error("getTodayActivityStats error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load today activity stats",
    });
  }
};

export const getOverallActivityStats = async (_req, res) => {
  try {
    const stats = await ActivityLog.aggregate([
      { $unwind: "$events" },
      { $group: { _id: "$events.action", count: { $sum: 1 } } },
    ]);

    const result = {
      created: 0,
      opened: 0,
      updated: 0,
      deleted: 0,
      searched: 0,
    };
    for (const row of stats) {
      const key = mapActionToKey(row._id);
      if (key) result[key] += row.count;
    }
    return res.json({ success: true, overall: result });
  } catch (err) {
    console.error("getOverallActivityStats error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load overall activity stats",
    });
  }
};
