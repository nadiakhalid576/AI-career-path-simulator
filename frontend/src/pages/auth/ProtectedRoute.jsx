// Protected Route — ensures only authenticated students can access this route.
// Admins are redirected to the admin portal, unauthenticated users to login.
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const authToken = localStorage.getItem("authToken");
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (!authToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
