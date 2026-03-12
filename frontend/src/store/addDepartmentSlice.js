// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axios from "axios";

// // Helper functions from original component
// const formatDeptName = (name = "") => {
//   return name
//     .trim()
//     .split(/\s+/)
//     .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
//     .join(" ");
// };

// const normalizeDepartments = (data) => {
//   const arr = Array.isArray(data) ? data : [];
//   return arr
//     .map((d) => ({
//       id: d.id || d._id,
//       name: formatDeptName(d.name || ""),
//       shortCode: (d.shortCode || "").toString().toUpperCase(),
//       startingCounter: d.startingCounter ?? "",
//       uploadTimes: d.uploadTimes ?? 0,
//       currentNo: d.currentNo ?? "",
//       createdAt: d.createdAt || null,
//     }))
//     .filter((d) => d.name.trim())
//     .sort((a, b) => a.name.localeCompare(b.name));
// };

// // Async thunks
// export const loadDepartments = createAsyncThunk(
//   "addDepartment/loadDepartments",
//   async (_, { rejectWithValue }) => {
//     try {
//       const res = await axios.get("/api/departments", {
//         withCredentials: true,
//       });
//       return normalizeDepartments(res.data);
//     } catch (err) {
//       console.error("Failed to load departments:", err);
//       return rejectWithValue(err.message);
//     }
//   }
// );

// export const saveDepartment = createAsyncThunk(
//   "addDepartment/saveDepartment",
//   async ({ editingId, payload }, { rejectWithValue, dispatch }) => {
//     try {
//       let response;

//       if (editingId) {
//         // Update department
//         response = await axios.patch(`/api/departments/${editingId}`, payload, {
//           withCredentials: true,
//         });
//       } else {
//         // Create department
//         response = await axios.post("/api/departments", payload, {
//           withCredentials: true,
//         });

//         // Store in localStorage for custom departments
//         if (response?.data?.success) {
//           try {
//             const stored = JSON.parse(
//               localStorage.getItem("custom_departments") || "[]"
//             );
//             const arr = Array.isArray(stored) ? stored : [];
//             const name = payload.name;

//             const exists = arr.some(
//               (d) => (d.name || "").toLowerCase() === name.toLowerCase()
//             );
//             if (!exists) {
//               arr.push({ name });
//               localStorage.setItem("custom_departments", JSON.stringify(arr));
//             }
//           } catch (e) {
//             console.warn("Failed to update localStorage:", e);
//           }
//         }
//       }

//       // Dispatch events for other components
//       window.dispatchEvent(new Event("departments-changed"));

//       // Reload departments list
//       dispatch(loadDepartments());

//       return {
//         type: editingId ? "update" : "create",
//         data: response.data,
//         editingId,
//       };
//     } catch (err) {
//       console.error("Save department failed:", err);
//       return rejectWithValue(
//         err.response?.data?.message || "Failed to save department."
//       );
//     }
//   }
// );

// export const deleteDepartment = createAsyncThunk(
//   "addDepartment/deleteDepartment",
//   async ({ id, name }, { rejectWithValue, dispatch }) => {
//     try {
//       await axios.delete(`/api/departments/${id}`, {
//         withCredentials: true,
//       });

//       // Dispatch events for other components
//       window.dispatchEvent(new Event("departments-changed"));
//       window.dispatchEvent(new Event("users-changed"));

//       // Reload departments list
//       dispatch(loadDepartments());

//       return { id, name };
//     } catch (err) {
//       console.error("Delete department failed:", err);
//       return rejectWithValue(
//         err.response?.data?.message || "Failed to delete department."
//       );
//     }
//   }
// );

// // Initial state
// const initialState = {
//   departments: [],
//   formData: {
//     deptName: "",
//     shortCode: "",
//     startingCounter: "",
//   },
//   loading: false,
//   tableLoading: false,
//   message: "",
//   msgType: "info",
//   search: "",
//   editingId: null,
//   page: 1,
//   PAGE_SIZE: 7,
// };

// const addDepartmentSlice = createSlice({
//   name: "addDepartment",
//   initialState,
//   reducers: {
//     setDeptName: (state, action) => {
//       state.formData.deptName = action.payload;
//     },
//     setShortCode: (state, action) => {
//       state.formData.shortCode = action.payload.toUpperCase().slice(0, 2);
//     },
//     setStartingCounter(state, action) {
//       state.formData.startingCounter = action.payload;
//     },

