// FileUploads.jsx
import React from "react";
import { useDispatch } from "react-redux";
import { setMainFileName } from "../store/drawingSlice";

import {
  FaFilePdf,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileAlt,
  FaUpload,
} from "react-icons/fa";
import { SiAutodesk, SiDassaultsystemes } from "react-icons/si";

const FILE_CONFIG = [
  { key: "pdf", label: "PDF File", stateKey: "pdfFile", Icon: FaFilePdf },
  { key: "xlsx", label: "XLSX File", stateKey: "xlsxFile", Icon: FaFileExcel },
  {
    key: "ppt",
    label: "PPT File",
    stateKey: "pptFile",
    Icon: FaFilePowerpoint,
  },
  { key: "lxd", label: "LXD File", stateKey: "lxdFile", Icon: SiAutodesk },
  { key: "mpr", label: "MPR File", stateKey: "mprFile", Icon: SiAutodesk },
  {
    key: "stp",
    label: "STP File",
    stateKey: "stpFile",
    Icon: SiDassaultsystemes,
  },
  { key: "dxf", label: "DXF File", stateKey: "dxfFile", Icon: SiAutodesk },
  {
    key: "stl",
    label: "STL File",
    stateKey: "stlFile",
    Icon: SiDassaultsystemes,
  },
  { key: "saw", label: "SAW File", stateKey: "sawFile", Icon: FaFileAlt },
  {
    key: "fix10",
    label: "Extra File 1",
    stateKey: "fixedFile10",
    Icon: FaUpload,
  },
  {
    key: "fix11",
    label: "Extra File 2",
    stateKey: "fixedFile11",
    Icon: FaUpload,
  },
];

function getSelectedNames(list) {
  const arr = Array.isArray(list) ? list : [];
  return arr
    .map((x) => {
      if (x?.file instanceof File) return x.file.name;
      if (x?.fileName) return x.fileName;
      return "";
    })
    .filter(Boolean);
}

function renderNames(names) {
  if (!names.length) return null;

  const firstTwo = names.slice(0, 2);
  const remaining = names.length - firstTwo.length;

  return (
    <div className="w-full">
      <div className="text-[11px] font-bold text-slate-700 leading-tight truncate">
        {firstTwo[0]}
      </div>

      {firstTwo[1] && (
        <div className="text-[10px] font-semibold text-slate-500 leading-tight truncate">
          {firstTwo[1]}
        </div>
      )}

      {remaining > 0 && (
        <div className="text-[9px] font-semibold text-slate-400 mt-0.5">
          +{remaining} more
        </div>
      )}
    </div>
  );
}

