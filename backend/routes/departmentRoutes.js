


import express from "express";
import {
  createDepartment,
  listDepartments,
  updateDepartment,
  deleteDepartment,
  getDepartmentUserCount,
  getDepartmentCount,
} from "../controller/departmentController.js";

import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();
router.get("/", listDepartments);
router.get("/:id/user-count", requireAdmin, getDepartmentUserCount);
router.post("/", requireAdmin, createDepartment);
router.patch("/:id", requireAdmin, updateDepartment);
router.get("/count", getDepartmentCount);
router.delete("/:id", requireAdmin, deleteDepartment);

export default router;