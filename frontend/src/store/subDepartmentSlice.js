import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

/* ================================
   FETCH BY PARENT
================================ */
export const fetchSubDepartmentsByParent = createAsyncThunk(
  "subDepartments/fetchByParent",
  async (parentId) => {
    const res = await axios.get(`/api/sub-departments/parent/${parentId}`, {
      withCredentials: true,
    });
    return res.data;
  }
);

/* ================================
   CREATE
================================ */
export const createSubDepartment = createAsyncThunk(
  "subDepartments/create",
  async ({ name, parentId, parentName }) => {
    const res = await axios.post(
      "/api/sub-departments",
      {
        name,
        parentDepartmentId: parentId,
        parentDepartmentName: parentName,
      },
      { withCredentials: true }
    );
    return res.data.subDepartment;
  }
);

/* ================================
   UPDATE
================================ */
export const updateSubDepartment = createAsyncThunk(
  "subDepartments/update",
  async ({ parentId, subId, name }) => {
    await axios.put(
      `/api/sub-departments/${parentId}/${subId}`,
      { name },
      { withCredentials: true }
    );
    return { subId, name };
  }
);

/* ================================
   DELETE
================================ */
export const deleteSubDepartment = createAsyncThunk(
  "subDepartments/delete",
  async ({ parentId, subId }) => {
    await axios.delete(`/api/sub-departments/${parentId}/${subId}`, {
      withCredentials: true,
    });
    return subId;
  }
);

const subDepartmentSlice = createSlice({
  name: "subDepartments",
  initialState: {
    items: [],
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      /* FETCH */
      .addCase(fetchSubDepartmentsByParent.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSubDepartmentsByParent.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })

      /* CREATE */
      .addCase(createSubDepartment.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })

      /* UPDATE */
      .addCase(updateSubDepartment.fulfilled, (state, action) => {
        state.items = state.items.map((s) =>
          s._id === action.payload.subId
            ? { ...s, name: action.payload.name }
            : s
        );
      })

      /* DELETE */
      .addCase(deleteSubDepartment.fulfilled, (state, action) => {
        state.items = state.items.filter((s) => s._id !== action.payload);
      });
  },
});

export default subDepartmentSlice.reducer;
