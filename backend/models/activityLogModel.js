import mongoose from "mongoose";

const activityEventSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: [
        "LOGIN",
        "LOGOUT",
        "SCHEDULE_UPSERT",
        "SCHEDULE_CLEANUP",
        "SESSION_CHECK",
        "CREATE_DRAWING",
        "UPDATE_DRAWING",
        "DELETE_DRAWING",
        "ACTIVATE_DRAWING",
        "DEACTIVATE_DRAWING",
        "SEARCH",
        "OPEN",
        "DOWNLOAD",
        "CREATE_USER",
        "UPDATE_USER",
        "DELETE_USER",
        "CREATE_DEPARTMENT",
        "UPDATE_DEPARTMENT",
        "DELETE_DEPARTMENT",
      ],
      required: true,
    },

    resourceType: {
      type: String,
      enum: ["drawing", "file", "user", "department"],
      required: true,
    },

    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
);

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    events: {
      type: [activityEventSchema],
      default: [],
    },
  },
  { timestamps: true },
);

activityLogSchema.index({ "events.createdAt": -1 });
activityLogSchema.index({ "events.resourceId": 1 });
activityLogSchema.index({ "events.action": 1 });
activityLogSchema.index({ "events.resourceType": 1 });

export default mongoose.models.ActivityLog ||
  mongoose.model("ActivityLog", activityLogSchema);
