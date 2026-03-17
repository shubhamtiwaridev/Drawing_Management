// const { app, BrowserWindow, dialog, shell } = require("electron");
// const path = require("path");
// const fs = require("fs");
// const net = require("net");
// const { fork } = require("child_process");
// const { autoUpdater } = require("electron-updater");

// let mainWindow = null;
// let backendProcess = null;
// let backendPort = null;
// let managedFileRoot = null;

// const BROWSER_SUPPORTED_EXTENSIONS = new Set([
//   ".pdf",
//   ".png",
//   ".jpg",
//   ".jpeg",
//   ".gif",
//   ".webp",
//   ".svg",
//   ".txt",
//   ".csv",
//   ".json",
//   ".htm",
//   ".html",
// ]);

// const SOFTWARE_SUPPORTED_EXTENSIONS = new Set([
//   ".xlsx",
//   ".xls",
//   ".ppt",
//   ".pptx",
//   ".lxd",
//   ".mpr",
//   ".stp",
//   ".step",
//   ".dxf",
//   ".stl",
//   ".saw",
// ]);

// const gotSingleInstanceLock = app.requestSingleInstanceLock();

// if (!gotSingleInstanceLock) {
//   app.quit();
// } else {
//   app.on("second-instance", () => {
//     if (mainWindow) {
//       if (mainWindow.isMinimized()) mainWindow.restore();
//       mainWindow.focus();
//     }
//   });
// }

// function getIconPath() {
//   const candidates = app.isPackaged
//     ? [
//         path.join(process.resourcesPath, "build", "icon.png"),
//         path.join(process.resourcesPath, "build", "icon.ico"),
//       ]
//     : [
//         path.join(__dirname, "..", "build", "icon.png"),
//         path.join(__dirname, "..", "build", "icon.ico"),
//       ];

//   return candidates.find((candidate) => fs.existsSync(candidate));
// }

// function getBackendDir() {
//   return app.isPackaged
//     ? path.join(process.resourcesPath, "backend")
//     : path.join(__dirname, "..", "backend");
// }

// function getConfiguredFileRoot() {
//   if (managedFileRoot) return managedFileRoot;

//   const configuredRoot =
//     process.env.SHARED_FILE_ROOT || process.env.FILE_ROOT || "";

//   if (String(configuredRoot).trim()) {
//     managedFileRoot = path.resolve(String(configuredRoot).trim());
//   } else {
//     managedFileRoot = app.isPackaged
//       ? path.join(app.getPath("documents"), "Drawing_Files")
//       : path.join(path.resolve(__dirname, ".."), "Drawing_Files");
//   }
//   managedFileRoot = path.resolve(managedFileRoot);
//   fs.mkdirSync(managedFileRoot, { recursive: true });
//   return managedFileRoot;
// }

// function resolveManagedFilePath(storedFilePath = "") {
//   const fileRoot = path.resolve(getConfiguredFileRoot());

//   const normalizedStoredPath = String(storedFilePath)
//     .replace(/\\/g, "/")
//     .replace(/^\/+/, "")
//     .replace(/^File_Management_System\/Drawing_Files\//i, "")
//     .replace(/^Drawing_Files\//i, "");

//   const absolutePath = path.resolve(fileRoot, normalizedStoredPath);
//   const safePrefix = `${fileRoot}${path.sep}`;

//   if (absolutePath !== fileRoot && !absolutePath.startsWith(safePrefix)) {
//     throw new Error("Invalid file path");
//   }

//   return absolutePath;
// }

// function isManagedFileOpenUrl(rawUrl) {
//   try {
//     const parsed = new URL(rawUrl);
//     return parsed.pathname.startsWith("/api/file/open/");
//   } catch {
//     return false;
//   }
// }

// function getExtensionFromFileUrl(rawUrl) {
//   try {
//     const parsed = new URL(rawUrl);
//     const queryPath = decodeURIComponent(parsed.searchParams.get("path") || "");
//     const lastPathSegment = decodeURIComponent(
//       parsed.pathname.split("/").filter(Boolean).pop() || "",
//     );

