// src/store/usersSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Async thunks
export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (filterRole = "all", { rejectWithValue }) => {
    try {
      const q =
        filterRole && filterRole !== "all"
          ? `?role=${encodeURIComponent(filterRole)}`
          : "";
      const res = await axios.get(`/api/users${q}`, {
        withCredentials: true,
      });

      // Normalize user data
      const normalizeUser = (u) => {
        if (!u) return u;

        const departments = Array.isArray(u.departments)
          ? u.departments
          : u.department
            ? [u.department]
            : [];

        return {
          ...u,
          id: u.id || u._id || (u._id && u._id.toString()),
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          email: u.email || "",
          employeeId: u.employeeId || "",
          departments,
          role: u.role || "user",
          disabled: !!u.disabled,
          createdAt: u.createdAt || "",
        };
      };

      const data = Array.isArray(res.data) ? res.data.map(normalizeUser) : [];
      return data;
    } catch (err) {
      console.error("Failed to load users:", err);
      return rejectWithValue(
        err.message || "Failed to load users from server.",
      );
    }
  },
);

export const updateUser = createAsyncThunk(
  "users/updateUser",
  async ({ id, userData }, { rejectWithValue, dispatch }) => {
    try {
      const res = await axios.put(`/api/users/${id}`, userData, {
        withCredentials: true,
      });

      dispatch(fetchUsers("all"));
      return { data: res.data, id };
    } catch (error) {
      console.error("Update failed:", error);
      return rejectWithValue(
        error?.response?.data?.message || "Failed to update user.",
      );
    }
  },
);

export const deleteUser = createAsyncThunk(
  "users/deleteUser",
  async (id, { rejectWithValue, dispatch }) => {
    try {
      await axios.delete(`/api/users/${id}?hard=true`, {
        withCredentials: true,
      });

      dispatch(fetchUsers("all"));
      return id;
    } catch (error) {
      console.error("Delete failed:", error);
      return rejectWithValue(
        error?.response?.data?.message || "Failed to delete user.",
      );
    }
  },
);

export const fetchDepartmentsForUsers = createAsyncThunk(
  "users/fetchDepartments",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/api/departments", {
        withCredentials: true,
      });

      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.departments)
          ? res.data.departments
          : [];

      const map = {};
      data.forEach((d) => {
        if (!d || !d.name) return;
        const name = d.name.toString().trim();
        const code = (d.shortCode || "").toString().toUpperCase();
        if (!name) return;
        map[name] = code;
      });

      return map;
    } catch (err) {
      console.warn("Failed to load departments for Users:", err);
      return rejectWithValue(err.message || "Failed to load departments.");
    }
  },
);

const initialState = {
  users: [],
  loading: false,
  search: "",
  editingId: null,
  message: "",
  deptShortcuts: {},
  filterRole: "all",

  editForm: {
    first: "",
    last: "",
    email: "",
    empId: "",
    password: "",
    department: "",
  },
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setSearch: (state, action) => {
      state.search = action.payload;
    },
    setEditingId: (state, action) => {
      state.editingId = action.payload;
    },
    setMessage: (state, action) => {
      state.message = action.payload;
    },
    setFilterRole: (state, action) => {
      state.filterRole = action.payload;
    },
    updateEditField: (state, action) => {
      const { field, value } = action.payload;
      if (field in state.editForm) {
        state.editForm[field] = value;
      }
    },
    setEditForm: (state, action) => {
      const user = action.payload;
      state.editingId = user.id;
      state.editForm = {
        first: user.firstName || "",
        last: user.lastName || "",
        email: user.email || "",
        empId: user.employeeId || "",
        password: "",
        department: Array.isArray(user.departments)
          ? user.departments.join(", ")
          : user.department
            ? [user.department].join(", ")
            : "",
        message: "",
      };
    },
    resetEditForm: (state) => {
      state.editingId = null;
      state.editForm = initialState.editForm;
      state.message = "";
    },
    clearMessage: (state) => {
      state.message = "";
    },
    resetUsersState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.message = "";
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.message = action.payload || "Failed to load users from server.";
      })
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.message = "";
      })
      .addCase(updateUser.fulfilled, (state) => {
        state.loading = false;
        state.editingId = null;
        state.editForm = initialState.editForm;
        state.message = "User updated successfully.";
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.message = action.payload || "Failed to update user.";
      })
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.message = "";
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.filter((user) => user.id !== action.payload);
        if (state.editingId === action.payload) {
          state.editingId = null;
          state.editForm = initialState.editForm;
        }
        state.message = "User deleted successfully.";
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.message = action.payload || "Failed to delete user.";
      })
      .addCase(fetchDepartmentsForUsers.fulfilled, (state, action) => {
        state.deptShortcuts = action.payload;
      })
      .addCase(fetchDepartmentsForUsers.rejected, (state) => {
        state.deptShortcuts = {};
      });
  },
});

export const {
  setSearch,
  setEditingId,
  setMessage,
  setFilterRole,
  updateEditField,
  setEditForm,
  resetEditForm,
  clearMessage,
  resetUsersState,
} = usersSlice.actions;

export const selectUsers = (state) => state.users.users;
export const selectLoading = (state) => state.users.loading;
export const selectSearch = (state) => state.users.search;
export const selectEditingId = (state) => state.users.editingId;
export const selectMessage = (state) => state.users.message;
export const selectDeptShortcuts = (state) => state.users.deptShortcuts;
export const selectFilterRole = (state) => state.users.filterRole;
export const selectEditForm = (state) => state.users.editForm;
export const selectVisibleUsers = (state) => {
  const { users, search } = state.users;

  if (!search.trim()) return users;

  const q = search.toLowerCase();
  return users.filter((u) => {
    const firstMatch = (u.firstName || "").toLowerCase().includes(q);
    const lastMatch = (u.lastName || "").toLowerCase().includes(q);
    const emailMatch = (u.email || "").toLowerCase().includes(q);
    const empMatch = (u.employeeId || "").toLowerCase().includes(q);
    return firstMatch || lastMatch || emailMatch || empMatch;
  });
};

export default usersSlice.reducer;
