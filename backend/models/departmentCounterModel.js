// models/departmentCounterModel.js
import mongoose from "mongoose";

const departmentCounterSchema = new mongoose.Schema(
  {
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "department",
      required: true,
      index: true,
      unique: true,
    },
    departmentName: { type: String, required: true, trim: true },
    shortCode: { type: String, trim: true, default: undefined },
    lastNumberUsed: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

const DepartmentCounter =
  mongoose.models.DepartmentCounter ||
  mongoose.model("DepartmentCounter", departmentCounterSchema);

export default DepartmentCounter;