//     return path.extname(queryPath || lastPathSegment).toLowerCase();
//   } catch {
//     return "";
//   }
// }

// function isBrowserSupportedExtension(ext) {
//   return BROWSER_SUPPORTED_EXTENSIONS.has(String(ext || "").toLowerCase());
// }

// function isSoftwareSupportedExtension(ext) {
//   return SOFTWARE_SUPPORTED_EXTENSIONS.has(String(ext || "").toLowerCase());
// }

// function buildDownloadUrl(rawUrl) {
//   const parsed = new URL(rawUrl);
//   parsed.searchParams.set("download", "1");
//   return parsed.toString();
// }

// function downloadManagedFile(rawUrl) {
//   if (!mainWindow || mainWindow.isDestroyed()) {
//     throw new Error("Main window is not available for download.");
//   }

//   mainWindow.webContents.downloadURL(buildDownloadUrl(rawUrl));
// }

// async function openManagedFileInBrowser(rawUrl) {
//   const previewWindow = new BrowserWindow({
//     width: 1200,
//     height: 900,
//     show: false,
//     autoHideMenuBar: true,
//     icon: getIconPath(),
//     title: "File Preview",
//     webPreferences: {
//       contextIsolation: true,
//       nodeIntegration: false,
//       preload: path.join(__dirname, "preload.cjs"),
//     },
//   });

//   previewWindow.once("ready-to-show", () => {
//     previewWindow.show();
//   });

//   await previewWindow.loadURL(rawUrl);
// }

// async function openManagedFileExternally(rawUrl) {
//   const parsed = new URL(rawUrl);
//   const storedFilePath = decodeURIComponent(
//     parsed.searchParams.get("path") || "",
//   );

//   if (!storedFilePath) {
//     throw new Error("Missing file path");
//   }

//   const absolutePath = resolveManagedFilePath(storedFilePath);

//   if (!fs.existsSync(absolutePath)) {
//     throw new Error(`File not found: ${absolutePath}`);
//   }

//   const openError = await shell.openPath(absolutePath);

//   if (!openError) return true;

//   downloadManagedFile(rawUrl);
//   return false;
// }

// async function handleFileOpenUrl(rawUrl) {
//   const ext = getExtensionFromFileUrl(rawUrl);

//   try {
//     if (isBrowserSupportedExtension(ext)) {
//       await openManagedFileInBrowser(rawUrl);
//       return;
//     }

//     if (isSoftwareSupportedExtension(ext)) {
//       const opened = await openManagedFileExternally(rawUrl);

//       if (!opened) {
//         dialog.showMessageBox({
//           type: "info",
//           title: "Downloading file",
//           message:
//             "No compatible desktop application was found for this file, so it is being downloaded.",
//         });
//       }

//       return;
//     }

//     downloadManagedFile(rawUrl);

//     dialog.showMessageBox({
//       type: "info",
//       title: "Downloading file",
//       message:
//         "This file type is not supported in the browser and is not mapped to a desktop application, so it is being downloaded.",
//     });
//   } catch (error) {
//     dialog.showErrorBox(
//       "File open failed",
//       error?.message || "The selected file could not be opened.",
//     );
//   }
// }

// function attachManagedFileHandler(window) {
//   window.webContents.setWindowOpenHandler(({ url }) => {
//     if (!isManagedFileOpenUrl(url)) {
//       return { action: "allow" };
//     }

//     void handleFileOpenUrl(url);
//     return { action: "deny" };
//   });

//   window.webContents.on("will-navigate", (event, url) => {
//     if (!isManagedFileOpenUrl(url)) return;
//     event.preventDefault();
//     void handleFileOpenUrl(url);
//   });
// }

// function isPortFree(port, host = "127.0.0.1") {
//   return new Promise((resolve) => {
//     const server = net
//       .createServer()
//       .once("error", () => resolve(false))
//       .once("listening", () => {
//         server.close(() => resolve(true));
//       })
//       .listen(port, host);
//   });
// }

