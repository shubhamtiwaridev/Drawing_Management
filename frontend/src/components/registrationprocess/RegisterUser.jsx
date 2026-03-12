// RegisterUser.jsx
import React, { useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchDepartments } from "../../store/departmentSlice";
import { getCurrentUser } from "../../utils/storage";
import {
  updateField,
  toggleDepartment,
  setMessage,
  clearForm,
  resetType,
  setDeptDropdownOpen,
  setDeptSearch,
  registerUser,
} from "../../store/userRegistrationSlice";

import { FaSearch, FaChevronDown, FaChevronUp } from "react-icons/fa";

const BASE_DEPARTMENTS = [];
const PISTACHIO_COLOR = "#93C572";
const digitsOnly = (s = "") => (s || "").replace(/\D/g, "");

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

function CardHeader({ title, subtitle }) {
  return (
    <div className="px-7 py-6 border-b border-slate-200/70 dark:border-slate-800 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <span
          className="w-2 h-7 rounded-full"
          style={{ backgroundColor: PISTACHIO_COLOR }}
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

const LABEL =
  "block mb-1 text-[12px] font-bold text-slate-700 dark:text-slate-200";
const INPUT =
  "w-full h-11 px-4 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 text-[13px] font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#93C572]/25 placeholder:text-slate-400";
const SELECT =
  "w-full h-11 px-4 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 text-[13px] font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#93C572]/25";
const SUMMARY_PILL =
  "px-3 py-1 rounded-full border border-slate-200/70 dark:border-slate-700/60 " +
  "bg-white/70 dark:bg-slate-900/50 text-[12px] font-semibold text-slate-700 dark:text-slate-100";

const SELECTED_SUMMARY_BOX =
  "rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 p-5";

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

function BtnDanger({ children, ...props }) {
  return (
    <button
      {...props}
      className={[
        "h-10 px-6 rounded-2xl text-sm font-extrabold text-white",
        "bg-rose-500 hover:bg-rose-600 hover:shadow-md",
        "transition active:scale-[0.98]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function RegisterUser({ onBack }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const viewerRole = (currentUser?.role || "").toLowerCase();
  const isAdminViewer = viewerRole === "admin";

  const { departments } = useSelector((state) => state.departments);
  const {
    formData,
    submitting,
    message,
    msgType,
    deptDropdownOpen,
    deptSearch,
  } = useSelector((state) => state.userRegistration);

  const {
    type,
    first,
    last,
    email,
    empId,
    password,
    confirmPassword,
    selectedDepartments,
    departmentOther,
  } = formData;

  const isSuperAdmin = type === "superadmin";
  const isUser = type === "user";
  const hasOtherSelected = selectedDepartments.includes("Other");
  const deptBoxRef = useRef(null);

  useEffect(() => {
    if (!deptDropdownOpen) return;

    const onDown = (e) => {
      if (!deptBoxRef.current) return;
      if (!deptBoxRef.current.contains(e.target)) {
        dispatch(setDeptDropdownOpen(false));
      }
    };

    const onKey = (e) => {
      if (e.key === "Escape") dispatch(setDeptDropdownOpen(false));
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [deptDropdownOpen, dispatch]);

  useEffect(() => {
    if (isAdminViewer && type === "superadmin") {
      dispatch(resetType());
    }

    dispatch(setDeptDropdownOpen(false));
    dispatch(setDeptSearch(""));
    dispatch(updateField({ field: "selectedDepartments", value: [] }));
    dispatch(updateField({ field: "departmentOther", value: "" }));
    dispatch(setMessage({ message: "", msgType: "info" }));

    if (type === "superadmin") {
      dispatch(updateField({ field: "empId", value: "" }));
    }

    if (type === "user") {
      dispatch(updateField({ field: "email", value: "" }));
    }
  }, [type, dispatch, isAdminViewer]);

  useEffect(() => {
    if (type === "superadmin" && departments.length > 0) {
      const allDeptNames = departments.filter((d) => d.name).map((d) => d.name);
      dispatch(
        updateField({ field: "selectedDepartments", value: allDeptNames }),
      );
      dispatch(updateField({ field: "departmentOther", value: "" }));
    }
  }, [type, departments, dispatch]);

  useEffect(() => {
    dispatch(fetchDepartments());

    const handleDepartmentsChanged = () => dispatch(fetchDepartments());
    window.addEventListener("departments-changed", handleDepartmentsChanged);
    return () =>
      window.removeEventListener(
        "departments-changed",
        handleDepartmentsChanged,
      );
  }, [dispatch]);

  const extraOptions = useMemo(() => {
    return departments
      .filter(
        (d) =>
          !!d.name && !BASE_DEPARTMENTS.includes(d.name) && d.name !== "Other",
      )
      .map((d) => ({
        value: d.name,
        label: d.name,
        shortCode: d.shortCode,
      }));
  }, [departments]);

  const departmentOptions = useMemo(
    () => [...extraOptions, { value: "Other", label: "Other" }],
    [extraOptions],
  );

  const validatePassword = (pass) => {
    if (!pass || pass.length === 0) return "Password is required.";
    return null;
  };

  const validate = () => {
    if (!type) return "Please choose account type.";
    if (isAdminViewer && type === "superadmin")
      return "Admin cannot create Super Admin accounts.";
    if (!first.trim() || !last.trim())
      return "First and last name are required.";

    const emailTrim = (email || "").trim();
    if (!isUser) {
      if (!/^\S+@\S+\.\S+$/.test(emailTrim))
        return "Please enter a valid email.";
    } else {
      if (emailTrim && !/^\S+@\S+\.\S+$/.test(emailTrim))
        return "Please enter a valid email.";
    }

    if (!isSuperAdmin) {
      const empIdDigits = digitsOnly(empId);
      if (empIdDigits.length !== 3)
        return "Employee ID must be exactly 3 digits.";
    }

    const passwordError = validatePassword(password);
    if (passwordError) return passwordError;

    if (password !== confirmPassword) return "Passwords do not match.";

    if (type !== "superadmin" && selectedDepartments.length < 1) {
      return "At least one department must be selected.";
    }

    if (hasOtherSelected && !departmentOther.trim()) {
      return "Please specify the department name for 'Other'.";
    }

    return null;
  };

  const getNormalizedDepartments = () => {
    const list = [...selectedDepartments];
    const idx = list.indexOf("Other");
    if (idx !== -1) {
      const custom = departmentOther.trim();
      list[idx] = custom || "Other";
    }
    return list;
  };

  const handleFieldChange = (field, value) =>
    dispatch(updateField({ field, value }));

  const handleEmpIdChange = (value) =>
    handleFieldChange("empId", digitsOnly(value).slice(0, 3));

  const handleToggleDepartment = (value) => {
    dispatch(toggleDepartment(value));
    dispatch(setMessage({ message: "", msgType: "info" }));
  };

  const handleBack = () => {
    if (typeof onBack === "function") onBack();
    else {
      try {
        localStorage.setItem("ui_view", "product");
      } catch (e) {}
      navigate("/home");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(setMessage({ message: "", msgType: "info" }));

    const err = validate();
    if (err) {
      dispatch(setMessage({ message: err, msgType: "error" }));
      return;
    }

    const finalDepartments = getNormalizedDepartments();
    const payload = {
      firstName: first.trim(),
      lastName: last.trim(),
      password,
      role: type,
      departments: finalDepartments,
      department: finalDepartments[0] || "",
      departmentOther,
    };

    if (!isUser) {
      payload.email = (email || "").trim().toLowerCase();
    } else if ((email || "").trim()) {
      payload.email = (email || "").trim().toLowerCase();
    }

    if (!isSuperAdmin) {
      payload.employeeId = digitsOnly(empId).padStart(3, "0");
    }

    try {
      const result = await dispatch(registerUser(payload)).unwrap();
      if (result) window.dispatchEvent(new Event("users-changed"));
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };

  const filteredDeptOptions = useMemo(() => {
    const q = deptSearch.trim().toLowerCase();
    return departmentOptions.filter((opt) => {
      const label = opt.label.toLowerCase();
      const code = (opt.shortCode || "").toString().toLowerCase();
      return label.includes(q) || (code && code.includes(q));
    });
  }, [deptSearch, departmentOptions]);

  const typeSummaryText = isSuperAdmin
    ? "✓ Employee ID not required • Full departments access"
    : "✓ Employee ID required (3 digits)";

  return (
    <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6">
      <SectionHeader title="User Registration" />

      <div className={`${CARD} mt-6`}>
        <CardHeader
          title="Admin and User Registration"
          subtitle="Create Super Admin, Admin, Sub Admin, or User accounts with controlled department access."
        />

        <div className="p-6 sm:p-7">
          {!type && (
            <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 p-5">
              <label className={LABEL}>Select account type</label>

              <select
                value={type}
                onChange={(e) => handleFieldChange("type", e.target.value)}
                className={SELECT}
              >
                <option value="">-- Select account type --</option>
                {!isAdminViewer && (
                  <option value="superadmin">Super Admin</option>
                )}
                <option value="admin">Admin</option>
                <option value="subadmin">Sub Admin</option>
                <option value="user">User</option>
              </select>

              <p className="mt-2 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                Choose a type to open the full registration form.
              </p>
              <div className="mt-5 flex justify-end">
                <BtnDanger type="button" onClick={handleBack}>
                  Back
                </BtnDanger>
              </div>
              <StatusMessage message={message} type={msgType} />
            </div>
          )}

          {type && (
            <>
              <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                      Creating Account Type
                    </div>
                    <div className="mt-1 text-lg font-black capitalize text-slate-900 dark:text-slate-100">
                      {type}
                    </div>
                    <div className="mt-1 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                      {typeSummaryText}
                    </div>
                  </div>

                  {submitting && (
                    <div className="inline-flex items-center gap-2 text-[12px] font-bold text-slate-500 dark:text-slate-400">
                      <span
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: PISTACHIO_COLOR }}
                      />
                      Submitting
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                {/* Names */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>First Name</label>
                    <input
                      value={first}
                      onChange={(e) =>
                        handleFieldChange("first", e.target.value)
                      }
                      placeholder="e.g. John"
                      className={INPUT}
                    />
                  </div>

                  <div>
                    <label className={LABEL}>Last Name</label>
                    <input
                      value={last}
                      onChange={(e) =>
                        handleFieldChange("last", e.target.value)
                      }
                      placeholder="e.g. Doe"
                      className={INPUT}
                    />
                  </div>
                </div>

                {/* Email + Employee ID */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {!isUser && (
                    <div
                      className={
                        isSuperAdmin ? "sm:col-span-3" : "sm:col-span-2"
                      }
                    >
                      <label className={LABEL}>Email</label>
                      <input
                        value={email}
                        onChange={(e) =>
                          handleFieldChange("email", e.target.value)
                        }
                        placeholder="name@company.com"
                        type="email"
                        className={INPUT}
                      />
                    </div>
                  )}

                  {!isSuperAdmin && (
                    <div className={isUser ? "sm:col-span-3" : ""}>
                      <label className={LABEL}>Employee ID</label>
                      <input
                        value={empId}
                        onChange={(e) => handleEmpIdChange(e.target.value)}
                        placeholder="3 digits"
                        maxLength={3}
                        inputMode="numeric"
                        className={INPUT}
                      />
                      <p className="mt-1 text-[11px] font-semibold text-slate-400">
                        Must be exactly 3 digits
                      </p>
                    </div>
                  )}
                </div>

                {/* Departments (not for superadmin) */}
                {type !== "superadmin" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div ref={deptBoxRef} className="relative">
                      <label className={LABEL}>Departments</label>

                      <button
                        type="button"
                        onClick={() =>
                          dispatch(setDeptDropdownOpen(!deptDropdownOpen))
                        }
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
                          {selectedDepartments.length === 0
                            ? "-- Select departments --"
                            : `${selectedDepartments.length} selected`}
                        </span>
                        <span className="text-slate-400">
                          {deptDropdownOpen ? (
                            <FaChevronUp />
                          ) : (
                            <FaChevronDown />
                          )}
                        </span>
                      </button>

                      {deptDropdownOpen && (
                        <div className="absolute z-30 mt-2 w-full rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-[0_18px_50px_rgba(15,23,42,0.12)] overflow-hidden">
                          <div className="p-3 border-b border-slate-200/70 dark:border-slate-800">
                            <div className="relative">
                              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                value={deptSearch}
                                onChange={(e) =>
                                  dispatch(setDeptSearch(e.target.value))
                                }
                                placeholder="Search department or code..."
                                className="w-full h-10 pl-9 pr-3 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 text-[12px] font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#93C572]/25"
                              />
                            </div>
                          </div>

                          <div className="max-h-64 overflow-y-auto py-1">
                            {filteredDeptOptions.map((opt) => {
                              const checked = selectedDepartments.includes(
                                opt.value,
                              );
                              return (
                                <label
                                  key={opt.value}
                                  className={[
                                    "px-4 py-2 cursor-pointer select-none",
                                    "flex items-center justify-between gap-3",
                                    "hover:bg-slate-50 dark:hover:bg-slate-800/60",
                                    checked ? "bg-[#93C572]/10" : "",
                                  ].join(" ")}
                                >
                                  <span className="flex items-center gap-3 min-w-0">
                                    <input
                                      type="checkbox"
                                      className="w-4 h-4 accent-[#93C572]"
                                      checked={checked}
                                      onChange={() =>
                                        handleToggleDepartment(opt.value)
                                      }
                                    />
                                    <span className="min-w-0">
                                      <div className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate">
                                        {opt.label}
                                      </div>
                                      {opt.shortCode && (
                                        <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                                          {opt.shortCode}
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

                    <div>
                      <label className={LABEL}>Specify if Other</label>
                      <input
                        value={departmentOther}
                        onChange={(e) =>
                          handleFieldChange("departmentOther", e.target.value)
                        }
                        disabled={!hasOtherSelected}
                        placeholder="Type department name..."
                        className={`${INPUT} ${!hasOtherSelected ? "opacity-60 cursor-not-allowed" : ""}`}
                      />
                      <p className="mt-1 text-[11px] font-semibold text-slate-400">
                        Enabled only if you select “Other”.
                      </p>
                    </div>
                  </div>
                )}

                {type !== "superadmin" && (
                  <div className={SELECTED_SUMMARY_BOX}>
                    <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                      Selected Departments
                    </div>

                    {selectedDepartments.length === 0 ? (
                      <p className="mt-2 text-[12px] font-semibold text-slate-400">
                        No departments selected yet.
                      </p>
                    ) : (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedDepartments.map((name) => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => handleToggleDepartment(name)}
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
                      Minimum 1 department required. Unlimited selections
                      allowed.
                    </p>
                  </div>
                )}

                {/* Passwords */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <div>
                    <label className={LABEL}>Password</label>
                    <input
                      value={password}
                      onChange={(e) =>
                        handleFieldChange("password", e.target.value)
                      }
                      placeholder="Enter password"
                      type="password"
                      className={INPUT}
                    />
                  </div>

                  <div>
                    <label className={LABEL}>Confirm Password</label>
                    <input
                      value={confirmPassword}
                      onChange={(e) =>
                        handleFieldChange("confirmPassword", e.target.value)
                      }
                      placeholder="Re-enter password"
                      type="password"
                      className={INPUT}
                    />

                    {confirmPassword && password !== confirmPassword && (
                      <p className="mt-2 text-[12px] font-bold text-rose-600">
                        Passwords do not match
                      </p>
                    )}
                    {confirmPassword && password === confirmPassword && (
                      <p className="mt-2 text-[12px] font-bold text-emerald-600">
                        ✓ Passwords match
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <BtnPrimary type="submit" disabled={submitting}>
                      {submitting ? "Registering..." : "Register"}
                    </BtnPrimary>

                    <BtnOutline
                      type="button"
                      onClick={() => dispatch(clearForm())}
                    >
                      Reset
                    </BtnOutline>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                    <BtnOutline
                      type="button"
                      onClick={() => dispatch(resetType())}
                    >
                      Change Type
                    </BtnOutline>

                    <BtnDanger type="button" onClick={handleBack}>
                      Back
                    </BtnDanger>
                  </div>
                </div>

                <StatusMessage message={message} type={msgType} />
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
