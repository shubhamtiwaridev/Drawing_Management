import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  loadTheme,
  saveTheme,
  getCurrentUser,
  setCurrentUser,
} from "../utils/storage";

import { FaSignOutAlt, FaCog } from "react-icons/fa";
import { FiSun, FiMoon, FiX } from "react-icons/fi";

const PISTACHIO = "#93C572";

const CARD =
  "rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 " +
  "shadow-[0_1px_0_rgba(0,0,0,0.03),0_18px_50px_rgba(15,23,42,0.06)] overflow-hidden";

function CardHeader({ title, subtitle, right }) {
  return (
    <div className="px-7 py-6 border-b border-slate-200/70 dark:border-slate-800 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <span
          className="w-2 h-7 rounded-full"
          style={{ backgroundColor: PISTACHIO }}
        />
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold tracking-wide uppercase text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-1 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

function BtnDanger({ children, ...props }) {
  return (
    <button
      {...props}
      className={[
        "h-11 px-6 rounded-2xl text-sm font-extrabold text-white",
        "bg-rose-500 hover:bg-rose-600 hover:shadow-md",
        "transition active:scale-[0.98]",
        "focus:outline-none focus:ring-2 focus:ring-rose-300",
        "inline-flex items-center justify-center gap-2",
        "w-full sm:w-auto",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function BtnOutline({ children, ...props }) {
  return (
    <button
      {...props}
      className={[
        "h-11 px-6 rounded-2xl text-sm font-extrabold",
        "border border-slate-200/70 dark:border-slate-700/60",
        "bg-white dark:bg-slate-900",
        "text-slate-700 dark:text-slate-100",
        "hover:bg-slate-50 dark:hover:bg-slate-800/60",
        "transition active:scale-[0.98]",
        "inline-flex items-center justify-center gap-2",
        "w-full sm:w-auto",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wide">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </div>
    </div>
  );
}

export default function Setting({ onLogout, onBack }) {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [dark, setDark] = useState(loadTheme());
  const [showProfile, setShowProfile] = useState(false);

  const displayName =
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User";

  const initials = useMemo(() => {
    const a = (user?.firstName || "").trim()[0] || "";
    const b = (user?.lastName || "").trim()[0] || "";
    return (a + b).toUpperCase() || "U";
  }, [user?.firstName, user?.lastName]);

  useEffect(() => {
    const isDark = !!dark;
    saveTheme(isDark);
    document.documentElement.classList.toggle("dark", isDark);

    try {
      window.dispatchEvent(new CustomEvent("theme-change", { detail: isDark }));
    } catch {
      window.__theme = isDark;
    }
  }, [dark]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setShowProfile(false);
    };
    if (showProfile) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showProfile]);

  const createdAtFormatted = useMemo(() => {
    if (!user?.createdAt) return "-";
    try {
      return new Date(user.createdAt).toLocaleString();
    } catch {
      return user.createdAt;
    }
  }, [user?.createdAt]);

  const doLogout = async () => {
    if (typeof onLogout === "function") {
      try {
        await onLogout();
      } catch (err) {
        console.warn(
          "Parent onLogout failed, continuing fallback logout:",
          err,
        );
      }
      return;
    }

    try {
      await axios.post("/api/auth/logout", {}, { withCredentials: true });
    } catch (err) {
      console.warn(
        "Logout API call failed (continuing client-side cleanup):",
        err,
      );
    }

    try {
      setCurrentUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("ui_view");
      localStorage.removeItem("selected_dept");
    } catch (e) {
      console.warn("Client logout cleanup error:", e);
    }

    navigate("/login", { replace: true });
  };

  const handleBack = () => {
    if (typeof onBack === "function") return onBack(); // ✅ dashboard
    navigate("/home");
  };

  return (
    <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Title */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm"
          style={{ backgroundColor: PISTACHIO }}
        >
          <FaCog />
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Settings
          </div>
          <div className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
            Manage account actions.
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className={`${CARD} mt-6`}>
        <CardHeader
          title="Account Settings"
          subtitle="Profile, theme and logout."
          right={
            <div className="flex items-center gap-2">
              {/* Profile button (same style as Header) */}
              <button
                type="button"
                onClick={() => setShowProfile(true)}
                className="
                  relative w-11 h-11 rounded-2xl
                  border border-slate-200/70 dark:border-slate-800
                  bg-white/70 dark:bg-slate-950/40
                  flex items-center justify-center
                  hover:shadow-md transition
                "
                title="Profile"
              >
                <span className="text-sm font-black text-slate-700 dark:text-slate-200">
                  {initials}
                </span>
                <span className="absolute -right-1 -bottom-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
              </button>

              {/* Theme button (same style as Header) */}
              <button
                type="button"
                onClick={() => setDark((prev) => !prev)}
                className="
                  w-10 h-10 rounded-full
                  border border-slate-200/70 dark:border-slate-800
                  bg-white/70 dark:bg-slate-950/40
                  flex items-center justify-center
                  hover:shadow-md transition
                "
                title={dark ? "Light Mode" : "Dark Mode"}
              >
                {dark ? (
                  <FiSun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <FiMoon className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                )}
              </button>
            </div>
          }
        />

        <div className="p-6 sm:p-7 space-y-5">
          {/* Actions (Back button in last) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
            <BtnOutline type="button" onClick={handleBack}>
              Back
            </BtnOutline>

            <BtnDanger onClick={doLogout} aria-label="Logout">
              <FaSignOutAlt />
              Logout
            </BtnDanger>
          </div>
        </div>
      </div>

      {/* PROFILE MODAL (no departments/mobile/etc) */}
      {showProfile && user && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4"
          onMouseDown={() => setShowProfile(false)}
        >
          <div
            className="
              w-full max-w-xl
              rounded-[26px]
              bg-white dark:bg-slate-900
              border border-slate-200/70 dark:border-slate-800
              shadow-[0_20px_60px_rgba(0,0,0,0.25)]
              p-6
            "
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-200/70 dark:border-slate-800">
              <div className="min-w-0">
                <div className="font-extrabold text-slate-900 dark:text-slate-50">
                  {displayName}
                </div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {user.email || "-"}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowProfile(false)}
                className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-center hover:shadow-md transition"
                title="Close"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <Info
                label="Role"
                value={(user.role || "-").toString().toUpperCase()}
              />
              <Info label="Employee ID" value={user.employeeId || "-"} />
              <Info label="Account Created" value={createdAtFormatted} />
            </div>

            <div className="mt-7 flex justify-end">
              <button
                type="button"
                onClick={() => setShowProfile(false)}
                className="px-6 py-2 rounded-2xl text-sm font-extrabold text-white bg-rose-500 hover:bg-rose-600 transition"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
