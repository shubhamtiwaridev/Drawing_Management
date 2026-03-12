import mongoose from "mongoose";

const UserActiveSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    loginAt: { type: Date, required: true },
    forcedLogoutAt: { type: Date, default: null },
    jwtExpiresAt: { type: Date, default: null },

    logoutAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

UserActiveSessionSchema.index({ userId: 1, isActive: 1 });

export default mongoose.model("UserActiveSession", UserActiveSessionSchema);
