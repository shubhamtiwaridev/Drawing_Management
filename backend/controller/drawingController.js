import fs from "fs";
import path from "path";
import crypto from "crypto";
import Drawing from "../models/drawingModel.js";
import { logActivity } from "./activityLogController.js";
import {
  slugifyFolderName,
  toStoredFilePath,
  resolveStoredFilePath,
} from "../utils/fileStorage.js";

const EXTENSION_MAP = {
  pdf: "pdfFile",
  xlsx: "xlsxFile",
  xls: "xlsxFile",
  ppt: "pptFile",
  pptx: "pptFile",
  lxd: "lxdFile",
  mpr: "mprFile",
  stp: "stpFile",
  step: "stpFile",
  dxf: "dxfFile",
  stl: "stlFile",
  saw: "sawFile",
};

const BROWSER_INLINE_EXTENSIONS = new Set([
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".txt",
  ".csv",
  ".json",
  ".htm",
  ".html",
]);

const normalizeToArray = (value) =>
  Array.isArray(value) ? value : value ? [value] : [];

const getExtension = (name = "") => name.split(".").pop().toLowerCase();

const flattenDrawingFiles = (files) => {
  if (!files) return [];

  if (files instanceof Map) {
    return Array.from(files.values()).flat().filter(Boolean);
  }

  if (typeof files?.toObject === "function") {
    return Object.values(files.toObject()).flat().filter(Boolean);
  }

  if (typeof files === "object") {
    return Object.values(files).flat().filter(Boolean);
  }

  return [];
};

const normalizeKey = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const normalizeFileForClient = (file) => {
  const plain =
    typeof file?.toObject === "function" ? file.toObject() : { ...file };

  const _id = normalizeKey(plain?._id);
  const id = normalizeKey(plain?.id);
  const fileId = normalizeKey(plain?.fileId);

  return {
    ...plain,
    _id: _id || undefined,
    id: id || undefined,
    fileId: fileId || undefined,
    fileKey: fileId || _id || id || "",
  };
};

const serializeDrawing = (drawing) => {
  const plain =
    typeof drawing?.toObject === "function"
      ? drawing.toObject({ flattenMaps: true })
      : drawing;

  const files = {};
  for (const [bucket, arr] of Object.entries(plain?.files || {})) {
    files[bucket] = (Array.isArray(arr) ? arr : []).map(normalizeFileForClient);
  }

  return {
    ...plain,
    _id: normalizeKey(plain?._id) || undefined,
    id: normalizeKey(plain?.id) || undefined,
    files,
  };
};

const renameExistingFile = (oldName = "", newFullDrawingNo = "") => {
  const ext = path.extname(oldName);
  if (!ext) return oldName;
  return `${newFullDrawingNo}${ext}`;
};

