// departmentSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const fetchDepartments = createAsyncThunk(
  "departments/fetchDepartments",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/api/departments", {
        withCredentials: true,
      });

      const rawData = res.data?.departments || res.data;
      const dataList = Array.isArray(rawData) ? rawData : [];

      return dataList
        .filter((d) => d && typeof d.name === "string" && d.name.trim())
        .map((d) => ({
          id: d.id || d._id,
          name: d.name.trim(),
          shortCode: (d.shortCode || "").toString().toUpperCase(),
        }));
    } catch (err) {
      console.warn("Failed to load departments:", err);
      return rejectWithValue(err.message || "Unknown error");
    }
  },
);

const departmentSlice = createSlice({
  name: "departments",
  initialState: {
    departments: [],
    loading: false,
    error: null,
  },
  reducers: {
    setDepartments: (state, action) => {
      state.departments = action.payload;
    },
    clearDepartments: (state) => {
      state.departments = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.departments = action.payload;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setDepartments, clearDepartments } = departmentSlice.actions;
export default departmentSlice.reducer;
