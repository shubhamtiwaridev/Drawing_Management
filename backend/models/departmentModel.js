// models/departmentModel.js
import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    shortCode: {
      type: String,
      trim: true,
      default: undefined,
    },
  },
  { timestamps: true },
);

const Department =
  mongoose.models.department || mongoose.model("department", departmentSchema);

export default Department;
