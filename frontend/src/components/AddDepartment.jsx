import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  loadDepartments,
  saveDepartment,
  deleteDepartment,
  setDeptName,
  setShortCode,
  setSearch,
  setPage,
  setMessage,
  resetForm,
  setEditForm,
} from "../store/addDepartmentSlice";

import { FaListUl, FaSearch, FaEdit, FaTrashAlt } from "react-icons/fa";
import { getCurrentUser } from "../utils/storage";

const pistachio = "#93C572";

function formatDeptName(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

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

const CARD =
  "rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-[0_1px_0_rgba(0,0,0,0.03),0_18px_50px_rgba(15,23,42,0.06)] overflow-hidden";

function CardHeader({ title, subtitle, right }) {
  return (
    <div className="px-7 py-6 border-b border-slate-200/70 dark:border-slate-800 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <span
          className="w-2 h-7 rounded-full"
          style={{ backgroundColor: pistachio }}
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

function IconBtn({ title, onClick, tone = "default", children }) {
  const toneClass =
    tone === "danger"
      ? "text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800/70"
      : "text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/70";

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={[
        "w-9 h-9 rounded-xl",
        "border border-slate-200/70 dark:border-slate-700/60",
        "bg-white dark:bg-slate-900",
        "shadow-sm",
        "transition active:scale-95 inline-flex items-center justify-center",
        toneClass,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function StatusMessage({ message, type }) {
  if (!message) return null;

  const styles =
    type === "success"
      ? "bg-emerald-100 text-emerald-900 border-emerald-200"
      : type === "error"
        ? "bg-rose-100 text-rose-900 border-rose-200"
        : "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <div
      aria-live="polite"
      className={`mt-4 px-4 py-3 rounded-2xl border text-[12px] font-bold ${styles}`}
    >
      {message}
    </div>
  );
}

export default function AddDepartment({ onBack }) {
  const dispatch = useDispatch();

  // ✅ ROLE CHECK (Delete only for superadmin)
  const currentUser = getCurrentUser();
  const viewerRole = (currentUser?.role || "").toLowerCase();
  const isSuperAdminViewer = viewerRole === "superadmin";

  const {
    departments,
    formData,
    loading,
    tableLoading,
    message,
    msgType,
    search,
    editingId,
    page,
    PAGE_SIZE,
  } = useSelector((state) => state.addDepartment);

  const { deptName, shortCode } = formData;

  useEffect(() => {
    dispatch(loadDepartments());
    const handler = () => dispatch(loadDepartments());
    window.addEventListener("departments-changed", handler);
    return () => window.removeEventListener("departments-changed", handler);
  }, [dispatch]);

  useEffect(() => {
    if (msgType === "success") {
      const timer = setTimeout(() => {
        dispatch(setMessage({ message: "", msgType: "info" }));
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [msgType, dispatch]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.shortCode || "").toLowerCase().includes(q),
    );
  }, [departments, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage, PAGE_SIZE]);

  const hasData = filtered.length > 0;

  const handleBack = () => {
    if (typeof onBack === "function") onBack();
  };

  const handleEditRow = (dept) => {
    dispatch(setEditForm(dept));
  };

  const handleDeleteRow = async (dept) => {
    dispatch(deleteDepartment({ id: dept.id, name: dept.name }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(setMessage({ message: "", msgType: "info" }));

    const rawName = deptName.trim();
    if (!rawName) {
      dispatch(
        setMessage({
          message: "Department name is required.",
          msgType: "error",
        }),
      );
      return;
    }
    const name = formatDeptName(rawName);

    const rawShort = shortCode.trim().toUpperCase();
    if (!rawShort) {
      dispatch(
        setMessage({ message: "Short code is required.", msgType: "error" }),
      );
      return;
    }
    if (rawShort.length < 1 || rawShort.length > 2) {
      dispatch(
        setMessage({
          message: "Short code must be 1 or 2 uppercase letters.",
          msgType: "error",
        }),
      );
      return;
    }

    const duplicate = departments.find(
      (d) => d.shortCode === rawShort && d.id !== editingId,
    );
    if (duplicate) {
      dispatch(
        setMessage({
          message: `Short code "${rawShort}" is already used by "${duplicate.name}".`,
          msgType: "error",
        }),
      );
      return;
    }

    if (deptName.trim() === "" || shortCode.trim() === "") {
      dispatch(
        setMessage({
          message: "Department name and Short code are mandatory.",
          msgType: "error",
        }),
      );
      return;
    }

    const payload = {
      name,
      shortCode: rawShort,
    };

    dispatch(saveDepartment({ editingId, payload }));
  };

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
        pages.push(i);
      }
    }
    return Array.from(new Set(pages)).sort((a, b) => a - b);
  };

  const pageNumbers = getPageNumbers();

  const labelClass =
    "block mb-1 text-[12px] font-bold text-slate-700 dark:text-slate-200";

  const inputClass =
    "w-full h-10 px-3 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 text-[13px] font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#93C572]/25";

  const thClass =
    "px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/70 dark:border-slate-800 whitespace-nowrap";
  const tdClass =
    "px-4 py-2 text-[13px] text-slate-700 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800/60";
  const tdRightBorder = "border-r border-slate-200/70 dark:border-slate-800";

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <SectionHeader title="Department Center" />

      {/* TOP FORM CARD */}
      <div className={`${CARD} mt-6`}>
        <CardHeader
          title={editingId ? "Edit Department" : "Add Department"}
          subtitle={
            editingId
              ? "Update the selected department."
              : "Create a new department using name and short code."
          }
          right={
            editingId ? (
              <span className="inline-flex items-center gap-2 text-[12px] font-bold text-slate-500 dark:text-slate-400">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: pistachio }}
                />
                Editing Mode
              </span>
            ) : null
          }
        />

        <div className="p-6 sm:p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Department Name</label>
                <input
                  type="text"
                  value={deptName}
                  onChange={(e) => dispatch(setDeptName(e.target.value))}
                  placeholder="e.g. Networking"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>
                  Short Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={shortCode}
                  onChange={(e) => dispatch(setShortCode(e.target.value))}
                  placeholder="e.g. NE"
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                type="submit"
                disabled={loading}
                className="h-10 px-6 rounded-2xl text-white text-[12px] font-extrabold transition disabled:opacity-60"
                style={{ backgroundColor: pistachio }}
              >
                {loading
                  ? editingId
                    ? "Updating..."
                    : "Saving..."
                  : editingId
                    ? "Update"
                    : "Save"}
              </button>

              <button
                type="button"
                onClick={handleBack}
                className="h-10 px-6 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-[12px] font-extrabold transition"
              >
                Back
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={() => dispatch(resetForm())}
                  className="h-10 px-6 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white dark:bg-slate-900 text-[12px] font-extrabold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
                >
                  Cancel
                </button>
              )}
            </div>

            <StatusMessage message={message} type={msgType} />
          </form>
        </div>
      </div>

      {/* LIST CARD */}
      <div className={`${CARD} mt-6`}>
        <CardHeader
          title="Department List"
          subtitle={
            tableLoading
              ? "Loading departments..."
              : `Showing ${filtered.length} department${
                  filtered.length === 1 ? "" : "s"
                }`
          }
          right={
            <div className="relative w-64 sm:w-[320px]">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="h-10 w-full rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 pl-9 pr-3 text-[13px] font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#93C572]/25 placeholder:text-slate-400"
                placeholder="Search department..."
                value={search}
                onChange={(e) => dispatch(setSearch(e.target.value))}
              />
            </div>
          }
        />

        <div className="p-6 sm:p-7">
          <div className="overflow-x-auto">
            <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 overflow-hidden min-w-full">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className={`${thClass} ${tdRightBorder}`}>Short</th>
                    <th className={`${thClass} ${tdRightBorder}`}>
                      Department
                    </th>
                    <th className={`${thClass} ${tdRightBorder} text-center`}>
                      Created
                    </th>
                    <th className={`${thClass} text-center`}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {/* Loading skeleton */}
                  {tableLoading &&
                    Array.from({ length: PAGE_SIZE }).map((_, idx) => (
                      <tr
                        key={`loading-${idx}`}
                        className="bg-white dark:bg-slate-900 animate-pulse"
                      >
                        {Array.from({ length: 4 }).map((__, c) => (
                          <td
                            key={c}
                            className={`${tdClass} ${
                              c < 3 ? tdRightBorder : ""
                            }`}
                          >
                            <div className="h-3 w-full rounded bg-slate-200/70 dark:bg-slate-800" />
                          </td>
                        ))}
                      </tr>
                    ))}

                  {!tableLoading && hasData && (
                    <>
                      {paginated.map((d) => (
                        <tr
                          key={d.id}
                          className="bg-white dark:bg-slate-900 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                        >
                          <td
                            className={`${tdClass} ${tdRightBorder} text-center`}
                          >
                            <span className="inline-flex items-center justify-center min-w-10 h-8 px-3 rounded-xl border border-slate-200/70 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 text-[12px] font-extrabold text-slate-700 dark:text-white">
                              {d.shortCode || "-"}
                            </span>
                          </td>

                          <td
                            className={`${tdClass} ${tdRightBorder} text-center font-semibold`}
                          >
                            {d.name}
                          </td>

                          <td
                            className={`${tdClass} ${tdRightBorder} text-center`}
                          >
                            {d.createdAt ? (
                              <div className="leading-tight">
                                <div className="text-[12px] font-semibold text-slate-700 dark:text-slate-100">
                                  {new Date(d.createdAt).toLocaleDateString(
                                    "en-IN",
                                  )}
                                </div>
                                <div className="text-[11px] font-extrabold text-slate-400">
                                  {new Date(d.createdAt).toLocaleTimeString(
                                    "en-IN",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: true,
                                    },
                                  )}
                                </div>
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>

                          <td className={`${tdClass} text-center`}>
                            <div className="inline-flex items-center justify-center gap-2">
                              <IconBtn
                                title="Edit"
                                onClick={() => handleEditRow(d)}
                              >
                                <FaEdit size={14} />
                              </IconBtn>

                              {/* ✅ Delete only for superadmin */}
                              {isSuperAdminViewer && (
                                <IconBtn
                                  title="Delete"
                                  tone="danger"
                                  onClick={() => handleDeleteRow(d)}
                                >
                                  <FaTrashAlt size={14} />
                                </IconBtn>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}

                      {/* filler rows */}
                      {Array.from({ length: PAGE_SIZE - paginated.length }).map(
                        (_, idx) => (
                          <tr
                            key={`empty-${idx}`}
                            className="bg-white dark:bg-slate-900"
                          >
                            <td className={tdClass} colSpan={4}>
                              &nbsp;
                            </td>
                          </tr>
                        ),
                      )}
                    </>
                  )}

                  {!tableLoading && !hasData && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 font-semibold">
                          <FaListUl className="text-slate-400" />
                          No departments to show.
                        </div>
                        {search?.trim() ? (
                          <div className="mt-2 text-[12px] font-semibold text-slate-400">
                            Try clearing the search.
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {!tableLoading && hasData && (
            <div className="mt-5 flex items-center justify-end gap-1 text-[12px] font-bold">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => dispatch(setPage(1))}
                className={`px-3 py-2 rounded-xl border ${
                  currentPage === 1
                    ? "text-slate-300 border-slate-200/70 dark:border-slate-800 cursor-not-allowed"
                    : "text-slate-700 dark:text-slate-200 border-slate-200/70 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                First
              </button>

              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => dispatch(setPage(Math.max(1, currentPage - 1)))}
                className={`px-3 py-2 rounded-xl border ${
                  currentPage === 1
                    ? "text-slate-300 border-slate-200/70 dark:border-slate-800 cursor-not-allowed"
                    : "text-slate-700 dark:text-slate-200 border-slate-200/70 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                Prev
              </button>

              {pageNumbers.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => dispatch(setPage(p))}
                  className={`w-10 h-10 rounded-xl border font-extrabold ${
                    p === currentPage
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200/70 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  dispatch(setPage(Math.min(totalPages, currentPage + 1)))
                }
                className={`px-3 py-2 rounded-xl border ${
                  currentPage === totalPages
                    ? "text-slate-300 border-slate-200/70 dark:border-slate-800 cursor-not-allowed"
                    : "text-slate-700 dark:text-slate-200 border-slate-200/70 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
