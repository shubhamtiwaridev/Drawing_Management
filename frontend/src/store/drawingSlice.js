import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getCurrentUser } from "../utils/storage";

// --- Helpers ---
async function parseErrorResponse(res) {
  try {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      return json.message || "Request failed";
    } catch {
      return text || "Request failed";
    }
  } catch {
    return "Request failed";
  }
}

function normalizeDepartments(data) {
  const arr = Array.isArray(data) ? data : [];
  return arr
    .map((d) => ({
      id: d.id || d._id,
      name: (d.name || "").toString().trim(),
      shortCode: (d.shortCode || "").toString().toUpperCase(),
    }))
    .filter((d) => d.name);
}

const getAuthHeaders = () => {
  const user = getCurrentUser();
  return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
};

const normalizeDrawingFiles = (row) => ({
  ...row,

  pdfFile: row.files?.pdfFile || [],
  xlsxFile: row.files?.xlsxFile || [],
  pptFile: row.files?.pptFile || [],
  lxdFile: row.files?.lxdFile || [],
  mprFile: row.files?.mprFile || [],
  stpFile: row.files?.stpFile || [],
  dxfFile: row.files?.dxfFile || [],
  stlFile: row.files?.stlFile || [],
  sawFile: row.files?.sawFile || [],
});

// --- Thunks ---

export const fetchAllDepartments = createAsyncThunk(
  "drawingManager/fetchAllDepartments",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/departments", {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to fetch departments");
      const body = await res.json();
      return normalizeDepartments(Array.isArray(body?.data) ? body.data : body);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const fetchAssignedDepartments = createAsyncThunk(
  "drawingManager/fetchAssignedDepartments",
  async (_, { rejectWithValue }) => {
    const currentUser = getCurrentUser();
    const currentUserId = currentUser?.id || currentUser?._id;
    const role = (currentUser?.role || "user").toLowerCase();

    if (!currentUserId || (role !== "admin" && role !== "subadmin")) return [];

    try {
      const res = await fetch(
        `/api/users/${currentUserId}/assigned-departments`,
        { headers: getAuthHeaders() },
      );
      if (!res.ok) throw new Error("Failed");
      const body = await res.json();
      if (Array.isArray(body)) {
        return body
          .map((d) => (typeof d === "object" ? d.id || d._id : d))
          .filter(Boolean);
      }
      return Array.isArray(body.departmentIds) ? body.departmentIds : [];
    } catch (err) {
      const fallback =
        currentUser?.assignedDepartmentIds ||
        currentUser?.assignedDepartments ||
        null;
      return Array.isArray(fallback) ? fallback : [];
    }
  },
);

export const fetchDrawings = createAsyncThunk(
  "drawingManager/fetchDrawings",
  async (
    {
      folderSlug,
      isAdmin,
      assignedDepartmentIds,
      allDepartments,
      deptNameToId,
    },
    { rejectWithValue },
  ) => {
    try {
      const params = new URLSearchParams({ folderSlug, limit: 1000 });
      const res = await fetch(`/api/drawings?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch drawings");
      const body = await res.json();
      const items = Array.isArray(body?.data)
        ? body.data
        : Array.isArray(body)
          ? body
          : [];

      let filtered = items;
      if (isAdmin && Array.isArray(assignedDepartmentIds)) {
        const assignedSet = new Set(assignedDepartmentIds.map(String));
        filtered = items.filter((it) => {
          const deptId =
            it.departmentId || it.department || it.deptId || it.dept || null;
          if (deptId) return assignedSet.has(String(deptId));
          if (it.folderName) {
            const id = deptNameToId[it.folderName];
            if (id) return assignedSet.has(String(id));
          }
          if (it.shortcut) {
            const match = allDepartments.find(
              (d) =>
                (d.shortCode || "").toUpperCase() ===
                (it.shortcut || "").toUpperCase(),
            );
            if (match && match.id) return assignedSet.has(String(match.id));
          }
          return false;
        });
      }
      return filtered;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const createDrawing = createAsyncThunk(
  "drawingManager/create",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/drawings", {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      if (!res.ok) {
        const message = await parseErrorResponse(res);
        return rejectWithValue(message);
      }

      return await res.json();
    } catch (err) {
      return rejectWithValue(err.message || "Create failed");
    }
  },
);

export const updateDrawing = createAsyncThunk(
  "drawingManager/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/drawings/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: payload,
      });

      if (!res.ok) {
        const message = await parseErrorResponse(res);
        return rejectWithValue(message);
      }

      return await res.json();
    } catch (err) {
      return rejectWithValue(err.message || "Update failed");
    }
  },
);

export const deleteDrawing = createAsyncThunk(
  "drawingManager/delete",
  async (id, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/drawings/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const message = await parseErrorResponse(res);
        return rejectWithValue(message);
      }

      return id;
    } catch (err) {
      return rejectWithValue(err.message || "Delete failed");
    }
  },
);

export const toggleDrawingActive = createAsyncThunk(
  "drawingManager/toggleActive",
  async (id, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/drawings/${id}/toggle-active`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const message = await parseErrorResponse(res);
        return rejectWithValue(message);
      }

      const body = await res.json();
      return body.data;
    } catch (err) {
      return rejectWithValue(err.message || "Toggle failed");
    }
  },
);

