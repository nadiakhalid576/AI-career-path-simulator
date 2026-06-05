import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import api from "../../api/api";
import { Loading } from "../../components/Loading";
import {
  LayoutDashboard,
  Users,
  Trophy,
  LogOut,
  Shield,
  Map,
  TrendingUp,
  Sparkles,
  GraduationCap,
  ArrowRight,
  UserPlus,
} from "lucide-react";

// Shared top nav for all admin pages — light theme, website colors.
const AdminNav = ({ onLogout }) => {
  const location = useLocation();
  const adminUser = localStorage.getItem("adminUser") || "Admin";
  const isActive = (path) => location.pathname === path;
  const navLinks = [
    {
      path: "/admin/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={16} />,
    },
    { path: "/admin/users", label: "Students", icon: <Users size={16} /> },
    { path: "/admin/badges", label: "Badges", icon: <Trophy size={16} /> },
  ];
  return (
    <nav className="bg-white/70 backdrop-blur-xl border-b border-violet-100 sticky top-0 z-40 shadow-sm shadow-violet-500/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/admin/dashboard" className="flex items-center gap-2.5 group">
            <img
              src="/Logo.png"
              alt="CareerPath AI"
              className="h-18 w-auto group-hover:scale-105 transition-transform"
            />
            <span className="text-[11px] text-indigo-600 font-semibold tracking-wide uppercase border-l border-violet-200 pl-2.5">
              Admin Portal
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-1 ml-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive(link.path)
                    ? "bg-violet-100 text-indigo-700"
                    : "text-slate-600 hover:text-indigo-700 hover:bg-violet-50"
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-violet-50/70 rounded-lg border border-violet-100">
            <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
              <Shield size={12} className="text-indigo-600" />
            </div>
            <span className="text-sm font-semibold text-slate-700">
              {adminUser}
            </span>
          </div>
          <button
            onClick={onLogout}
            className="px-3 py-1.5 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 border border-violet-100 hover:border-red-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>
      {/* Mobile nav links */}
      <div className="md:hidden border-t border-violet-100 px-4 py-2 flex gap-1 overflow-x-auto">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
              isActive(link.path)
                ? "bg-violet-100 text-indigo-700"
                : "text-slate-600 hover:bg-violet-50"
            }`}
          >
            {link.icon}
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export { AdminNav };

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const adminUser = localStorage.getItem("adminUser") || "Admin";

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get("/admin/stats/");
      setStats(response.data.data);
    } catch (error) {
      if (error.response?.status === 403) {
        localStorage.removeItem("isAdmin");
        navigate("/admin/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("isAdmin");
    navigate("/admin/login");
  };

  if (loading) return <Loading message="Loading dashboard..." />;

  const statCards = [
    {
      label: "Registered Students",
      value: stats?.totalUsers || 0,
      icon: <GraduationCap size={20} />,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Career Paths",
      value: stats?.totalPaths || 0,
      icon: <Map size={20} />,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Badges Configured",
      value: stats?.totalBadges || 0,
      icon: <Trophy size={20} />,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Active Students",
      value: stats?.activeUsers || 0,
      icon: <TrendingUp size={20} />,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
  ];

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #f3e8ff 100%)" }}>
      <AdminNav onLogout={handleLogout} />

      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-linear-to-br from-indigo-600 via-violet-700 to-purple-800 text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-300/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 pointer-events-none"></div>
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        ></div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-violet-200 text-sm flex items-center gap-1.5">
                <Sparkles size={14} /> {greeting},
              </p>
              <h1 className="text-2xl md:text-3xl font-bold">{adminUser}</h1>
              <p className="text-violet-100 text-sm mt-1">
                Managing <b className="text-white">{stats?.totalUsers || 0}</b>{" "}
                students &middot;{" "}
                <b className="text-white">{stats?.totalPaths || 0}</b> career
                paths generated
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/admin/users"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-700 hover:bg-violet-50 font-semibold rounded-xl transition-all shadow-lg text-sm"
              >
                <Users size={15} /> Manage Students
              </Link>
              <Link
                to="/admin/badges"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all border border-white/20 backdrop-blur-sm text-sm"
              >
                <Trophy size={15} /> Manage Badges
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 -mt-6 relative">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, i) => (
            <div
              key={i}
              className="bg-white/85 backdrop-blur-sm rounded-2xl border border-violet-100 p-5 hover:shadow-lg hover:shadow-violet-200/40 hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-11 h-11 ${stat.bg} rounded-xl flex items-center justify-center ${stat.color}`}
                >
                  {stat.icon}
                </div>
                <TrendingUp size={14} className="text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Quick Actions */}
          <div className="lg:col-span-1 bg-white/85 backdrop-blur-sm rounded-2xl border border-violet-100 p-6">
            <h2 className="font-bold text-gray-900 mb-1">Quick Actions</h2>
            <p className="text-xs text-gray-500 mb-4">
              Jump into common admin tasks
            </p>
            <div className="space-y-3">
              <Link
                to="/admin/users"
                className="flex items-center gap-3 p-3.5 bg-violet-50/60 rounded-xl hover:bg-violet-100 border border-violet-100 hover:border-violet-300 transition-all group"
              >
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Users size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-gray-900 text-sm block">
                    Manage Students
                  </span>
                  <span className="text-xs text-gray-500">
                    View or remove users
                  </span>
                </div>
                <ArrowRight
                  size={16}
                  className="text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all"
                />
              </Link>
              <Link
                to="/admin/badges"
                className="flex items-center gap-3 p-3.5 bg-violet-50/60 rounded-xl hover:bg-amber-50 border border-violet-100 hover:border-amber-200 transition-all group"
              >
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <Trophy size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-gray-900 text-sm block">
                    Manage Badges
                  </span>
                  <span className="text-xs text-gray-500">
                    Achievements & criteria
                  </span>
                </div>
                <ArrowRight
                  size={16}
                  className="text-gray-300 group-hover:text-amber-600 group-hover:translate-x-1 transition-all"
                />
              </Link>
            </div>
          </div>

          {/* Recent Users */}
          <div className="lg:col-span-2 bg-white/85 backdrop-blur-sm rounded-2xl border border-violet-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-gray-900">
                  Recently Joined Students
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Latest 5 registrations on the platform
                </p>
              </div>
              <Link
                to="/admin/users"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>
            {stats?.recentUsers?.length > 0 ? (
              <div className="space-y-2">
                {stats.recentUsers.map((user, idx) => {
                  const avatar = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(
                    user.username,
                  )}&backgroundColor=c7d2fe,ddd6fe,cffafe`;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-violet-50/60 rounded-xl border border-violet-100 hover:border-violet-300 hover:bg-violet-100/60 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={avatar}
                          alt={user.username}
                          className="w-10 h-10 rounded-full bg-white border border-indigo-100 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 text-sm truncate">
                            {user.username}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {user.email || "No email"}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 shrink-0 ml-3">
                        {new Date(user.date_joined).toLocaleDateString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed border-violet-200 rounded-xl">
                <UserPlus size={28} className="mx-auto mb-2 text-violet-400" />
                <p className="text-slate-500 text-sm">
                  No students have registered yet
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
