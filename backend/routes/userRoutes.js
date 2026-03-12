// backend/routes/usersRoutes.js (or similar)
import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";
import {
  listUsers,
  getUser,
  getMe,
  createUser,
  updateUser,
  deleteUser,
  getAssignedDepartments,
  getTotalUsersCount,
  getUsersCountByRole,
} from "../controller/usersControllers.js";

const router = express.Router();

router.get("/stats/total-users", requireAuth, requireAdmin, getTotalUsersCount);
router.get("/stats/by-role", requireAuth, requireAdmin, getUsersCountByRole);
router.get("/", requireAuth, requireAdmin, listUsers);
router.get("/me", requireAuth, getMe);
router.get(
  "/:id/assigned-departments",
  requireAuth,
  requireAdmin,
  getAssignedDepartments,
);
router.get("/:id", requireAuth, requireAdmin, getUser);
router.post("/", requireAuth, requireAdmin, createUser);
router.put("/:id", requireAuth, requireAdmin, updateUser);
router.delete("/:id", requireAuth, requireAdmin, deleteUser);

export default router;