// async function findFreePort(startPort = 3000, host = "127.0.0.1") {
//   for (let port = startPort; port < startPort + 50; port += 1) {
//     const free = await isPortFree(port, host);
//     if (free) return port;
//   }

//   return new Promise((resolve, reject) => {
//     const server = net.createServer();
//     server.listen(0, host, () => {
//       const address = server.address();
//       server.close(() => {
//         if (typeof address === "object" && address && address.port) {
//           resolve(address.port);
//         } else {
//           reject(new Error("Failed to allocate a free port"));
//         }
//       });
//     });
//   });
// }

// function waitForServer(port, host = "127.0.0.1", timeoutMs = 30000) {
//   const startedAt = Date.now();

//   return new Promise((resolve, reject) => {
//     const tryConnect = () => {
//       const socket = net.connect({ port, host });

//       socket.once("connect", () => {
//         socket.end();
//         resolve();
//       });

//       socket.once("error", () => {
//         socket.destroy();

//         if (Date.now() - startedAt > timeoutMs) {
//           reject(new Error(`Backend did not start within ${timeoutMs}ms`));
//           return;
//         }

//         setTimeout(tryConnect, 300);
//       });
//     };

//     tryConnect();
//   });
// }

// function startBackend(port) {
//   const backendDir = getBackendDir();
//   const backendEntry = path.join(backendDir, "server.js");
//   const frontendDist = app.isPackaged
//     ? path.join(process.resourcesPath, "frontend", "dist")
//     : path.join(__dirname, "..", "frontend", "dist");

//   const fileRoot = getConfiguredFileRoot();

//   if (!fs.existsSync(backendEntry)) {
//     throw new Error(`Backend entry not found: ${backendEntry}`);
//   }

//   if (!fs.existsSync(path.join(frontendDist, "index.html"))) {
//     throw new Error(
//       `Frontend build not found: ${path.join(frontendDist, "index.html")}`,
//     );
//   }

//   fs.mkdirSync(fileRoot, { recursive: true });

//   backendProcess = fork(backendEntry, [], {
//     cwd: backendDir,
//     env: {
//       ...process.env,
//       NODE_ENV: "production",
//       ELECTRON: "true",
//       SERVE_FRONTEND: "true",
//       HOST: "127.0.0.1",
//       PORT: String(port),
//       FRONTEND_DIST: frontendDist,
//       ENV_PATH: path.join(backendDir, ".env"),
//       FILE_ROOT: fileRoot,
//       SYSTEM_ROOT: path.dirname(fileRoot),
//       SHARED_FILE_ROOT: fileRoot,
//       PROJECT_ROOT: app.isPackaged
//         ? process.resourcesPath
//         : path.resolve(__dirname, ".."),
//       CORS_ORIGINS: `http://127.0.0.1:${port},http://localhost:${port}`,
//     },
//     silent: true,
//   });
// }

// function setupAutoUpdater() {
//   if (!app.isPackaged) return;

//   autoUpdater.autoDownload = true;
//   autoUpdater.autoInstallOnAppQuit = true;

//   autoUpdater.on("checking-for-update", () => {
//     console.log("Checking for update...");
//   });

//   autoUpdater.on("update-available", (info) => {
//     console.log("Update available:", info?.version);
//   });

//   autoUpdater.on("update-not-available", () => {
//     console.log("No updates available");
//   });

//   autoUpdater.on("error", (err) => {
//     console.error("Auto update error:", err);
//   });

//   autoUpdater.on("update-downloaded", () => {
//     dialog
//       .showMessageBox({
//         type: "info",
//         title: "Update Ready",
//         message:
//           "A new version has been downloaded. Restart now to install it?",
//         buttons: ["Restart Now", "Later"],
//         defaultId: 0,
//         cancelId: 1,
//       })
//       .then(({ response }) => {
//         if (response === 0) {
//           autoUpdater.quitAndInstall();
//         }
//       });
//   });

//   autoUpdater.checkForUpdatesAndNotify();
// }

