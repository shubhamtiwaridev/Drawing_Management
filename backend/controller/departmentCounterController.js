// controller/departmentCounterController.js
import mongoose from "mongoose";
import Department from "../models/departmentModel.js";
import DepartmentCounter from "../models/departmentCounterModel.js";

export const getCounter = async (req, res) => {
  try {
    const { departmentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({ success: false, message: "Invalid department id" });
    }

    let counter = await DepartmentCounter.findOne({ departmentId }).lean();

    if (!counter) {
      const dep = await Department.findById(departmentId).lean();
      if (!dep) {
        return res.status(404).json({ success: false, message: "Department not found" });
      }

      counter = await DepartmentCounter.create({
        departmentId: dep._id,
        departmentName: dep.name,
        shortCode: dep.shortCode,
        lastNumberUsed: typeof dep.lastNumberUsed === "number" ? dep.lastNumberUsed : 0,
      });

      counter = counter.toObject();
    }

    return res.json({
      success: true,
      counter: {
        departmentId: counter.departmentId.toString(),
        departmentName: counter.departmentName,
        shortCode: counter.shortCode,
        lastNumberUsed: counter.lastNumberUsed || 0,
      },
    });
  } catch (err) {
    console.error("getCounter error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getNextNumber = async (req, res) => {
  try {
    const { departmentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({ success: false, message: "Invalid department id" });
    }

    const dep = await Department.findById(departmentId).lean();
    if (!dep) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    const updated = await DepartmentCounter.findOneAndUpdate(
      { departmentId },
      {
        $setOnInsert: { departmentName: dep.name, shortCode: dep.shortCode },
        $inc: { lastNumberUsed: 1 },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, lean: true }
    );

    const nextNumber = updated.lastNumberUsed || 0;

    return res.json({
      success: true,
      nextNumber,
      department: {
        departmentId: updated.departmentId.toString(),
        departmentName: updated.departmentName,
        shortCode: updated.shortCode,
      },
    });
  } catch (err) {
    console.error("getNextNumber error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const backfillCounters = async (req, res) => {
  try {
    if (String(process.env.DEPT_COUNTER_BACKFILL) !== "1") {
      return res.status(403).json({ success: false, message: "Backfill disabled" });
    }
    const Drawing = (await import("../models/drawingModel.js")).default;

    const departments = await Department.find({}).lean();
    const results = [];

    for (const dep of departments) {
      const folderSlug = (dep.name || "").toLowerCase().trim().replace(/\s+/g, "_");
      const short = dep.shortCode || "";

      const q = {
        $or: [
          { folderSlug },
          { shortcut: dep.shortCode || "" },
          ...(short ? [{ fullDrawingNo: { $regex: `^${short}[-_]?\\d+`, $options: "i" } }] : []),
        ],
      };

      const drawings = await Drawing.find(q).lean();
      let maxNum = 0;
      drawings.forEach((d) => {
        if (d.drawingNo && /^\d+$/.test(String(d.drawingNo).trim())) {
          const n = parseInt(String(d.drawingNo).trim(), 10);
          if (!Number.isNaN(n) && n > maxNum) maxNum = n;
        } else if (d.fullDrawingNo) {
          const m = String(d.fullDrawingNo).match(/(\d+)\s*$/);
          if (m && m[1]) {
            const n = parseInt(m[1], 10);
            if (!Number.isNaN(n) && n > maxNum) maxNum = n;
          }
        }
      });

      if (maxNum > 0) {
        await DepartmentCounter.findOneAndUpdate(
          { departmentId: dep._id },
          { $set: { departmentName: dep.name, shortCode: dep.shortCode, lastNumberUsed: maxNum } },
          { upsert: true }
        );
      }

      results.push({ departmentId: dep._id.toString(), deptName: dep.name, foundMax: maxNum });
    }

    return res.json({ success: true, results });
  } catch (err) {
    console.error("backfillCounters error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export default { getCounter, getNextNumber, backfillCounters };
