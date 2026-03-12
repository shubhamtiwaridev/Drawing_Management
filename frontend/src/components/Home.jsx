import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Header from "./Header";
import Sidebar from "./Sidebar";
import ProductDepartment from "./ProductDepartment";
import AddDepartment from "./AddDepartment";
import RegisterUser from "./registrationprocess/RegisterUser";
import Users from "./registrationprocess/User";
import Setting from "./Setting";
import { setCurrentUser, getCurrentUser, loadTheme } from "../utils/storage";
import { mapDepartmentToId } from "../utils/deptMap";
import AddFiles from "./AddDrawing";
import axios from "axios";
import UserCentralSearch from "./UserCentralSearch";
import Dashboard from "./Dashboard";

export default function Home() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const role = user?.role || "user";
  const normalizedRole = role.toString().toLowerCase();

  const isUser = normalizedRole === "user";
  const isAdmin = normalizedRole === "admin";
  const isSubAdmin = normalizedRole === "subadmin";
  const isSuperAdmin = normalizedRole === "superadmin";

  const [addFilesMode, setAddFilesMode] = useState("add");

  const userDepartments = Array.isArray(user?.departments)
    ? user.departments
    : user?.department
      ? [user.department]
      : [];

  const primaryDeptId = userDepartments.length
    ? mapDepartmentToId(userDepartments[0])
    : "";

  const [view, setView] = useState(() => {
    if (isSuperAdmin || isAdmin || isSubAdmin) return "dashboard";
    return localStorage.getItem("ui_view") || "product";
  });

  const [selectedDeptIdState, setSelectedDeptIdState] = useState(() => {
    if (role === "superadmin")
      return localStorage.getItem("selected_dept") || "";
    return primaryDeptId || "";
  });

  useEffect(() => {
    const isDark = loadTheme();
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  useEffect(() => {
    const handleThemeChange = (e) => {
      const isDark = !!e.detail;
      document.documentElement.classList.toggle("dark", isDark);
    };

    window.addEventListener("theme-change", handleThemeChange);
    return () => window.removeEventListener("theme-change", handleThemeChange);
  }, []);

  const setSelectedDeptId = (deptId) => {
    setSelectedDeptIdState(deptId);
    localStorage.setItem("selected_dept", deptId || "");
  };

  const selectedDeptId = selectedDeptIdState;

  const logout = async () => {
    await axios
      .post("/api/auth/logout", {}, { withCredentials: true })
      .catch(() => {});
    setCurrentUser(null);
    localStorage.clear();
    navigate("/");
  };

  const handleBackToDashboard = () => {
    setSelectedDeptId("");
    setView("dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Header />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {false && (
          <Sidebar
            view={view}
            setView={setView}
            selectedDeptId={selectedDeptId}
            setSelectedDeptId={setSelectedDeptId}
          />
        )}

        <div className="flex-1 min-h-0 overflow-y-auto pt-24 sm:pt-24">
          {isUser && (
            <div className="min-h-[calc(100vh-96px)] flex items-center justify-center px-4">
              <UserCentralSearch />
            </div>
          )}

          {(isSuperAdmin || isAdmin || isSubAdmin) && view === "dashboard" && (
            <Dashboard
              currentRole={normalizedRole}
              onGoToDepartments={() => setView("product")}
              onAddDepartment={() => setView("add_department")}
              onAddFiles={(mode = "add") => {
                setSelectedDeptId("");
                setAddFilesMode(mode);
                setView("add_files");
              }}
              onRegisterUser={() => setView("register")}
              onUserManagement={() => setView("user")}
              onGlobalHistory={() => navigate("/history")}
              onSettings={() => setView("settings")}
            />
          )}

          {!isUser && view !== "dashboard" && (
            <div className="w-full px-2 sm:px-3 lg:px-4 py-6">
              {view === "product" && (
                <ProductDepartment
                  role={role}
                  assignedDepartments={userDepartments}
                  selectedDeptId={selectedDeptId}
                  onBack={handleBackToDashboard}
                  onSelectDepartment={setSelectedDeptId}
                />
              )}

              {(role === "superadmin" || role === "admin") &&
                view === "register" && (
                  <RegisterUser onBack={() => setView("dashboard")} />
                )}

              {(role === "superadmin" || role === "admin") &&
                view === "user" && (
                  <Users onBack={() => setView("dashboard")} />
                )}

              {(role === "superadmin" ||
                role === "admin" ||
                role === "subadmin") &&
                view === "add_department" && (
                  <AddDepartment
                    onBack={() => {
                      localStorage.removeItem("ui_view");
                      setView("dashboard");
                    }}
                  />
                )}

              {(role === "superadmin" ||
                role === "admin" ||
                role === "subadmin") &&
                view === "add_files" && (
                  <AddFiles
                    mode={addFilesMode}
                    deptId={selectedDeptId}
                    onBack={() => {
                      localStorage.removeItem("ui_view");
                      setAddFilesMode("add");
                      setView("dashboard");
                    }}
                  />
                )}

              {view === "settings" && (
                <Setting
                  onLogout={logout}
                  onBack={() => setView("dashboard")}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