// async function createWindow() {
//   const icon = getIconPath();

//   mainWindow = new BrowserWindow({
//     width: 1400,
//     height: 900,
//     show: false,
//     autoHideMenuBar: true,
//     icon,
//     title: "Drawing Management",
//     webPreferences: {
//       contextIsolation: true,
//       nodeIntegration: false,
//       preload: path.join(__dirname, "preload.cjs"),
//     },
//   });

//   attachManagedFileHandler(mainWindow);

//   async function createWindow() {
//     const icon = getIconPath();

//     mainWindow = new BrowserWindow({
//       width: 1400,
//       height: 900,
//       show: false,
//       autoHideMenuBar: true,
//       icon,
//       title: "Drawing Management",
//       webPreferences: {
//         contextIsolation: true,
//         nodeIntegration: false,
//         preload: path.join(__dirname, "preload.cjs"),
//       },
//     });

//     attachManagedFileHandler(mainWindow);

//     backendPort = await findFreePort(3000, "127.0.0.1");
//     startBackend(backendPort);
//     await waitForServer(backendPort, "127.0.0.1", 30000);
//     await mainWindow.loadURL(`http://127.0.0.1:${backendPort}/`);

//     if (!app.isPackaged) {
//       mainWindow.webContents.openDevTools({ mode: "detach" });
//     } else {
//       setupAutoUpdater();
//     }

//     mainWindow.once("ready-to-show", () => {
//       if (mainWindow) mainWindow.show();
//     });

//     mainWindow.on("closed", () => {
//       mainWindow = null;
//     });
//   }

//   mainWindow.once("ready-to-show", () => {
//     if (mainWindow) mainWindow.show();
//   });

//   mainWindow.on("closed", () => {
//     mainWindow = null;
//   });
// }

// function stopBackend() {
//   if (!backendProcess) return;
//   try {
//     backendProcess.kill();
//   } catch {}
//   backendProcess = null;
// }

// app.whenReady().then(async () => {
//   try {
//     await createWindow();
//   } catch (error) {
//     dialog.showErrorBox(
//       "Failed to start",
//       error?.message || "Failed to start the desktop application.",
//     );
//     app.quit();
//   }
// });

// app.on("before-quit", () => {
//   stopBackend();
// });

// app.on("window-all-closed", () => {
//   stopBackend();
//   if (process.platform !== "darwin") {
//     app.quit();
//   }
// });

// app.on("activate", async () => {
//   if (BrowserWindow.getAllWindows().length === 0) {
//     try {
//       await createWindow();
//     } catch (error) {
//       dialog.showErrorBox(
//         "Failed to reopen",
//         error?.message || "Failed to reopen the desktop application.",
//       );
//     }
//   }
// });

const {
  app,
  BrowserWindow,
  dialog,
  shell,
  net: electronNet,
} = require("electron");
const path = require("path");
const fs = require("fs");
const nodeNet = require("net");
const { fork } = require("child_process");
const { autoUpdater } = require("electron-updater");

let mainWindow = null;
let backendProcess = null;
let backendPort = null;
let managedFileRoot = null;

const BROWSER_SUPPORTED_EXTENSIONS = new Set([
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

const SOFTWARE_SUPPORTED_EXTENSIONS = new Set([
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

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function getIconPath() {
  const candidates = app.isPackaged
    ? [
        path.join(process.resourcesPath, "build", "icon.png"),
        path.join(process.resourcesPath, "build", "icon.ico"),
      ]
    : [
        path.join(__dirname, "..", "build", "icon.png"),
        path.join(__dirname, "..", "build", "icon.ico"),
      ];

  return candidates.find((candidate) => fs.existsSync(candidate));
}

function getBackendDir() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "backend")
    : path.join(__dirname, "..", "backend");
}

function getConfiguredFileRoot() {
  if (managedFileRoot) return managedFileRoot;

  const configuredRoot =
    process.env.SHARED_FILE_ROOT || process.env.FILE_ROOT || "";

  if (String(configuredRoot).trim()) {
    managedFileRoot = path.resolve(String(configuredRoot).trim());
  } else {
    managedFileRoot = app.isPackaged
      ? path.join(app.getPath("documents"), "Drawing_Files")
      : path.join(path.resolve(__dirname, ".."), "Drawing_Files");
  }

  managedFileRoot = path.resolve(managedFileRoot);
  fs.mkdirSync(managedFileRoot, { recursive: true });
  return managedFileRoot;
}

function isManagedFileOpenUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return parsed.pathname.startsWith("/api/file/open/");
  } catch {
    return false;
  }
}

