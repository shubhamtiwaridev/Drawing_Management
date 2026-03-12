import multer from "multer";
import path from "path";
import { ensureDepartmentDir, safeName } from "../utils/fileStorage.js";

const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".xlsx",
  ".xls",
  ".ppt",
  ".pptx",
  ".lxd",
  ".mpr",
  ".stp",
  ".step",
  ".dxf",
  ".stl",
  ".saw",
]);

const storage = multer.diskStorage({
  destination(req, _file, cb) {
    try {
      const folderName = req.body.folderName || "general";
      const { dirPath } = ensureDepartmentDir(folderName);
      cb(null, dirPath);
    } catch (error) {
      cb(error);
    }
  },

  filename(req, file, cb) {
    try {
      const ext = path.extname(file.originalname).toLowerCase();
      const fullDrawingNo = safeName(req.body.fullDrawingNo || "DRAWING");
      cb(null, `${fullDrawingNo}${ext}`);
    } catch (error) {
      cb(error);
    }
  },
});

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new Error(`File type ${ext} is not allowed`), false);
  }

  cb(null, true);
};

export default multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
});