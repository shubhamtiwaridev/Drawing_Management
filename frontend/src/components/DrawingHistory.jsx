import React, { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "./logos/image.png";
import SearchBox from "../components/SearchBox";

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_BASE_URL || "";

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

const formatAction = (action) => {
  switch (action) {
    case "CREATE_DRAWING":
      return "Created Drawing";
    case "UPDATE_DRAWING":
      return "Updated Drawing";
    case "DELETE_DRAWING":
      return "Deleted Drawing";
    case "ACTIVATE_DRAWING":
      return "Activated Drawing";
    case "DEACTIVATE_DRAWING":
      return "Deactivated Drawing";
    case "SEARCH":
      return "Searched";
    case "OPEN":
      return "Opened File";
    case "DOWNLOAD":
      return "Downloaded File";
    default:
      return action;
  }
};

export default function DrawingHistory() {
  const { drawingId } = useParams();
  const navigate = useNavigate();

  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchBy, setSearchBy] = useState("select");
  const [searchValue, setSearchValue] = useState("");

  const ROWS_PER_PAGE = 18;
  const [currentPage, setCurrentPage] = useState(1);

  const ALLOWED_SEARCH_KEYS = [
    "select",
    "all",
    "email",
    "action",
    "drawing",
    "datetime",
  ];
  const autoPagedRef = useRef(false);

  const filteredLogs = useMemo(() => {
    if (searchBy === "select" || !searchValue) return activityLogs;

    return activityLogs.filter((log) => {
      switch (searchBy) {
        case "all": {
          const q = String(searchValue || "").toLowerCase();
          if (!q) return true;

          const email = log.userId?.email || "";
          const action = formatAction(log.action);
          const rawAction = log.action || "";
          const drawingLike =
            log.metadata?.fileName ||
            log.metadata?.drawingNo ||
            log.metadata?.revisionNo ||
            log.metadata?.query ||
            "";
          const time = formatDateTime(log.createdAt);

          const combined = `
            ${email}
            ${action}
            ${rawAction}
            ${drawingLike}
            ${time}
          `.toLowerCase();

          return combined.includes(q);
        }

        case "email":
          return (log.userId?.email || "")
            .toLowerCase()
            .includes(String(searchValue).toLowerCase());

        case "action":
          return Array.isArray(searchValue)
            ? searchValue.includes(log.action)
            : true;

        case "drawing":
          return (
            log.metadata?.drawingNo ||
            log.metadata?.fileName ||
            log.metadata?.revisionNo ||
            log.metadata?.query ||
            ""
          )
            .toLowerCase()
            .includes(String(searchValue).toLowerCase());

        case "datetime": {
          const {
            fromDate,
            toDate,
            fromTime,
            fromMeridiem,
            toTime,
            toMeridiem,
          } = searchValue || {};

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
  }, [activityLogs, searchBy, searchValue]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLogs.length / ROWS_PER_PAGE),
  );
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const pageRows = filteredLogs.slice(startIndex, startIndex + ROWS_PER_PAGE);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/history/${drawingId}`, {
          withCredentials: true,
        });

        const logs = res.data.activityLogs || [];
        logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setActivityLogs(logs);
      } catch (err) {
        console.error("History load error", err);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [drawingId]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  useEffect(() => {
    if (!loading && activityLogs.length > 0 && !autoPagedRef.current) {
      setCurrentPage(totalPages);
      autoPagedRef.current = true;
    }
  }, [loading, activityLogs.length, totalPages]);

  if (loading) {
    return (
      <div className="p-10 text-center text-sm text-slate-600">
        Loading history...
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-slate-200 rounded-2xl p-4 bg-white">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="h-10" />
          <div>
            <div className="text-sm font-extrabold text-slate-900">
              Drawing History
            </div>
            <div className="text-xs text-slate-500">
              Activity for drawing:{" "}
              <span className="font-bold">{drawingId}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <span className="text-xs font-bold text-slate-700">Search:</span>
            <SearchBox
              searchBy={searchBy}
              searchValue={searchValue}
              allowedKeys={ALLOWED_SEARCH_KEYS}
              onSearchByChange={(val) => {
                if (!ALLOWED_SEARCH_KEYS.includes(val)) {
                  setSearchBy("select");
                  setSearchValue("");
                  setCurrentPage(1);
                  return;
                }
                setSearchBy(val);
                setSearchValue("");
                setCurrentPage(1);
                autoPagedRef.current = true;
              }}
              onSearchValueChange={(val) => {
                setSearchValue(val);
                setCurrentPage(1);
                autoPagedRef.current = true;
              }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 border border-slate-200 rounded-2xl overflow-hidden bg-white">
        <div className="overflow-auto">
          <table className="w-full text-[12px] border-collapse">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="border border-slate-200 px-3 py-2 text-left font-extrabold">
                  User Email
                </th>
                <th className="border border-slate-200 px-3 py-2 text-left font-extrabold">
                  Drawing / File
                </th>
                <th className="border border-slate-200 px-3 py-2 text-left font-extrabold">
                  Action
                </th>
                <th className="border border-slate-200 px-3 py-2 text-left font-extrabold">
                  Time
                </th>
              </tr>
            </thead>

            <tbody className="text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="border border-slate-200 px-3 py-6 text-center"
                  >
                    No history found
                  </td>
                </tr>
              ) : (
                pageRows.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50">
                    <td className="border border-slate-200 px-3 py-2 font-extrabold text-slate-900">
                      {log.userId?.email || "—"}
                    </td>

                    <td className="border border-slate-200 px-3 py-2">
                      {log.metadata?.fileName ||
                        log.metadata?.drawingNo ||
                        log.metadata?.revisionNo ||
                        log.metadata?.query ||
                        "—"}
                    </td>
                    <td className="border border-slate-200 px-3 py-2 font-extrabold text-slate-900">
                      {formatAction(log.action)}
                    </td>

                    <td className="border border-slate-200 px-3 py-2">
                      {formatDateTime(log.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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

      <div className="mt-6 flex justify-center">
        <button
          onClick={() => navigate(-1)}
          className="h-10 px-8 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold"
        >
          Back
        </button>
      </div>
    </div>
  );
}
