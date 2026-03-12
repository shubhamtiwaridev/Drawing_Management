// src/store/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../api";
import axiosRaw from "axios";
import { setCurrentUser } from "../utils/storage";

export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, employeeId, password }, { rejectWithValue }) => {
    try {
      const body = { password };
      if (employeeId) body.employeeId = String(employeeId).replace(/\D/g, "");
      else if (email) body.email = String(email).trim().toLowerCase();
      else return rejectWithValue("Email or Employee ID is required.");

      const response = await axios.post("/api/auth/login", body, {
        withCredentials: true,
      });

      const data = response?.data;

      if (data && (data.success === true || data.token)) {
        if (data.user) setCurrentUser(data.user);
        return data;
      }

      return rejectWithValue(
        data?.message || "Login failed — check credentials",
      );
    } catch (err) {
      if (!err.response) {
        return rejectWithValue("Network error or server not reachable");
      }
      return rejectWithValue(
        err.response?.data?.message || `Error: ${err.response.status}`,
      );
    }
  },
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const response = await axiosRaw.post(
        (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_BASE_URL || "") + "/api/auth/register",
        { name, email, password },
      );

      if (response.data?.success) {
        return response.data;
      }

      return rejectWithValue(response.data?.message || "Registration failed");
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Network or server error",
      );
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    loading: false,
    error: "",
    message: "",
  },
  reducers: {
    clearError: (state) => {
      state.error = "";
    },
    clearMessage: (state) => {
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(loginUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = "";
        state.message = "";
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload?.message || "Registration successful!";
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearMessage } = authSlice.actions;
export default authSlice.reducer;