//     setSearch: (state, action) => {
//       state.search = action.payload;
//       // Reset to first page when search changes
//       state.page = 1;
//     },
//     setPage: (state, action) => {
//       state.page = action.payload;
//     },
//     setEditingId: (state, action) => {
//       state.editingId = action.payload;
//     },
//     setMessage: (state, action) => {
//       state.message = action.payload.message;
//       state.msgType = action.payload.msgType;
//     },
//     clearMessage: (state) => {
//       state.message = "";
//       state.msgType = "info";
//     },
//     resetForm: (state) => {
//       state.editingId = null;
//       state.formData.deptName = "";
//       state.formData.shortCode = "";
//       state.formData.startingCounter = "";
//       state.message = "";
//       state.msgType = "info";
//     },
//     setEditForm: (state, action) => {
//       const dept = action.payload;

//       state.editingId = dept.id;
//       state.formData.deptName = dept.name;
//       state.formData.shortCode = dept.shortCode || "";

//       // ✅ ONLY original starting counter
//       state.formData.startingCounter = dept.startingCounter ?? "";

//       state.message = "";
//       state.msgType = "info";
//     },

//     resetState: () => initialState,
//   },
//   extraReducers: (builder) => {
//     builder
//       // Load Departments
//       .addCase(loadDepartments.pending, (state) => {
//         state.tableLoading = true;
//       })
//       .addCase(loadDepartments.fulfilled, (state, action) => {
//         state.tableLoading = false;
//         state.departments = action.payload;
//       })
//       .addCase(loadDepartments.rejected, (state) => {
//         state.tableLoading = false;
//         state.departments = [];
//       })

//       // Save Department
//       .addCase(saveDepartment.pending, (state) => {
//         state.loading = true;
//         state.message = "";
//         state.msgType = "info";
//       })
//       .addCase(saveDepartment.fulfilled, (state, action) => {
//         state.loading = false;
//         state.msgType = "success";
//         state.message =
//           action.payload.type === "update"
//             ? "Department updated successfully."
//             : "Department added successfully.";
//         state.editingId = null;
//         state.formData.deptName = "";
//         state.formData.shortCode = "";
//         state.formData.startingCounter = "";
//       })
//       .addCase(saveDepartment.rejected, (state, action) => {
//         state.loading = false;
//         state.msgType = "error";
//         state.message = action.payload || "Failed to save department.";
//       })

//       // Delete Department
//       .addCase(deleteDepartment.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(deleteDepartment.fulfilled, (state, action) => {
//         state.loading = false;
//         state.msgType = "success";
//         state.message = `Department "${action.payload.name}" deleted.`;

//         // Remove from local state if still present
//         state.departments = state.departments.filter(
//           (dept) => dept.id !== action.payload.id
//         );

//         // Clear edit form if editing the deleted department
//         if (state.editingId === action.payload.id) {
//           state.editingId = null;
//           state.formData.deptName = "";
//           state.formData.shortCode = "";
//           state.formData.startingCounter = "";
//         }
//       })
//       .addCase(deleteDepartment.rejected, (state, action) => {
//         state.loading = false;
//         state.msgType = "error";
//         state.message = action.payload || "Failed to delete department.";
//       });
//   },
// });

// export const {
//   setDeptName,
//   setShortCode,
//   setStartingCounter, // ✅ ADD THIS LINE
//   setSearch,
//   setPage,
//   setEditingId,
//   setMessage,
//   clearMessage,
//   resetForm,
//   setEditForm,
//   resetState,
// } = addDepartmentSlice.actions;

// export default addDepartmentSlice.reducer;



import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const formatDeptName = (name = "") => {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

const normalizeDepartments = (data) => {
  const arr = Array.isArray(data) ? data : [];
  return arr
    .map((d) => ({
      id: d.id || d._id,
      name: formatDeptName(d.name || ""),
      shortCode: (d.shortCode || "").toString().toUpperCase(),
      createdAt: d.createdAt || null,
    }))
    .filter((d) => d.name.trim())
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const loadDepartments = createAsyncThunk(
  "addDepartment/loadDepartments",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/api/departments", {
        withCredentials: true,
      });
      return normalizeDepartments(res.data);
    } catch (err) {
      console.error("Failed to load departments:", err);
      return rejectWithValue(err.message);
    }
  }
);

