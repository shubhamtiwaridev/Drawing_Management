import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import drawingRoutes from "./routes/drawingRoutes.js";
import counterRoutes from "./routes/counterRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import historyRoutes from "./routes/historyRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import sessionsRoutes from "./routes/sessions.js";
import sessionSchedulesRoutes from "./routes/sessionSchedules.js";
import sessionWarning from "./middleware/sessionWarning.js";
import auth from "./middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultEnvPath = fs.existsSync(path.resolve(__dirname, ".env"))
  ? path.resolve(__dirname, ".env")
  : path.resolve(__dirname, "..", ".env");

dotenv.config({
  path: process.env.ENV_PATH
    ? path.resolve(process.env.ENV_PATH)
    : defaultEnvPath,
});

const PORT = Number.parseInt(process.env.PORT || "3000", 10);
const HOST =
  process.env.HOST ||
  (process.env.ELECTRON === "true" ? "127.0.0.1" : "0.0.0.0");

const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:5178",
  `http://localhost:${PORT}`,
  `http://127.0.0.1:${PORT}`,
];

const extraAllowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  ...defaultAllowedOrigins,
  ...extraAllowedOrigins,
]);

const shouldServeFrontend =
  process.env.SERVE_FRONTEND === "true" ||
  process.env.NODE_ENV === "production";

const frontendDist = process.env.FRONTEND_DIST
  ? path.resolve(process.env.FRONTEND_DIST)
  : path.resolve(__dirname, "..", "frontend", "dist");

const frontendIndex = path.join(frontendDist, "index.html");

if (shouldServeFrontend && !fs.existsSync(frontendIndex)) {
  throw new Error(
    `Frontend build not found: ${frontendIndex}. Run \"npm --prefix frontend run build\" before packaging.`,
  );
}

export const app = express();

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowedOrigins.has(origin)) return cb(null, true);

      if (
        process.env.ELECTRON === "true" &&
        (origin === "null" || origin.startsWith("file://"))
      ) {
        return cb(null, true);
      }

      return cb(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(cookieParser());
app.use(express.json());
app.set("trust proxy", true);

app.use("/api/auth", authRoutes);
app.use("/api", auth);
app.use("/api", sessionWarning);
app.use("/api/users", userRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/drawings", drawingRoutes);
app.use("/api/counters", counterRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/file", fileRoutes);
app.use("/api/sessions", sessionsRoutes);
app.use("/api/session-schedules", sessionSchedulesRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "API running" });
});

if (shouldServeFrontend) {
  app.use(express.static(frontendDist));

  app.get(/^\/(?!api(?:\/|$)).*/, (_req, res) => {
    return res.sendFile(frontendIndex);
  });
}

app.use((err, req, res, _next) => {
  if (err?.name === "MulterError") {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err?.message?.includes("File type")) {
    return res.status(400).json({ success: false, message: err.message });
  }

  console.error("Unhandled server error:", err);
  return res
    .status(500)
    .json({ success: false, message: "Internal server error" });
});

let serverInstance = null;
let serverStartPromise = null;
let serverStopPromise = null;

export async function startServer() {
  if (serverInstance) {
    return { app, server: serverInstance, port: PORT, host: HOST };
  }

  if (serverStartPromise) {
    return serverStartPromise;
  }

  serverStartPromise = (async () => {
    await connectDB();

    await new Promise((resolve, reject) => {
      const server = app.listen(PORT, HOST, () => {
        serverInstance = server;
        console.log(`Server running on http://${HOST}:${PORT}`);
        resolve();
      });

      server.once("error", reject);
    });

    return { app, server: serverInstance, port: PORT, host: HOST };
  })();

  try {
    return await serverStartPromise;
  } catch (error) {
    serverStartPromise = null;
    throw error;
  }
}

export async function stopServer() {
  if (serverStopPromise) {
    return serverStopPromise;
  }

  serverStopPromise = (async () => {
    const currentServer = serverInstance;
    serverInstance = null;
    serverStartPromise = null;

    if (currentServer) {
      await new Promise((resolve, reject) => {
        currentServer.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  })();

  try {
    await serverStopPromise;
  } finally {
    serverStopPromise = null;
  }
}

const startedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (startedDirectly) {
  startServer().catch((error) => {
    console.error("Failed to start backend:", error);
    process.exit(1);
  });
}
