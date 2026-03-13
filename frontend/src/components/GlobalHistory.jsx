import React, { useEffect, useMemo, useState } from "react";
import SearchBox from "../components/SearchBox";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../utils/storage";
import logo from "./logos/image.png";
import * as XLSX from "xlsx";
import { FaTrashAlt } from "react-icons/fa";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_BASE_URL ||
  "";

const formatDateTime = (date) => {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const normalizeAction = (v) =>
  String(v || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

const isAuthAction = (log) => {
  const a = normalizeAction(log?.action);
  return a === "LOGIN" || a === "LOGOUT" || a === "SESSION_CHECK";
};

const getDepartmentName = (log) => {
  const action = normalizeAction(log?.action);
  const type = String(log?.resourceType || "").toLowerCase();

  if (type === "department" || action.endsWith("_DEPARTMENT")) {
    return (
      log?.metadata?.name ||
      log?.metadata?.after?.name ||
      log?.metadata?.before?.name ||
      log?.metadata?.departmentName ||
      log?.metadata?.uploadFolder ||
      log?.metadata?.folderName ||
      "—"
    );
  }

  return log?.metadata?.folderName || "—";
};

const getTargetUserText = (log) => {
  const action = normalizeAction(log?.action);
  const type = String(log?.resourceType || "").toLowerCase();

  if (type !== "user" && !action.endsWith("_USER")) return "—";

  const name = String(log?.metadata?.targetName || "").trim();
  const email = String(
    log?.metadata?.targetEmail || log?.metadata?.createdUserEmail || "",
  ).trim();
  const emp = String(
    log?.metadata?.targetEmployeeId || log?.metadata?.employeeId || "",
  ).trim();
  const role = String(
    log?.metadata?.targetRole || log?.metadata?.createdUserRole || "",
  ).trim();

  const main = name || email || "—";
  const extra = [];

  if (name && email) extra.push(email);
  if (emp) extra.push(`Emp: ${emp}`);
  if (role) extra.push(role);

  return extra.length ? `${main} (${extra.join(", ")})` : main;
};

const getDrawingOrTarget = (log) => {
  if (isAuthAction(log)) return "—";

  const action = normalizeAction(log?.action);
  const type = String(log?.resourceType || "").toLowerCase();

  if (type === "user" || action.endsWith("_USER")) {
    return getTargetUserText(log);
  }

  return log?.metadata?.fullDrawingNo || log?.metadata?.query || "—";
};

const formatAction = (action) => {
  const a = normalizeAction(action);

  switch (a) {
    case "LOGIN":
      return "Login";
    case "LOGOUT":
      return "Logout";
    case "CREATE_DRAWING":
      return "Created Drawing";
    case "UPDATE_DRAWING":
      return "Updated Drawing";
    case "DELETE_DRAWING":
      return "Deleted Drawing";
    case "CREATE_DEPARTMENT":
      return "Created Department";
    case "UPDATE_DEPARTMENT":
      return "Updated Department";
    case "DELETE_DEPARTMENT":
      return "Deleted Department";
    case "CREATE_USER":
      return "Created User";
    case "UPDATE_USER":
      return "Updated User";
    case "DELETE_USER":
      return "Deleted User";
    case "ENABLE_USER":
      return "Enabled User";
    case "DISABLE_USER":
      return "Disabled User";
    case "ACTIVATE_DRAWING":
      return "Activated Drawing";
    case "DEACTIVATE_DRAWING":
      return "Deactivated Drawing";
    case "SEARCH":
      return "Search";
    case "OPEN":
      return "Opened File";
    case "DOWNLOAD":
      return "Downloaded File";
    case "SCHEDULE_UPSERT":
      return "Schedule Saved";
    case "SCHEDULE_CLEANUP":
      return "Schedule Cleared";
    case "SESSION_CHECK":
      return "Session Checked";
    default:
      return action;
  }
};

const buildExportRows = (data) =>
  data.map((log) => ({
    "User Email": log.userId?.email || "",
    "User Name": `${log.userId?.firstName || ""} ${
      log.userId?.lastName || ""
    }`.trim(),
    "Emp No": log.userId?.employeeId || "",
    Role: log.userId?.role || "",
    Action: formatAction(log.action),
    Department: getDepartmentName(log),
    Drawing: getDrawingOrTarget(log),
    "File Name": log.metadata?.fileName || "",
    Time: formatDateTime(log.createdAt),
  }));

export default function GlobalHistory() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const role = (user?.role || "").toLowerCase();
  const isSuperAdmin = role === "superadmin";

  if (!["superadmin", "admin"].includes(role)) {
    return null;
  }

  const handleBack = () => {
    localStorage.setItem("ui_view", "product");
    navigate("/home");
  };

  const [logs, setLogs] = useState([]);
  const [searchBy, setSearchBy] = useState("select");
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(true);

  const ROWS_PER_PAGE = 18;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/history`, {
          withCredentials: true,
        });
        const data = res.data.activityLogs || [];
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setLogs(data);
      } catch (err) {
        console.error("Global history error", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDelete = async (eventId) => {
    try {
      await axios.delete(`${API_BASE}/api/history/event/${eventId}`, {
        withCredentials: true,
      });
      setLogs((prev) => prev.filter((e) => e._id !== eventId));
    } catch (err) {
      console.error("Delete history failed", err);
    }
  };

  const exportCSV = () => {
    if (!filtered.length) return;

    const rows = buildExportRows(filtered);
    const headers = Object.keys(rows[0]).join(",");

    const csvBody = rows
      .map((row) =>
        Object.values(row)
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    const csv = `${headers}\n${csvBody}`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `global-history-${Date.now()}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    if (!filtered.length) return;

    const rows = buildExportRows(filtered);
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Global History");
    XLSX.writeFile(workbook, `global-history-${Date.now()}.xlsx`);
  };

  const filtered = useMemo(() => {
    if (searchBy === "select" || !searchValue) return logs;

    return logs.filter((log) => {
      switch (searchBy) {
        case "all": {
          const q = String(searchValue || "").toLowerCase();
          if (!q) return true;

          const email = log.userId?.email || "";
          const name = `${log.userId?.firstName || ""} ${
            log.userId?.lastName || ""
          }`;
          const empNo = log.userId?.employeeId || "";
          const r = log.userId?.role || "";
          const action = formatAction(log.action);
          const rawAction = log.action || "";

          const department = getDepartmentName(log);
          const drawingOrTarget = getDrawingOrTarget(log);
          const fileName = log.metadata?.fileName || "";
          const time = formatDateTime(log.createdAt);

          const combined = `
            ${email}
            ${name}
            ${empNo}
            ${r}
            ${action}
            ${rawAction}
            ${department}
            ${drawingOrTarget}
            ${fileName}
            ${time}
          `.toLowerCase();

          return combined.includes(q);
        }

        case "email":
          return log.userId?.email
            ?.toLowerCase()
            .includes(String(searchValue).toLowerCase());

        case "username":
          return `${log.userId?.firstName || ""} ${log.userId?.lastName || ""}`
            .toLowerCase()
            .includes(String(searchValue).toLowerCase());

        case "empNo":
          return (
            log.userId?.employeeId &&
            String(log.userId.employeeId).includes(String(searchValue))
          );

        case "role":
          if (!Array.isArray(searchValue) || searchValue.length === 0)
            return true;
          return searchValue
            .map((x) => x.toLowerCase())
            .includes((log.userId?.role || "").toLowerCase());

        case "action":
          if (!Array.isArray(searchValue) || searchValue.length === 0)
            return true;
          return searchValue.includes(log.action);

        case "department": {
          if (!Array.isArray(searchValue) || searchValue.length === 0)
            return true;
          const dept = getDepartmentName(log);
          return searchValue.includes(dept);
        }

        case "drawing": {
          const val = getDrawingOrTarget(log);
          return val?.toLowerCase().includes(String(searchValue).toLowerCase());
        }

        case "fileName":
          return log.metadata?.fileName
            ?.toLowerCase()
            .includes(String(searchValue).toLowerCase());

        case "datetime": {
          if (!searchValue) return true;

          const {
            fromDate,
            toDate,
            fromTime,
            fromMeridiem,
            toTime,
            toMeridiem,
          } = searchValue;
          if (!fromDate && !toDate && !fromTime && !toTime) return true;

          const logDate = new Date(log.createdAt);

          if (fromDate) {
            const from = new Date(fromDate);
            from.setHours(0, 0, 0, 0);
            if (logDate < from) return false;
          }

          if (toDate) {
            const to = new Date(toDate);
            to.setHours(23, 59, 59, 999);
            if (logDate > to) return false;
          }

          const toMinutes = (time, meridiem) => {
            if (!time || !meridiem) return null;
            const [h, m] = time.split(":").map(Number);
            let hours = h % 12;
            if (meridiem === "PM") hours += 12;
            return hours * 60 + m;
          };

          const logMinutes = logDate.getHours() * 60 + logDate.getMinutes();
          const fromMinutes = toMinutes(fromTime, fromMeridiem);
          const toMinutesVal = toMinutes(toTime, toMeridiem);

          if (fromMinutes !== null && logMinutes < fromMinutes) return false;
          if (toMinutesVal !== null && logMinutes > toMinutesVal) return false;

          return true;
        }

        default:
          return true;
      }
    });
  }, [logs, searchBy, searchValue]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const pageRows = filtered.slice(startIndex, startIndex + ROWS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  if (loading) {
    return (
      <div className="p-10 text-center text-sm text-slate-600">
        Loading history...
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-slate-200 rounded-2xl p-4 bg-white">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="h-10" />
          <div className="text-sm font-extrabold text-slate-900">
            Global History
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <button
            onClick={exportCSV}
            className="h-9 px-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
          >
            Export CSV
          </button>

          <button
            onClick={exportExcel}
            className="h-9 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
          >
            Export Excel
          </button>

          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <span className="text-xs font-bold text-slate-700">Search:</span>
            <SearchBox
              searchBy={searchBy}
              searchValue={searchValue}
              onSearchByChange={(val) => {
                setSearchBy(val);
                setSearchValue("");
                setCurrentPage(1);
              }}
              onSearchValueChange={(val) => {
                setSearchValue(val);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 border border-slate-200 rounded-2xl overflow-hidden bg-white">
        <div className="overflow-auto">
          <table className="w-full text-[12px] border-collapse">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="border border-slate-200 px-3 py-2 text-left font-extrabold">
                  User Email
                </th>
                <th className="border border-slate-200 px-3 py-2 text-left font-extrabold">
                  User Name
                </th>
                <th className="border border-slate-200 px-3 py-2 text-left font-extrabold">
                  Emp No
                </th>
                <th className="border border-slate-200 px-3 py-2 text-left font-extrabold">
                  Role
                </th>
                <th className="border border-slate-200 px-3 py-2 text-left font-extrabold">
                  Action
                </th>
                <th className="border border-slate-200 px-3 py-2 text-left font-extrabold">
                  Department
                </th>
                <th className="border border-slate-200 px-3 py-2 text-left font-extrabold">
                  Drawing
                </th>
                <th className="border border-slate-200 px-3 py-2 text-left font-extrabold">
                  File Name
                </th>
                <th className="border border-slate-200 px-3 py-2 text-left font-extrabold">
                  Time
                </th>
                {isSuperAdmin && (
                  <th className="border border-slate-200 px-3 py-2 text-center font-extrabold">
                    Delete
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={isSuperAdmin ? 10 : 9}
                    className="border border-slate-200 px-3 py-6 text-center"
                  >
                    No history found
                  </td>
                </tr>
              ) : (
                pageRows.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50">
                    <td className="border border-slate-200 px-3 py-2 font-extrabold text-slate-900">
                      {(() => {
                        const role = String(
                          log.userId?.role || "",
                        ).toLowerCase();
                        const email =
                          log.userId?.email || log.metadata?.actor?.email || "";
                        if (!email && role === "user") return "";
                        return email || "—";
                      })()}
                    </td>

                    <td className="border border-slate-200 px-3 py-2">
                      {log.userId?.firstName ||
                      log.userId?.lastName ||
                      log.metadata?.actor?.firstName ||
                      log.metadata?.actor?.lastName
                        ? `${log.userId?.firstName || log.metadata?.actor?.firstName || ""} ${log.userId?.lastName || log.metadata?.actor?.lastName || ""}`.trim()
                        : "—"}
                    </td>

                    <td className="border border-slate-200 px-3 py-2">
                      {log.userId?.employeeId || "—"}
                    </td>

                    <td className="border border-slate-200 px-3 py-2">
                      {log.userId?.role || "—"}
                    </td>

                    <td className="border border-slate-200 px-3 py-2 font-extrabold text-slate-900">
                      {formatAction(log.action)}
                    </td>

                    <td className="border border-slate-200 px-3 py-2">
                      {getDepartmentName(log)}
                    </td>

                    <td className="border border-slate-200 px-3 py-2">
                      {getDrawingOrTarget(log)}
                    </td>

                    <td className="border border-slate-200 px-3 py-2">
                      {log.metadata?.fileName ||
                        (normalizeAction(log.action) === "SEARCH"
                          ? log.metadata?.query
                          : "") ||
                        "—"}
                    </td>

                    <td className="border border-slate-200 px-3 py-2">
                      {formatDateTime(log.createdAt)}
                    </td>

                    {isSuperAdmin && (
                      <td className="border border-slate-200 px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDelete(log._id)}
                          className="
                            inline-flex items-center justify-center
                            w-9 h-9 rounded-xl
                            border border-slate-200
                            text-rose-600 hover:text-rose-700
                            hover:bg-rose-50
                            transition
                          "
                          title="Delete"
                          aria-label="Delete"
                        >
                          <FaTrashAlt className="text-[14px]" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-end gap-1 text-[12px] font-bold">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(1)}
          className={`px-3 py-2 rounded-xl border ${
            currentPage === 1
              ? "text-slate-300 border-slate-200 cursor-not-allowed"
              : "text-slate-700 border-slate-200 hover:bg-slate-50"
          }`}
        >
          First
        </button>

        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          className={`px-3 py-2 rounded-xl border ${
            currentPage === 1
              ? "text-slate-300 border-slate-200 cursor-not-allowed"
              : "text-slate-700 border-slate-200 hover:bg-slate-50"
          }`}
        >
          Prev
        </button>

        {(() => {
          const pages = [];
          for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
              pages.push(i);
            }
          }
          const pageNumbers = Array.from(new Set(pages)).sort((a, b) => a - b);

          return pageNumbers.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setCurrentPage(p)}
              className={`w-10 h-10 rounded-xl border font-extrabold ${
                p === currentPage
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          ));
        })()}

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          className={`px-3 py-2 rounded-xl border ${
            currentPage === totalPages
              ? "text-slate-300 border-slate-200 cursor-not-allowed"
              : "text-slate-700 border-slate-200 hover:bg-slate-50"
          }`}
        >
          Next
        </button>

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(totalPages)}
          className={`px-3 py-2 rounded-xl border ${
            currentPage === totalPages
              ? "text-slate-300 border-slate-200 cursor-not-allowed"
              : "text-slate-700 border-slate-200 hover:bg-slate-50"
          }`}
        >
          Last
        </button>
      </div>

      {/* Back */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleBack}
          className="h-10 px-6 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-[12px] font-extrabold transition"
        >
          Back
        </button>
      </div>
    </div>
  );
}