export const saveDepartment = createAsyncThunk(
  "addDepartment/saveDepartment",
  async ({ editingId, payload }, { rejectWithValue, dispatch }) => {
    try {
      let response;

      if (editingId) {
        response = await axios.patch(`/api/departments/${editingId}`, payload, {
          withCredentials: true,
        });
      } else {
        response = await axios.post("/api/departments", payload, {
          withCredentials: true,
        });

        if (response?.data?.success) {
          try {
            const stored = JSON.parse(
              localStorage.getItem("custom_departments") || "[]"
            );
            const arr = Array.isArray(stored) ? stored : [];
            const name = payload.name;

            const exists = arr.some(
              (d) => (d.name || "").toLowerCase() === name.toLowerCase()
            );
            if (!exists) {
              arr.push({ name });
              localStorage.setItem("custom_departments", JSON.stringify(arr));
            }
          } catch (e) {
            console.warn("Failed to update localStorage:", e);
          }
        }
      }

      window.dispatchEvent(new Event("departments-changed"));

      dispatch(loadDepartments());

      return {
        type: editingId ? "update" : "create",
        data: response.data,
        editingId,
      };
    } catch (err) {
      console.error("Save department failed:", err);
      return rejectWithValue(
        err.response?.data?.message || "Failed to save department."
      );
    }
  }
);

export const deleteDepartment = createAsyncThunk(
  "addDepartment/deleteDepartment",
  async ({ id, name }, { rejectWithValue, dispatch }) => {
    try {
      await axios.delete(`/api/departments/${id}`, {
        withCredentials: true,
      });

      window.dispatchEvent(new Event("departments-changed"));
      window.dispatchEvent(new Event("users-changed"));

      dispatch(loadDepartments());

      return { id, name };
    } catch (err) {
      console.error("Delete department failed:", err);
      return rejectWithValue(
        err.response?.data?.message || "Failed to delete department."
      );
    }
  }
);

const initialState = {
  departments: [],
  formData: {
    deptName: "",
    shortCode: "",
  },
  loading: false,
  tableLoading: false,
  message: "",
  msgType: "info",
  search: "",
  editingId: null,
  page: 1,
  PAGE_SIZE: 7,
};

const addDepartmentSlice = createSlice({
  name: "addDepartment",
  initialState,
  reducers: {
    setDeptName: (state, action) => {
      state.formData.deptName = action.payload;
    },
    setShortCode: (state, action) => {
      state.formData.shortCode = action.payload.toUpperCase().slice(0, 2);
    },

    setSearch: (state, action) => {
      state.search = action.payload;
      state.page = 1;
    },
    setPage: (state, action) => {
      state.page = action.payload;
    },
    setEditingId: (state, action) => {
      state.editingId = action.payload;
    },
    setMessage: (state, action) => {
      state.message = action.payload.message;
      state.msgType = action.payload.msgType;
    },
    clearMessage: (state) => {
      state.message = "";
      state.msgType = "info";
    },
    resetForm: (state) => {
      state.editingId = null;
      state.formData.deptName = "";
      state.formData.shortCode = "";
      state.message = "";
      state.msgType = "info";
    },
    setEditForm: (state, action) => {
      const dept = action.payload;

      state.editingId = dept.id;
      state.formData.deptName = dept.name;
      state.formData.shortCode = dept.shortCode || "";

      state.message = "";
      state.msgType = "info";
    },

    resetState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadDepartments.pending, (state) => {
        state.tableLoading = true;
      })
      .addCase(loadDepartments.fulfilled, (state, action) => {
        state.tableLoading = false;
        state.departments = action.payload;
      })
      .addCase(loadDepartments.rejected, (state) => {
        state.tableLoading = false;
        state.departments = [];
      })

      .addCase(saveDepartment.pending, (state) => {
        state.loading = true;
        state.message = "";
        state.msgType = "info";
      })
      .addCase(saveDepartment.fulfilled, (state, action) => {
        state.loading = false;
        state.msgType = "success";
        state.message =
          action.payload.type === "update"
            ? "Department updated successfully."
            : "Department added successfully.";
        state.editingId = null;
        state.formData.deptName = "";
        state.formData.shortCode = "";
      })
      .addCase(saveDepartment.rejected, (state, action) => {
        state.loading = false;
        state.msgType = "error";
        state.message = action.payload || "Failed to save department.";
      })

      .addCase(deleteDepartment.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteDepartment.fulfilled, (state, action) => {
        state.loading = false;
        state.msgType = "success";
        state.message = `Department "${action.payload.name}" deleted.`;

        state.departments = state.departments.filter(
          (dept) => dept.id !== action.payload.id
        );

        if (state.editingId === action.payload.id) {
          state.editingId = null;
          state.formData.deptName = "";
          state.formData.shortCode = "";
        }
      })
      .addCase(deleteDepartment.rejected, (state, action) => {
        state.loading = false;
        state.msgType = "error";
        state.message = action.payload || "Failed to delete department.";
      });
  },
});

export const {
  setDeptName,
  setShortCode,
  setSearch,
  setPage,
  setEditingId,
  setMessage,
  clearMessage,
  resetForm,
  setEditForm,
  resetState,
} = addDepartmentSlice.actions;

export default addDepartmentSlice.reducer;