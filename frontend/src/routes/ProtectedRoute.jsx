import React from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../utils/storage";

export default function ProtectedRoute({ children }) {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/" replace />;
  return children;
}
