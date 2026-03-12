// // backend/controller/departmentController.js
// import mongoose from "mongoose";
// import Department from "../models/departmentModel.js";
// import User from "../models/userModels.js";
// import fs from "fs";
// import path from "path";
// import { logActivity } from "./activityLogController.js";

// const safeDeptSlug = (name = "") =>
//   name.toLowerCase().trim().replace(/\s+/g, "_");

// const escapeRegex = (s = "") =>
//   String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// const normalizeUserDepartments = (u) => {
//   if (!u) return [];
//   if (Array.isArray(u.departments) && u.departments.length)
//     return u.departments;
//   if (typeof u.department === "string" && u.department.trim())
//     return [u.department.trim()];
//   return [];
// };

// export const createDepartment = async (req, res) => {
//   try {
//     const { name, shortCode } = req.body || {};
//     const trimmedName = (name || "").trim();

//     if (!trimmedName) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Department name is required" });
//     }

//     const payload = { name: trimmedName };

//     if (shortCode && String(shortCode).trim()) {
//       payload.shortCode = String(shortCode).trim().toUpperCase();
//     }

//     const existing = await Department.findOne({ name: trimmedName }).lean();
//     if (existing) {
//       return res.status(409).json({
//         success: false,
//         message: "Department already exists",
//       });
//     }

//     const dep = await Department.create(payload);

//     const deptSlug = safeDeptSlug(dep.name);

//     const PROJECT_ROOT = process.env.PROJECT_ROOT
//       ? path.resolve(process.env.PROJECT_ROOT)
//       : path.resolve(process.cwd(), "..");

//     const FILE_ROOT = process.env.FILE_ROOT
//       ? path.resolve(process.env.FILE_ROOT)
//       : path.join(PROJECT_ROOT, "File_Management_System");

//     // Legacy path: <backend>/uploads/<dept>
//     // In packaged/Electron builds, the app install folder may be read-only.
//     // Use UPLOADS_ROOT if provided; otherwise fall back to a writable folder under FILE_ROOT.
//     const UPLOADS_ROOT = process.env.UPLOADS_ROOT
//       ? path.resolve(process.env.UPLOADS_ROOT)
//       : path.join(FILE_ROOT, "_uploads");

//     const deptPath = path.join(UPLOADS_ROOT, deptSlug);

//     if (!fs.existsSync(deptPath)) {
//       fs.mkdirSync(deptPath, { recursive: true });
//     }

//     await logActivity({
//       userId: req.user?.id,
//       action: "CREATE_DEPARTMENT",
//       resourceType: "department",
//       resourceId: dep._id,
//       metadata: {
//         name: dep.name,
//         departmentName: dep.name,
//         shortCode: dep.shortCode,
//         uploadFolder: deptSlug,
//       },
//     });

//     return res.status(201).json({
//       success: true,
//       department: {
//         id: dep._id.toString(),
//         name: dep.name,
//         shortCode: dep.shortCode,
//         createdAt: dep.createdAt,
//       },
//     });
//   } catch (err) {
//     console.error("createDepartment error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Server error while adding department",
//     });
//   }
// };

// export const listDepartments = async (_req, res) => {
//   try {
//     const deps = await Department.find({}).sort({ name: 1 }).lean();

//     return res.json(
//       deps.map((d) => ({
//         id: d._id.toString(),
//         name: d.name,
//         shortCode: d.shortCode,
//         createdAt: d.createdAt,
//       })),
//     );
//   } catch (err) {
//     console.error("listDepartments error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Server error while listing departments",
//     });
//   }
// };

// export const getDepartmentUserCount = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid department ID format",
//       });
//     }

//     const dep = await Department.findById(id).lean();
//     if (!dep) {
//       return res.status(404).json({
//         success: false,
//         message: "Department not found",
//       });
//     }

//     const nameRegex = { $regex: `^${escapeRegex(dep.name)}$`, $options: "i" };