export const getDrawings = async (req, res) => {
  try {
    const { folderSlug, search = "", page = 1, limit = 50 } = req.query;
    const role = req.user?.role || "user";

    const query = {};
    if (role === "user") query.active = true;
    if (folderSlug) query.folderSlug = folderSlug.toLowerCase();

    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [
        { shortcut: regex },
        { drawingNo: regex },
        { revisionNo: regex },
        { description: regex },
        { fullDrawingNo: regex },
        { "files.pdfFile.fileName": regex },
        { "files.xlsxFile.fileName": regex },
        { "files.pptFile.fileName": regex },
        { "files.lxdFile.fileName": regex },
        { "files.mprFile.fileName": regex },
        { "files.stpFile.fileName": regex },
        { "files.dxfFile.fileName": regex },
        { "files.stlFile.fileName": regex },
        { "files.sawFile.fileName": regex },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Drawing.find(query)
        .sort({ lastActivityAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Drawing.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: items.map(serializeDrawing),
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error("getDrawings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch drawings",
    });
  }
};

export const getDrawingById = async (req, res) => {
  try {
    const drawing = await Drawing.findById(req.params.id);
    if (!drawing) {
      return res.status(404).json({
        success: false,
        message: "Drawing not found",
      });
    }

    if (req.user?.role === "user" && !drawing.active) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({ success: true, data: serializeDrawing(drawing) });
  } catch (error) {
    console.error("getDrawingById error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch drawing",
    });
  }
};

export const searchDrawingsForUser = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json([]);

    const user = req.user;

    const allowedDepartments = Array.isArray(user?.departments)
      ? user.departments.map(String)
      : user?.department
        ? [String(user.department)]
        : [];

    const qLower = q.toLowerCase();
    const dotIdx = qLower.lastIndexOf(".");
    const hasExt = dotIdx > 0 && dotIdx < qLower.length - 1;

    const requestedFileNameLower = hasExt ? qLower : null;
    const baseNoUpper = hasExt
      ? q.toUpperCase().slice(0, dotIdx)
      : q.toUpperCase();

    const exactDrawing = await Drawing.findOne({
      fullDrawingNo: baseNoUpper,
      active: true,
    }).select("_id folderName fullDrawingNo files");

    if (!exactDrawing) {
      await logActivity({
        userId: user.id,
        action: "SEARCH",
        resourceType: "drawing",
        resourceId: user.id,
        metadata: {
          query: q,
          folderName: null,
          fullDrawingNo: null,
          fileName: requestedFileNameLower || null,
          status: "NOT_FOUND",
        },
      });

      return res.json([]);
    }

    if (
      !allowedDepartments.length ||
      !allowedDepartments.includes(exactDrawing.folderName)
    ) {
      await logActivity({
        userId: user.id,
        action: "SEARCH",
        resourceType: "drawing",
        resourceId: exactDrawing._id,
        metadata: {
          query: q,
          folderName: exactDrawing.folderName,
          fullDrawingNo: exactDrawing.fullDrawingNo,
          fileName: requestedFileNameLower || null,
          status: "NO_ACCESS",
        },
      });

      return res.json([]);
    }

    const results = [];
    const allFiles = flattenDrawingFiles(exactDrawing.files);

    for (const file of allFiles) {
      if (
        requestedFileNameLower &&
        String(file.fileName || "").toLowerCase() !== requestedFileNameLower
      ) {
        continue;
      }

      const normalized = normalizeFileForClient(file);

      results.push({
        drawingId: String(exactDrawing._id),
        fileId: normalized.fileId,
        fileKey: normalized.fileKey,
        fileName: normalized.fileName,
        filePath: normalized.filePath,
        remark: normalized.remark || "",
        drawingNo: exactDrawing.fullDrawingNo,
        department: exactDrawing.folderName,
      });
    }

    const status = results.length > 0 ? "SUCCESS" : "NOT_FOUND";

    await logActivity({
      userId: user.id,
      action: "SEARCH",
      resourceType: "drawing",
      resourceId: exactDrawing._id,
      metadata: {
        query: q,
        folderName: exactDrawing.folderName,
        fullDrawingNo: exactDrawing.fullDrawingNo,
        fileName: results?.[0]?.fileName || requestedFileNameLower || null,
        status,
      },
    });

    return res.json(results.slice(0, 20));
  } catch (err) {
    console.error("searchDrawingsForUser error:", err);
    return res.status(500).json([]);
  }
};

export const openFile = async (req, res) => {
  try {
    const { drawingId, fileKey } = req.params;
    const { download } = req.query;

    if (!drawingId || !fileKey) {
      return res.status(400).send("File key missing");
    }

    const drawing = await Drawing.findById(drawingId);
    if (!drawing) {
      return res.status(404).send("Drawing not found");
    }

    const allowedDepartments = Array.isArray(req.user?.departments)
      ? req.user.departments.map(String)
      : req.user?.department
        ? [String(req.user.department)]
        : [];

    const canOpen =
      req.user?.role !== "user" ||
      (drawing.active &&
        allowedDepartments.includes(String(drawing.folderName)));

    if (!canOpen) {
      return res.status(403).send("Access denied");
    }

    const allFiles = flattenDrawingFiles(drawing.files);
    const requestedKey = normalizeKey(fileKey);

    const foundFile =
      allFiles.find((f) => {
        const keys = [
          normalizeKey(f?.fileKey),
          normalizeKey(f?.fileId),
          normalizeKey(f?._id),
          normalizeKey(f?.id),
        ].filter(Boolean);

        return requestedKey && keys.includes(requestedKey);
      }) || null;

    if (!foundFile) {
      console.warn("OPEN FILE NOT LINKED", {
        drawingId: drawing._id.toString(),
        userId: req.user?.id,
        requestedKey,
        availableKeys: allFiles.map((f) => ({
          fileKey: normalizeKey(f?.fileKey) || null,
          fileId: normalizeKey(f?.fileId) || null,
          _id: normalizeKey(f?._id) || null,
          id: normalizeKey(f?.id) || null,
          fileName: f?.fileName || null,
        })),
      });

      return res.status(404).send("File not linked to drawing");
    }

    const absPath = resolveStoredFilePath(foundFile.filePath);

    if (!fs.existsSync(absPath)) {
      console.warn("OPEN FILE MISSING", {
        drawingId: drawing._id.toString(),
        userId: req.user?.id,
        fileKey: requestedKey,
        storedPath: foundFile.filePath,
        resolvedPath: absPath,
      });
      return res.status(404).send("File missing on server");
    }

    await logActivity({
      userId: req.user.id,
      action: "OPEN",
      resourceType: "file",
      resourceId: drawing._id,
      metadata: {
        folderName: drawing.folderName,
        fullDrawingNo: drawing.fullDrawingNo,
        fileName: foundFile.fileName,
        fileKey:
          foundFile.fileKey ||
          foundFile.fileId ||
          foundFile._id ||
          foundFile.id,
      },
    });

    const extWithDot = (
      path.extname(foundFile.fileName || "") ||
      path.extname(foundFile.filePath || "")
    ).toLowerCase();

    const downloadName =
      foundFile.fileName || `${drawing.fullDrawingNo}${extWithDot}`;
    const forceDownload = String(download || "") === "1";
    const canOpenInlineInBrowser = BROWSER_INLINE_EXTENSIONS.has(extWithDot);

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    if (forceDownload || !canOpenInlineInBrowser) {
      return res.download(absPath, downloadName);
    }

    res.setHeader(
      "Content-Disposition",
      `inline; filename="${downloadName}"; filename*=UTF-8''${encodeURIComponent(
        downloadName,
      )}`,
    );

    return res.sendFile(absPath);
  } catch (err) {
    console.error("File open error:", err);
    return res.status(500).send("Failed to open file");
  }
};

