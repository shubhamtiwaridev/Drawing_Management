import ActivityLog from "../models/activityLogModel.js";

export const logActivity = async ({
  userId,
  action,
  resourceType = "drawing",
  resourceId,
  metadata = {},
}) => {
  try {
    if (!userId || !action || !resourceId) return;

    await ActivityLog.findOneAndUpdate(
      { userId }, 
      {
        $setOnInsert: { userId },
        $push: {
          events: {
            action,
            resourceType,
            resourceId,
            metadata,
          },
        },
      },
      { upsert: true }
    );
  } catch (err) {
    console.error("Activity log failed:", err);
  }
};
