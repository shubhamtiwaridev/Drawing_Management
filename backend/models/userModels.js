import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: function () {
        return this.role !== "user";
      },
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },

    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["superadmin", "admin", "subadmin", "user"],
      default: "user",
    },

    employeeId: {
      type: String,
      required: function () {
        return this.role !== "superadmin";
      },
      unique: true,
      sparse: true,
      trim: true,
    },

    departments: { type: [String], default: [] },
    department: { type: String },
    tokens: { type: [String], default: [] },

    disabled: { type: Boolean, default: false },

    deleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const userModel = mongoose.models.User || mongoose.model("User", userSchema);
export default userModel;
