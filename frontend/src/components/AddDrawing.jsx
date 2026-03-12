// AddDrawing.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import DrawingManagerForm from "./DrawingManager";
import FileUploads from "./FileUploads";
import { getCurrentUser } from "../utils/storage";

import {
  FaFilePdf,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileAlt,
  FaHistory,
  FaEdit,
  FaTrashAlt,
  FaSearch,
} from "react-icons/fa";
import { SiAutodesk, SiDassaultsystemes } from "react-icons/si";

import {
  fetchAllDepartments,
  fetchAssignedDepartments,
  fetchDrawings,
  createDrawing,
  updateDrawing,
  deleteDrawing,
  setSearch,
  setCurrentPage,
  setFolderName,
  setShortcutKey,
  setDrawingNumber,
  setRevisionNo,
  setDescription,
  setMainFileName,
  setEditingId,
  resetForm,
  toggleDrawingActive,
} from "../store/drawingSlice";

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_BASE_URL || "";

function slugFromName(name = "") {
  return name.toString().toLowerCase().trim().replace(/\s+/g, "_");
}

const formatDateTime = (date) => {
  if (!date) return "—";
  const d = new Date(date);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${day}/${month}/${year} - ${hours}:${minutes} ${ampm}`;
};

const FILE_ICONS = [
  { ext: ".pdf", icon: FaFilePdf, color: "text-red-600" },
  { ext: ".xlsx", icon: FaFileExcel, color: "text-green-600" },
  { ext: ".xls", icon: FaFileExcel, color: "text-green-600" },
  { ext: ".ppt", icon: FaFilePowerpoint, color: "text-orange-500" },
  { ext: ".pptx", icon: FaFilePowerpoint, color: "text-orange-500" },
  { ext: ".lxd", icon: SiAutodesk, color: "text-blue-600" },
  { ext: ".mpr", icon: SiAutodesk, color: "text-indigo-600" },
  { ext: ".dxf", icon: SiAutodesk, color: "text-purple-600" },
  { ext: ".stp", icon: SiDassaultsystemes, color: "text-sky-600" },
  { ext: ".step", icon: SiDassaultsystemes, color: "text-sky-600" },
  { ext: ".stl", icon: SiDassaultsystemes, color: "text-teal-600" },
  { ext: ".saw", icon: FaFileAlt, color: "text-gray-600" },
];

const makeFilesState = (fixedNull = true) => ({
  pdfFile: [],
  xlsxFile: [],
  pptFile: [],
  lxdFile: [],
  mprFile: [],
  stpFile: [],
  dxfFile: [],
  stlFile: [],
  sawFile: [],
  fixedFile10: fixedNull ? null : [],
  fixedFile11: fixedNull ? null : [],
  extraFiles: [],
});

export default function DrawingManager({
  mode = "add",
  onBack,
  deptId,
  onDeptChange,
  isDeptLocked,
}) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isSearchMode = mode === "search";
  const ROWS_PER_PAGE = isSearchMode ? 15 : 8;

  const hasLoadedDefaultRef = useRef(false);
  const hasAutoPagedRef = useRef(false);

  const [files, setFiles] = useState(() => makeFilesState(true));
  const [uploadResetKey, setUploadResetKey] = useState(0);
  const [fileError, setFileError] = useState("");

  const {
    rows,
    departments,
    allDepartments,
    deptNameToId,
    assignedDepartmentIds,
    search,
    currentPage,
    folderName,
    shortcutKey,
    drawingNumber,
    revisionNo,
    description,
    mainFileName,
    editingId,
  } = useSelector((state) => state.drawingManager || {});

  const currentUser = getCurrentUser();
  const role = (currentUser?.role || "user").toLowerCase();

  const canViewHistory =
    role === "superadmin" || role === "admin" || role === "subadmin";
  const canEdit =
    role === "superadmin" || role === "admin" || role === "subadmin";
  const canDelete = role === "superadmin";
  const isAdmin = role === "admin" || role === "subadmin";

  if (role === "user") return null;

  const folderSlug = useMemo(
    () => (folderName || "").toLowerCase().replace(/\s+/g, "_"),
    [folderName],
  );

  const handleToggleActive = async (id) => {
    if (!canEdit) return;
    const res = await dispatch(toggleDrawingActive(id));
    if (toggleDrawingActive.rejected.match(res)) {
      alert(res.payload || "Failed to toggle active status");
    } else {
      window.dispatchEvent(new Event("drawings-refresh"));
    }
  };

  useEffect(() => {
    const refreshHandler = () => {
      dispatch(
        fetchDrawings({
          folderSlug,
          isAdmin,
          assignedDepartmentIds,
          allDepartments,
          deptNameToId,
        }),
      );
    };

    window.addEventListener("drawings-refresh", refreshHandler);
    return () => window.removeEventListener("drawings-refresh", refreshHandler);
  }, [
    dispatch,
    folderSlug,
    isAdmin,
    assignedDepartmentIds,
    allDepartments,
    deptNameToId,
  ]);

  const allowedDepartments = useMemo(() => {
    if (role === "superadmin") return departments || [];

    if (role === "admin" || role === "subadmin") {
      if (
        !Array.isArray(assignedDepartmentIds) ||
        assignedDepartmentIds.length === 0
      ) {
        return [];
      }

      const assignedAsString = assignedDepartmentIds.map(String);
      return (departments || []).filter((d) =>
        assignedAsString.includes(String(d.id)),
      );
    }

    return [];
  }, [role, departments, assignedDepartmentIds]);

  // ✅ If deptId is passed (ProductDepartment dept card flow),
  // lock dropdown options to only that selected department.
  const lockedDept = useMemo(() => {
    if (!deptId) return null;

    return (
      allowedDepartments.find((d) => String(d.id) === String(deptId)) ||
      allowedDepartments.find((d) => slugFromName(d.name) === String(deptId))
    );
  }, [deptId, allowedDepartments]);

  // ✅ Use single dept if locked, otherwise normal list
  const deptOptions = lockedDept ? [lockedDept] : allowedDepartments;

  useEffect(() => {
    const loadData = async () => {
      await dispatch(fetchAllDepartments());
      await dispatch(fetchAssignedDepartments());
    };

    loadData();
    const handler = () => loadData();

    window.addEventListener("departments-changed", handler);
    return () => window.removeEventListener("departments-changed", handler);
  }, [dispatch]);

  useEffect(() => {
    if (!departments || departments.length === 0) return;

    if (deptId) {
      const matched =
        allowedDepartments.find((d) => String(d.id) === String(deptId)) ||
        allowedDepartments.find((d) => slugFromName(d.name) === String(deptId));

      if (matched && matched.name !== folderName) {
        dispatch(setFolderName(matched.name));
        dispatch(setShortcutKey(matched.shortCode || ""));
      }

      hasLoadedDefaultRef.current = true;
      return;
    }

    if (
      !hasLoadedDefaultRef.current &&
      (!folderName || !folderName.trim()) &&
      allowedDepartments.length > 0
    ) {
      const first = allowedDepartments[0];
      dispatch(setFolderName(first.name));
      dispatch(setShortcutKey(first.shortCode || ""));
      hasLoadedDefaultRef.current = true;
    }
  }, [deptId, departments, allowedDepartments, folderName, dispatch]);

  useEffect(() => {
    const loadDrawings = async () => {
      await dispatch(
        fetchDrawings({
          folderSlug,
          isAdmin,
          assignedDepartmentIds,
          allDepartments,
          deptNameToId,
        }),
      );
    };

    loadDrawings();
  }, [
    folderSlug,
    assignedDepartmentIds,
    dispatch,
    isAdmin,
    allDepartments,
    deptNameToId,
  ]);

  const handleRevisionChange = (raw) => {
    let v = (raw || "").toUpperCase();
    v = v.replace(/[^R0-9]/g, "");
    if (!v.startsWith("R")) v = "R" + v.replace(/R/g, "");
    const digits = v
      .slice(1)
      .replace(/[^0-9]/g, "")
      .slice(0, 2);
    const finalVal = "R" + digits;
    dispatch(setRevisionNo(finalVal || "R0"));
  };

  const handleFolderChange = (value) => {
    dispatch(setFolderName(value));
    const dept = allowedDepartments.find((d) => d.name === value);
    dispatch(setShortcutKey(dept?.shortCode || ""));

    if (!isDeptLocked && typeof onDeptChange === "function" && dept?.id) {
      onDeptChange(dept.id);
    }
  };

  const handleShortcutChange = (value) => {
    dispatch(setShortcutKey(value));
    const dept = allowedDepartments.find(
      (d) => (d.shortCode || "").toUpperCase() === value.toUpperCase(),
    );
    if (dept?.name) dispatch(setFolderName(dept.name));
  };

  const filteredRows = useMemo(() => {
    const q = (search || "").toString().trim().toLowerCase();
    const deptName = (folderName || "").toString().trim();
    const deptShort = (shortcutKey || "").toString().trim().toUpperCase();

    return (rows || []).filter((r) => {
      if (deptName || deptShort) {
        const matchesFolder =
          deptName && (r.folderName || "").toString() === deptName;
        const matchesShortcut =
          deptShort &&
          (r.shortcut || "").toString().toUpperCase() === deptShort;

        if (!matchesFolder && !matchesShortcut) return false;
      }

      if (!q) return true;

      const hay = [
        r.shortcut,
        r.drawingNo,
        r.revisionNo,
        r.description,
        r.fullDrawingNo,
        r.lastActivityAt ? formatDateTime(new Date(r.lastActivityAt)) : null,
        ...(r.files?.pdfFile || []).flatMap((f) => [f.fileName, f.remark]),
        ...(r.files?.xlsxFile || []).flatMap((f) => [f.fileName, f.remark]),
        ...(r.files?.pptFile || []).flatMap((f) => [f.fileName, f.remark]),
        ...(r.files?.lxdFile || []).flatMap((f) => [f.fileName, f.remark]),
        ...(r.files?.mprFile || []).flatMap((f) => [f.fileName, f.remark]),
        ...(r.files?.stpFile || []).flatMap((f) => [f.fileName, f.remark]),
        ...(r.files?.dxfFile || []).flatMap((f) => [f.fileName, f.remark]),
        ...(r.files?.stlFile || []).flatMap((f) => [f.fileName, f.remark]),
        ...(r.files?.sawFile || []).flatMap((f) => [f.fileName, f.remark]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [rows, search, folderName, shortcutKey]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / ROWS_PER_PAGE));

  useEffect(() => {
    if (!hasAutoPagedRef.current && filteredRows.length > 0) {
      dispatch(setCurrentPage(1));
      hasAutoPagedRef.current = true;
    }
  }, [filteredRows.length, pageCount, dispatch]);

  useEffect(() => {
    if (currentPage > pageCount) dispatch(setCurrentPage(pageCount));
  }, [currentPage, pageCount, dispatch]);

  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const pageRows = filteredRows.slice(startIndex, startIndex + ROWS_PER_PAGE);
  const emptyRowsCount = Math.max(0, ROWS_PER_PAGE - pageRows.length);

  const handleDelete = async (id) => {
    if (!canDelete) return alert("Superadmin access required");

    const res = await dispatch(deleteDrawing(id));
    if (deleteDrawing.rejected.match(res)) {
      alert(res.payload || "Delete failed");
      return;
    }

    if (editingId === id) dispatch(resetForm());

    setFiles(makeFilesState(true));
    window.dispatchEvent(new Event("drawings-refresh"));
  };

  const handleEdit = (row) => {
    dispatch(setEditingId(row._id || row.id));
    dispatch(setShortcutKey(row.shortcut || ""));
    dispatch(setDrawingNumber(row.drawingNo || ""));

    const r = row.revisionNo || "R0";
    const formattedRev = r.startsWith("R") ? r.toUpperCase() : `R${r}`;
    dispatch(setRevisionNo(formattedRev));
    dispatch(setDescription(row.description || ""));

    setFiles({
      pdfFile: row.files?.pdfFile || [],
      xlsxFile: row.files?.xlsxFile || [],
      pptFile: row.files?.pptFile || [],
      lxdFile: row.files?.lxdFile || [],
      mprFile: row.files?.mprFile || [],
      stpFile: row.files?.stpFile || [],
      dxfFile: row.files?.dxfFile || [],
      stlFile: row.files?.stlFile || [],
      sawFile: row.files?.sawFile || [],
      fixedFile10: null,
      fixedFile11: null,
      extraFiles: [],
    });

    setUploadResetKey((k) => k + 1);

    const deptMatch = (departments || []).find(
      (d) =>
        (d.shortCode || "").toUpperCase() ===
        (row.shortcut || "").toUpperCase(),
    );

    if (deptMatch) {
      dispatch(setFolderName(deptMatch.name));
      dispatch(setShortcutKey(deptMatch.shortCode));
    }

    window.dispatchEvent(new Event("drawings-refresh"));

    const el = document.getElementById("add-drawing-section");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSaveAction = async (e) => {
    e.preventDefault();
    if (!canEdit) return alert("Insufficient permissions");

    const hasNewFile = Object.values(files).some(
      (arr) =>
        Array.isArray(arr) && arr.some((item) => item?.file instanceof File),
    );

    // ✅ Only block when creating new drawing
    if (editingId == null && !hasNewFile) {
      setFileError("Please select at least one file before saving.");
      return;
    }

    setFileError("");

    if (
      isAdmin &&
      Array.isArray(assignedDepartmentIds) &&
      assignedDepartmentIds.length > 0
    ) {
      const chosenDept = (allDepartments || []).find(
        (d) =>
          d.name === folderName ||
          d.shortCode === (shortcutKey || "").toUpperCase(),
      );

      const chosenId = chosenDept ? chosenDept.id : null;

      if (
        !chosenId ||
        !assignedDepartmentIds.map(String).includes(String(chosenId))
      ) {
        return alert(
          "You are not allowed to save drawings to this department.",
        );
      }
    }

    if (editingId == null) {
      const matchedDept = (departments || []).find(
        (d) =>
          d.name === folderName ||
          d.shortCode === (shortcutKey || "").toUpperCase(),
      );

      if (!matchedDept)
        return alert("Please choose a valid department/folder.");

      const num = (drawingNumber || "").toString().trim();
      const rev =
        revisionNo && /^R\d{0,2}$/.test(revisionNo) ? revisionNo : "R0";
      const full = `${shortcutKey || ""}${num}${rev}`;

      const formData = new FormData();
      formData.append("folderName", folderName);
      formData.append("shortcut", shortcutKey);
      formData.append("drawingNo", num);
      formData.append("revisionNo", rev);
      formData.append("description", description ?? "");
      formData.append("fullDrawingNo", full);

      Object.values(files).forEach((fileArray) => {
        if (!Array.isArray(fileArray)) return;
        fileArray.forEach((item) => {
          if (item?.file instanceof File) {
            formData.append("files", item.file);
            formData.append("remarks", item.remark || "");
          }
        });
      });

      const res = await dispatch(createDrawing(formData));

      if (createDrawing.rejected.match(res)) {
        alert(res.payload || "Create failed");
      } else {
        dispatch(
          fetchDrawings({
            folderSlug,
            isAdmin,
            assignedDepartmentIds,
            allDepartments,
            deptNameToId,
          }),
        );

        dispatch(resetForm());
        setFiles(makeFilesState(false));
        setUploadResetKey((k) => k + 1);
        window.dispatchEvent(new Event("drawings-refresh"));
      }

      return;
    }

    const num = drawingNumber ? String(drawingNumber).trim() : "0";
    const rev = revisionNo && /^R\d{0,2}$/.test(revisionNo) ? revisionNo : "R0";
    const full = `${shortcutKey || ""}${num}${rev}`;

    const formData = new FormData();
    formData.append("folderName", folderName);
    formData.append("shortcut", shortcutKey);
    formData.append("drawingNo", num);
    formData.append("revisionNo", rev);
    formData.append("description", description ?? "");
    formData.append("fullDrawingNo", full);

    [
      files.pdfFile,
      files.xlsxFile,
      files.pptFile,
      files.lxdFile,
      files.mprFile,
      files.stpFile,
      files.dxfFile,
      files.stlFile,
      files.sawFile,
    ].forEach((arr) => {
      if (!Array.isArray(arr)) return;
      arr.forEach((item) => {
        if (item && item.file instanceof File) {
          formData.append("files", item.file);
          formData.append("remarks", item.remark || "");
        }
      });
    });

    const res = await dispatch(
      updateDrawing({ id: editingId, payload: formData }),
    );

    if (updateDrawing.rejected.match(res)) {
      alert(res.payload || "Update failed");
    } else {
      dispatch(
        fetchDrawings({
          folderSlug,
          isAdmin,
          assignedDepartmentIds,
          allDepartments,
          deptNameToId,
        }),
      );

      dispatch(resetForm());
      setFiles(makeFilesState(false));
      setUploadResetKey((k) => k + 1);
      window.dispatchEvent(new Event("drawings-refresh"));
    }
  };

  const handleBackNav = () => {
    if (typeof onBack === "function") return onBack();
    try {
      localStorage.setItem("ui_view", "product");
    } catch {}
    navigate("/home");
  };

  const displayDrawingNo = drawingNumber ? String(drawingNumber) : "";
  const displayFullDrawingNo = `${shortcutKey || ""}${displayDrawingNo || ""}${
    revisionNo || "R0"
  }`;

  const deptSelected =
    (deptId && deptId.toString().trim()) ||
    (folderName && folderName.toString().trim());

  const headers = [
    "Shortcut",
    "Drawing No",
    "Rev",
    "Description",
    "PDF",
    "XLSX",
    "PPT",
    "LXD",
    "MPR",
    "STP",
    "DXF",
    "STL",
    "SAW",
    "Full Drawing No",
    "Activity",
  ];
  if (canViewHistory) headers.push("History");
  if (canEdit) {
    headers.push("Active");
    headers.push("Actions");
  }

  const tdBase = (isLast) =>
    `border-b border-slate-100 px-3 py-2 ${
      isLast ? "" : "border-r border-slate-200"
    }`;

  const thBase = (isLast) =>
    `border-b border-slate-200 px-3 py-3 whitespace-nowrap text-[11px] font-bold text-slate-600 bg-slate-50 ${
      isLast ? "" : "border-r border-slate-200"
    }`;

  const renderEmptyRow = (key) => (
    <tr key={key} className="bg-white">
      {headers.map((_, i) => (
        <td key={i} className={tdBase(i === headers.length - 1)}>
          &nbsp;
        </td>
      ))}
    </tr>
  );

  const LightDot = () => (
    <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300/70" />
  );

  const iconBtnBase =
    "w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center transition active:scale-95 bg-white text-slate-700 hover:bg-slate-50";

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-none px-4 sm:px-6 lg:px-8 py-6">
        {!isSearchMode && canEdit && (
          <div className="mt-6">
            <DrawingManagerForm
              departments={deptOptions}
              folderName={folderName}
              setFolderName={handleFolderChange}
              shortcutKey={shortcutKey}
              setShortcutKey={handleShortcutChange}
              drawingNumber={drawingNumber}
              setDrawingNumber={(val) => dispatch(setDrawingNumber(val))}
              revisionNo={revisionNo}
              setRevisionNo={(val) => dispatch(setRevisionNo(val))}
              description={description}
              setDescription={(val) => dispatch(setDescription(val))}
              mainFileName={mainFileName}
              setMainFileName={(val) => dispatch(setMainFileName(val))}
              editingId={editingId}
              setEditingId={(val) => dispatch(setEditingId(val))}
              resetForm={() => dispatch(resetForm())}
              handleSave={handleSaveAction}
              handleRevisionChange={handleRevisionChange}
              displayDrawingNo={displayDrawingNo}
              displayFullDrawingNo={displayFullDrawingNo}
              handleBack={handleBackNav}
              isDeptLocked={isDeptLocked}
              FileUploadsComponent={
                <FileUploads
                  key={uploadResetKey}
                  files={files}
                  setFiles={setFiles}
                  errorMessage={fileError}
                  displayFullDrawingNo={displayFullDrawingNo}
                />
              }
            />
          </div>
        )}

        <div
          className="
            mt-6
            rounded-[22px]
            border border-slate-200
            bg-white
            shadow-[0_1px_0_rgba(0,0,0,0.03),0_18px_50px_rgba(15,23,42,0.06)]
            overflow-hidden
          "
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 sm:px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-[12px] font-semibold text-slate-400 whitespace-nowrap">
                Showing {filteredRows.length} records
              </div>

              {isSearchMode && (
                <select
                  className="
                    h-10
                    w-48
                    rounded-2xl
                    border border-slate-200
                    bg-white
                    px-3
                    text-[12px] font-semibold text-slate-700
                    shadow-sm
                    outline-none
                    focus:ring-2 focus:ring-[#93C572]/25
                  "
                  value={folderName || ""}
                  onChange={(e) => handleFolderChange(e.target.value)}
                  disabled={!!isDeptLocked || allowedDepartments.length === 0}
                  title={
                    isDeptLocked ? "Department locked" : "Select department"
                  }
                >
                  {allowedDepartments.length === 0 ? (
                    <option value="">No departments</option>
                  ) : (
                    deptOptions.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))
                  )}
                </select>
              )}

              <div className="relative w-71 sm:w-[320px]">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="
                    h-10 w-full
                    rounded-2xl
                    border border-slate-200
                    bg-white
                    pl-9 pr-3
                    text-[13px] font-semibold text-slate-700
                    shadow-sm
                    outline-none
                    placeholder:text-slate-400
                    focus:ring-2 focus:ring-[#93C572]/25
                  "
                  value={search}
                  onChange={(e) => dispatch(setSearch(e.target.value))}
                  placeholder="Search drawings..."
                />
              </div>
            </div>
          </div>

          <div className="max-w-full w-full">
            {deptSelected && filteredRows.length === 0 ? (
              <div className="p-10 text-center">
                <h2 className="text-xl font-bold text-slate-800 mb-2">
                  Please Select file
                </h2>

                <div className="grid grid-cols-6 gap-3 max-w-3xl mx-auto">
                  {FILE_ICONS.map(({ ext, icon: Icon, color }) => (
                    <div
                      key={ext}
                      className="flex flex-col items-center gap-1 p-3 rounded-2xl hover:bg-slate-50 transition"
                    >
                      <Icon className={`text-3xl ${color}`} />
                      <span className="text-[11px] font-semibold text-slate-600">
                        {ext}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* TABLE */}
                <div className="px-3 sm:px-4 py-4 max-w-full overflow-x-auto">
                  <div className="rounded-2xl border border-slate-200 overflow-hidden min-w-fit">
                    <table className="w-full text-[12px] min-w-full sm:min-w-full border-collapse">
                      <thead className="bg-slate-50">
                        <tr>
                          {headers.map((h, idx) => (
                            <th
                              key={h}
                              className={thBase(idx === headers.length - 1)}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {pageRows.map((r) => {
                          const id = r._id || r.id;

                          const renderFileCell = (
                            filesArr = [],
                            cellKey,
                            isLast = false,
                          ) => (
                            <td
                              key={cellKey}
                              className={tdBase(isLast) + " align-top"}
                            >
                              {Array.isArray(filesArr) &&
                              filesArr.length > 0 ? (
                                <div className="flex flex-col gap-2 max-w-44">
                                  {filesArr.map((f, idx2) => (
                                    <div
                                      key={`${cellKey}-${idx2}`}
                                      className="flex flex-col items-center"
                                    >
                                      <a
                                        href={`${API_BASE}/api/file/open/${r._id}/${encodeURIComponent(
                                          f.fileName,
                                        )}?path=${encodeURIComponent(f.filePath)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-700 font-semibold transition truncate max-w-44"
                                        style={{ textDecoration: "none" }}
                                        title={f.fileName}
                                      >
                                        {f.fileName}
                                      </a>

                                      {f.remark && (
                                        <span className="text-[10px] font-semibold text-slate-400 text-center">
                                          {f.remark}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex items-center justify-center py-2">
                                  <LightDot />
                                </div>
                              )}
                            </td>
                          );

                          const activityText = r.lastActivityAt
                            ? formatDateTime(new Date(r.lastActivityAt))
                            : null;
                          const activityParts = activityText
                            ? activityText.split(" - ")
                            : [];

                          const lastColIndex = headers.length - 1;
                          let col = 0;
                          const isLast = () => col === lastColIndex;

                          const nextTd = (content, extraClass = "") => {
                            const out = (
                              <td
                                key={col}
                                className={`${tdBase(isLast())} ${extraClass}`}
                              >
                                {content}
                              </td>
                            );
                            col += 1;
                            return out;
                          };

                          const cells = [];

                          cells.push(
                            nextTd(
                              <div className="flex items-center justify-center">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-700 font-bold bg-white">
                                  {r.shortcut}
                                </span>
                              </div>,
                              "text-center whitespace-nowrap w-[90px]",
                            ),
                          );

                          cells.push(
                            nextTd(
                              <span className="font-semibold text-slate-800">
                                {r.drawingNo}
                              </span>,
                              "text-center whitespace-nowrap w-[90px]",
                            ),
                          );

                          cells.push(
                            nextTd(
                              <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-bold text-[11px]">
                                {r.revisionNo}
                              </span>,
                              "text-center whitespace-nowrap w-[90px]",
                            ),
                          );

                          cells.push(
                            nextTd(
                              <div className="text-left whitespace-normal break-normal leading-snug text-slate-700 font-semibold">
                                {r.description}
                              </div>,
                            ),
                          );

                          // 9 file columns (preserved)
                          cells.push(
                            renderFileCell(r.files?.pdfFile, "pdf", false),
                          );
                          col += 1;
                          cells.push(
                            renderFileCell(r.files?.xlsxFile, "xlsx", false),
                          );
                          col += 1;
                          cells.push(
                            renderFileCell(r.files?.pptFile, "ppt", false),
                          );
                          col += 1;
                          cells.push(
                            renderFileCell(r.files?.lxdFile, "lxd", false),
                          );
                          col += 1;
                          cells.push(
                            renderFileCell(r.files?.mprFile, "mpr", false),
                          );
                          col += 1;
                          cells.push(
                            renderFileCell(r.files?.stpFile, "stp", false),
                          );
                          col += 1;
                          cells.push(
                            renderFileCell(r.files?.dxfFile, "dxf", false),
                          );
                          col += 1;
                          cells.push(
                            renderFileCell(r.files?.stlFile, "stl", false),
                          );
                          col += 1;
                          cells.push(
                            renderFileCell(r.files?.sawFile, "saw", false),
                          );
                          col += 1;

                          cells.push(
                            nextTd(
                              <span className="font-extrabold text-slate-900">
                                {r.fullDrawingNo}
                              </span>,
                              "text-center whitespace-nowrap w-[130px]",
                            ),
                          );

                          cells.push(
                            nextTd(
                              r.lastActivityAt ? (
                                <div className="leading-tight text-center whitespace-nowrap">
                                  <div className="text-[12px] font-semibold text-slate-700">
                                    {activityParts[0] || "—"}
                                  </div>
                                  <div className="text-[10px] font-bold text-slate-400 mt-1">
                                    {activityParts[1] || ""}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center">
                                  <LightDot />
                                </div>
                              ),
                              "text-center w-[110px]",
                            ),
                          );

                          if (canViewHistory) {
                            cells.push(
                              nextTd(
                                <div className="flex items-center justify-center">
                                  <button
                                    type="button"
                                    title="History"
                                    onClick={() =>
                                      navigate(`/history/${r._id || r.id}`)
                                    }
                                    className={iconBtnBase}
                                  >
                                    <FaHistory size={16} />
                                  </button>
                                </div>,
                                "text-center",
                              ),
                            );
                          }

                          if (canEdit) {
                            cells.push(
                              nextTd(
                                <div className="flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleToggleActive(r._id || r.id)
                                    }
                                    title={r.active ? "On" : "Off"}
                                    className={`
                                      relative inline-flex h-6 w-11 items-center rounded-full
                                      border transition active:scale-95
                                      ${
                                        r.active
                                          ? "bg-emerald-500 border-emerald-500"
                                          : "bg-slate-200 border-slate-200"
                                      }
                                    `}
                                  >
                                    <span
                                      className={`
                                        inline-block h-5 w-5 rounded-full bg-white shadow
                                        transform transition
                                        ${r.active ? "translate-x-5" : "translate-x-1"}
                                      `}
                                    />
                                  </button>
                                </div>,
                                "text-center w-[90px]",
                              ),
                            );
                          }

                          if (canEdit) {
                            cells.push(
                              nextTd(
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    title="Update"
                                    onClick={() => handleEdit(r)}
                                    className={iconBtnBase}
                                  >
                                    <FaEdit size={16} />
                                  </button>

                                  {canDelete && (
                                    <button
                                      type="button"
                                      title="Delete"
                                      onClick={() => handleDelete(id)}
                                      className={iconBtnBase}
                                    >
                                      <FaTrashAlt size={16} />
                                    </button>
                                  )}
                                </div>,
                                "text-center whitespace-nowrap w-[110px]",
                              ),
                            );
                          }

                          return (
                            <tr
                              key={id}
                              className="bg-white hover:bg-slate-50/50 transition"
                            >
                              {cells}
                            </tr>
                          );
                        })}

                        {pageRows.length === 0 && (rows || []).length === 0 && (
                          <tr>
                            <td
                              colSpan={headers.length}
                              className="px-2 py-10 text-center text-slate-500 font-semibold"
                            >
                              No drawings found.
                            </td>
                          </tr>
                        )}

                        {pageRows.length > 0 &&
                          Array.from({ length: emptyRowsCount }).map((_, idx) =>
                            renderEmptyRow(`empty-${idx}`),
                          )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* FOOTER pagination */}
                <div className="flex items-center justify-end px-6 pb-6">
                  <div className="flex flex-wrap items-center justify-end gap-2 text-[12px]">
                    <button
                      className="px-4 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                      onClick={() => dispatch(setCurrentPage(1))}
                      disabled={currentPage === 1}
                    >
                      First
                    </button>

                    <button
                      className="px-4 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                      onClick={() =>
                        dispatch(
                          setCurrentPage(currentPage > 1 ? currentPage - 1 : 1),
                        )
                      }
                      disabled={currentPage === 1}
                    >
                      Prev
                    </button>

                    {Array.from({ length: pageCount }).map((_, i) => {
                      const p = i + 1;

                      if (
                        pageCount > 8 &&
                        Math.abs(currentPage - p) > 2 &&
                        p !== 1 &&
                        p !== pageCount
                      ) {
                        return null;
                      }

                      if (pageCount > 8 && Math.abs(currentPage - p) === 3) {
                        return (
                          <span
                            key={p}
                            className="px-1 text-slate-400 font-bold"
                          >
                            ..
                          </span>
                        );
                      }

                      const isActive = p === currentPage;

                      return (
                        <button
                          key={p}
                          className={`
                            w-10 h-10
                            rounded-xl
                            border
                            font-extrabold
                            ${
                              isActive
                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }
                          `}
                          onClick={() => dispatch(setCurrentPage(p))}
                        >
                          {p}
                        </button>
                      );
                    })}

                    <button
                      className="px-4 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                      onClick={() =>
                        dispatch(
                          setCurrentPage(
                            currentPage < pageCount
                              ? currentPage + 1
                              : pageCount,
                          ),
                        )
                      }
                      disabled={currentPage === pageCount}
                    >
                      Next
                    </button>

                    <button
                      className="px-4 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                      onClick={() => dispatch(setCurrentPage(pageCount))}
                      disabled={currentPage === pageCount}
                    >
                      Last
                    </button>
                  </div>
                </div>
              </>
            )}

            {isSearchMode && (
              <div className="flex justify-end px-6 pb-6">
                <button
                  type="button"
                  onClick={handleBackNav}
                  className="h-10 px-6 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-[12px] font-extrabold transition"
                >
                  Back
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
