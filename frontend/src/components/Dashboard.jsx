import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { getCurrentUser } from "../utils/storage";

import {
  FaUpload,
  FaFileAlt,
  FaUsers,
  FaBuilding,
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaSearch,
} from "react-icons/fa";

import {
  FiPlus,
  FiFileText,
  FiUserPlus,
  FiUsers,
  FiClock,
  FiSettings,
} from "react-icons/fi";

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_BASE_URL || "";
export default function Dashboard({
  currentRole,
  onGoToDepartments,
  onAddDepartment,
  onAddFiles,
  onRegisterUser,
  onUserManagement,
  onGlobalHistory,
  onSettings,
}) {
  const isSuperAdmin = currentRole === "superadmin";
  const isAdmin = currentRole === "admin";
  const isSubAdmin = currentRole === "subadmin";
  const isAdminOrSubAdmin = isAdmin || isSubAdmin;

  const currentUser = getCurrentUser();

  // stats
  const [uploadsToday, setUploadsToday] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [departmentCount, setDepartmentCount] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);

  const [todayActivity, setTodayActivity] = useState({
    created: 0,
    opened: 0,
    updated: 0,
    deleted: 0,
    searched: 0,
  });

  const [overallActivity, setOverallActivity] = useState({
    created: 0,
    opened: 0,
    updated: 0,
    deleted: 0,
    searched: 0,
  });

  const [usersByRole, setUsersByRole] = useState({
    total: 0,
    superadmin: 0,
    admin: 0,
    subadmin: 0,
    user: 0,
  });

  // uploads today
  useEffect(() => {
    const fetchUploadsToday = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/api/drawings/stats/uploads-today`,
          { withCredentials: true },
        );
        if (res.data?.success) setUploadsToday(res.data.uploadsToday || 0);
      } catch (err) {
        console.error("Failed to fetch uploads today", err);
      }
    };
    fetchUploadsToday();
  }, []);

  // total files
  useEffect(() => {
    const fetchTotalFiles = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/api/drawings/stats/total-files`,
          { withCredentials: true },
        );
        if (res.data?.success) setTotalFiles(res.data.totalFiles || 0);
      } catch (err) {
        console.error("Failed to fetch total files", err);
      }
    };
    fetchTotalFiles();
  }, []);

  // department count
  useEffect(() => {
    const fetchDepartmentCount = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/departments/count`, {
          withCredentials: true,
        });
        if (res.data?.success) setDepartmentCount(res.data.count || 0);
      } catch (err) {
        console.error("Failed to fetch department count", err);
      }
    };
    fetchDepartmentCount();
  }, []);

  // total users
  useEffect(() => {
    const fetchTotalUsers = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/users/stats/total-users`, {
          withCredentials: true,
        });
        if (res.data?.success) setTotalUsers(res.data.totalUsers || 0);
      } catch (err) {
        console.error("Failed to fetch total users", err);
      }
    };

    fetchTotalUsers();
    window.addEventListener("users-changed", fetchTotalUsers);
    return () => window.removeEventListener("users-changed", fetchTotalUsers);
  }, []);

  // today activity
  useEffect(() => {
    const fetchTodayActivity = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/activity/stats/today`, {
          withCredentials: true,
        });
        if (res.data?.success) setTodayActivity(res.data.today);
      } catch (err) {
        console.error("Failed to fetch today activity stats", err);
      }
    };

    fetchTodayActivity();
    window.addEventListener("activity-changed", fetchTodayActivity);
    return () =>
      window.removeEventListener("activity-changed", fetchTodayActivity);
  }, []);

  // overall activity
  useEffect(() => {
    const fetchOverallActivity = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/activity/stats/overall`, {
          withCredentials: true,
        });
        if (res.data?.success) setOverallActivity(res.data.overall);
      } catch (err) {
        console.error("Failed to fetch overall activity stats", err);
      }
    };

    fetchOverallActivity();
    window.addEventListener("activity-changed", fetchOverallActivity);
    return () =>
      window.removeEventListener("activity-changed", fetchOverallActivity);
  }, []);

  // users by role
  useEffect(() => {
    const fetchUsersByRole = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/users/stats/by-role`, {
          withCredentials: true,
        });

        if (res.data?.success) {
          setUsersByRole({
            total: res.data.total || 0,
            ...res.data.roles,
          });
        }
      } catch (err) {
        console.error("Failed to fetch users by role", err);
      }
    };

    fetchUsersByRole();
    window.addEventListener("users-changed", fetchUsersByRole);
    return () => window.removeEventListener("users-changed", fetchUsersByRole);
  }, []);

  useEffect(() => {
    const fetchHistoryCount = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/history`, {
          withCredentials: true,
        });

        const total =
          res.data?.totalEvents ?? (res.data?.activityLogs || []).length;
        setHistoryCount(total || 0);
      } catch (err) {
        console.error("Failed to fetch history count", err);
      }
    };

    fetchHistoryCount();
    window.addEventListener("activity-changed", fetchHistoryCount);
    return () =>
      window.removeEventListener("activity-changed", fetchHistoryCount);
  }, []);

  const allocatedDepartmentCount =
    !isSuperAdmin && Array.isArray(currentUser?.departments)
      ? currentUser.departments.length
      : departmentCount;

  const metrics = useMemo(
    () => [
      {
        key: "daily_uploads",
        title: "Daily Uploads",
        value: uploadsToday,
        note: uploadsToday === 0 ? "Syncing..." : "Updated",
        noteDotClass: "bg-violet-400",
        icon: <FaUpload />,
        iconClassName: "text-emerald-600",
        glowClassName: "bg-emerald-100/60 dark:bg-emerald-400/10",
      },
      {
        key: "storage_capacity",
        title: "Total Uploads",
        value: totalFiles,
        note: "File DB",
        noteDotClass: "bg-indigo-400",
        icon: <FaFileAlt />,
        iconClassName: "text-blue-600",
        glowClassName: "bg-blue-100/60 dark:bg-blue-400/10",
      },
      {
        key: "total_personnel",
        title: "Total Personnel",
        value: totalUsers,
        note: "Active Accounts",
        noteDotClass: "bg-indigo-400",
        icon: <FaUsers />,
        iconClassName: "text-violet-600",
        glowClassName: "bg-violet-100/60 dark:bg-violet-400/10",
      },
    ],
    [uploadsToday, totalFiles, totalUsers],
  );

  const canSeeNewDept = isSuperAdmin || isAdmin || isSubAdmin;
  const canSeeRegistryMgmt = isSuperAdmin || isAdmin;
  const actionTiles = useMemo(
    () => [
      {
        key: "departments",
        label: "Departments",
        value: allocatedDepartmentCount,
        icon: <FaBuilding />,
        onClick: onGoToDepartments,
        visible: true,
      },
      {
        key: "add_files",
        label: "Add Files",
        value: totalFiles,
        icon: <FiFileText />,
        onClick: onAddFiles,
        visible: true,
      },
      {
        key: "search_mode",
        label: "Search Files",
        value: (overallActivity.opened || 0) + (overallActivity.searched || 0),
        icon: <FaSearch />,
        onClick: () => onAddFiles?.("search"),
        visible: true,
      },
      {
        key: "new_dept",
        label: "Add Departments",
        value: departmentCount,
        icon: <FiPlus />,
        onClick: canSeeNewDept ? onAddDepartment : undefined,
        disabled: !canSeeNewDept,
        visible: canSeeNewDept,
      },
      {
        key: "registry",
        label: "Register Users",
        value: totalUsers,
        icon: <FiUserPlus />,
        onClick: canSeeRegistryMgmt ? onRegisterUser : undefined,
        disabled: !canSeeRegistryMgmt,
        visible: canSeeRegistryMgmt,
      },
      {
        key: "management",
        label: "Users Management",
        value: totalUsers,
        icon: <FiUsers />,
        onClick: canSeeRegistryMgmt ? onUserManagement : undefined,
        disabled: !canSeeRegistryMgmt,
        visible: canSeeRegistryMgmt,
      },
      {
        key: "history",
        label: "Global History",
        value: historyCount,
        icon: <FiClock />,
        onClick: onGlobalHistory,
        visible: isSuperAdmin,
      },

      {
        key: "settings",
        label: "Settings",
        value: overallActivity.updated,
        icon: <FiSettings />,
        onClick: onSettings,
        visible: true,
      },
    ],
    [
      allocatedDepartmentCount,
      totalFiles,
      totalUsers,
      departmentCount,
      overallActivity.searched,
      overallActivity.opened,
      overallActivity.updated,
      isSuperAdmin,
      canSeeNewDept,
      canSeeRegistryMgmt,
      onGoToDepartments,
      onAddFiles,
      onAddDepartment,
      onRegisterUser,
      onUserManagement,
      onGlobalHistory,
      onSettings,
    ],
  );

  const todayMini = useMemo(
    () => [
      {
        key: "t_searched",
        label: "Searched",
        value: todayActivity.searched,
        icon: <FaSearch />,
        color: "violet",
      },
      {
        key: "t_opened",
        label: "Opened",
        value: todayActivity.opened,
        icon: <FaEye />,
        color: "blue",
      },
      {
        key: "t_created",
        label: "Created",
        value: todayActivity.created,
        icon: <FaPlus />,
        color: "emerald",
      },
      {
        key: "t_updated",
        label: "Updated",
        value: todayActivity.updated,
        icon: <FaEdit />,
        color: "amber",
      },
      {
        key: "t_deleted",
        label: "Deleted",
        value: todayActivity.deleted,
        icon: <FaTrash />,
        color: "rose",
      },
    ],
    [todayActivity],
  );

  const overallMini = useMemo(
    () => [
      {
        key: "o_searched",
        label: "Searched",
        value: overallActivity.searched,
        icon: <FaSearch />,
        color: "violet",
      },
      {
        key: "o_opened",
        label: "Opened",
        value: overallActivity.opened,
        icon: <FaEye />,
        color: "blue",
      },
      {
        key: "o_created",
        label: "Created",
        value: overallActivity.created,
        icon: <FaPlus />,
        color: "emerald",
      },
      {
        key: "o_updated",
        label: "Updated",
        value: overallActivity.updated,
        icon: <FaEdit />,
        color: "amber",
      },
      {
        key: "o_deleted",
        label: "Deleted",
        value: overallActivity.deleted,
        icon: <FaTrash />,
        color: "rose",
      },
    ],
    [overallActivity],
  );

  const rolesList = useMemo(
    () => [
      {
        key: "r_superadmin",
        label: "Super Admin",
        sub: "Priority Access",
        count: usersByRole.superadmin,
        icon: <FaUsers />,
        tone: "violet",
      },
      {
        key: "r_admin",
        label: "Admin",
        sub: "Priority Access",
        count: usersByRole.admin,
        icon: <FaUsers />,
        tone: "blue",
      },
      {
        key: "r_subadmin",
        label: "Sub Admin",
        sub: "Priority Access",
        count: usersByRole.subadmin,
        icon: <FaUsers />,
        tone: "indigo",
      },
      {
        key: "r_user",
        label: "Users",
        sub: "Priority Access",
        count: usersByRole.user,
        icon: <FaUsers />,
        tone: "emerald",
      },
    ],
    [usersByRole],
  );

  return (
    <div className="bg-slate-50 dark:bg-slate-950">
      <main className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 pt-6 pb-10 text-slate-900 dark:text-slate-100">
        {isSuperAdmin && (
          <>
            <SectionHeader title="Priority Metrics" />
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {metrics.map(({ key, ...props }) => (
                <MetricCard key={key} {...props} />
              ))}
            </div>
          </>
        )}

        <div className="mt-10">
          <SectionHeader title="Action Center" />
          <div
            className={`mt-6 grid gap-6 ${
              isAdminOrSubAdmin
                ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-3"
                : "grid-cols-2 md:grid-cols-4 lg:grid-cols-4"
            }`}
          >
            {actionTiles
              .filter((t) => t.visible)
              .map(({ key, ...props }) => (
                <ActionTile
                  key={key}
                  {...props}
                  size={isAdminOrSubAdmin ? "lg" : "md"}
                />
              ))}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
            {isSuperAdmin && (
              <Panel title="Today's Activity Summary" showStatusDot>
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {todayMini.map(({ key, ...props }) => (
                    <MiniStat key={key} {...props} />
                  ))}
                </div>
              </Panel>
            )}

            {isSuperAdmin && (
              <Panel title="Overall Activity Summary">
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {overallMini.map(({ key, ...props }) => (
                    <MiniStat key={key} {...props} />
                  ))}
                </div>
              </Panel>
            )}
          </div>

          {/* ✅ Users by Role: only superadmin */}
          {isSuperAdmin && (
            <div className="rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-[0_1px_0_rgba(0,0,0,0.03),0_18px_50px_rgba(15,23,42,0.06)] overflow-hidden">
              <div className="px-7 py-6 border-b border-slate-200/70 dark:border-slate-800 flex items-center gap-3">
                <span className="w-2 h-7 rounded-full bg-[#93C572]" />
                <h3 className="text-sm font-extrabold tracking-wide uppercase">
                  Users by Role
                </h3>
              </div>

              <div className="p-6 space-y-4">
                {rolesList.map(({ key, ...props }) => (
                  <RoleRow key={key} {...props} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
      <div className="h-px flex-1 bg-slate-200/80 dark:bg-slate-800" />
    </div>
  );
}

function MetricCard({
  title,
  value,
  note,
  noteDotClass = "bg-slate-300",
  icon,
  iconClassName = "text-slate-600",
  glowClassName = "bg-slate-100/60 dark:bg-slate-400/10",
  onClick,
}) {
  const clickable = typeof onClick === "function";

  const iconNode = React.isValidElement(icon)
    ? React.cloneElement(icon, {
        size: icon.props.size ?? 22,
        className: `${icon.props.className ?? ""} ${iconClassName}`,
      })
    : icon;

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={`
        relative overflow-hidden rounded-[28px]
        bg-white dark:bg-slate-900
        border border-slate-200/70 dark:border-slate-800
        shadow-[0_1px_0_rgba(0,0,0,0.03),0_18px_50px_rgba(15,23,42,0.06)]
        p-7 flex items-start justify-between
        transition-all duration-300
        ${
          clickable
            ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_1px_0_rgba(0,0,0,0.03),0_26px_60px_rgba(15,23,42,0.10)]"
            : ""
        }
      `}
    >
      <div
        className={`absolute -right-14 -top-14 w-56 h-56 rounded-full blur-2xl ${glowClassName}`}
      />

      <div className="relative z-10">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-slate-400">
          {title}
        </p>

        <p className="mt-3 text-4xl font-black tracking-tight text-slate-900 dark:text-slate-50">
          {value}
        </p>

        {note && (
          <div className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            <span className={`w-2 h-2 rounded-full ${noteDotClass}`} />
            <span>{note}</span>
          </div>
        )}
      </div>

      <div className="relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 shadow-sm flex items-center justify-center">
          {iconNode}
        </div>
      </div>
    </div>
  );
}

function ActionTile({ icon, value, label, onClick, disabled, size = "md" }) {
  const clickable = !disabled && typeof onClick === "function";

  const iconNode = React.isValidElement(icon)
    ? React.cloneElement(icon, {
        size: icon.props.size ?? 22,
        className: `${icon.props.className ?? ""} text-slate-600 dark:text-slate-200`,
      })
    : icon;

  const glowClassName = "bg-slate-200/50 dark:bg-white/5";
  const isLg = size === "lg";

  const containerSizeClass = isLg ? "px-8 py-7 min-h-[140px]" : "px-6 py-5";
  const valueClass = isLg ? "text-4xl" : "text-3xl";
  const labelClass = isLg
    ? "text-[12px] tracking-[0.30em]"
    : "text-[11px] tracking-[0.28em]";
  const iconBoxClass = isLg ? "w-16 h-16" : "w-14 h-14";

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={`
        relative overflow-hidden rounded-[26px]
        bg-white dark:bg-slate-900
        border border-slate-200/70 dark:border-slate-800
        shadow-[0_1px_0_rgba(0,0,0,0.03),0_14px_40px_rgba(15,23,42,0.06)]
        ${containerSizeClass}
        flex items-center justify-between
        transition-all duration-300
        group
        ${
          clickable
            ? `
              cursor-pointer
              hover:-translate-y-1
              hover:border-slate-300/80 dark:hover:border-slate-700
              hover:shadow-[0_1px_0_rgba(0,0,0,0.03),0_28px_70px_rgba(15,23,42,0.14)]
              active:translate-y-0
            `
            : "opacity-60 cursor-not-allowed"
        }
      `}
    >
      <div
        className={`absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl ${glowClassName} transition-opacity duration-300 ${
          clickable ? "group-hover:opacity-80" : "opacity-50"
        }`}
      />

      <div className="relative z-10 min-w-0">
        <p
          className={`${labelClass} font-extrabold uppercase text-slate-400 truncate`}
        >
          {label}
        </p>

        <p
          className={`mt-2 ${valueClass} font-black tracking-tight text-slate-900 dark:text-slate-50`}
        >
          {value ?? 0}
        </p>
      </div>

      <div className="relative z-10 shrink-0">
        <div
          className={`
            ${iconBoxClass} rounded-2xl
            bg-slate-50 dark:bg-slate-800/60
            border border-slate-200/70 dark:border-slate-700/60
            shadow-sm
            flex items-center justify-center
            transition-all duration-300
            group-hover:shadow-md
            group-hover:scale-[1.04]
          `}
        >
          {iconNode}
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children, showStatusDot }) {
  return (
    <div className="relative rounded-[30px] bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-[0_1px_0_rgba(0,0,0,0.03),0_18px_50px_rgba(15,23,42,0.06)] px-8 py-7">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-extrabold tracking-tight">{title}</h3>
        {showStatusDot && (
          <span className="w-2.5 h-2.5 rounded-full bg-[#93C572]" />
        )}
      </div>
      {children}
    </div>
  );
}

function MiniStat({ icon, label, value, color }) {
  const styles = {
    violet:
      "text-violet-600 bg-violet-50 border-violet-100 dark:text-violet-300 dark:bg-violet-500/5 dark:border-violet-500/15",
    blue: "text-blue-600 bg-blue-50 border-blue-100 dark:text-blue-300 dark:bg-blue-500/5 dark:border-blue-500/15",
    emerald:
      "text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-300 dark:bg-emerald-500/5 dark:border-emerald-500/15",
    amber:
      "text-amber-600 bg-amber-50 border-amber-100 dark:text-amber-300 dark:bg-amber-500/5 dark:border-amber-500/15",
    rose: "text-rose-600 bg-rose-50 border-rose-100 dark:text-rose-300 dark:bg-rose-500/5 dark:border-rose-500/15",
  };

  const iconNode = React.isValidElement(icon)
    ? React.cloneElement(icon, { size: 18 })
    : icon;

  return (
    <div
      className={`
        rounded-[26px] border p-5
        flex flex-col items-center text-center
        transition-all duration-300
        hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]
        ${styles[color]}
      `}
    >
      <div className="w-12 h-12 rounded-2xl bg-white/60 dark:bg-white/5 shadow-sm flex items-center justify-center mb-3">
        {iconNode}
      </div>
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-2 text-[11px] font-extrabold uppercase tracking-[0.28em] opacity-80">
        {label}
      </p>
    </div>
  );
}

function RoleRow({ label, sub, count, icon, tone }) {
  const tones = {
    violet:
      "text-violet-600 bg-violet-50 border-violet-100 dark:text-violet-300 dark:bg-violet-500/5 dark:border-violet-500/15",
    blue: "text-blue-600 bg-blue-50 border-blue-100 dark:text-blue-300 dark:bg-blue-500/5 dark:border-blue-500/15",
    indigo:
      "text-indigo-600 bg-indigo-50 border-indigo-100 dark:text-indigo-300 dark:bg-indigo-500/5 dark:border-indigo-500/15",
    emerald:
      "text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-300 dark:bg-emerald-500/5 dark:border-emerald-500/15",
  };

  const iconNode = React.isValidElement(icon)
    ? React.cloneElement(icon, { size: 18 })
    : icon;

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-[0_1px_0_rgba(0,0,0,0.03),0_10px_25px_rgba(15,23,42,0.06)] px-5 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${tones[tone]}`}
        >
          {iconNode}
        </div>

        <div>
          <p className="text-sm font-extrabold text-slate-900 dark:text-slate-50">
            {label}
          </p>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
            {sub}
          </p>
        </div>
      </div>

      <p className={`text-2xl font-black ${tones[tone].split(" ")[0]}`}>
        {count}
      </p>
    </div>
  );
}
