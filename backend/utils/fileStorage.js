import path from "path";
import fs from "fs";

const PROJECT_ROOT = process.env.PROJECT_ROOT
  ? path.resolve(process.env.PROJECT_ROOT)
  : path.resolve(process.cwd(), "..");

const SYSTEM_ROOT = process.env.SYSTEM_ROOT
  ? path.resolve(process.env.SYSTEM_ROOT)
  : path.join(PROJECT_ROOT, "File_Management_System");

const FILE_ROOT = process.env.FILE_ROOT
  ? path.resolve(process.env.FILE_ROOT)
  : path.join(SYSTEM_ROOT, "Drawing_Files");

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
  `/File_Management_System/Drawing_Files/${slugifyFolderName(folderSlug)}/${safeName(fileName)}`;

export const resolveStoredFilePath = (storedPath = "") => {
  const normalized = String(storedPath)
    .replace(/^[/\\]+/, "")
    .replace(/^File_Management_System[/\\]+/, "");

  const absPath = path.resolve(SYSTEM_ROOT, normalized);
  const root = path.resolve(FILE_ROOT);
  const safePrefix = `${root}${path.sep}`;

  if (absPath !== root && !absPath.startsWith(safePrefix)) {
    throw new Error("Invalid file path");
  }

  return absPath;
};