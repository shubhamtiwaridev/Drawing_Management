
import React, { useEffect, useRef, useState, useMemo } from "react";

const SEARCH_BY_OPTIONS = [
  { key: "select", label: "Select" },
  { key: "all", label: "All" },
  { key: "email", label: "User Email" },
  { key: "username", label: "Username" },
  { key: "empNo", label: "Emp No" },
  { key: "role", label: "Role" },
  { key: "action", label: "Action" },
  { key: "department", label: "Department" },
  { key: "drawing", label: "Drawing" },
  { key: "fileName", label: "File Name" },
  { key: "datetime", label: "Date & Time" },
];

const ROLE_OPTIONS = ["SUPERADMIN", "ADMIN", "SUBADMIN", "USER"];

const ACTION_OPTIONS = [
  "LOGIN",
  "LOGOUT",
  "CREATE_DRAWING",
  "UPDATE_DRAWING",
  "DELETE_DRAWING",
  "ACTIVATE_DRAWING",
  "DEACTIVATE_DRAWING",
  "SEARCH",
  "OPEN",
  "DOWNLOAD",
  "SCHEDULE_UPSERT",
  "SCHEDULE_CLEANUP",
  "SESSION_CHECK",
];

const FILE_EXTENSIONS = [
  ".pdf",
  ".xlsx",
  ".xls",
  ".ppt",
  ".pptx",
  ".lxd",
  ".mpr",
  ".stp",
  ".step",
  ".dxf",
  ".stl",
  ".saw",
];

const DEPARTMENTS = [
  "3 D Printer",
  "Anycubic Kobra 2 Neo",
  "Assembly Instructions",
  "Bambu Lab P1s Single",
  "Cadt",
  "Curide Program",
  "Edgeband",
  "Elego Neptune",
  "Fabric",
  "Finished Drawings",
  "Hardware Mechanism",
  "Hardware Sticker",
  "Hr",
  "Logistics Department",
  "Marketing",
  "Ms Ss Bar Department",
  "Packing Data",
  "Packing Instructions",
  "Panel Processing Wood",
  "Plastic Parts",
  "Qr Code",
  "Security",
  "Sheet Metal",
  "Smd Laser Program",
  "Solid Wood Carpentry",
  "Time Office",
  "Tool Room",
  "Trading",
  "Tube Department",
  "Welding Department",
];


const WRAP_W = "w-80"; 

const TRIGGER =
  "h-10 px-3 rounded-2xl border border-slate-200/70 bg-white " +
  "flex items-center justify-between cursor-pointer " +
  "text-[13px] font-semibold text-slate-700 " +
  "hover:bg-slate-50 transition " +
  "focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

const MENU =
  "absolute z-30 mt-2 w-full max-h-72 overflow-auto " +
  "rounded-2xl border border-slate-200/70 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.14)]";

const MENU_ITEM =
  "flex items-center gap-3 px-3 py-2 cursor-pointer " +
  "text-[13px] font-semibold text-slate-700 hover:bg-slate-50";

const INPUT =
  "h-10 px-3 rounded-2xl border border-slate-200/70 bg-white " +
  "text-[13px] font-semibold text-slate-800 outline-none " +
  "focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400/70 " +
  "placeholder:text-slate-400 transition";


function isPlainObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

