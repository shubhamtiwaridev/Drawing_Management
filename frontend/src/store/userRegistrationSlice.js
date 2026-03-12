// src/store/userRegistrationSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const registerUser = createAsyncThunk(
  "userRegistration/registerUser",
  async (userData, { rejectWithValue }) => {
    try {
      const res = await axios.post("/api/users", userData, {
        withCredentials: true,
      });

      if (res && res.status >= 200 && res.status < 300) {
        return res.data;
      } else {
        return rejectWithValue(
          res?.data?.message || "Failed to register user.",
        );
      }
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to register user.",
      );
    }
  },
);

const getInitialState = () => ({
  formData: {
    type: "",
    first: "",
    last: "",
    email: "",
    empId: "",
    password: "",
    confirmPassword: "",
    selectedDepartments: [],
    departmentOther: "",
  },
  submitting: false,
  message: "",
  msgType: "info",
  deptDropdownOpen: false,
  deptSearch: "",
});

const userRegistrationSlice = createSlice({
  name: "userRegistration",
  initialState: getInitialState(),
  reducers: {
    updateField: (state, action) => {
      const { field, value } = action.payload;
      if (Object.prototype.hasOwnProperty.call(state.formData, field)) {
        state.formData[field] = value;
      }
    },
    updateDepartments: (state, action) => {
      state.formData.selectedDepartments = action.payload;
    },
    toggleDepartment: (state, action) => {
      const value = action.payload;
      const { selectedDepartments } = state.formData;

      if (selectedDepartments.includes(value)) {
        state.formData.selectedDepartments = selectedDepartments.filter(
          (v) => v !== value,
        );
      } else {
        state.formData.selectedDepartments.push(value);
      }
    },
    setMessage: (state, action) => {
      state.message = action.payload.message;
      state.msgType = action.payload.msgType;
    },
    clearForm: (state) => {
      const freshState = getInitialState();
      state.formData = freshState.formData;
      state.message = "";
      state.msgType = "info";
    },
    resetType: (state) => {
      state.formData.type = "";
      state.message = "";
      state.msgType = "info";
    },
    setDeptDropdownOpen: (state, action) => {
      state.deptDropdownOpen = action.payload;
    },
    setDeptSearch: (state, action) => {
      state.deptSearch = action.payload;
    },
    resetRegistrationState: () => getInitialState(),
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.submitting = true;
        state.message = "";
        state.msgType = "info";
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.submitting = false;
        state.msgType = "success";
        state.message = "User registered successfully.";

        const fresh = getInitialState().formData;
        state.formData = fresh;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.submitting = false;
        state.msgType = "error";
        state.message = action.payload || "Failed to register user.";
      });
  },
});

export const {
  updateField,
  updateDepartments,
  toggleDepartment,
  setMessage,
  clearForm,
  resetType,
  setDeptDropdownOpen,
  setDeptSearch,
  resetRegistrationState,
} = userRegistrationSlice.actions;

export default userRegistrationSlice.reducer;
