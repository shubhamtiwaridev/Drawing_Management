import React, { useEffect, useRef, useState } from "react";
import { getCurrentUser } from "../utils/storage";
import logo from "./logos/image.png";
import { FaSearch } from "react-icons/fa";

const PISTACHIO = "#93C572";
const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_BASE_URL || "";

const CARD =
  "rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 " +
  "shadow-[0_1px_0_rgba(0,0,0,0.03),0_18px_50px_rgba(15,23,42,0.06)] overflow-hidden";

function CardHeader({ title }) {
  return (
    <div className="px-7 py-4 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <span
          className="w-2 h-7 rounded-full"
          style={{ backgroundColor: PISTACHIO }}
        />
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold tracking-wide uppercase text-slate-900 dark:text-slate-100">
            {title}
          </h3>
        </div>
      </div>
    </div>
  );
}

function StatusMessage({ show, children, tone = "error" }) {
  if (!show) return null;

  const cls =
    tone === "error"
      ? "bg-rose-100 text-rose-900 border-rose-200"
      : "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`mt-4 px-5 py-4 rounded-2xl border text-[13px] font-extrabold ${cls}`}
    >
      {children}
    </div>
  );
}

export default function UserCentralSearch() {
  const user = getCurrentUser();
  const role = (user?.role || "user").toLowerCase();

  if (role !== "user") return null;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  const hideTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const scheduleHide = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowMessage(false), 15000);
  };

  const handleSearch = async () => {
    const q = query.trim();
    setSearched(true);
    setResults([]);
    setShowMessage(false);

    if (!q) return;

    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE}/api/drawings/search?q=${encodeURIComponent(q)}`,
        { credentials: "include" },
      );

      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        setResults(data);
      } else {
        setShowMessage(true);
        scheduleHide();
      }
    } catch {
      setShowMessage(true);
      scheduleHide();
    } finally {
      setLoading(false);
    }
  };

  const handleEnter = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="mx-auto w-[88vw] max-w-3xl px-4 sm:px-6 lg:px-8 pb-3 relative -top-48 sm:-top-60">
      <div className="flex items-center justify-center mt-0 mb-1">
        <img
          src={logo}
          alt="Logo"
          className="h-14 sm:h-20 object-contain opacity-95"
        />
      </div>

      <div className={`${CARD} mt-1`}>
        <CardHeader title="File Search" />

        <div className="p-5 sm:p-6">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center md:justify-center">
            <div className="relative w-full">
              <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />

              <input
                type="text"
                placeholder="Search file number..."
                value={query}
                onKeyDown={handleEnter}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setResults([]);
                  setSearched(false);
                  setShowMessage(false);
                  if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
                }}
                className="
                  w-full h-12 pl-12 pr-5 rounded-[18px]
                  border border-slate-200/70 dark:border-slate-700/60
                  bg-white dark:bg-slate-800/40
                  text-[17px] sm:text-[18px] font-semibold text-slate-800 dark:text-white
                  outline-none focus:ring-2 focus:ring-[#93C572]/25
                  placeholder:text-slate-400
                "
              />
            </div>

            <button
              onClick={handleSearch}
              disabled={loading}
              className="
               h-12 px-7 rounded-[18px]
                text-white text-[14px] font-extrabold
                transition disabled:opacity-60 active:scale-[0.995]
              "
              style={{ backgroundColor: PISTACHIO }}
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          <StatusMessage show={!loading && showMessage} tone="error">
            File does not exist or does not match the file number
          </StatusMessage>

          {/* RESULTS */}
          <div className="mt-5">
            {!loading && searched && results.length > 0 && (
              <div className="mb-3 text-[12px] font-bold text-slate-500 dark:text-slate-400">
                Showing {results.length} result{results.length === 1 ? "" : "s"}
              </div>
            )}

            <div className="space-y-3">
              {!loading &&
                results.map((file) => {
                  const href = `${API_BASE}/api/file/open/${file.drawingId}?path=${encodeURIComponent(
                    file.filePath || "",
                  )}`;

                  return (
                    <div
                      key={`${file.filePath}-${file.fileName}`}
                      className="
                        rounded-2xl border border-slate-200/70 dark:border-slate-800
                        bg-white dark:bg-slate-900
                        shadow-sm hover:shadow-md transition
                        px-5 py-4
                      "
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                            Department
                          </div>
                          <div className="mt-1 text-[13px] font-bold text-slate-700 dark:text-slate-200">
                            {file.department || "—"}
                          </div>
                        </div>

                        <div className="min-w-0 sm:max-w-[65%] text-left sm:text-right">
                          <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                            File
                          </div>

                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="
                              mt-1 inline-block max-w-full
                              text-[13px] font-extrabold
                              text-blue-600 hover:text-blue-700
                              truncate
                            "
                            title={file.fileName}
                          >
                            {file.fileName || "—"}
                          </a>

                          {file.remark && (
                            <div className="mt-1 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                              {file.remark}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {!loading && searched && results.length === 0 && !showMessage && (
              <div className="mt-5 text-center text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                Start by typing a file number above.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