//     const count = await User.countDocuments({
//       $or: [{ department: nameRegex }, { departments: nameRegex }],
//     });

//     return res.json({
//       success: true,
//       departmentId: id,
//       departmentName: dep.name,
//       count,
//     });
//   } catch (err) {
//     console.error("getDepartmentUserCount error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Server error while counting department users",
//     });
//   }
// };

// export const updateDepartment = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, shortCode } = req.body || {};

//     if (!id) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Department id is required" });
//     }

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid department id" });
//     }

//     const before = await Department.findById(id).lean();
//     if (!before) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Department not found" });
//     }

//     const trimmedName = (name || "").trim();
//     if (!trimmedName) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Department name is required" });
//     }

//     const payload = { name: trimmedName };

//     if (shortCode && String(shortCode).trim()) {
//       payload.shortCode = String(shortCode).trim().toUpperCase();
//     } else if (shortCode === "") {
//       payload.shortCode = undefined;
//     }

//     const existing = await Department.findOne({
//       _id: { $ne: id },
//       name: trimmedName,
//     }).lean();

//     if (existing) {
//       return res
//         .status(409)
//         .json({ success: false, message: "Department name already in use" });
//     }

//     const dep = await Department.findByIdAndUpdate(id, payload, {
//       new: true,
//       runValidators: true,
//     }).lean();

//     if (!dep) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Department not found" });
//     }
//     if (before.name !== dep.name) {
//       const oldRe = new RegExp(`^${escapeRegex(before.name)}$`, "i");

//       const affected = await User.find({
//         deleted: { $ne: true },
//         $or: [{ department: oldRe }, { departments: oldRe }],
//       })
//         .select("_id department departments")
//         .lean();

//       for (const u of affected) {
//         const current = normalizeUserDepartments(u);
//         const next = current
//           .map((d) => (oldRe.test(d) ? dep.name : d))
//           .filter(Boolean);

//         const update = { $set: { departments: next } };
//         if (next.length) update.$set.department = next[0];
//         else update.$unset = { department: "" };

//         await User.updateOne({ _id: u._id }, update);
//       }
//     }

//     const updatedFields = [];
//     if (before.name !== dep.name) updatedFields.push("name");
//     if ((before.shortCode || "") !== (dep.shortCode || ""))
//       updatedFields.push("shortCode");

//     await logActivity({
//       userId: req.user?.id,
//       action: "UPDATE_DEPARTMENT",
//       resourceType: "department",
//       resourceId: dep._id,
//       metadata: {
//         updatedFields,
//         before: {
//           name: before.name,
//           shortCode: before.shortCode,
//         },
//         after: {
//           name: dep.name,
//           shortCode: dep.shortCode,
//         },
//         departmentName: dep.name,
//       },
//     });

//     return res.json({
//       success: true,
//       department: {
//         id: dep._id.toString(),
//         name: dep.name,
//         shortCode: dep.shortCode,
//         createdAt: dep.createdAt,
//       },
//     });
//   } catch (err) {
//     console.error("updateDepartment error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Server error while updating department",
//     });
//   }
// };

// export const getDepartmentCount = async (_req, res) => {
//   try {
//     const count = await Department.countDocuments();

//     return res.json({
//       success: true,
//       count,
//     });
//   } catch (err) {
//     console.error("getDepartmentCount error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch department count",
//     });
//   }
// };

// export const deleteDepartment = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!id) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Department id is required" });
//     }

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid department ID format",
//       });
//     }

//     const dep = await Department.findById(id).lean();
//     if (!dep) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Department not found" });
//     }

//     const oldRe = new RegExp(`^${escapeRegex(dep.name)}$`, "i");

//     const affected = await User.find({
//       deleted: { $ne: true },
//       $or: [{ department: oldRe }, { departments: oldRe }],
//     })
//       .select("_id department departments")
//       .lean();

//     for (const u of affected) {
//       const current = normalizeUserDepartments(u);
//       const next = current.filter((d) => !oldRe.test(d)).filter(Boolean);