function isBrowserSupportedExtension(ext) {
  return BROWSER_SUPPORTED_EXTENSIONS.has(String(ext || "").toLowerCase());
}

function isSoftwareSupportedExtension(ext) {
  return SOFTWARE_SUPPORTED_EXTENSIONS.has(String(ext || "").toLowerCase());
}

function buildDownloadUrl(rawUrl) {
  const parsed = new URL(rawUrl);
  parsed.searchParams.set("download", "1");
  return parsed.toString();
}

function getHeaderValue(headers, name) {
  const value = headers?.[String(name).toLowerCase()] ?? headers?.[name];
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function decodeDispositionFilename(disposition = "") {
  const filenameStarMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (filenameStarMatch?.[1]) {
    try {
      return decodeURIComponent(filenameStarMatch[1].trim());
    } catch {
      return filenameStarMatch[1].trim();
    }
  }

  const quotedMatch = disposition.match(/filename="([^"]+)"/i);
  if (quotedMatch?.[1]) return quotedMatch[1].trim();

  const plainMatch = disposition.match(/filename=([^;]+)/i);
  if (plainMatch?.[1]) return plainMatch[1].trim();

  return "";
}

function sanitizeFileName(fileName = "download") {
  return (
    String(fileName || "download")
      .replace(/[<>:"/\\|?*]+/g, "_")
      .replace(/\s+/g, " ")
      .trim() || "download"
  );
}

function requestFileMetadata(rawUrl) {
  return new Promise((resolve, reject) => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      reject(new Error("Main window is not available."));
      return;
    }

    const request = electronNet.request({
      method: "HEAD",
      url: rawUrl,
      session: mainWindow.webContents.session,
      useSessionCookies: true,
    });

    request.on("response", (response) => {
      const disposition = getHeaderValue(
        response.headers,
        "content-disposition",
      );
      const contentType = getHeaderValue(response.headers, "content-type");
      const fileName = sanitizeFileName(
        decodeDispositionFilename(disposition) ||
          decodeURIComponent(
            new URL(rawUrl).pathname.split("/").pop() || "download",
          ),
      );

      response.on("data", () => {});
      response.on("end", () => {
        resolve({
          fileName,
          ext: path.extname(fileName).toLowerCase(),
          contentType,
        });
      });
    });

    request.on("error", reject);
    request.end();
  });
}

function downloadManagedFile(rawUrl, suggestedFileName = "") {
  return new Promise((resolve, reject) => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      reject(new Error("Main window is not available for download."));
      return;
    }

    const session = mainWindow.webContents.session;

    const listener = (_event, item) => {
      const targetName = sanitizeFileName(
        suggestedFileName || item.getFilename(),
      );
      const savePath = path.join(app.getPath("downloads"), targetName);

      item.setSavePath(savePath);

      item.once("done", (_doneEvent, state) => {
        if (state === "completed") {
          resolve(savePath);
        } else {
          reject(new Error(`Download failed: ${state}`));
        }
      });
    };

    session.once("will-download", listener);

    try {
      mainWindow.webContents.downloadURL(buildDownloadUrl(rawUrl));
    } catch (error) {
      session.removeListener("will-download", listener);
      reject(error);
    }
  });
}

