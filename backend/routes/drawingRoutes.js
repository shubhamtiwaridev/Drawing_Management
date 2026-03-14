import express from "express";
import {
  getDrawings,
  getDrawingById,
  createDrawing,
  updateDrawing,
  deleteDrawing,
  toggleDrawingActive,
  searchDrawingsForUser,
  getUploadsTodayCount,
  getTotalFilesCount,
  getDepartmentFileCounts,
} from "../controller/drawingController.js";
import requireAuth from "../middleware/requireAuth.js";
import requireEditor from "../middleware/requireEditor.js";
import requireAdmin from "../middleware/requireAdmin.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/search", requireAuth, searchDrawingsForUser);
router.get("/", requireAuth, getDrawings);
router.get("/:id", requireAuth, getDrawingById);
router.post("/", requireEditor, upload.array("files"), createDrawing);
router.put("/:id", requireEditor, upload.array("files"), updateDrawing);
router.get("/stats/total-files", requireAuth, getTotalFilesCount);
router.get(
  "/stats/uploads-today",
  requireAuth,
  requireAdmin,
  getUploadsTodayCount
);
router.get("/stats/files-by-department", requireAuth, getDepartmentFileCounts);
router.patch("/:id/toggle-active", requireEditor, toggleDrawingActive);
router.delete("/:id", requireAdmin, deleteDrawing);
export default router;