//       const update = { $set: { departments: next } };
//       if (next.length) update.$set.department = next[0];
//       else update.$unset = { department: "" };

//       await User.updateOne({ _id: u._id }, update);
//     }

//     await Department.findByIdAndDelete(id);

//     await logActivity({
//       userId: req.user?.id,
//       action: "DELETE_DEPARTMENT",
//       resourceType: "department",
//       resourceId: dep._id,
//       metadata: {
//         name: dep.name,
//         departmentName: dep.name,
//         shortCode: dep.shortCode,
//         updatedUsers: affected.length,
//       },
//     });

//     return res.json({
//       success: true,
//       message: `Department deleted successfully. ${affected.length} user(s) updated.`,
//       deletedUsers: affected.length,
//     });
//   } catch (err) {
//     console.error("deleteDepartment error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Server error while deleting department",
//     });
//   }
// };


import mongoose from "mongoose";
import Department from "../models/departmentModel.js";
import User from "../models/userModels.js";
import { logActivity } from "./activityLogController.js";
import { ensureDepartmentDir, slugifyFolderName } from "../utils/fileStorage.js";

const escapeRegex = (s = "") =>
  String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeUserDepartments = (u) => {
  if (!u) return [];
  if (Array.isArray(u.departments) && u.departments.length) {
    return u.departments;
  }
  if (typeof u.department === "string" && u.department.trim()) {
    return [u.department.trim()];
  }
  return [];
};

export const createDepartment = async (req, res) => {
  try {
    const { name, shortCode } = req.body || {};
    const trimmedName = (name || "").trim();

    if (!trimmedName) {
      return res
        .status(400)
        .json({ success: false, message: "Department name is required" });
    }

    const payload = { name: trimmedName };

    if (shortCode && String(shortCode).trim()) {
      payload.shortCode = String(shortCode).trim().toUpperCase();
    }

    const existing = await Department.findOne({ name: trimmedName }).lean();
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Department already exists",
      });
    }

    const dep = await Department.create(payload);

    const deptSlug = slugifyFolderName(dep.name);
    ensureDepartmentDir(dep.name);

    await logActivity({
      userId: req.user?.id,
      action: "CREATE_DEPARTMENT",
      resourceType: "department",
      resourceId: dep._id,
      metadata: {
        name: dep.name,
        departmentName: dep.name,
        shortCode: dep.shortCode,
        uploadFolder: deptSlug,
      },
    });

    return res.status(201).json({
      success: true,
      department: {
        id: dep._id.toString(),
        name: dep.name,
        shortCode: dep.shortCode,
        createdAt: dep.createdAt,
      },
    });
  } catch (err) {
    console.error("createDepartment error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while adding department",
    });
  }
};

export const listDepartments = async (_req, res) => {
  try {
    const deps = await Department.find({}).sort({ name: 1 }).lean();

    return res.json(
      deps.map((d) => ({
        id: d._id.toString(),
        name: d.name,
        shortCode: d.shortCode,
        createdAt: d.createdAt,
      })),
    );
  } catch (err) {
    console.error("listDepartments error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while listing departments",
    });
  }
};

