import mongoose from "mongoose";

const UserSessionScheduleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    mode: {
      type: String,
      enum: ["LOGIN_ONLY", "LOGIN_LOGOUT", "LOGOUT_ONLY", "PERIOD_JWT"],
      required: true,
      index: true,
    },
    loginAt: { type: Date, default: null },
    logoutAt: { type: Date, default: null },
    windowStart: { type: Date, default: null },
    windowEnd: { type: Date, default: null },
    note: { type: String, default: "" },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

UserSessionScheduleSchema.index({ userId: 1, isActive: 1 });
export default mongoose.model("UserSessionSchedule", UserSessionScheduleSchema);
