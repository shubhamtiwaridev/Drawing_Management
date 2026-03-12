import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../utils/storage";
import {
  fetchUsersCount,
  fetchCustomDepartments,
  toggleProdExpanded,
  setProdExpanded,
  selectDarkMode,
  selectProdExpanded,
  selectUsersCount,
  selectCustomDepartments,
} from "../store/sidebarSlice";

import {
  FiPlus,
  FiFileText,
  FiUserPlus,
  FiUsers,
  FiClock,
  FiSettings,
} from "react-icons/fi";
import { FaFolder } from "react-icons/fa";

export default function Sidebar({
  view,
  setView,
  selectedDeptId,
  setSelectedDeptId,
  departments = [],
}) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux selectors
  const dark = useSelector(selectDarkMode);
  const prodExpanded = useSelector(selectProdExpanded);
  const usersCount = useSelector(selectUsersCount);
  const customDepartments = useSelector(selectCustomDepartments);

  const currentUser = getCurrentUser();
  const rawRole = currentUser?.role || "user";
  const role = rawRole.toString().toLowerCase();
  const isSuperAdmin = role === "superadmin";

  //  USER should see HEADER ONLY (NO SIDEBAR)
  if (role === "user") {
    return null; // ❌ completely hide sidebar
  }

  const userDepartments =
    Array.isArray(currentUser?.departments) &&
    currentUser.departments.length > 0
      ? currentUser.departments
      : currentUser?.department
      ? [currentUser.department]
      : [];

  // Theme change listener
  useEffect(() => {
    const onThemeChange = (e) => {
      const isDark = !!(e && e.detail);
      // Update Redux state if different
      if (isDark !== dark) {
        // We'll handle this through the reducer's action
      }
    };
    window.addEventListener("theme-change", onThemeChange);
    return () => window.removeEventListener("theme-change", onThemeChange);
  }, [dark]);

  // Fetch initial data
  useEffect(() => {
    dispatch(fetchUsersCount());
    dispatch(fetchCustomDepartments());

    // Set up event listeners for data refreshes
    const refreshUsers = () => dispatch(fetchUsersCount());
    const refreshDepartments = () => dispatch(fetchCustomDepartments());

    window.addEventListener("users-changed", refreshUsers);
    window.addEventListener("departments-changed", refreshDepartments);

    return () => {
      window.removeEventListener("users-changed", refreshUsers);
      window.removeEventListener("departments-changed", refreshDepartments);
    };
  }, [dispatch]);

  // Save view and selected department to localStorage
  useEffect(() => {
    localStorage.setItem("ui_view", view);
  }, [view]);

  useEffect(() => {
    localStorage.setItem("selected_dept", selectedDeptId || "");
  }, [selectedDeptId]);

  const pistachio = "#93C572";

  const SidebarButton = ({ id, icon: Icon, children, onClick }) => {
    const active = view === id;

    return (
      <button
        onClick={() => {
          setView(id);
          if (onClick) onClick();
        }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[17px] font-semibold transition
        ${
          active
            ? "bg-green-50 dark:bg-slate-700 border-l-4"
            : "hover:bg-green-50 dark:hover:bg-slate-700/60"
        }`}
        style={{ borderColor: active ? "#93C572" : "transparent" }}
      >
        {Icon && (
          <Icon className="text-[20px] text-slate-600 dark:text-slate-300 shrink-0" />
        )}
        <span className="truncate">{children}</span>
      </button>
    );
  };

  // Merge system + DB departments
  const mergedMap = new Map();

  departments.forEach((d) => {
    mergedMap.set(d.id, { ...d, backendId: d.backendId });
  });

  customDepartments.forEach((d) => {
    const slug = (d.name || "").toLowerCase().replace(/\s+/g, "_");
    if (!slug) return;

    if (!mergedMap.has(slug)) {
      mergedMap.set(slug, {
        id: slug,
        name: d.name || "Unnamed Department",
        backendId: d.id,
        shortCode: d.shortCode,
      });
    } else {
      const existing = mergedMap.get(slug);
      if (!existing.backendId) existing.backendId = d.id;
      if (!existing.shortCode && d.shortCode) existing.shortCode = d.shortCode;
      mergedMap.set(slug, existing);
    }
  });

  const mergedDepartments = Array.from(mergedMap.values());

  const normalizedUserDepartments = userDepartments.map((d) =>
    (d || "").toString().toUpperCase()
  );

  const visibleDepartments = isSuperAdmin
    ? mergedDepartments
    : mergedDepartments.filter((d) => {
        const nameUpper = (d.name || "").toString().toUpperCase();
        const codeUpper = (d.shortCode || "").toString().toUpperCase();
        return (
          normalizedUserDepartments.includes(nameUpper) ||
          (codeUpper && normalizedUserDepartments.includes(codeUpper))
        );
      });

  const handleDepartmentClick = (dept) => {
    setView("product");
    setSelectedDeptId(dept.id);
  };

  const handleProductToggle = () => {
    const next = !prodExpanded;
    dispatch(setProdExpanded(next));
    setView("product");
  };

  return (
    <div className={dark ? "bg-slate-900 text-white" : "bg-white text-black"}>
      <aside className="fixed top-[105px] left-3 bottom-3 w-70 z-30">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg flex flex-col h-full">
          <nav className="px-4 pt-4 pb-4 space-y-4">
            <button
              onClick={handleProductToggle}
              className={`w-full px-4 py-2.5 font-bold rounded-xl flex justify-between items-center text-[16px] tracking-wide
           ${
             view === "product"
               ? "bg-green-50 dark:bg-slate-700"
               : "hover:bg-green-50 dark:hover:bg-slate-700/60"
           } border border-transparent`}
            >
              <span>Departments</span>
              <span className="text-lg text-slate-500 dark:text-slate-300">
                {prodExpanded ? "▴" : "▾"}
              </span>
            </button>

            {prodExpanded && (
              <div
                className="pl-2 pr-2 pt-2 pb-2 space-y-2 rounded-lg dark:bg-slate-800/60
                           max-h-[330px] overflow-y-auto
                           scrollbar-thin
scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700
scrollbar-track-transparent"
              >
                {visibleDepartments.map((dept) => (
                  <div
                    key={dept.id}
                    className="w-full flex items-center justify-between gap-1"
                  >
                    <button
                      onClick={() => handleDepartmentClick(dept)}
                      className="flex-1 flex items-center text-left py-2 text-[16px] rounded-md transition
             hover:bg-white hover:shadow-sm dark:hover:bg-slate-700/80"
                    >
                      {/* Folder Icon */}
                      <FaFolder className="ml-2 mr-2 text-[17px] shrink-0 text-yellow-500 dark:text-yellow-400" />

                      {/* Text highlight area */}
                      <span
                        className={`px-2 py-1 rounded-md truncate ${
                          selectedDeptId === dept.id
                            ? "bg-green-100 text-black font-bold"
                            : ""
                        }`}
                      >
                        {dept.name}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* SUPERADMIN + ADMIN controls area */}
            {(role === "superadmin" ||
              role === "admin" ||
              role === "subadmin") && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 mt-3 space-y-2">
                {(role === "superadmin" || role === "admin") && (
                  <>
                    <SidebarButton id="add_department" icon={FiPlus}>
                      Add Department
                    </SidebarButton>
                  </>
                )}

                {role === "superadmin" && (
                  <>
                    <SidebarButton
                      id="add_files"
                      icon={FiFileText}
                      onClick={() => setSelectedDeptId("")}
                    >
                      Add Files
                    </SidebarButton>
                    <SidebarButton id="register" icon={FiUserPlus}>
                      Registration Form
                    </SidebarButton>
                    <SidebarButton id="user" icon={FiUsers}>
                      User Management
                    </SidebarButton>
                  </>
                )}

                {(role === "admin" || role === "subadmin") && (
                  <SidebarButton
                    id="add_files"
                    onClick={() => setSelectedDeptId("")}
                  >
                    Add Files
                  </SidebarButton>
                )}
              </div>
            )}

            {/* GLOBAL HISTORY (ADMIN + SUPERADMIN ONLY) */}
            {(role === "superadmin" || role === "admin") && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
                <SidebarButton
                  id="history"
                  icon={FiClock}
                  onClick={() => navigate("/history")}
                >
                  Global History
                </SidebarButton>
              </div>
            )}

            <div className=" border-slate-200 dark:border-slate-700 space-y-2">
              <SidebarButton id="settings" icon={FiSettings}>
                Settings
              </SidebarButton>
            </div>
          </nav>
        </div>
      </aside>
    </div>
  );
}
