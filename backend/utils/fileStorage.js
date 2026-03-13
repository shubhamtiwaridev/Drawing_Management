import path from "path";
import fs from "fs";

const PROJECT_ROOT = process.env.PROJECT_ROOT
  ? path.resolve(process.env.PROJECT_ROOT)
  : path.resolve(process.cwd(), "..");

const FILE_ROOT = process.env.FILE_ROOT
  ? path.resolve(process.env.FILE_ROOT)
  : path.join(PROJECT_ROOT, "Drawing_Files");

const SYSTEM_ROOT = path.dirname(FILE_ROOT);

fs.mkdirSync(FILE_ROOT, { recursive: true });

export const safeName = (value = "") =>
  value
    .toString()
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, "_");

export const slugifyFolderName = (value = "") =>
  safeName(value).toLowerCase();

export const getSystemRoot = () => SYSTEM_ROOT;
export const getFileRoot = () => FILE_ROOT;

export const ensureDepartmentDir = (folderName = "general") => {
  const folderSlug = slugifyFolderName(folderName);
  const dirPath = path.join(FILE_ROOT, folderSlug);
  fs.mkdirSync(dirPath, { recursive: true });
  return { folderSlug, dirPath };
};

export const toStoredFilePath = (folderSlug, fileName) =>
  `/${slugifyFolderName(folderSlug)}/${safeName(fileName)}`;

export const resolveStoredFilePath = (storedPath = "") => {
  const normalized = String(storedPath)
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^File_Management_System\/Drawing_Files\//i, "")
    .replace(/^Drawing_Files\//i, "");

  const absPath = path.resolve(FILE_ROOT, normalized);
  const root = path.resolve(FILE_ROOT);
  const safePrefix = `${root}${path.sep}`;

  if (absPath !== root && !absPath.startsWith(safePrefix)) {
    throw new Error("Invalid file path");
  }

  return absPath;
};