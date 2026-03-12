import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../store/authSlice";
import userRegistrationReducer from '../store/userRegistrationSlice';
import departmentReducer from '../store/departmentSlice';
import usersReducer from '../store/usersSlice';
import addDepartmentReducer from '../store/addDepartmentSlice';
import drawingReducer from '../store/drawingSlice';
import sidebarReducer from "../store/sidebarSlice";
import subDepartmentReducer from "../store/subDepartmentSlice";



const store = configureStore({
  reducer: {
    auth: authReducer,
    userRegistration: userRegistrationReducer,
    departments: departmentReducer,
    users: usersReducer,
    addDepartment: addDepartmentReducer,
    subDepartment: subDepartmentReducer,
    drawingManager: drawingReducer,
    sidebar: sidebarReducer,
  },
});

export default store;
