import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import AddFiles from "./AddDrawing";
import { FaBoxes, FaSearch } from "react-icons/fa";

const departmentsMeta = {};
const PISTACHIO = "#93C572";

function slugFromName(name = "") {
  return name.toString().toLowerCase().trim().replace(/\s+/g, "_");
}

const CARD =
  "rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 " +
  "shadow-[0_1px_0_rgba(0,0,0,0.03),0_18px_50px_rgba(15,23,42,0.06)] overflow-hidden";

function SectionHeader({ title }) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
        {title}
      </h2>
      <div className="h-px flex-1 bg-slate-200/80 dark:bg-slate-800" />
    </div>
  );
}

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

const INPUT =
  "w-full h-10 pl-9 pr-3 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 " +
  "bg-white dark:bg-slate-800/40 text-[13px] font-semibold text-slate-800 dark:text-white " +
  "outline-none focus:ring-2 focus:ring-[#93C572]/25 placeholder:text-slate-400";

export default function ProductDepartment({
  role = "user",
  selectedDeptId,
  onBack,
  onSelectDepartment,
  assignedDepartments = [],
}) {
  const roleLower = String(role || "").toLowerCase();
  const isUserRole = roleLower === "user";

  const [searchTerm, setSearchTerm] = useState("");
  const [extraDepartments, setExtraDepartments] = useState([]);
  const [deptFileCounts, setDeptFileCounts] = useState({});

  // Load file counts (KEEP)
  useEffect(() => {
    const loadDeptFileCounts = async () => {
      try {
        const res = await axios.get("/api/drawings/stats/files-by-department", {
          withCredentials: true,
        });
        if (res.data?.success) setDeptFileCounts(res.data.data || {});
      } catch (err) {
        console.warn("Failed to load department file counts:", err);
      }
    };
    loadDeptFileCounts();
  }, []);

  // Load departments
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const res = await axios.get("/api/departments", {
          withCredentials: true,
        });
        const arr = Array.isArray(res.data) ? res.data : [];
        setExtraDepartments(
          arr.filter((d) => d?.name && String(d.name).trim()),
        );
      } catch (err) {
        console.warn("Failed to load departments:", err);
      }
    };

    loadDepartments();
    const handler = () => loadDepartments();
    window.addEventListener("departments-changed", handler);
    return () => window.removeEventListener("departments-changed", handler);
  }, []);

  const handleBackClick = () => {
    if (selectedDeptId && typeof onSelectDepartment === "function") {
      onSelectDepartment("");
      return;
    }
    if (typeof onBack === "function") return onBack();
    window.history.back();
  };

  const filteredEntries = useMemo(() => {
    const baseEntries = Object.entries(departmentsMeta);

    const dynamicEntries = extraDepartments
      .map((d) => {
        const id = slugFromName(d.name);
        return [id, { title: d.name }];
      })
      .filter(([id]) => !departmentsMeta[id]);

    const allEntries =
      roleLower === "superadmin"
        ? [...baseEntries, ...dynamicEntries]
        : dynamicEntries.filter(([id]) =>
            assignedDepartments.some((dept) => slugFromName(dept) === id),
          );

    const q = searchTerm.trim().toLowerCase();
    return allEntries.filter(([, meta]) =>
      meta.title.toLowerCase().includes(q),
    );
  }, [extraDepartments, roleLower, assignedDepartments, searchTerm]);

  const handleSelectDept = (id) => {
    if (typeof onSelectDepartment === "function") onSelectDepartment(id);
  };

  if (isUserRole) return null;

  if (selectedDeptId) {
    return (
      <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6">
        <AddFiles
          deptId={selectedDeptId}
          onBack={handleBackClick}
          onDeptChange={onSelectDepartment}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6">
      <SectionHeader title="Departments" />

      <div className={`${CARD} mt-6`}>
        <CardHeader
          title="Department Picker"
          subtitle="Select a department to manage drawings and files."
          right={
            <div className="relative w-64 sm:w-[320px]">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                className={INPUT}
                placeholder="Search department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          }
        />

        <div className="p-6 sm:p-7">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="text-[12px] font-bold text-slate-500 dark:text-slate-400">
              Showing {filteredEntries.length} department
              {filteredEntries.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            {filteredEntries.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 font-semibold">
                  <FaBoxes className="text-slate-400" />
                  No departments available
                </div>
                <div className="mt-2 text-[12px] font-semibold text-slate-400">
                  Try clearing the search.
                </div>
              </div>
            ) : (
              <div
                className="
                 overflow-y-auto p-4 sm:p-5"
                style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
              >
                <style>{`div::-webkit-scrollbar{display:none;}`}</style>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {filteredEntries.map(([id, meta]) => {
                    const count = deptFileCounts[meta.title] || 0;

                    return (
                      <button
                        key={id}
                        onClick={() => handleSelectDept(id)}
                        className={[
                          "group text-left",
                          "rounded-2xl border border-slate-200/70 dark:border-slate-800",
                          "bg-slate-50/60 dark:bg-slate-800/30",
                          "p-5 min-h-28",
                          "hover:bg-white dark:hover:bg-slate-800/60",
                          "hover:border-emerald-300 dark:hover:border-emerald-500/50",
                          "hover:shadow-md hover:-translate-y-0.5",
                          "transition",
                        ].join(" ")}
                      >
                        <div className="min-w-0">
                          <div className="text-[13px] font-extrabold text-slate-900 dark:text-slate-100 truncate">
                            {meta.title}
                          </div>
                          <div className="mt-1 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                            Click to open
                          </div>
                        </div>

                        {/* KEEP Files section */}
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <span className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                            Files
                          </span>

                          <span
                            style={{ minWidth: 56 }}
                            className="inline-flex items-center justify-center h-8 px-3 rounded-xl border border-slate-200/70 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/40 text-[12px] font-extrabold text-slate-700 dark:text-slate-100"
                          >
                            {count}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={handleBackClick}
              className="h-10 px-6 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-[12px] font-extrabold transition"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
