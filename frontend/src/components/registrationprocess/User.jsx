// Users.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MdEmail, MdBadge } from "react-icons/md";
import { FaChevronDown, FaChevronUp, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { FaTable } from "react-icons/fa";
import { getCurrentUser } from "../../utils/storage";

import {
  fetchUsers,
  updateUser,
  deleteUser,
  fetchDepartmentsForUsers,
  setSearch,
  setFilterRole,
  setMessage,
  updateEditField,
  setEditForm,
  resetEditForm,
} from "../../store/usersSlice";
import { fetchDepartments } from "../../store/departmentSlice";

const PISTACHIO_COLOR = "#93C572";

const CARD =
  "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm";

const BTN_DANGER =
  "px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold transition";

const EDIT_CARD =
  "rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-[0_1px_0_rgba(0,0,0,0.03),0_18px_50px_rgba(15,23,42,0.06)] overflow-hidden";

const EDIT_HEADER =
  "px-7 py-6 border-b border-slate-200/70 dark:border-slate-800 flex items-start justify-between gap-4";

const LABEL =
  "block mb-1 text-[12px] font-bold text-slate-700 dark:text-slate-200";

const EDIT_INPUT =
  "w-full h-11 px-4 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 text-[13px] font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#93C572]/25 placeholder:text-slate-400";

const SUMMARY_PILL =
  "px-3 py-1 rounded-full border border-slate-200/70 dark:border-slate-700/60 " +
  "bg-white/70 dark:bg-slate-900/50 text-[12px] font-semibold text-slate-700 dark:text-slate-100";

const SELECTED_SUMMARY_BOX =
  "rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 p-5";

const digitsOnly = (s = "") => (s || "").replace(/\D/g, "");

function BtnPrimary({ children, ...props }) {
  return (
    <button
      {...props}
      className={[
        "h-11 px-8 rounded-2xl text-sm font-extrabold text-white",
        "shadow-sm transition",
        "hover:-translate-y-0.5 hover:shadow-md active:translate-y-0",
        "disabled:opacity-60 disabled:cursor-not-allowed",
      ].join(" ")}
      style={{ backgroundColor: PISTACHIO_COLOR }}
    >
      {children}
    </button>
  );
}

function BtnOutline({ children, ...props }) {
  return (
    <button
      {...props}
      className={[
        "h-11 px-6 rounded-2xl text-sm font-extrabold",
        "border border-slate-200/70 dark:border-slate-700/60",
        "bg-white dark:bg-slate-900",
        "text-slate-700 dark:text-slate-100",
        "hover:bg-slate-50 dark:hover:bg-slate-800/60",
        "transition active:scale-[0.98]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function RoleBadge({ role }) {
  const cls = (() => {
    switch ((role || "").toLowerCase()) {
      case "superadmin":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:border-rose-500/20";
      case "admin":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-200 dark:border-blue-500/20";
      case "subadmin":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/20";
      case "user":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:border-emerald-500/20";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700";
    }
  })();

  if (!role) return null;

  return (
    <span
      className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold border ${cls}`}
    >
      {String(role).toUpperCase()}
    </span>
  );
}

export default function Users({ onBack }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const currentUser = getCurrentUser();
  const viewerRole = (currentUser?.role || "").toLowerCase();
  const isAdminViewer = viewerRole === "admin";
  const canEditUsers = ["superadmin", "admin", "subadmin"].includes(viewerRole);
  const canDeleteUsers = viewerRole === "superadmin";

  const handleBackClick = () => {
    if (typeof onBack === "function") return onBack();
    navigate(-1);
  };

  const {
    users,
    loading,
    search,
    editingId,
    message,
    deptShortcuts,
    filterRole,
    editForm,
  } = useSelector((state) => state.users);

  const { departments } = useSelector((state) => state.departments);
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
  const [deptSearch, setDeptSearch] = useState("");
  const [openDeptCardId, setOpenDeptCardId] = useState(null);
  const editDeptBoxRef = useRef(null);

  const editingUser = useMemo(
    () => users.find((u) => u.id === editingId) || null,
    [users, editingId],
  );

  const editRole = String(editingUser?.role || "user").toLowerCase();
  const isSuperAdminEdit = editRole === "superadmin";
  const isUserEdit = editRole === "user";

  useEffect(() => {
    if (!isAdminViewer) return;
    if (
      editingUser &&
      (editingUser.role || "").toLowerCase() === "superadmin"
    ) {
      dispatch(resetEditForm());
      setDeptDropdownOpen(false);
      setDeptSearch("");
    }
  }, [isAdminViewer, editingUser, dispatch]);

  useEffect(() => {
    if (!editingUser) return;
    if ((editingUser.role || "").toLowerCase() === "superadmin") {
      dispatch(updateEditField({ field: "department", value: "" }));
      setDeptDropdownOpen(false);
      setDeptSearch("");
    }
  }, [editingUser, dispatch]);

  useEffect(() => {
    if (!deptDropdownOpen) return;

    const onDown = (e) => {
      if (!editDeptBoxRef.current) return;
      if (!editDeptBoxRef.current.contains(e.target))
        setDeptDropdownOpen(false);
    };

    const onKey = (e) => {
      if (e.key === "Escape") setDeptDropdownOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [deptDropdownOpen]);

  useEffect(() => {
    dispatch(fetchDepartmentsForUsers());
    dispatch(fetchDepartments());

    const handleUsersChanged = () => {
      const roleToFetch =
        isAdminViewer && filterRole === "superadmin" ? "all" : filterRole;
      dispatch(fetchUsers(roleToFetch));
    };

    const handleDepartmentsChanged = () => {
      dispatch(fetchDepartmentsForUsers());
      dispatch(fetchDepartments());
    };

    window.addEventListener("users-changed", handleUsersChanged);
    window.addEventListener("departments-changed", handleDepartmentsChanged);

    return () => {
      window.removeEventListener("users-changed", handleUsersChanged);
      window.removeEventListener(
        "departments-changed",
        handleDepartmentsChanged,
      );
    };
  }, [dispatch, filterRole, isAdminViewer]);

  useEffect(() => {
    const roleToFetch =
      isAdminViewer && filterRole === "superadmin" ? "all" : filterRole;
    if (roleToFetch) dispatch(fetchUsers(roleToFetch));
  }, [dispatch, filterRole, isAdminViewer]);

  useEffect(() => {
    if (isAdminViewer && filterRole === "superadmin") {
      dispatch(setFilterRole("all"));
    }
  }, [isAdminViewer, filterRole, dispatch]);

  const validatePassword = (_pass) => null;

  const first = editForm?.first || "";
  const last = editForm?.last || "";
  const email = editForm?.email || "";
  const empId = editForm?.empId || "";
  const password = editForm?.password || "";
  const department = editForm?.department || "";

  const handleEditFieldChange = (field, value) => {
    dispatch(updateEditField({ field, value }));
  };

  const handleEmpIdChange = (value) =>
    handleEditFieldChange("empId", digitsOnly(value).slice(0, 3));

  const departmentOptions = useMemo(() => {
    const deptOptions = (departments || [])
      .filter((d) => d?.name)
      .map((dept) => ({
        value: dept.name,
        label: dept.name,
        shortCode: dept.shortCode,
      }));

    const shortcutOptions = Object.keys(deptShortcuts || {}).map((name) => ({
      value: name,
      label: name,
      shortCode: deptShortcuts[name],
    }));

    const allOptions = [...deptOptions, ...shortcutOptions];
    const seen = new Set();
    const unique = [];

    for (const opt of allOptions) {
      if (!opt?.value) continue;
      if (!seen.has(opt.value)) {
        seen.add(opt.value);
        unique.push(opt);
      }
    }

    return unique.sort((a, b) => a.label.localeCompare(b.label));
  }, [departments, deptShortcuts]);

  const filteredDeptOptions = useMemo(() => {
    const q = deptSearch.trim().toLowerCase();
    if (!q) return departmentOptions;
    return departmentOptions.filter((opt) => {
      const label = (opt.label || "").toLowerCase();
      const code = (opt.shortCode || "").toString().toLowerCase();
      return label.includes(q) || (code && code.includes(q));
    });
  }, [deptSearch, departmentOptions]);

  const getSelectedDepartmentsArray = () => {
    if (!department) return [];
    return String(department)
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);
  };

  const toggleDepartment = (deptName) => {
    const current = getSelectedDepartmentsArray();
    const isSelected = current.includes(deptName);
    const next = isSelected
      ? current.filter((d) => d !== deptName)
      : [...current, deptName];
    handleEditFieldChange("department", next.join(", "));
  };

  const validate = () => {
    if (!first.trim()) return "First name is required.";
    if (!last.trim()) return "Last name is required.";

    const emailTrim = String(email || "").trim();
    if (!isUserEdit) {
      if (!/^\S+@\S+\.\S+$/.test(emailTrim))
        return "Please enter a valid email address.";
    } else {
      if (emailTrim && !/^\S+@\S+\.\S+$/.test(emailTrim))
        return "Please enter a valid email address.";
    }

    if (!isSuperAdminEdit) {
      const id = digitsOnly(empId);
      if (id.length !== 3) return "Employee ID must be exactly 3 digits.";
      const selectedDepts = getSelectedDepartmentsArray();
      if (selectedDepts.length === 0)
        return "At least one department must be selected.";
    }

    const passwordError = validatePassword(password);
    if (passwordError) return passwordError;

    return null;
  };

  const startEdit = (user) => {
    if (!canEditUsers) return;

    if (isAdminViewer && (user?.role || "").toLowerCase() === "superadmin")
      return;

    dispatch(setEditForm(user));
    dispatch(
      updateEditField({ field: "email", value: String(user?.email || "") }),
    );
    dispatch(updateEditField({ field: "password", value: "" }));

    if ((user?.role || "").toLowerCase() !== "superadmin") {
      const deps = Array.isArray(user?.departments) ? user.departments : [];
      dispatch(
        updateEditField({ field: "department", value: deps.join(", ") }),
      );
    } else {
      dispatch(updateEditField({ field: "department", value: "" }));
    }

    setOpenDeptCardId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const applyEdit = async (e) => {
    e.preventDefault();
    dispatch(setMessage(""));

    if (!canEditUsers) return;
    if (!editingUser) return;

    if (isAdminViewer && isSuperAdminEdit) return;

    const currentSelectedSorted = [...getSelectedDepartmentsArray()].sort();
    const originalSorted = [...(editingUser.departments || [])].sort();

    const hasChanges =
      first.trim() !== String(editingUser.firstName || "") ||
      last.trim() !== String(editingUser.lastName || "") ||
      String(email || "")
        .trim()
        .toLowerCase() !==
        String(editingUser.email || "")
          .trim()
          .toLowerCase() ||
      digitsOnly(empId) !== digitsOnly(editingUser.employeeId || "") ||
      (password && password.trim().length > 0) ||
      (!isSuperAdminEdit &&
        JSON.stringify(currentSelectedSorted) !==
          JSON.stringify(originalSorted));

    if (!hasChanges) {
      dispatch(
        setMessage(
          "No changes detected. Please modify at least one field before applying.",
        ),
      );
      return;
    }

    const err = validate();
    if (err) {
      dispatch(setMessage(err));
      return;
    }

    const emailNormalized = String(email || "")
      .trim()
      .toLowerCase();
    const shouldCheckEmail = isUserEdit ? null : emailNormalized;
    const empToCheck = !isSuperAdminEdit ? digitsOnly(empId) : "";
    let conflictReason = "";
    const conflictUser = users.find((u) => {
      if (u.id === editingId) return false;

      const uEmail = String(u.email || "")
        .trim()
        .toLowerCase();
      if (shouldCheckEmail && uEmail === shouldCheckEmail) {
        conflictReason = "email";
        return true;
      }

      if (empToCheck && empToCheck.length === 3) {
        const uEmp = digitsOnly(u.employeeId || "");
        if (uEmp === empToCheck) {
          conflictReason = "employeeId";
          return true;
        }
      }

      return false;
    });

    if (conflictUser) {
      dispatch(
        setMessage(
          conflictReason === "email"
            ? "This email is already assigned to another user."
            : "This Employee ID is already assigned to another user.",
        ),
      );
      return;
    }

    const payload = {
      firstName: first.trim(),
      lastName: last.trim(),
    };

    if (!isSuperAdminEdit) {
      payload.employeeId = digitsOnly(empId).padStart(3, "0");
    }

    if (!isUserEdit) {
      payload.email = emailNormalized;
    }

    if (password && password.trim()) payload.password = password;

    if (!isSuperAdminEdit) {
      const deps = getSelectedDepartmentsArray();
      payload.departments = deps;
      payload.department = deps[0] || undefined;
    }

    try {
      await dispatch(updateUser({ id: editingId, userData: payload })).unwrap();
      dispatch(setMessage("User updated successfully."));
      window.dispatchEvent(new Event("users-changed"));
      setDeptDropdownOpen(false);
    } catch {
      dispatch(setMessage("Update failed. Please try again."));
    }
  };

  const cancelEdit = () => {
    dispatch(resetEditForm());
    setDeptDropdownOpen(false);
    setDeptSearch("");
  };

  const handleDeleteUser = async (id, userObj) => {
    if (!canDeleteUsers) return;

    const name =
      `${userObj?.firstName || ""} ${userObj?.lastName || ""}`.trim();
    if (!confirm(`Delete this user permanently?${name ? `\n\n${name}` : ""}`))
      return;

    try {
      await dispatch(deleteUser(id)).unwrap();
      window.dispatchEvent(new Event("users-changed"));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleToggleDisabled = async (userObj) => {
    if (!canEditUsers) return;

    const targetRole = String(userObj?.role || "").toLowerCase();

    if (targetRole === "superadmin" && viewerRole !== "superadmin") return;

    if (userObj?.id === currentUser?.id) {
      alert("You cannot disable your own account.");
      return;
    }

    const nextDisabled = !userObj.disabled;
    try {
      await dispatch(
        updateUser({ id: userObj.id, userData: { disabled: nextDisabled } }),
      ).unwrap();
      window.dispatchEvent(new Event("users-changed"));
    } catch (error) {
      console.error("Toggle disabled failed:", error);
    }
  };

  const visibleUsers = useMemo(() => {
    const baseUsers = isAdminViewer
      ? users.filter((u) => (u.role || "").toLowerCase() !== "superadmin")
      : users;

    if (!search.trim()) return baseUsers;

    const q = search.toLowerCase();
    return baseUsers.filter((u) => {
      const firstMatch = (u.firstName || "").toLowerCase().includes(q);
      const lastMatch = (u.lastName || "").toLowerCase().includes(q);
      const emailMatch = (u.email || "").toLowerCase().includes(q);
      const empMatch = (u.employeeId || "").toLowerCase().includes(q);
      return firstMatch || lastMatch || emailMatch || empMatch;
    });
  }, [users, search, isAdminViewer]);

  const roleLabel = (r) => String(r || "").toLowerCase();

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Top bar */}
      <div
        className={`${CARD} mb-4 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4`}
      >
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Users
          </h1>
        </div>

        <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="w-full sm:w-72 flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3">
            <input
              value={search}
              onChange={(e) => dispatch(setSearch(e.target.value))}
              placeholder="Search users..."
              className="flex-1 text-sm bg-transparent outline-none py-2 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
              aria-label="Search users"
            />
          </div>

          {/* Role filter */}
          <select
            value={filterRole}
            onChange={(e) => {
              dispatch(setFilterRole(e.target.value));
              dispatch(resetEditForm());
              setOpenDeptCardId(null);
            }}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100"
            aria-label="Filter users by role"
          >
            <option value="all">All</option>
            {!isAdminViewer && <option value="superadmin">Super Admin</option>}
            <option value="admin">Admin</option>
            <option value="subadmin">Sub Admin</option>
            <option value="user">User</option>
          </select>

          {/* Count */}
          <div className="text-sm text-slate-600 dark:text-slate-300 px-2 py-1 flex items-center">
            <span className="font-extrabold">{visibleUsers.length}</span>
            <span className="ml-1 text-slate-500 dark:text-slate-400">
              {filterRole === "all"
                ? "users"
                : filterRole + (visibleUsers.length === 1 ? "" : "s")}
            </span>
          </div>

          {/* Sessions */}
          <button
            type="button"
            onClick={() =>
              navigate("/user-login-logout", {
                state: {
                  from: "users",
                  usersMini: visibleUsers.map((u) => ({
                    id: u.id,
                    firstName: u.firstName,
                    lastName: u.lastName,
                    role: u.role,
                  })),
                },
              })
            }
            className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-extrabold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 transition inline-flex items-center gap-2"
            aria-label="Open user login/logout table"
          >
            <FaTable className="text-slate-500" />
            Sessions
          </button>
        </div>
      </div>

      {/* Edit */}
      {editingId && canEditUsers && !(isAdminViewer && isSuperAdminEdit) && (
        <section className={`${EDIT_CARD} mb-5`}>
          <div className={EDIT_HEADER}>
            <div className="flex items-start gap-3 min-w-0">
              <span
                className="w-2 h-7 rounded-full"
                style={{ backgroundColor: PISTACHIO_COLOR }}
              />
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold tracking-wide uppercase text-slate-900 dark:text-slate-100">
                  Edit User
                </h3>
                <p className="mt-1 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                  Update details and apply changes.
                </p>
              </div>
            </div>

            <BtnOutline type="button" onClick={cancelEdit}>
              Close
            </BtnOutline>
          </div>

          <form onSubmit={applyEdit} className="p-6 sm:p-7 space-y-6">
            {/* First / Last */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>First Name</label>
                <input
                  value={first}
                  onChange={(e) =>
                    handleEditFieldChange("first", e.target.value)
                  }
                  placeholder="First name"
                  className={EDIT_INPUT}
                />
              </div>

              <div>
                <label className={LABEL}>Last Name</label>
                <input
                  value={last}
                  onChange={(e) =>
                    handleEditFieldChange("last", e.target.value)
                  }
                  placeholder="Last name"
                  className={EDIT_INPUT}
                />
              </div>
            </div>

            {/* Email / EmpId */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* ✅ Hide Email completely for role=user */}
              {!isUserEdit && (
                <div
                  className={
                    isSuperAdminEdit ? "sm:col-span-3" : "sm:col-span-2"
                  }
                >
                  <label className={LABEL}>Email</label>
                  <input
                    value={email}
                    onChange={(e) =>
                      handleEditFieldChange("email", e.target.value)
                    }
                    placeholder="name@company.com"
                    className={EDIT_INPUT}
                  />
                </div>
              )}

              {!isSuperAdminEdit && (
                <div className={isUserEdit ? "sm:col-span-3" : ""}>
                  <label className={LABEL}>Employee ID</label>
                  <input
                    value={empId}
                    onChange={(e) => handleEmpIdChange(e.target.value)}
                    placeholder="3 digits"
                    className={EDIT_INPUT}
                  />
                  <p className="mt-1 text-[11px] font-semibold text-slate-400">
                    Must be exactly 3 digits.
                  </p>
                </div>
              )}
            </div>

            {/* Password / Departments */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Password</label>
                <input
                  value={password}
                  onChange={(e) =>
                    handleEditFieldChange("password", e.target.value)
                  }
                  type="password"
                  placeholder="Leave blank to keep current"
                  className={EDIT_INPUT}
                />
                <p className="mt-1 text-[11px] font-semibold text-slate-400">
                  Any password allowed (numbers / letters / symbols).
                </p>
              </div>

              {!isSuperAdminEdit && (
                <div ref={editDeptBoxRef} className="relative">
                  <label className={LABEL}>Departments</label>

                  <button
                    type="button"
                    onClick={() => setDeptDropdownOpen((v) => !v)}
                    className={[
                      "w-full h-11 px-4 rounded-2xl border",
                      "border-slate-200/70 dark:border-slate-700/60",
                      "bg-white dark:bg-slate-800/40",
                      "text-[13px] font-semibold text-slate-800 dark:text-white",
                      "flex items-center justify-between",
                      "outline-none focus:ring-2 focus:ring-[#93C572]/25",
                    ].join(" ")}
                    aria-expanded={deptDropdownOpen}
                  >
                    <span className="truncate">
                      {getSelectedDepartmentsArray().length === 0
                        ? "-- Select departments --"
                        : `${getSelectedDepartmentsArray().length} selected`}
                    </span>
                    <span className="text-slate-400">
                      {deptDropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
                    </span>
                  </button>

                  {deptDropdownOpen && (
                    <div className="absolute z-50 mt-2 w-full rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-[0_18px_50px_rgba(15,23,42,0.12)] overflow-hidden">
                      {/* Search */}
                      <div className="p-3 border-b border-slate-200/70 dark:border-slate-800">
                        <div className="relative">
                          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            value={deptSearch}
                            onChange={(e) => setDeptSearch(e.target.value)}
                            placeholder="Search department or code..."
                            className="w-full h-10 pl-9 pr-3 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 text-[12px] font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#93C572]/25"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>

                      {/* Options */}
                      <div className="max-h-64 overflow-y-auto py-1">
                        {filteredDeptOptions.map((opt) => {
                          const checked =
                            getSelectedDepartmentsArray().includes(opt.value);
                          return (
                            <label
                              key={opt.value}
                              className={[
                                "px-4 py-2 cursor-pointer select-none",
                                "flex items-center justify-between gap-3",
                                "hover:bg-slate-50 dark:hover:bg-slate-800/60",
                                checked ? "bg-[#93C572]/10" : "",
                              ].join(" ")}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="flex items-center gap-3 min-w-0">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 accent-[#93C572]"
                                  checked={checked}
                                  onChange={() => toggleDepartment(opt.value)}
                                />
                                <span className="min-w-0">
                                  <div className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate">
                                    {opt.label}
                                  </div>
                                  {opt.shortCode && (
                                    <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                                      {String(opt.shortCode)}
                                    </div>
                                  )}
                                </span>
                              </span>

                              {checked && (
                                <span className="text-emerald-600 text-xs font-extrabold">
                                  ✓
                                </span>
                              )}
                            </label>
                          );
                        })}

                        {filteredDeptOptions.length === 0 && (
                          <div className="px-4 py-6 text-center text-[12px] font-semibold text-slate-400">
                            No departments found.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Departments summary */}
            {!isSuperAdminEdit && (
              <div className={SELECTED_SUMMARY_BOX}>
                <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  Selected Departments
                </div>

                {getSelectedDepartmentsArray().length === 0 ? (
                  <p className="mt-2 text-[12px] font-semibold text-slate-400">
                    No departments selected yet.
                  </p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {getSelectedDepartmentsArray().map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => toggleDepartment(name)}
                        className={`${SUMMARY_PILL} inline-flex items-center gap-2 hover:border-rose-300`}
                        title="Remove department"
                      >
                        <span>{name}</span>
                        <span className="text-slate-400 font-black">×</span>
                      </button>
                    ))}
                  </div>
                )}

                <p className="mt-3 text-[11px] font-semibold text-slate-400">
                  Minimum 1 department required. Unlimited selections allowed.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
              <div className="flex flex-col sm:flex-row gap-3">
                <BtnPrimary type="submit" disabled={loading}>
                  {loading ? "Updating..." : "Apply Edit"}
                </BtnPrimary>

                <BtnOutline type="button" onClick={cancelEdit}>
                  Cancel
                </BtnOutline>
              </div>
            </div>

            {message && (
              <div
                className={`mt-1 px-4 py-3 rounded-2xl border text-[12px] font-bold ${
                  message.toLowerCase().includes("success")
                    ? "bg-emerald-100 text-emerald-900 border-emerald-200"
                    : "bg-rose-100 text-rose-900 border-rose-200"
                }`}
              >
                {message}
              </div>
            )}
          </form>
        </section>
      )}

      {/* Users Grid */}
      <section
        className="
          bg-white dark:bg-slate-900
          p-3 sm:p-4
          rounded-2xl border border-slate-200 dark:border-slate-800
          shadow-sm
          flex flex-col
          h-[calc(100vh-220px)]
        "
      >
        {loading && !editingId ? (
          <div className="text-sm text-slate-500 py-6 text-center">
            Loading users...
          </div>
        ) : visibleUsers.length === 0 ? (
          <div className="text-sm text-slate-500 py-6 text-center">
            No users found.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 items-stretch">
              {visibleUsers.map((u) => {
                const role = roleLabel(u.role);
                const isOpen = openDeptCardId === u.id;
                const deptCount = Array.isArray(u.departments)
                  ? u.departments.length
                  : 0;

                const showEdit = canEditUsers;
                const showDelete = canDeleteUsers;

                const canToggleDisabled =
                  canEditUsers &&
                  !(role === "superadmin" && viewerRole !== "superadmin");

                return (
                  <div
                    key={u.id}
                    className={[
                      "rounded-2xl border border-slate-200 dark:border-slate-800",
                      "bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow",
                      "p-4 flex flex-col",
                      "h-64",
                    ].join(" ")}
                  >
                    {/* TOP */}
                    <div className="flex items-start gap-3">
                      <div
                        className="flex items-center justify-center w-10 h-10 rounded-2xl text-white text-xs font-black shadow-sm"
                        style={{ backgroundColor: PISTACHIO_COLOR }}
                      >
                        {`${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}`
                          .toUpperCase()
                          .trim() || "U"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-extrabold text-sm truncate text-slate-900 dark:text-slate-100">
                              {u.firstName} {u.lastName}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 mt-2">
                              <MdEmail className="w-4 h-4 shrink-0 text-slate-400" />
                              <span className="truncate">{u.email || "—"}</span>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <RoleBadge role={u.role} />
                            {u.disabled && (
                              <span
                                className="
                                  shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold border
                                  bg-rose-50 text-rose-700 border-rose-200
                                  dark:bg-rose-500/10 dark:text-rose-200 dark:border-rose-500/20
                                "
                              >
                                DISABLED
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-2 truncate">
                            <MdBadge className="w-4 h-4 shrink-0 text-slate-400" />
                            <span>ID: {u.employeeId || "—"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* MIDDLE */}
                    <div className="mt-4 flex-1 overflow-visible">
                      {/* ✅ TOGGLE MOVED ABOVE DEPARTMENTS */}
                      {canToggleDisabled && (
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                            {u.disabled ? "Disabled" : "Active"}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleToggleDisabled(u)}
                            disabled={u.id === currentUser?.id}
                            className={[
                              "relative inline-flex items-center h-7 w-14 rounded-full transition",
                              u.disabled
                                ? "bg-slate-300 dark:bg-slate-700"
                                : "bg-emerald-500",
                              u.id === currentUser?.id
                                ? "opacity-60 cursor-not-allowed"
                                : "cursor-pointer",
                            ].join(" ")}
                            title={u.disabled ? "Enable user" : "Disable user"}
                          >
                            <span
                              className={[
                                "inline-block w-5 h-5 transform bg-white rounded-full shadow transition",
                                u.disabled ? "translate-x-1" : "translate-x-8",
                              ].join(" ")}
                            />
                          </button>
                        </div>
                      )}

                      {role !== "superadmin" && deptCount > 0 ? (
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 overflow-hidden">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenDeptCardId(isOpen ? null : u.id)
                            }
                            className="w-full px-3 py-2 flex items-center justify-between text-left"
                          >
                            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                              Departments ({deptCount})
                            </span>
                            <span className="text-slate-400">
                              {isOpen ? (
                                <FaChevronUp size={12} />
                              ) : (
                                <FaChevronDown size={12} />
                              )}
                            </span>
                          </button>

                          {isOpen && (
                            <div className="px-3 pb-3">
                              <div className="max-h-32 overflow-y-auto pr-1">
                                <div className="flex flex-col gap-2">
                                  {u.departments.map((dep) => {
                                    const code =
                                      deptShortcuts?.[dep] &&
                                      String(deptShortcuts[dep]).toUpperCase();
                                    return (
                                      <div
                                        key={dep}
                                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/40"
                                      >
                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                                          {dep}
                                        </span>
                                        {code ? (
                                          <span className="text-[10px] font-extrabold tracking-wider text-slate-400">
                                            {code}
                                          </span>
                                        ) : null}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                          {role === "superadmin"
                            ? "All departments access"
                            : deptCount === 0
                              ? "No departments"
                              : ""}
                        </div>
                      )}
                    </div>

                    {/* BOTTOM actions */}
                    {(showEdit || showDelete || canToggleDisabled) && (
                      <div
                        className={[
                          "mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex gap-2",
                          !showDelete ? "justify-center" : "",
                        ].join(" ")}
                      >
                        {showEdit && (
                          <button
                            type="button"
                            onClick={() => startEdit(u)}
                            className={[
                              showDelete ? "flex-1" : "flex-1",
                              "px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/15 text-xs font-extrabold border border-amber-200 dark:border-amber-500/20 transition",
                            ].join(" ")}
                          >
                            Edit
                          </button>
                        )}

                        {showDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id, u)}
                            className="flex-1 px-3 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold transition"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleBackClick}
          className={`mt-6 mx-auto ${BTN_DANGER}`}
        >
          Back
        </button>
      </section>
    </div>
  );
}
