import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  loadTheme,
  saveTheme,
  getCurrentUser,
  setCurrentUser,
} from "../utils/storage";
import logo from "./logos/image.png";

import { FiSun, FiMoon, FiLogOut, FiX } from "react-icons/fi";

const API_BASE = import.meta.env.VITE_API_URL || "";
const PISTACHIO = "#93C572";

export default function Header() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(loadTheme());
  const [role, setRole] = useState("");
  const [showProfile, setShowProfile] = useState(false);

  const user = getCurrentUser();

  const displayName =
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User";

  const initials = useMemo(() => {
    const a = (user?.firstName || "").trim()[0] || "";
    const b = (user?.lastName || "").trim()[0] || "";
    return (a + b).toUpperCase() || "U";
  }, [user?.firstName, user?.lastName]);

  useEffect(() => {
    setRole(user?.role || "user");
  }, [user]);

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

  const createdAtFormatted = useMemo(() => {
    if (!user?.createdAt) return "-";
    try {
      return new Date(user.createdAt).toLocaleString();
    } catch {
      return user.createdAt;
    }
  }, [user?.createdAt]);

  const doLogout = async () => {
    try {
      await axios.post(
        `${API_BASE}/api/auth/logout`,
        {},
        { withCredentials: true },
      );
    } catch (err) {
      console.warn("Logout API failed, continuing cleanup", err);
    }

    try {
      setCurrentUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("ui_view");
      localStorage.removeItem("selected_dept");
    } catch {}

    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setShowProfile(false);
    };
    if (showProfile) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showProfile]);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50">
        <div className="px-4 sm:px-6 py-3 bg-transparent">
          <header
            className="
              w-full
              rounded-[28px]
              border border-slate-200/70 dark:border-slate-800
              bg-white/85 dark:bg-slate-900/70
              backdrop-blur-xl
              shadow-[0_1px_0_rgba(0,0,0,0.03),0_14px_40px_rgba(15,23,42,0.10)]
              px-5 sm:px-7 py-3.5
              flex items-center justify-between gap-1
            "
          >
            {/* LEFT */}
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={logo}
                alt="Decostyle"
                className="h-9 sm:h-10 object-contain"
              />

              <span
                className="
                  inline-flex items-center
                  text-[10px] sm:text-xs font-extrabold
                  px-2.5 py-1 rounded-full
                  text-white tracking-wide
                "
                style={{ backgroundColor: PISTACHIO }}
              >
                {role?.toUpperCase()}
              </span>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:block text-right leading-tight mr-1">
                <div className="font-extrabold text-slate-800 dark:text-slate-100 max-w-xs truncate">
                  {displayName}
                </div>
                <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                  {role?.toUpperCase()}
                </div>
              </div>

              {/* initials badge (NO cartoon avatar) */}
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

              {/* theme */}
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

              {/* logout (softer pistachio tone) */}
              <button
                type="button"
                onClick={doLogout}
                className="
                  inline-flex items-center gap-2
                  px-3.5 py-2 rounded-2xl
                  text-xs font-extrabold text-white
                  shadow-sm hover:shadow-md transition
                "
                style={{ backgroundColor: PISTACHIO }}
                title="Logout"
              >
                <FiLogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </header>
        </div>
      </div>

      {/* PROFILE MODAL */}
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
              <Info label="Department" value={user.department || "-"} />
              <Info label="Mobile" value={user.mobile || "-"} />
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
    </>
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
