import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./components/Home.jsx";
import RegisterUser from "./components/registrationprocess/RegisterUser.jsx";
import Register from "./components/registrationprocess/Register.jsx";
import ProtectedRoute from "./routes/ProtectedRoute";
import Login from "./components/registrationprocess/Login";
import Users from "./components/registrationprocess/User.jsx";
import DrawingHistory from "./components/DrawingHistory";
import GlobalHistory from "./components/GlobalHistory";
import UserLoginLogout from "./components/registrationprocess/UserLoginLogout";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />

      <Route
        path="/user"
        element={
          <ProtectedRoute>
            <Users />
          </ProtectedRoute>
        }
      />

      <Route
        path="/register-user"
        element={
          <ProtectedRoute>
            <RegisterUser />
          </ProtectedRoute>
        }
      />

      <Route path="/history" element={<GlobalHistory />} />
      <Route path="/history/:drawingId" element={<DrawingHistory />} />
      <Route path="/user-login-logout" element={<UserLoginLogout />} />
    </Routes>
  );
}