export const createDrawing = async (req, res) => {
  try {
    const now = new Date();
    const {
      folderName,
      shortcut,
      drawingNo,
      revisionNo = "R0",
      description = "",
      fullDrawingNo,
    } = req.body;

    if (!folderName || !shortcut || !drawingNo || !fullDrawingNo) {
      return res.status(400).json({
        success: false,
        message:
          "folderName, shortcut, drawingNo and fullDrawingNo are required.",
      });
    }

    const folderSlug = slugifyFolderName(folderName);

    const exists = await Drawing.findOne({ folderSlug, fullDrawingNo });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Drawing already exists",
      });
    }

    const fileBuckets = {};
    const uploadedFiles = Array.isArray(req.files)
      ? req.files
      : Object.values(req.files || {}).flat();

    const remarks = normalizeToArray(req.body.remarks);

    uploadedFiles.forEach((file, index) => {
      const ext = getExtension(file.originalname);
      const key = EXTENSION_MAP[ext];
      if (!key) return;

      if (!fileBuckets[key]) fileBuckets[key] = [];

      const extWithDot = path.extname(file.originalname).toLowerCase();
      const storedName = `${fullDrawingNo}${extWithDot}`;

      fileBuckets[key].push({
        fileId: crypto.randomUUID(),
        fileName: storedName,
        filePath: toStoredFilePath(folderSlug, file.filename),
        remark: Array.isArray(remarks) ? remarks[index] || "" : "",
        uploadedAt: now,
      });
    });

    const files = {};
    Object.entries(fileBuckets).forEach(([key, value]) => {
      if (value.length > 0) files[key] = value;
    });

    const drawing = await Drawing.create({
      folderName,
      folderSlug,
      shortcut,
      drawingNo,
      revisionNo,
      description,
      files,
      fullDrawingNo,
      lastActivityAt: now,
    });

    await logActivity({
      userId: req.user.id,
      action: "CREATE_DRAWING",
      resourceType: "drawing",
      resourceId: drawing._id,
      metadata: {
        folderName: drawing.folderName,
        fullDrawingNo: drawing.fullDrawingNo,
      },
    });

    res.status(201).json({ success: true, data: serializeDrawing(drawing) });
  } catch (error) {
    console.error("createDrawing error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create drawing",
    });
  }
};

