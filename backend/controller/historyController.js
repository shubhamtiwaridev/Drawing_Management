import mongoose from "mongoose";
import ActivityLog from "../models/activityLogModel.js";
import "../models/userModels.js";

export const getDrawingHistory = async (req, res) => {
  try {
    const { drawingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(drawingId)) {
      return res.status(400).json({ message: "Invalid drawingId" });
    }

    const drawingObjectId = new mongoose.Types.ObjectId(drawingId);
    const events = await ActivityLog.aggregate([
      { $unwind: "$events" },
      {
        $match: {
          "events.resourceId": drawingObjectId,
          "events.resourceType": "drawing",
        },
      },
      { $sort: { "events.createdAt": -1 } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: "$events._id",
          action: "$events.action",
          metadata: { $ifNull: ["$events.metadata", {}] },
          createdAt: "$events.createdAt",
          resourceId: "$events.resourceId",
          resourceType: "$events.resourceType",
          userId: {
            _id: "$user._id",
            firstName: {
              $ifNull: ["$user.firstName", "$events.metadata.actor.firstName"],
            },
            lastName: {
              $ifNull: ["$user.lastName", "$events.metadata.actor.lastName"],
            },
            email: { $ifNull: ["$user.email", "$events.metadata.actor.email"] },
            role: { $ifNull: ["$user.role", "$events.metadata.actor.role"] },
            employeeId: {
              $ifNull: [
                "$user.employeeId",
                "$events.metadata.actor.employeeId",
              ],
            },
          },
        },
      },
    ]);

    return res.json({ activityLogs: events });
  } catch (err) {
    console.error("History fetch error:", err);
    return res.status(500).json({ message: "Failed to load history" });
  }
};

export const getAllHistory = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "100", 10), 1),
      500,
    );
    const skip = (page - 1) * limit;

    const totalAgg = await ActivityLog.aggregate([
      { $unwind: "$events" },
      { $count: "totalEvents" },
    ]);
    const totalEvents = totalAgg?.[0]?.totalEvents || 0;

    const events = await ActivityLog.aggregate([
      { $unwind: "$events" },
      { $sort: { "events.createdAt": -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },

      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: "$events._id",
          action: "$events.action",
          metadata: { $ifNull: ["$events.metadata", {}] },
          createdAt: "$events.createdAt",
          resourceId: "$events.resourceId",
          resourceType: "$events.resourceType",
          userId: {
            _id: "$user._id",
            firstName: {
              $ifNull: ["$user.firstName", "$events.metadata.actor.firstName"],
            },
            lastName: {
              $ifNull: ["$user.lastName", "$events.metadata.actor.lastName"],
            },
            email: { $ifNull: ["$user.email", "$events.metadata.actor.email"] },
            role: { $ifNull: ["$user.role", "$events.metadata.actor.role"] },
            employeeId: {
              $ifNull: [
                "$user.employeeId",
                "$events.metadata.actor.employeeId",
              ],
            },
          },
        },
      },
    ]);

    return res.json({
      success: true,
      page,
      limit,
      totalEvents,
      activityLogs: events,
    });
  } catch (err) {
    console.error("Global history error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load global history",
    });
  }
};

export const deleteHistoryEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid eventId" });
    }

    const objId = new mongoose.Types.ObjectId(eventId);

    const result = await ActivityLog.updateOne(
      { "events._id": objId },
      { $pull: { events: { _id: objId } } },
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "History entry not found" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Delete history error:", err);
    return res.status(500).json({ message: "Failed to delete history entry" });
  }
};