export default function FileUploads({ files, setFiles, errorMessage }) {
  const dispatch = useDispatch();

  const handleFileChange = (stateKey, fileList, key) => {
    const selectedFiles = Array.from(fileList || []);

    if (!selectedFiles.length) {
      setFiles((prev) => ({ ...prev, [stateKey]: [] }));
      return;
    }

    if (key === "pdf") {
      dispatch(setMainFileName(selectedFiles[0].name));
    }

    setFiles((prev) => ({
      ...prev,
      [stateKey]: selectedFiles.map((file) => ({ file, remark: "" })),
    }));
  };

  const handleRemarkChange = (stateKey, index, value) => {
    setFiles((prev) => {
      const updated = [...(prev[stateKey] || [])];
      updated[index] = { ...updated[index], remark: value };
      return { ...prev, [stateKey]: updated };
    });
  };

  const TITLE = "text-[12px] font-bold text-slate-700 mb-2";

  return (
    <>
      {errorMessage && (
        <div className="mb-3 text-center text-red-500 text-[13px] font-semibold">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {FILE_CONFIG.map(({ key, stateKey }) => {
          const fileList = files[stateKey] || [];
          const rows = fileList.length ? fileList : [{}];
          const selectedNames = getSelectedNames(fileList);

          return (
            <div
              key={key}
              className="
                rounded-[26px]
                border border-slate-200/70
                bg-white
                shadow-[0_1px_0_rgba(0,0,0,0.03),0_14px_35px_rgba(15,23,42,0.06)]
                px-4 py-3
                transition-all duration-300
                hover:-translate-y-0.5 hover:shadow-[0_1px_0_rgba(0,0,0,0.03),0_20px_45px_rgba(15,23,42,0.10)]
              "
            >
              <div
                className="
                  relative
                  rounded-2xl
                  border border-dashed border-slate-200
                  bg-slate-50/60
                  px-3 py-1.5
                "
              >
                <input
                  type="file"
                  multiple
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) =>
                    handleFileChange(stateKey, e.target.files, key)
                  }
                />

                <div className="flex items-center justify-center gap-2 py-1">
                  <FaUpload className="text-slate-400" size={12} />

                  {!selectedNames.length ? (
                    <div className="text-center leading-tight">
                      <div className="text-[11px] font-bold text-slate-700">
                        Choose File
                      </div>
                      <div className="text-[9px] font-semibold text-slate-400">
                        Click to browse
                      </div>
                    </div>
                  ) : (
                    <div className="min-w-0 flex-1">
                      {renderNames(selectedNames)}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-2 space-y-2">
                {rows.map((item, idx) => {
                  const hasFile =
                    item?.file instanceof File || !!item?.fileName;

                  return (
                    <div key={idx}>
                      <input
                        type="text"
                        value={item?.remark || ""}
                        placeholder="Remark (required)"
                        disabled={!hasFile}
                        required={hasFile}
                        onChange={(e) =>
                          handleRemarkChange(stateKey, idx, e.target.value)
                        }
                        className={`
                          w-full h-9 rounded-2xl
                          border border-slate-200/70
                          px-3 text-[11px] font-semibold
                          bg-white placeholder:text-slate-400
                          focus:outline-none focus:ring-2 focus:ring-[#93C572]/35
                          ${hasFile && !item?.remark ? "border-rose-300 bg-rose-50/40" : ""}
                          disabled:bg-slate-100
                        `}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* extra files */}
        {files.extraFiles?.map((item, idx) => {
          const selectedName =
            item?.file instanceof File ? item.file.name : item?.fileName || "";

          return (
            <div
              key={`extra-${idx}`}
              className="
                rounded-[26px]
                border border-slate-200/70
                bg-white
                shadow-[0_1px_0_rgba(0,0,0,0.03),0_14px_35px_rgba(15,23,42,0.06)]
                px-4 py-3
                transition-all duration-300
                hover:-translate-y-0.5 hover:shadow-[0_1px_0_rgba(0,0,0,0.03),0_20px_45px_rgba(15,23,42,0.10)]
              "
            >
              <div className={TITLE}>Extra Upload</div>

              <div
                className="
                  relative
                  rounded-2xl
                  border border-dashed border-slate-200
                  bg-slate-50/60
                  px-3 py-1.5
                "
              >
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    setFiles((prev) => {
                      const updated = [...prev.extraFiles];
                      updated[idx] = { file, remark: "" };
                      return { ...prev, extraFiles: updated };
                    });
                  }}
                />

                <div className="flex items-center justify-center gap-2 py-1">
                  <FaUpload className="text-slate-400" size={12} />

                  {!selectedName ? (
                    <div className="text-center leading-tight">
                      <div className="text-[11px] font-bold text-slate-700">
                        Choose File
                      </div>
                      <div className="text-[9px] font-semibold text-slate-400">
                        Click to browse
                      </div>
                    </div>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-slate-700 leading-tight truncate">
                        {selectedName}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <input
                type="text"
                value={item.remark || ""}
                placeholder="Remark (required)"
                onChange={(e) => {
                  const value = e.target.value;
                  setFiles((prev) => {
                    const updated = [...prev.extraFiles];
                    updated[idx] = { ...updated[idx], remark: value };
                    return { ...prev, extraFiles: updated };
                  });
                }}
                className="
                  mt-2 w-full h-9 rounded-2xl border border-slate-200/70 px-3
                  text-[11px] font-semibold bg-white placeholder:text-slate-400
                  focus:outline-none focus:ring-2 focus:ring-[#93C572]/35
                "
              />

              <button
                type="button"
                onClick={() =>
                  setFiles((prev) => ({
                    ...prev,
                    extraFiles: prev.extraFiles.filter((_, i) => i !== idx),
                  }))
                }
                className="mt-2 text-[11px] font-semibold text-rose-600 hover:text-rose-700 transition"
              >
                Remove
              </button>
            </div>
          );
        })}

        {/* add another */}
        <button
          type="button"
          onClick={() =>
            setFiles((prev) => ({
              ...prev,
              extraFiles: [
                ...(prev.extraFiles || []),
                { file: null, remark: "" },
              ],
            }))
          }
          className="
            rounded-[26px]
            border border-slate-200/70
            bg-white
            shadow-[0_1px_0_rgba(0,0,0,0.03),0_14px_35px_rgba(15,23,42,0.06)]
            px-4 py-3
            flex items-center justify-center
            text-[12px] font-bold
            text-slate-700
            transition-all duration-300
            hover:-translate-y-0.5 hover:shadow-[0_1px_0_rgba(0,0,0,0.03),0_20px_45px_rgba(15,23,42,0.10)]
          "
        >
          + Add another file
        </button>
      </div>
    </>
  );
}