export const getDepartmentUserCount = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID format",
      });
    }

    const dep = await Department.findById(id).lean();
    if (!dep) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const nameRegex = { $regex: `^${escapeRegex(dep.name)}$`, $options: "i" };

    const count = await User.countDocuments({
      $or: [{ department: nameRegex }, { departments: nameRegex }],
    });

    return res.json({
      success: true,
      departmentId: id,
      departmentName: dep.name,
      count,
    });
  } catch (err) {
    console.error("getDepartmentUserCount error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while counting department users",
    });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, shortCode } = req.body || {};

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Department id is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid department id" });
    }

    const before = await Department.findById(id).lean();
    if (!before) {
      return res
        .status(404)
        .json({ success: false, message: "Department not found" });
    }

    const trimmedName = (name || "").trim();
    if (!trimmedName) {
      return res
        .status(400)
        .json({ success: false, message: "Department name is required" });
    }

    const payload = { name: trimmedName };

    if (shortCode && String(shortCode).trim()) {
      payload.shortCode = String(shortCode).trim().toUpperCase();
    } else if (shortCode === "") {
      payload.shortCode = undefined;
    }

    const existing = await Department.findOne({
      _id: { $ne: id },
      name: trimmedName,
    }).lean();

    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Department name already in use" });
    }

    const dep = await Department.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).lean();

    if (!dep) {
      return res
        .status(404)
        .json({ success: false, message: "Department not found" });
    }

    if (before.name !== dep.name) {
      const oldRe = new RegExp(`^${escapeRegex(before.name)}$`, "i");

      const affected = await User.find({
        deleted: { $ne: true },
        $or: [{ department: oldRe }, { departments: oldRe }],
      })
        .select("_id department departments")
        .lean();

      for (const u of affected) {
        const current = normalizeUserDepartments(u);
        const next = current
          .map((d) => (oldRe.test(d) ? dep.name : d))
          .filter(Boolean);

        const update = { $set: { departments: next } };
        if (next.length) {
          update.$set.department = next[0];
        } else {
          update.$unset = { department: "" };
        }

        await User.updateOne({ _id: u._id }, update);
      }

      ensureDepartmentDir(dep.name);
    }

    const updatedFields = [];
    if (before.name !== dep.name) updatedFields.push("name");
    if ((before.shortCode || "") !== (dep.shortCode || "")) {
      updatedFields.push("shortCode");
    }

    await logActivity({
      userId: req.user?.id,
      action: "UPDATE_DEPARTMENT",
      resourceType: "department",
      resourceId: dep._id,
      metadata: {
        updatedFields,
        before: {
          name: before.name,
          shortCode: before.shortCode,
        },
        after: {
          name: dep.name,
          shortCode: dep.shortCode,
        },
        departmentName: dep.name,
      },
    });

    return res.json({
      success: true,
      department: {
        id: dep._id.toString(),
        name: dep.name,
        shortCode: dep.shortCode,
        createdAt: dep.createdAt,
      },
    });
  } catch (err) {
    console.error("updateDepartment error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while updating department",
    });
  }
};

export const getDepartmentCount = async (_req, res) => {
  try {
    const count = await Department.countDocuments();

    return res.json({
      success: true,
      count,
    });
  } catch (err) {
    console.error("getDepartmentCount error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch department count",
    });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Department id is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID format",
      });
    }

    const dep = await Department.findById(id).lean();
    if (!dep) {
      return res
        .status(404)
        .json({ success: false, message: "Department not found" });
    }

    const oldRe = new RegExp(`^${escapeRegex(dep.name)}$`, "i");

    const affected = await User.find({
      deleted: { $ne: true },
      $or: [{ department: oldRe }, { departments: oldRe }],
    })
      .select("_id department departments")
      .lean();

    for (const u of affected) {
      const current = normalizeUserDepartments(u);
      const next = current.filter((d) => !oldRe.test(d)).filter(Boolean);

      const update = { $set: { departments: next } };
      if (next.length) {
        update.$set.department = next[0];
      } else {
        update.$unset = { department: "" };
      }

      await User.updateOne({ _id: u._id }, update);
    }

    await Department.findByIdAndDelete(id);

    await logActivity({
      userId: req.user?.id,
      action: "DELETE_DEPARTMENT",
      resourceType: "department",
      resourceId: dep._id,
      metadata: {
        name: dep.name,
        departmentName: dep.name,
        shortCode: dep.shortCode,
        updatedUsers: affected.length,
      },
    });

    return res.json({
      success: true,
      message: `Department deleted successfully. ${affected.length} user(s) updated.`,
      deletedUsers: affected.length,
    });
  } catch (err) {
    console.error("deleteDepartment error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting department",
    });
  }
};