// Admin Protected Route — only admin users may enter.
// Students (with authToken but no isAdmin flag) are bounced to /dashboard,
// unauthenticated visitors to /admin/login.
import { Navigate } from "react-router-dom";

const AdminProtectedRoute = ({ children }) => {
  const adminToken = localStorage.getItem("adminToken");
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  const studentToken = localStorage.getItem("authToken");

  if (!adminToken || !isAdmin) {
    if (studentToken) return <Navigate to="/dashboard" replace />;
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default AdminProtectedRoute;