const initialState = {
  rows: [],
  allDepartments: [],
  departments: [],
  deptNameToId: {},
  assignedDepartmentIds: [],
  loading: false,
  search: "",
  currentPage: 1,
  folderName: "",
  shortcutKey: "",
  drawingNumber: "",
  revisionNo: "R0",
  description: "",
  notes: "",
  mainFileName: "",
  editingId: null,
};

const drawingSlice = createSlice({
  name: "drawingManager",
  initialState,
  reducers: {
    setSearch: (state, action) => {
      state.search = action.payload;
      state.currentPage = 1;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    setFolderName: (state, action) => {
      state.folderName = action.payload;
    },
    setShortcutKey: (state, action) => {
      state.shortcutKey = action.payload;
    },
    setDrawingNumber: (state, action) => {
      state.drawingNumber = action.payload;
    },
    setRevisionNo: (state, action) => {
      state.revisionNo = action.payload;
    },
    setDescription: (state, action) => {
      state.description = action.payload;
    },
    setNotes: (state, action) => {
      state.notes = action.payload;
    },
    setMainFileName: (state, action) => {
      state.mainFileName = action.payload;
    },
    setEditingId: (state, action) => {
      state.editingId = action.payload;
    },

    resetForm: (state) => {
      state.drawingNumber = "";
      state.revisionNo = "R0";
      state.description = "";
      state.notes = "";
      state.mainFileName = "";
      state.editingId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllDepartments.fulfilled, (state, action) => {
        state.allDepartments = action.payload;
        const map = {};
        action.payload.forEach((d) => {
          if (d?.name && d?.id) map[d.name] = d.id;
        });
        state.deptNameToId = map;
        state.departments = action.payload;
      })
      .addCase(fetchAssignedDepartments.fulfilled, (state, action) => {
        state.assignedDepartmentIds = Array.isArray(action.payload)
          ? action.payload
          : [];
      })
      .addCase(fetchDrawings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDrawings.fulfilled, (state, action) => {
        state.loading = false;

        const ts = (x) => {
          const v =
            x?.lastActivityAt ||
            x?.updatedAt ||
            x?.createdAt ||
            x?.created_at ||
            x?.createdOn ||
            null;
          const t = v ? new Date(v).getTime() : NaN;
          return Number.isFinite(t) ? t : -Infinity;
        };

        // ✅ newest first (first come first serve in display)
        state.rows = action.payload
          .map(normalizeDrawingFiles)
          .sort((a, b) => ts(b) - ts(a));
      })
      .addCase(fetchDrawings.rejected, (state) => {
        state.loading = false;
        state.rows = [];
      })
      .addCase(createDrawing.pending, (state) => {
        state.loading = true;
      })
      .addCase(createDrawing.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createDrawing.rejected, (state) => {
        state.loading = false;
      })
      .addCase(updateDrawing.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateDrawing.fulfilled, (state, action) => {
        state.loading = false;

        const updated = action.payload.data || action.payload;
        const updatedId = updated._id || updated.id;

        const index = state.rows.findIndex(
          (r) => (r._id || r.id) === updatedId,
        );

        if (index !== -1) {
          state.rows[index] = normalizeDrawingFiles(updated);
        }
      })
      .addCase(updateDrawing.rejected, (state) => {
        state.loading = false;
      })
      .addCase(deleteDrawing.fulfilled, (state, action) => {
        state.rows = state.rows.filter(
          (r) => (r._id || r.id) !== action.payload,
        );
      })
      .addCase(toggleDrawingActive.fulfilled, (state, action) => {
        const updated = action.payload;
        const updatedId = updated._id || updated.id;

        const index = state.rows.findIndex(
          (r) => (r._id || r.id) === updatedId,
        );

        if (index !== -1) {
          state.rows[index] = normalizeDrawingFiles(updated);
        }
      });
  },
});

export const {
  setSearch,
  setCurrentPage,
  setFolderName,
  setShortcutKey,
  setDrawingNumber,
  setRevisionNo,
  setDescription,
  setNotes,
  setMainFileName,
  setEditingId,
  resetForm,
} = drawingSlice.actions;

export default drawingSlice.reducer;