function downloadManagedFileToTemp(rawUrl, fileName) {
  return new Promise((resolve, reject) => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      reject(new Error("Main window is not available for download."));
      return;
    }

    const tempDir = path.join(app.getPath("temp"), "Drawing_Management_Temp");
    fs.mkdirSync(tempDir, { recursive: true });

    const safeName = sanitizeFileName(fileName || "download");
    const savePath = path.join(tempDir, `${Date.now()}-${safeName}`);

    const request = electronNet.request({
      method: "GET",
      url: rawUrl,
      session: mainWindow.webContents.session,
      useSessionCookies: true,
    });

    request.on("response", (response) => {
      if (response.statusCode && response.statusCode >= 400) {
        response.resume();
        reject(
          new Error(
            `Download request failed with status ${response.statusCode}`,
          ),
        );
        return;
      }

      const stream = fs.createWriteStream(savePath);
      response.pipe(stream);

      stream.on("finish", () => {
        stream.close(() => resolve(savePath));
      });

      stream.on("error", (error) => {
        stream.destroy();
        try {
          fs.unlinkSync(savePath);
        } catch {}
        reject(error);
      });
    });

    request.on("error", reject);
    request.end();
  });
}

async function openManagedFileInBrowser(rawUrl) {
  const previewWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    icon: getIconPath(),
    title: "File Preview",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  previewWindow.once("ready-to-show", () => {
    previewWindow.show();
  });

  await previewWindow.loadURL(rawUrl);
}

async function openManagedFileExternally(rawUrl, fileName) {
  const tempPath = await downloadManagedFileToTemp(rawUrl, fileName);
  const openError = await shell.openPath(tempPath);

  if (!openError) return true;

  await downloadManagedFile(rawUrl, fileName);
  return false;
}

async function handleFileOpenUrl(rawUrl) {
  try {
    const metadata = await requestFileMetadata(rawUrl);
    const ext = metadata.ext;

    if (isBrowserSupportedExtension(ext)) {
      await openManagedFileInBrowser(rawUrl);
      return;
    }

    if (isSoftwareSupportedExtension(ext)) {
      const opened = await openManagedFileExternally(rawUrl, metadata.fileName);

      if (!opened) {
        dialog.showMessageBox({
          type: "info",
          title: "Downloading file",
          message:
            "No compatible desktop application was found for this file, so it has been downloaded automatically.",
        });
      }

      return;
    }

    await downloadManagedFile(rawUrl, metadata.fileName);

    dialog.showMessageBox({
      type: "info",
      title: "Downloading file",
      message:
        "This file type is not supported in the browser and is not mapped to a desktop application, so it has been downloaded automatically.",
    });
  } catch (error) {
    dialog.showErrorBox(
      "File open failed",
      error?.message || "The selected file could not be opened.",
    );
  }
}

function attachManagedFileHandler(window) {
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (!isManagedFileOpenUrl(url)) {
      return { action: "allow" };
    }

    void handleFileOpenUrl(url);
    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, url) => {
    if (!isManagedFileOpenUrl(url)) return;
    event.preventDefault();
    void handleFileOpenUrl(url);
  });
}

function isPortFree(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const server = nodeNet
      .createServer()
      .once("error", () => resolve(false))
      .once("listening", () => {
        server.close(() => resolve(true));
      })
      .listen(port, host);
  });
}

async function findFreePort(startPort = 3000, host = "127.0.0.1") {
  for (let port = startPort; port < startPort + 50; port += 1) {
    const free = await isPortFree(port, host);
    if (free) return port;
  }

  return new Promise((resolve, reject) => {
    const server = nodeNet.createServer();
    server.listen(0, host, () => {
      const address = server.address();
      server.close(() => {
        if (typeof address === "object" && address && address.port) {
          resolve(address.port);
        } else {
          reject(new Error("Failed to allocate a free port"));
        }
      });
    });
  });
}