function CheckboxDropdown({
  value,
  onChange,
  options,
  placeholder,
  multi = false,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const isActive = Array.isArray(value) ? value.length > 0 : Boolean(value);

  const displayText = useMemo(() => {
    if (Array.isArray(value)) {
      return value.length > 0 ? `${value.length} selected` : placeholder;
    }
    return value ? value : placeholder;
  }, [value, placeholder]);

  const toggleMulti = (item) => {
    const current = Array.isArray(value) ? value : [];
    const next = current.includes(item)
      ? current.filter((v) => v !== item)
      : [...current, item];
    onChange(next);
  };

  const handleSelect = (item) => {
    if (!multi) {
      onChange(item);
      setOpen(false);
      return;
    }
    toggleMulti(item);
  };

  return (
    <div ref={ref} className={`relative ${WRAP_W}`}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((p) => !p)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((p) => !p);
          }
          if (e.key === "Escape") setOpen(false);
        }}
        className={TRIGGER}
        aria-expanded={open}
      >
        <span className={isActive ? "text-slate-800" : "text-slate-400"}>
          {displayText}
        </span>

        <span className="text-slate-400 text-[12px] select-none">▾</span>
      </div>

      {open && (
        <div className={MENU}>
          {options.map((item) => {
            const checked = multi
              ? Array.isArray(value) && value.includes(item)
              : value === item;

            return (
              <div
                key={item}
                className={MENU_ITEM}
                onClick={() => handleSelect(item)}
                role="option"
                aria-selected={checked}
              >
                <input type="checkbox" readOnly checked={checked} />
                <span className="truncate">{item}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SearchBox({
  searchBy,
  searchValue,
  onSearchByChange,
  onSearchValueChange,
  allowedKeys,
}) {
  const filteredSearchOptions = Array.isArray(allowedKeys)
    ? SEARCH_BY_OPTIONS.filter((o) => allowedKeys.includes(o.key))
    : SEARCH_BY_OPTIONS;

  const selectedLabel =
    filteredSearchOptions.find((o) => o.key === searchBy)?.label || "";

  const selectedDropdownValue = searchBy === "select" ? "" : selectedLabel;

  const textInput = (placeholder) => (
    <input
      className={`${INPUT} ${WRAP_W}`}
      placeholder={placeholder}
      value={typeof searchValue === "string" ? searchValue : ""}
      onChange={(e) => onSearchValueChange(e.target.value)}
    />
  );

  const dropdown = (options, placeholder) => (
    <CheckboxDropdown
      value={Array.isArray(searchValue) ? searchValue : []}
      onChange={onSearchValueChange}
      options={options}
      placeholder={placeholder}
      multi={true}
    />
  );

  const renderSecondControl = () => {
    if (searchBy === "all") return textInput("Search all fields");

    if (["email", "username", "empNo", "drawing"].includes(searchBy)) {
      return textInput(`Enter ${selectedLabel}`);
    }

    if (searchBy === "role") return dropdown(ROLE_OPTIONS, "Select Role");
    if (searchBy === "action") return dropdown(ACTION_OPTIONS, "Select Action");
    if (searchBy === "department")
      return dropdown(DEPARTMENTS, "Select Department");
    if (searchBy === "fileName")
      return dropdown(FILE_EXTENSIONS, "Select Extension");

    if (searchBy === "datetime") {
      const v = isPlainObject(searchValue) ? searchValue : {};

      return (
        <div className="flex flex-col gap-2">
          {/* ROW 1 — DATES */}
          <div className="flex gap-2 items-center">
            <input
              type="date"
              className={`${INPUT} w-40`}
              value={v.fromDate || ""}
              onChange={(e) => {
                const value = e.target.value;
                const year = value.split("-")[0];
                if (year.length > 4) return;

                onSearchValueChange((prev) => ({
                  ...(isPlainObject(prev) ? prev : {}),
                  fromDate: value,
                }));
              }}
            />

            <input
              type="date"
              className={`${INPUT} w-40`}
              value={v.toDate || ""}
              onChange={(e) => {
                const value = e.target.value;
                const year = value.split("-")[0];
                if (year.length > 4) return;

                onSearchValueChange((prev) => ({
                  ...(isPlainObject(prev) ? prev : {}),
                  toDate: value,
                }));
              }}
            />
          </div>

          {/* ROW 2 — TIME */}
          <div className="flex gap-2 items-center">
            {/* FROM TIME */}
            <div className="flex h-10 rounded-2xl overflow-hidden border border-slate-200/70 bg-white">
              <input
                type="text"
                placeholder="HH:MM"
                inputMode="numeric"
                className="w-20 px-2 outline-none text-[13px] font-semibold text-slate-800 placeholder:text-slate-400"
                value={v.fromTime || ""}
                onChange={(e) =>
                  onSearchValueChange((prev) => ({
                    ...(isPlainObject(prev) ? prev : {}),
                    fromTime: e.target.value,
                  }))
                }
              />
              <select
                className="px-2 border-l border-slate-200/70 bg-white text-[13px] font-semibold text-slate-700 outline-none"
                value={v.fromMeridiem || "AM"}
                onChange={(e) =>
                  onSearchValueChange((prev) => ({
                    ...(isPlainObject(prev) ? prev : {}),
                    fromMeridiem: e.target.value,
                  }))
                }
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>

            {/* TO TIME */}
            <div className="flex h-10 rounded-2xl overflow-hidden border border-slate-200/70 bg-white">
              <input
                type="text"
                placeholder="HH:MM"
                inputMode="numeric"
                className="w-20 px-2 outline-none text-[13px] font-semibold text-slate-800 placeholder:text-slate-400"
                value={v.toTime || ""}
                onChange={(e) =>
                  onSearchValueChange((prev) => ({
                    ...(isPlainObject(prev) ? prev : {}),
                    toTime: e.target.value,
                  }))
                }
              />
              <select
                className="px-2 border-l border-slate-200/70 bg-white text-[13px] font-semibold text-slate-700 outline-none"
                value={v.toMeridiem || "AM"}
                onChange={(e) =>
                  onSearchValueChange((prev) => ({
                    ...(isPlainObject(prev) ? prev : {}),
                    toMeridiem: e.target.value,
                  }))
                }
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex items-center gap-3">
      <CheckboxDropdown
        value={selectedDropdownValue}
        options={filteredSearchOptions.map((o) => o.label)}
        placeholder="Select"
        multi={false}
        onChange={(label) => {
          const found = filteredSearchOptions.find((o) => o.label === label);
          if (!found) return;

          onSearchByChange(found.key);

          onSearchValueChange(
            found.key === "datetime"
              ? {}
              : ["role", "action", "department", "fileName"].includes(found.key)
                ? []
                : "",
          );
        }}
      />

      {searchBy !== "select" && renderSecondControl()}
    </div>
  );
}