export const updateDrawing = async (req, res) => {
  try {
    const drawing = await Drawing.findById(req.params.id);
    if (!drawing) {
      return res.status(404).json({
        success: false,
        message: "Drawing not found",
      });
    }

    const now = new Date();

    const folderName = req.body.folderName || drawing.folderName;
    const folderSlug = slugifyFolderName(folderName);
    const effectiveFullDrawingNo =
      req.body.fullDrawingNo || drawing.fullDrawingNo;

    const uploadedFiles = Array.isArray(req.files)
      ? req.files
      : Object.values(req.files || {}).flat();

    const remarks = normalizeToArray(req.body.remarks);
    const fileBuckets = {};

    uploadedFiles.forEach((file, index) => {
      const ext = getExtension(file.originalname);
      const key = EXTENSION_MAP[ext];
      if (!key) return;

      if (!fileBuckets[key]) fileBuckets[key] = [];

      const extWithDot = path.extname(file.originalname).toLowerCase();
      const storedName = `${effectiveFullDrawingNo}${extWithDot}`;

      fileBuckets[key].push({
        fileId: crypto.randomUUID(),
        fileName: storedName,
        filePath: toStoredFilePath(folderSlug, file.filename),
        remark: remarks[index] || "",
        uploadedAt: now,
      });
    });

    const existingFiles =
      drawing.files instanceof Map
        ? Object.fromEntries(drawing.files)
        : drawing.files || {};

    const oldFull = drawing.fullDrawingNo;
    const newFull = effectiveFullDrawingNo;

    if (newFull && oldFull && newFull !== oldFull) {
      Object.keys(existingFiles).forEach((bucket) => {
        const arr = Array.isArray(existingFiles[bucket])
          ? existingFiles[bucket]
          : [];

        arr.forEach((f) => {
          f.fileName = renameExistingFile(f?.fileName || "", newFull);
        });
      });
    }

    Object.entries(fileBuckets).forEach(([key, newFiles]) => {
      if (!existingFiles[key]) existingFiles[key] = [];
      existingFiles[key].push(...newFiles);
    });

    const update = {
      folderName,
      folderSlug,
      lastActivityAt: now,
      files: existingFiles,
    };

    if (req.body.shortcut) update.shortcut = req.body.shortcut;
    if (req.body.drawingNo) update.drawingNo = req.body.drawingNo;
    if (req.body.revisionNo) update.revisionNo = req.body.revisionNo;
    if (req.body.description !== undefined) {
      update.description = req.body.description;
    }
    if (req.body.fullDrawingNo) update.fullDrawingNo = req.body.fullDrawingNo;

    const updated = await Drawing.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true },
    );

    await logActivity({
      userId: req.user.id,
      action: "UPDATE_DRAWING",
      resourceType: "drawing",
      resourceId: updated._id,
      metadata: {
        folderName: updated.folderName,
        fullDrawingNo: updated.fullDrawingNo,
        revisionNo: updated.revisionNo,
      },
    });

    res.json({ success: true, data: serializeDrawing(updated) });
  } catch (error) {
    console.error("updateDrawing error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update drawing",
    });
  }
};

export const getUploadsTodayCount = async (_req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const drawings = await Drawing.find({}, { files: 1 });

    let count = 0;

    for (const drawing of drawings) {
      const allFiles = flattenDrawingFiles(drawing.files);

      for (const file of allFiles) {
        if (file.uploadedAt && new Date(file.uploadedAt) >= todayStart) {
          count++;
        }
      }
    }

    res.json({
      success: true,
      uploadsToday: count,
    });
  } catch (error) {
    console.error("getUploadsTodayCount error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate uploads today",
    });
  }
};

export const getTotalFilesCount = async (_req, res) => {
  try {
    const drawings = await Drawing.find({}, { files: 1 });

    let totalFiles = 0;
    for (const d of drawings) {
      totalFiles += flattenDrawingFiles(d.files).length;
    }

    res.json({
      success: true,
      totalFiles,
    });
  } catch (err) {
    console.error("getTotalFilesCount error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch total files count",
    });
  }
};

export const getDepartmentFileCounts = async (_req, res) => {
  try {
    const drawings = await Drawing.find({}, { folderName: 1, files: 1 });

    const result = {};

    for (const drawing of drawings) {
      const dept = drawing.folderName;
      if (!dept) continue;

      if (!result[dept]) result[dept] = 0;
      result[dept] += flattenDrawingFiles(drawing.files).length;
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("getDepartmentFileCounts error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch department file counts",
    });
  }
};

export const toggleDrawingActive = async (req, res) => {
  try {
    const drawing = await Drawing.findById(req.params.id);
    if (!drawing) {
      return res.status(404).json({
        success: false,
        message: "Drawing not found",
      });
    }

    drawing.active = !drawing.active;
    await drawing.save();

    await logActivity({
      userId: req.user.id,
      action: drawing.active ? "ACTIVATE_DRAWING" : "DEACTIVATE_DRAWING",
      resourceType: "drawing",
      resourceId: drawing._id,
      metadata: {
        folderName: drawing.folderName,
        fullDrawingNo: drawing.fullDrawingNo,
      },
    });

    res.json({ success: true, data: serializeDrawing(drawing) });
  } catch (error) {
    console.error("toggleDrawingActive error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle active status",
    });
  }
};

export const deleteDrawing = async (req, res) => {
  try {
    const drawing = await Drawing.findByIdAndDelete(req.params.id);
    if (!drawing) {
      return res.status(404).json({
        success: false,
        message: "Drawing not found",
      });
    }

    await logActivity({
      userId: req.user.id,
      action: "DELETE_DRAWING",
      resourceType: "drawing",
      resourceId: drawing._id,
      metadata: {
        folderName: drawing.folderName,
        fullDrawingNo: drawing.fullDrawingNo,
      },
    });

    res.json({
      success: true,
      message: "Drawing deleted successfully",
    });
  } catch (error) {
    console.error("deleteDrawing error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete drawing",
    });
  }
};
