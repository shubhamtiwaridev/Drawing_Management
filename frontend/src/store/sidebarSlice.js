import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { loadTheme } from '../utils/storage';

// Async thunks
export const fetchUsersCount = createAsyncThunk(
  'sidebar/fetchUsersCount',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/api/users", { withCredentials: true });
      return Array.isArray(res.data) ? res.data.length : 0;
    } catch (err) {
      console.error("Failed to fetch users count:", err);
      return rejectWithValue(err.message || "Failed to fetch users count");
    }
  }
);

export const fetchCustomDepartments = createAsyncThunk(
  'sidebar/fetchCustomDepartments',
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

      const normalized = data.map((d) => ({
        id: d.id || d._id,
        name: d.name,
        shortCode: d.shortCode,
      }));

      return normalized;
    } catch (err) {
      console.warn("Failed to load dynamic departments:", err);
      return rejectWithValue(err.message || "Failed to load departments");
    }
  }
);

// Initialize state
const initialState = {
  darkMode: loadTheme(),
  prodExpanded: true,
  usersCount: 0,
  customDepartments: [],
  loading: false,
  error: null,
};

const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      // Update localStorage
      localStorage.setItem("dark", state.darkMode ? "true" : "false");
      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent("theme-change", { detail: state.darkMode }));
    },
    setDarkMode: (state, action) => {
      state.darkMode = action.payload;
      localStorage.setItem("dark", state.darkMode ? "true" : "false");
      window.dispatchEvent(new CustomEvent("theme-change", { detail: state.darkMode }));
    },
    toggleProdExpanded: (state) => {
      state.prodExpanded = !state.prodExpanded;
    },
    setProdExpanded: (state, action) => {
      state.prodExpanded = action.payload;
    },
    setUsersCount: (state, action) => {
      state.usersCount = action.payload;
    },
    setCustomDepartments: (state, action) => {
      state.customDepartments = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch users count
      .addCase(fetchUsersCount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsersCount.fulfilled, (state, action) => {
        state.loading = false;
        state.usersCount = action.payload;
      })
      .addCase(fetchUsersCount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.usersCount = 0;
      })
      // Fetch custom departments
      .addCase(fetchCustomDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.customDepartments = action.payload;
      })
      .addCase(fetchCustomDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.customDepartments = [];
      });
  },
});

export const {
  toggleDarkMode,
  setDarkMode,
  toggleProdExpanded,
  setProdExpanded,
  setUsersCount,
  setCustomDepartments,
  clearError,
} = sidebarSlice.actions;

// Selectors
export const selectDarkMode = (state) => state.sidebar.darkMode;
export const selectProdExpanded = (state) => state.sidebar.prodExpanded;
export const selectUsersCount = (state) => state.sidebar.usersCount;
export const selectCustomDepartments = (state) => state.sidebar.customDepartments;
export const selectSidebarLoading = (state) => state.sidebar.loading;
export const selectSidebarError = (state) => state.sidebar.error;

export default sidebarSlice.reducer;