function waitForServer(port, host = "127.0.0.1", timeoutMs = 30000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const socket = nodeNet.connect({ port, host });

      socket.once("connect", () => {
        socket.end();
        resolve();
      });

      socket.once("error", () => {
        socket.destroy();

        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Backend did not start within ${timeoutMs}ms`));
          return;
        }

        setTimeout(tryConnect, 300);
      });
    };

    tryConnect();
  });
}

function startBackend(port) {
  const backendDir = getBackendDir();
  const backendEntry = path.join(backendDir, "server.js");
  const frontendDist = app.isPackaged
    ? path.join(process.resourcesPath, "frontend", "dist")
    : path.join(__dirname, "..", "frontend", "dist");

  const fileRoot = getConfiguredFileRoot();

  if (!fs.existsSync(backendEntry)) {
    throw new Error(`Backend entry not found: ${backendEntry}`);
  }

  if (!fs.existsSync(path.join(frontendDist, "index.html"))) {
    throw new Error(
      `Frontend build not found: ${path.join(frontendDist, "index.html")}`,
    );
  }

  fs.mkdirSync(fileRoot, { recursive: true });

  backendProcess = fork(backendEntry, [], {
    cwd: backendDir,
    env: {
      ...process.env,
      NODE_ENV: "production",
      ELECTRON: "true",
      SERVE_FRONTEND: "true",
      HOST: "127.0.0.1",
      PORT: String(port),
      FRONTEND_DIST: frontendDist,
      ENV_PATH: path.join(backendDir, ".env"),
      FILE_ROOT: fileRoot,
      SYSTEM_ROOT: path.dirname(fileRoot),
      SHARED_FILE_ROOT: fileRoot,
      PROJECT_ROOT: app.isPackaged
        ? process.resourcesPath
        : path.resolve(__dirname, ".."),
      CORS_ORIGINS: `http://127.0.0.1:${port},http://localhost:${port}`,
    },
    silent: true,
  });

  backendProcess.on("exit", () => {
    backendProcess = null;
  });

  if (backendProcess.stdout) {
    backendProcess.stdout.on("data", (data) => {
      process.stdout.write(`[BACKEND] ${data}`);
    });
  }

  if (backendProcess.stderr) {
    backendProcess.stderr.on("data", (data) => {
      process.stderr.write(`[BACKEND] ${data}`);
    });
  }
}

function setupAutoUpdater() {
  if (!app.isPackaged) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("checking-for-update", () => {
    console.log("Checking for update...");
  });

  autoUpdater.on("update-available", (info) => {
    console.log("Update available:", info?.version);
  });

  autoUpdater.on("update-not-available", () => {
    console.log("No updates available");
  });

  autoUpdater.on("error", (err) => {
    console.error("Auto update error:", err);
  });

  autoUpdater.on("update-downloaded", () => {
    dialog
      .showMessageBox({
        type: "info",
        title: "Update Ready",
        message:
          "A new version has been downloaded. Restart now to install it?",
        buttons: ["Restart Now", "Later"],
        defaultId: 0,
        cancelId: 1,
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
  });

  autoUpdater.checkForUpdatesAndNotify();
}

async function createWindow() {
  const icon = getIconPath();

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    icon,
    title: "Drawing Management",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  attachManagedFileHandler(mainWindow);

  backendPort = await findFreePort(3000, "127.0.0.1");
  startBackend(backendPort);
  await waitForServer(backendPort, "127.0.0.1", 30000);
  await mainWindow.loadURL(`http://127.0.0.1:${backendPort}/`);

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    setupAutoUpdater();
  }

  mainWindow.once("ready-to-show", () => {
    if (mainWindow) mainWindow.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function stopBackend() {
  if (!backendProcess) return;

  try {
    backendProcess.kill();
  } catch {}

  backendProcess = null;
}

app.whenReady().then(async () => {
  try {
    await createWindow();
  } catch (error) {
    dialog.showErrorBox(
      "Failed to start",
      error?.message || "Failed to start the desktop application.",
    );
    app.quit();
  }
});

app.on("before-quit", () => {
  stopBackend();
});

app.on("window-all-closed", () => {
  stopBackend();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    try {
      await createWindow();
    } catch (error) {
      dialog.showErrorBox(
        "Failed to reopen",
        error?.message || "Failed to reopen the desktop application.",
      );
    }
  }
});
