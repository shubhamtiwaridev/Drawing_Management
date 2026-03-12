import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginUser, clearError } from "../../store/authSlice";
import logo from "../logos/image.png";
import { FiMail, FiLock } from "react-icons/fi";

const digitsOnly = (s = "") => String(s || "").replace(/\D/g, "");

export default function Login() {
  const [mode, setMode] = useState("user"); 
  const [email, setEmail] = useState("");
  const [empDigits, setEmpDigits] = useState(["", "", ""]); 
  const [password, setPassword] = useState("");

  const empRefs = useRef([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error } = useSelector((state) => state.auth);
  const pistachio = "#93C572";

  const employeeId = useMemo(() => empDigits.join(""), [empDigits]);

  const resetFields = () => {
    setEmail("");
    setEmpDigits(["", "", ""]);
    setPassword("");
  };

  useEffect(() => {
    if (mode === "user") {
      setTimeout(() => empRefs.current?.[0]?.focus?.(), 0);
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "user") return;

    const t = setTimeout(() => {
      const domVals = empRefs.current.map((el) =>
        digitsOnly(el?.value || "").slice(-1),
      );
      const safe = [
        domVals[0] || "",
        domVals[1] || "",
        domVals[2] || "",
      ];
      if (safe.join("") !== empDigits.join("")) setEmpDigits(safe);
    }, 80);

    return () => clearTimeout(t);
  }, [mode, empDigits]);

  const setEmpAt = (idx, val) => {
    const d = digitsOnly(val).slice(-1); 
    setEmpDigits((prev) => {
      const next = [...prev];
      next[idx] = d;
      return next;
    });

    if (d && idx < 2) {
      requestAnimationFrame(() => empRefs.current?.[idx + 1]?.focus?.());
    }
  };

  const handleEmpKeyDown = (idx, e) => {
    const k = e.key;

    if (k === "Backspace") {
      if (empDigits[idx]) {
        setEmpDigits((prev) => {
          const next = [...prev];
          next[idx] = "";
          return next;
        });
      } else if (idx > 0) {
        requestAnimationFrame(() => empRefs.current?.[idx - 1]?.focus?.());
      }
      return;
    }

    if (k === "ArrowLeft" && idx > 0) {
      e.preventDefault();
      empRefs.current?.[idx - 1]?.focus?.();
      return;
    }

    if (k === "ArrowRight" && idx < 2) {
      e.preventDefault();
      empRefs.current?.[idx + 1]?.focus?.();
      return;
    }
  };

  const handleEmpPaste = (e) => {
    const text = e.clipboardData?.getData("text") || "";
    const d = digitsOnly(text).slice(0, 3);
    if (!d) return;

    e.preventDefault();
    const next = [d[0] || "", d[1] || "", d[2] || ""];
    setEmpDigits(next);

    const focusIndex = Math.min(d.length, 3) - 1;
    requestAnimationFrame(() => empRefs.current?.[focusIndex]?.focus?.());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(clearError());

    if (!password.trim()) return;

    if (mode === "user") {
      if (employeeId.length !== 3) return;

      dispatch(loginUser({ employeeId, password })).then((res) => {
        if (res.meta.requestStatus === "fulfilled") {
          resetFields();
          navigate("/home");
        }
      });
      return;
    }

    if (!email.trim()) return;

    dispatch(loginUser({ email: email.trim(), password })).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        resetFields();
        navigate("/home");
      }
    });
  };
  const EMP_BOX_CLASS = [
    "h-12 w-12 rounded-xl border border-gray-200",
    "text-center text-lg font-semibold text-gray-900 shadow-sm",
    "outline-none transition appearance-none",
    "bg-white focus:bg-white focus-visible:bg-white",
    "focus:border-[#93C572]/60 focus:ring-4 focus:ring-[#93C572]/20",
    "autofill:bg-white autofill:text-gray-900",
    "autofill:shadow-[inset_0_0_0_1000px_#ffffff]",
  ].join(" ");

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 bg-[linear-gradient(135deg,rgba(147,197,114,0.10),#ffffff,rgba(147,197,114,0.15))]">
      <div className="relative w-full max-w-sm sm:max-w-md">
        <div className="absolute -inset-1 rounded-3xl blur-xl opacity-70 bg-[linear-gradient(90deg,rgba(147,197,114,0.35),rgba(147,197,114,0.10),rgba(147,197,114,0.35))]" />
        <div className="relative bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)] border border-[#93C572]/20">
          <div className="flex flex-col items-center mb-7">
            <div className="flex justify-center mb-4">
              <img
                src={logo}
                alt="Decostyle"
                className="h-14 sm:h-16 object-contain drop-shadow-sm"
              />
            </div>

            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
              Welcome back
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Sign in to continue to Decostyle
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="mb-5 p-1 rounded-2xl border border-gray-200 bg-white shadow-sm grid grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setMode("user");
                dispatch(clearError());
              }}
              className={[
                "py-2 rounded-xl text-sm font-semibold transition",
                mode === "user"
                  ? "text-white"
                  : "text-gray-700 hover:bg-gray-50",
              ].join(" ")}
              style={mode === "user" ? { backgroundColor: pistachio } : undefined}
            >
              User
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("admin");
                dispatch(clearError());
              }}
              className={[
                "py-2 rounded-xl text-sm font-semibold transition",
                mode === "admin"
                  ? "text-white"
                  : "text-gray-700 hover:bg-gray-50",
              ].join(" ")}
              style={mode === "admin" ? { backgroundColor: pistachio } : undefined}
            >
              Admin
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-red-500" />
                <div className="text-sm text-red-700 leading-5">{error}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* USER: Employee ID */}
            {mode === "user" && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Employee ID
                </label>

                <div className="flex items-center gap-3">
                  {/* # outside */}
                  <span className="text-gray-400 font-bold text-lg select-none">
                    #
                  </span>

                  <div className="flex gap-3" onPaste={handleEmpPaste}>
                    {empDigits.map((d, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (empRefs.current[idx] = el)}
                        value={d}
                        onChange={(e) => setEmpAt(idx, e.target.value)}
                        onInput={(e) => setEmpAt(idx, e.currentTarget.value)}
                        onKeyDown={(e) => handleEmpKeyDown(idx, e)}
                        onFocus={(e) => e.target.select()}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        aria-label={`Employee ID digit ${idx + 1}`}
                        autoComplete="off"
                        name={`emp_digit_${idx}`}
                        spellCheck={false}
                        className={EMP_BOX_CLASS}
                        required
                      />
                    ))}
                  </div>
                </div>

                <p className="text-[12px] text-gray-400 font-medium">
                  Enter 3 digits (e.g. 1 0 0)
                </p>
              </div>
            )}

            {/* ADMIN: Email */}
            {mode === "admin" && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FiMail size={18} />
                  </span>

                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-10 py-3 text-gray-900 placeholder:text-gray-400 shadow-sm outline-none transition focus:border-[#93C572]/60 focus:ring-4 focus:ring-[#93C572]/20"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <FiLock size={18} />
                </span>

                <input
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-10 py-3 text-gray-900 placeholder:text-gray-400 shadow-sm outline-none transition focus:border-[#93C572]/60 focus:ring-4 focus:ring-[#93C572]/20"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-xl py-3 text-white font-semibold shadow-md transition active:scale-[0.99] ${
                loading
                  ? "bg-[#93C572]/40 cursor-not-allowed shadow-none"
                  : "bg-[#93C572] hover:brightness-95"
              }`}
              style={
                !loading
                  ? { boxShadow: `0 12px 28px -18px ${pistachio}` }
                  : undefined
              }
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}