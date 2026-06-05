// Main App Component with Routes
import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

// User Pages
import HomePage from "./pages/homepage/Homapage";
import RegisterPage from "./pages/auth/Register";
import LoginPage from "./pages/auth/Login";
import DashboardPage from "./pages/dashboard/Dashboard";
import ProfilePage from "./pages/dashboard/Profile";
import SimulatorPage from "./pages/dashboard/Simulator";
import AchievementsPage from "./pages/dashboard/Achievements";
import ProtectedRoute from "./pages/auth/ProtectedRoute";
import AdminProtectedRoute from "./pages/auth/AdminProtectedRoute";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminBadges from "./pages/admin/AdminBadges";

import api from "./api/api";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("authToken")
  );
  const [username, setUsername] = useState(localStorage.getItem("username"));

  const handleLogin = (user) => {
    setIsAuthenticated(true);
    setUsername(user.username);
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout/");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.clear();
      setIsAuthenticated(false);
      setUsername(null);
      window.location.href = "/";
    }
  };

  return (
    <Router>
      <Routes>
        {/* Admin Routes - No Navbar/Footer */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminProtectedRoute>
              <AdminUsers />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/badges"
          element={
            <AdminProtectedRoute>
              <AdminBadges />
            </AdminProtectedRoute>
          }
        />

        {/* User Routes - With Navbar/Footer */}
        <Route
          path="*"
          element={
              <div>
                <Navbar
                  isAuthenticated={isAuthenticated}
                  username={username}
                  onLogout={handleLogout}
                />            
              <main>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/simulator"
                    element={
                      <ProtectedRoute>
                        <SimulatorPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/achievements"
                    element={
                      <ProtectedRoute>
                        <AchievementsPage />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </main>
              <Footer />
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
