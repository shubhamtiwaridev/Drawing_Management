import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setFolderName,
  setShortcutKey,
  setDrawingNumber,
  setRevisionNo,
  setDescription,
  resetForm,
} from "../store/drawingSlice";
import { getCurrentUser } from "../utils/storage";

export default function DrawingManager({
  departments,
  handleSave,
  handleBack,
  FileUploadsComponent,
  isDeptLocked,
}) {
  const dispatch = useDispatch();

  const {
    folderName,
    shortcutKey,
    revisionNo,
    description,
    editingId,
    drawingNumber,
  } = useSelector((state) => state.drawingManager);

  const user = getCurrentUser();
  const role = (user?.role || "user").toLowerCase();
  if (role === "user") return null;

  const pistachio = "#93C572";
  const [fullTail, setFullTail] = useState("");
  const [revTouched, setRevTouched] = useState(false);
  const prevEditingIdRef = useRef(null);

  useEffect(() => {
    const prev = prevEditingIdRef.current;
    if (prev && !editingId) {
      setFullTail("");
      setRevTouched(false);
    }
    prevEditingIdRef.current = editingId;
  }, [editingId]);

  useEffect(() => {
    const rev = (revisionNo || "R0").toString().toUpperCase();
    if (
      !editingId &&
      !drawingNumber &&
      !description &&
      (rev === "R0" || rev === "R")
    ) {
      setFullTail("");
      setRevTouched(false);
    }
  }, [editingId, drawingNumber, revisionNo, description]);

  useEffect(() => {
    if (!editingId) return;
    const rev = (revisionNo || "R0").toString().toUpperCase();
    const revUi = rev === "R0" ? "R" : rev;
    setFullTail(`${drawingNumber || ""}${revUi}`);
  }, [editingId, drawingNumber, revisionNo]);

  const handleFolderChange = (value) => {
    dispatch(setFolderName(value));
    const dept = (departments || []).find((d) => d.name === value);
    if (dept) dispatch(setShortcutKey(dept.shortCode || ""));
  };

  const handleShortcutChange = (value) => {
    dispatch(setShortcutKey(value));
    const dept = (departments || []).find(
      (d) => (d.shortCode || "").toUpperCase() === (value || "").toUpperCase(),
    );
    if (dept) dispatch(setFolderName(dept.name));
  };

  const handleRevisionChange = (raw) => {
    setRevTouched(true);
    let v = (raw || "")
      .toString()
      .toUpperCase()
      .replace(/[^R0-9]/g, "");
    if (!v.startsWith("R")) v = "R" + v.replace(/R/g, "");
    const digits = v
      .slice(1)
      .replace(/[^0-9]/g, "")
      .slice(0, 2);

    dispatch(setRevisionNo(digits ? `R${digits}` : "R0"));

    const tail = (fullTail || "").toString().toUpperCase();
    const rIdx = tail.indexOf("R");
    const numPart =
      rIdx >= 0
        ? tail.slice(0, rIdx).replace(/[^0-9]/g, "")
        : tail.replace(/[^0-9]/g, "");

    if (!numPart && !tail.includes("R")) return;

    setFullTail(`${numPart}${digits ? `R${digits}` : "R"}`);
  };

  const handleFullTailChange = (raw) => {
    let v = (raw || "").toString().toUpperCase();
    v = v.replace(/[^0-9R]/g, "");

    const rPos = v.indexOf("R");

    if (rPos >= 0) {
      const numPart = v.slice(0, rPos).replace(/[^0-9]/g, "");
      const revDigits = v
        .slice(rPos + 1)
        .replace(/[^0-9]/g, "")
        .slice(0, 2);

      const shown = revDigits ? `${numPart}R${revDigits}` : `${numPart}R`;
      setFullTail(shown);

      dispatch(setDrawingNumber(numPart));
      setRevTouched(true);
      dispatch(setRevisionNo(revDigits ? `R${revDigits}` : "R0"));
      return;
    }
    const onlyNum = v.replace(/[^0-9]/g, "");
    setFullTail(onlyNum);
    dispatch(setDrawingNumber(onlyNum));
  };

  const revNorm = (revisionNo || "R0").toString().toUpperCase();
  const revUiValue = revNorm === "R0" ? "R" : revNorm;

  const LABEL = "block mb-2 text-[12px] font-bold text-slate-700";

  const CARD =
    "rounded-[28px] bg-white border border-slate-200/70 shadow-[0_1px_0_rgba(0,0,0,0.03),0_18px_50px_rgba(15,23,42,0.06)]";

  const SAME_HEIGHT = "min-h-[460px] h-full";

  return (
    <div id="add-drawing-section" className="w-full">
      <div className="mb-5" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT: FILE UPLOADS */}
        <div className="lg:col-span-8 flex">
          <div className={`${CARD} p-6 w-full flex flex-col ${SAME_HEIGHT}`}>
            <div className="flex-1">{FileUploadsComponent}</div>
          </div>
        </div>

        {/* RIGHT: FORM */}
        <div className="lg:col-span-4 flex">
          <form
            id="drawing-form"
            onSubmit={handleSave}
            className={`${CARD} p-6 w-full flex flex-col ${SAME_HEIGHT}`}
          >
            <div className="flex-1 space-y-4">
              <div>
                <label className={LABEL}>Folder Name</label>

                {!isDeptLocked ? (
                  <select
                    value={folderName}
                    onChange={(e) => handleFolderChange(e.target.value)}
                    disabled={isDeptLocked}
                    className="h-11 w-full rounded-2xl border border-slate-200/70 bg-slate-50/70 px-4 text-sm font-semibold text-slate-800 outline-none"
                    style={{ "--tw-ring-color": pistachio }}
                    required
                  >
                    <option value="">Select folder...</option>
                    {(departments || []).map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="h-11 w-full rounded-2xl border border-slate-200/70 bg-slate-100 px-4 text-sm font-semibold text-slate-800 outline-none"
                    value={folderName}
                    readOnly
                  />
                )}
              </div>

              {/* Shortcut + Revision */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Shortcut</label>
                  <select
                    value={shortcutKey}
                    onChange={(e) => handleShortcutChange(e.target.value)}
                    disabled={isDeptLocked}
                    className="h-11 w-full rounded-2xl border border-slate-200/70 bg-slate-50/70 px-4 text-sm font-semibold text-slate-800 outline-none"
                    style={{ "--tw-ring-color": pistachio }}
                  >
                    <option value="">Type</option>
                    {(departments || []).map((d) => (
                      <option key={d.id} value={d.shortCode}>
                        {d.shortCode}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ✅ Revision No: simple centered "R" */}
                <div>
                  <label className={LABEL}>Revision No</label>
                  <input
                    className="h-11 w-full rounded-2xl border border-slate-200/70 bg-white px-4 text-sm font-semibold text-slate-800 outline-none focus:ring-2 text-center"
                    style={{ "--tw-ring-color": pistachio }}
                    value={revTouched || editingId ? revUiValue : "R"}
                    onChange={(e) => handleRevisionChange(e.target.value)}
                    maxLength={3}
                    inputMode="text"
                  />
                </div>
              </div>

              {/* ✅ Full Drawing No */}
              <div>
                <label className={LABEL}>Full Drawing No</label>

                <div className="h-11 w-full overflow-hidden rounded-2xl border border-slate-200/70 bg-white flex">
                  <div className="px-4 flex items-center bg-slate-100 text-slate-800 font-extrabold border-r border-slate-200/70">
                    {shortcutKey || ""}
                  </div>

                  <input
                    className="flex-1 px-4 text-sm font-semibold text-slate-800 outline-none text-center"
                    value={fullTail}
                    onChange={(e) => handleFullTailChange(e.target.value)}
                    placeholder=""
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={LABEL}>Description</label>
                <textarea
                  className="w-full min-h-12 rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 resize-none"
                  style={{ "--tw-ring-color": pistachio }}
                  value={description}
                  onChange={(e) => dispatch(setDescription(e.target.value))}
                  placeholder="Optional description..."
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-4 flex items-center justify-end gap-3">
              {editingId && (
                <button
                  type="button"
                  onClick={() => dispatch(resetForm())}
                  className="h-11 px-6 rounded-2xl border border-slate-200/70 bg-white text-sm font-extrabold text-slate-700 hover:shadow-md transition"
                >
                  Reset
                </button>
              )}

              <button
                type="submit"
                className="h-11 px-8 rounded-2xl text-sm font-extrabold text-white shadow-sm hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 transition"
                style={{ backgroundColor: pistachio }}
              >
                {editingId ? "Update Drawing" : "Save Drawing"}
              </button>

              <button
                type="button"
                onClick={handleBack}
                className="h-11 px-6 rounded-2xl bg-rose-500 text-white text-sm font-extrabold hover:bg-rose-600 hover:shadow-md transition"
              >
                Back
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
