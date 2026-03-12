import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const PISTACHIO = "#93C572";

const CARD =
  "rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 " +
  "shadow-[0_1px_0_rgba(0,0,0,0.03),0_18px_50px_rgba(15,23,42,0.06)] overflow-hidden";

function CardHeader({ title, subtitle }) {
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
    </div>
  );
}

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_BASE_URL || "";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
  });

  let data = null;
  try {
    data = await res.json();
  } catch {}

  if (!res.ok) {
    const msg = data?.message || data?.error || "Request failed";
    throw new Error(msg);
  }
  return data;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function maxDate(a, b) {
  if (!a) return b || null;
  if (!b) return a || null;
  return a.getTime() >= b.getTime() ? a : b;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toUiDateTimeObj(dateLike) {
  if (!dateLike) return null;
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return null;

  const dd = pad2(d.getDate());
  const mm = pad2(d.getMonth() + 1);
  const yyyy = d.getFullYear();

  const h24 = d.getHours();
  const min = pad2(d.getMinutes());

  const meridiem = h24 >= 12 ? "PM" : "AM";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;

  const hh = pad2(h12);

  return {
    date: `${dd}/${mm}/${yyyy}`,
    time: `${hh}:${min}`,
    meridiem,
  };
}

function formatDateInput(raw) {
  const digits = String(raw || "")
    .replace(/\D/g, "")
    .slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function formatTimeInput(raw) {
  const digits = String(raw || "")
    .replace(/\D/g, "")
    .slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function isCompleteDate(dateStr) {
  return typeof dateStr === "string" && dateStr.length === 10;
}
function isCompleteTime(timeStr) {
  return typeof timeStr === "string" && timeStr.length === 5;
}

function parseDateOnly(dateStr) {
  if (!isCompleteDate(dateStr)) return null;
  const [ddS, mmS, yyyyS] = dateStr.split("/");
  const dd = Number(ddS);
  const mm = Number(mmS);
  const yyyy = Number(yyyyS);

  if (
    yyyyS.length !== 4 ||
    !Number.isFinite(dd) ||
    !Number.isFinite(mm) ||
    !Number.isFinite(yyyy)
  ) {
    return null;
  }

  if (dd < 1 || dd > 31) return null;
  if (mm < 1 || mm > 12) return null;

  const d = new Date(yyyy, mm - 1, dd, 0, 0, 0, 0);

  if (
    d.getFullYear() !== yyyy ||
    d.getMonth() !== mm - 1 ||
    d.getDate() !== dd
  ) {
    return null;
  }

  return d;
}

function parseDateTime(val) {
  if (!val) return null;

  const dateStr = val.date || "";
  const timeStr = val.time || "";
  const meridiem = (val.meridiem || "AM").toUpperCase();

  if (!isCompleteDate(dateStr) || !isCompleteTime(timeStr)) return null;

  const dateOnly = parseDateOnly(dateStr);
  if (!dateOnly) return null;

  const [hhS, minS] = timeStr.split(":");
  let hh = Number(hhS);
  const min = Number(minS);

  if (!Number.isFinite(hh) || !Number.isFinite(min)) return null;
  if (min < 0 || min > 59) return null;
  if (hh < 1 || hh > 12) return null;

  hh = hh % 12;
  if (meridiem === "PM") hh += 12;

  return new Date(
    dateOnly.getFullYear(),
    dateOnly.getMonth(),
    dateOnly.getDate(),
    hh,
    min,
    0,
    0,
  );
}

function formatDurationDays(ms) {
  if (!Number.isFinite(ms) || ms < 0) return "—";

  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const remMinAfterDays = totalMinutes - days * 60 * 24;
  const hours = Math.floor(remMinAfterDays / 60);
  const minutes = remMinAfterDays % 60;

  if (days > 0)
    return `${days} day${days === 1 ? "" : "s"} ${hours}h ${minutes}m`;
  return `${hours}h ${minutes}m`;
}

function TimeInputCell({ value, onChange, disabled = false }) {
  const time = value?.time || "";
  const meridiem = value?.meridiem || "AM";

  return (
    <div className="flex items-center justify-center gap-2">
      <input
        type="text"
        inputMode="numeric"
        placeholder="HH:MM"
        value={time}
        maxLength={5}
        disabled={disabled}
        onChange={(e) => {
          const formatted = formatTimeInput(e.target.value);
          onChange({ time: formatted, meridiem });
        }}
        className={`
          h-9 w-24 px-3 rounded-xl
          border border-slate-200/70 dark:border-slate-700/60
          bg-white dark:bg-slate-800/40
          text-[12px] font-semibold text-slate-800 dark:text-slate-100
          outline-none focus:ring-2 focus:ring-[#93C572]/25
          placeholder:text-slate-400 text-center
          ${disabled ? "opacity-60 cursor-not-allowed" : ""}
        `}
      />

      <select
        value={meridiem}
        disabled={disabled}
        onChange={(e) => onChange({ time, meridiem: e.target.value })}
        className={`
          h-9 w-18 px-2 rounded-xl
          border border-slate-200/70 dark:border-slate-700/60
          bg-white dark:bg-slate-800/40
          text-[12px] font-bold text-slate-800 dark:text-slate-100
          outline-none focus:ring-2 focus:ring-[#93C572]/25
          text-center
          ${disabled ? "opacity-60 cursor-not-allowed" : ""}
        `}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}

function DateTimeCell({ value, onChange, minDateObj, showError, errorText }) {
  const date = value?.date || "";
  const time = value?.time || "";
  const meridiem = value?.meridiem || "AM";
  const dateComplete = isCompleteDate(date);

  const dateIsBeforeMin = (() => {
    if (!minDateObj) return false;
    const picked = parseDateOnly(date);
    if (!picked) return false;

    const minOnly = new Date(
      minDateObj.getFullYear(),
      minDateObj.getMonth(),
      minDateObj.getDate(),
      0,
      0,
      0,
      0,
    );

    return picked.getTime() < minOnly.getTime();
  })();

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex items-center justify-center gap-3">
        <input
          type="text"
          inputMode="numeric"
          placeholder="DD/MM/YYYY"
          value={date}
          maxLength={10}
          onChange={(e) => {
            const formatted = formatDateInput(e.target.value);
            onChange({ date: formatted, time, meridiem });
          }}
          className={`
            h-9 w-32 px-3 rounded-xl
            border border-slate-200/70 dark:border-slate-700/60
            bg-white dark:bg-slate-800/40
            text-[12px] font-semibold text-slate-800 dark:text-slate-100
            outline-none focus:ring-2 focus:ring-[#93C572]/25
            placeholder:text-slate-400 text-center
            ${dateIsBeforeMin ? "border-rose-300 dark:border-rose-500/40" : ""}
          `}
        />

        {dateComplete ? (
          <TimeInputCell
            value={{ time, meridiem }}
            onChange={(t) =>
              onChange({ date, time: t.time, meridiem: t.meridiem })
            }
            disabled={false}
          />
        ) : (
          <div className="h-9 w-44 rounded-xl border border-dashed border-slate-200/70 dark:border-slate-700/60 bg-slate-50/40 dark:bg-slate-800/20 flex items-center justify-center">
            <span className="text-[11px] font-semibold text-slate-400">
              Enter date to add time
            </span>
          </div>
        )}
      </div>

      {showError && (
        <div className="mt-1 text-[10px] font-bold text-rose-600 text-center">
          {errorText}
        </div>
      )}
    </div>
  );
}

export default function UserLoginLogout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { users } = useSelector((state) => state.users);

  const passed = Array.isArray(location.state?.usersMini)
    ? location.state.usersMini
    : null;
  const todayMin = useMemo(() => startOfDay(new Date()), []);

  const rows = useMemo(() => {
    const base = Array.isArray(users) && users.length ? users : [];
    const source = (base.length ? base : passed || []).filter(
      (u) => String(u?.role || "").toLowerCase() !== "superadmin",
    );

    return [...source].sort((a, b) => {
      const an = `${a.firstName || ""} ${a.lastName || ""}`
        .trim()
        .toLowerCase();
      const bn = `${b.firstName || ""} ${b.lastName || ""}`
        .trim()
        .toLowerCase();
      return an.localeCompare(bn);
    });
  }, [users, passed]);

  const [sessionTimes, setSessionTimes] = useState({});
  const [rowStatus, setRowStatus] = useState({});

  const setLogin = (id, next) => {
    setSessionTimes((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), login: next },
    }));
  };

  const setLogout = (id, next) => {
    setSessionTimes((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), logout: next },
    }));
  };

  const getTotalTime = (id) => {
    const login = parseDateTime(sessionTimes[id]?.login);
    const logout = parseDateTime(sessionTimes[id]?.logout);
    if (!login || !logout) return "—";
    if (logout.getTime() < login.getTime()) return "—";
    return formatDurationDays(logout.getTime() - login.getTime());
  };

  const isLogoutBeforeLogin = (id) => {
    const login = parseDateTime(sessionTimes[id]?.login);
    const logout = parseDateTime(sessionTimes[id]?.logout);
    if (!login || !logout) return false;
    return logout.getTime() < login.getTime();
  };

  const isDateBeforeMinOnly = (dateStr, minObj) => {
    if (!minObj) return false;
    const picked = parseDateOnly(dateStr);
    if (!picked) return false;
    const minOnly = new Date(
      minObj.getFullYear(),
      minObj.getMonth(),
      minObj.getDate(),
      0,
      0,
      0,
      0,
    );
    return picked.getTime() < minOnly.getTime();
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const list = await apiFetch("/api/session-schedules", {
          method: "GET",
        });
        if (!mounted) return;

        setSessionTimes((prev) => {
          const next = { ...prev };

          (Array.isArray(list) ? list : []).forEach((s) => {
            const uid = String(s?.userId?._id || s?.userId || "");
            if (!uid) return;

            if (s?.mode === "LOGIN_LOGOUT") {
              next[uid] = {
                ...(next[uid] || {}),
                login: toUiDateTimeObj(s.loginAt),
                logout: toUiDateTimeObj(s.logoutAt),
              };
            }

            if (s?.mode === "LOGIN_ONLY") {
              next[uid] = {
                ...(next[uid] || {}),
                login: toUiDateTimeObj(s.loginAt),
                logout: null,
              };
            }

            if (s?.mode === "LOGOUT_ONLY") {
              next[uid] = {
                ...(next[uid] || {}),
                login: null,
                logout: toUiDateTimeObj(s.logoutAt),
              };
            }
          });

          return next;
        });
      } catch (e) {
        console.warn("Failed to load schedules:", e?.message || e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const saveScheduleForUser = async (userId) => {
  setRowStatus((p) => ({
    ...p,
    [userId]: { saving: true, okMsg: "", errMsg: "" },
  }));

  try {
    const login = sessionTimes[userId]?.login;
    const logout = sessionTimes[userId]?.logout;

    const loginDT = parseDateTime(login);
    const logoutDT = parseDateTime(logout);

    // ✅ auto decide mode
    let mode = null;
    if (loginDT && logoutDT) mode = "LOGIN_LOGOUT";
    else if (loginDT) mode = "LOGIN_ONLY";
    else if (logoutDT) mode = "LOGOUT_ONLY";

    if (!mode) {
      throw new Error("Please enter at least Login or Logout date+time.");
    }

    if (mode === "LOGIN_LOGOUT" && logoutDT.getTime() < loginDT.getTime()) {
      throw new Error("Logout cannot be before Login.");
    }

    const body = { userId, mode, note: "" };

    if (mode === "LOGIN_ONLY" || mode === "LOGIN_LOGOUT") body.login = login;
    if (mode === "LOGOUT_ONLY" || mode === "LOGIN_LOGOUT") body.logout = logout;

    await apiFetch("/api/session-schedules/upsert", {
      method: "POST",
      body: JSON.stringify(body),
    });

    setRowStatus((p) => ({
      ...p,
      [userId]: { saving: false, okMsg: "Saved ✅", errMsg: "" },
    }));
  } catch (e) {
    setRowStatus((p) => ({
      ...p,
      [userId]: { saving: false, okMsg: "", errMsg: e?.message || "Failed" },
    }));
  }
};
  const clearScheduleForUser = async (userId) => {
    setRowStatus((p) => ({
      ...p,
      [userId]: { saving: true, okMsg: "", errMsg: "" },
    }));

    try {
      await apiFetch(`/api/session-schedules/cleanup/${userId}`, {
        method: "DELETE",
      });

      setSessionTimes((prev) => {
        const next = { ...prev };
        next[userId] = { ...(next[userId] || {}), login: null, logout: null };
        return next;
      });

      setRowStatus((p) => ({
        ...p,
        [userId]: { saving: false, okMsg: "Cleared ✅", errMsg: "" },
      }));
    } catch (e) {
      setRowStatus((p) => ({
        ...p,
        [userId]: { saving: false, okMsg: "", errMsg: e?.message || "Failed" },
      }));
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className={CARD}>
        <CardHeader title="Sessions User Login / Logout" />

        <div className="p-6 sm:p-7">
          <div className="mb-3 text-[12px] font-extrabold text-slate-500 dark:text-slate-400">
            Total: {rows.length}
          </div>

          <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
            <div className="overflow-auto">
              <table className="w-full text-[12px] border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-200">
                  <tr>
                    <th className="border border-slate-200/70 dark:border-slate-800 px-2 py-2 text-center font-extrabold whitespace-nowrap w-14">
                      S.No
                    </th>

                    <th className="border border-slate-200/70 dark:border-slate-800 px-2 py-2 text-center font-extrabold whitespace-nowrap w-52">
                      User Name
                    </th>

                    <th className="border border-slate-200/70 dark:border-slate-800 px-2 py-2 text-center font-extrabold whitespace-nowrap w-32">
                      Roles
                    </th>

                    <th className="border border-slate-200/70 dark:border-slate-800 px-3 py-2 text-center font-extrabold whitespace-nowrap w-96">
                      Login
                    </th>

                    <th className="border border-slate-200/70 dark:border-slate-800 px-3 py-2 text-center font-extrabold whitespace-nowrap w-96">
                      Logout
                    </th>

                    <th className="border border-slate-200/70 dark:border-slate-800 px-3 py-2 text-center font-extrabold whitespace-nowrap w-44">
                      Total Time
                    </th>

                    <th className="border border-slate-200/70 dark:border-slate-800 px-3 py-2 text-center font-extrabold whitespace-nowrap w-56">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="text-slate-700 dark:text-slate-200">
                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="border border-slate-200/70 dark:border-slate-800 px-3 py-10 text-center"
                      >
                        No users found
                      </td>
                    </tr>
                  ) : (
                    rows.map((u, idx) => {
                      const id = u.id || u._id || String(idx);
                      const fullName =
                        `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
                        "—";
                      const roleText = u.role
                        ? String(u.role).toUpperCase()
                        : "—";

                      const loginDT = parseDateTime(sessionTimes[id]?.login);
                      const logoutDT = parseDateTime(sessionTimes[id]?.logout);

                      const loginDateOnly = parseDateOnly(
                        sessionTimes[id]?.login?.date || "",
                      );
                      const logoutMin = maxDate(todayMin, loginDateOnly);

                      const logoutBeforeLogin = isLogoutBeforeLogin(id);
                      const st = rowStatus[id] || {};
                      const saving = !!st.saving;

                      return (
                        <tr
                          key={id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/30"
                        >
                          <td className="border border-slate-200/70 dark:border-slate-800 px-2 py-2 text-center font-extrabold text-slate-900 dark:text-slate-100 w-14">
                            {idx + 1}
                          </td>

                          <td className="border border-slate-200/70 dark:border-slate-800 px-2 py-2 text-center font-extrabold text-slate-900 dark:text-slate-100">
                            {fullName}
                          </td>

                          <td className="border border-slate-200/70 dark:border-slate-800 px-2 py-2 text-center font-medium uppercase">
                            {roleText}
                          </td>

                          {/* LOGIN */}
                          <td className="border border-slate-200/70 dark:border-slate-800 px-3 py-2 text-center">
                            <DateTimeCell
                              value={sessionTimes[id]?.login}
                              onChange={(val) => {
                                if (isCompleteDate(val?.date || "")) {
                                  if (isDateBeforeMinOnly(val.date, todayMin))
                                    return;
                                }
                                setLogin(id, val);
                              }}
                              minDateObj={todayMin}
                              showError={false}
                              errorText=""
                            />
                          </td>

                          {/* LOGOUT */}
                          <td className="border border-slate-200/70 dark:border-slate-800 px-3 py-2 text-center">
                            <DateTimeCell
                              value={sessionTimes[id]?.logout}
                              onChange={(val) => {
                                const next = { ...val };

                                if (isCompleteDate(next?.date || "")) {
                                  if (
                                    logoutMin &&
                                    isDateBeforeMinOnly(next.date, logoutMin)
                                  ) {
                                    return;
                                  }
                                }

                                const nextLogoutDT = parseDateTime(next);
                                const curLoginDT = parseDateTime(
                                  sessionTimes[id]?.login,
                                );

                                if (curLoginDT && nextLogoutDT) {
                                  if (
                                    nextLogoutDT.getTime() <
                                    curLoginDT.getTime()
                                  ) {
                                    return;
                                  }
                                }

                                setLogout(id, next);
                              }}
                              minDateObj={logoutMin}
                              showError={logoutBeforeLogin}
                              errorText="Logout cannot be before Login."
                            />
                          </td>

                          {/* TOTAL TIME */}
                          <td className="border border-slate-200/70 dark:border-slate-800 px-3 py-2 text-center font-extrabold text-slate-900 dark:text-slate-100">
                            {loginDT &&
                            logoutDT &&
                            logoutDT.getTime() >= loginDT.getTime()
                              ? formatDurationDays(
                                  logoutDT.getTime() - loginDT.getTime(),
                                )
                              : getTotalTime(id)}
                          </td>

                          {/* ACTION */}
                          <td className="border border-slate-200/70 dark:border-slate-800 px-3 py-2 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => saveScheduleForUser(id)}
                                  className={`h-9 px-4 rounded-xl text-[12px] font-extrabold transition text-white ${
                                    saving
                                      ? "bg-slate-400 cursor-not-allowed"
                                      : "bg-emerald-600 hover:bg-emerald-700"
                                  }`}
                                >
                                  {saving ? "Saving..." : "Save"}
                                </button>

                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => clearScheduleForUser(id)}
                                  className={`h-9 px-4 rounded-xl text-[12px] font-extrabold transition text-white ${
                                    saving
                                      ? "bg-slate-400 cursor-not-allowed"
                                      : "bg-rose-500 hover:bg-rose-600"
                                  }`}
                                >
                                  Clear
                                </button>
                              </div>

                              {st.okMsg ? (
                                <div className="text-[11px] font-extrabold text-emerald-600">
                                  {st.okMsg}
                                </div>
                              ) : null}

                              {st.errMsg ? (
                                <div className="text-[11px] font-extrabold text-rose-600 text-center max-w-xs">
                                  {st.errMsg}
                                </div>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Back */}
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (location.state?.from === "users") return navigate(-1);
                return navigate("/user");
              }}
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
