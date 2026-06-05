import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import { Loading } from "../../components/Loading";
import { Button } from "../../components/Button";
import { Toast } from "../../components/Toast";
import {
  Map,
  Target,
  Trophy,
  Star,
  User,
  Trash2,
  Calendar,
  GitFork,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Zap,
} from "lucide-react";

const DashboardPage = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");
  const [savedPaths, setSavedPaths] = useState([]);
  const [stats, setStats] = useState({
    pathsExplored: 0,
    decisionsMade: 0,
    badgesEarned: 0,
    level: 1,
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pathsRes, progressRes] = await Promise.all([
        api.get("/simulator/saved-paths/"),
        api.get("/gamification/progress/"),
      ]);
      setSavedPaths(pathsRes.data.data || []);
      const p = progressRes.data.data || {};
      setStats({
        pathsExplored: p.paths_explored || 0,
        decisionsMade: p.decisions_made || 0,
        badgesEarned: p.badges_earned || 0,
        level: p.level || 1,
      });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (pathId) => {
    if (!window.confirm("Delete this path?")) return;
    try {
      await api.delete(`/simulator/delete-path/${pathId}/`);
      setSavedPaths((prev) => prev.filter((p) => p.id !== pathId));
      setToast({ message: "Path deleted", type: "success" });
    } catch (error) {
      setToast({ message: "Failed to delete", type: "error" });
    }
  };

  if (loading) return <Loading message="Loading dashboard..." />;

  const levelProgress = Math.min(
    (stats.pathsExplored * 10 + stats.decisionsMade * 5) % 100,
    100,
  );

  const statCards = [
    { icon: <Map size={20} />, value: stats.pathsExplored, label: "Paths Explored", color: "text-indigo-600", bg: "bg-indigo-50" },
    { icon: <Target size={20} />, value: stats.decisionsMade, label: "Decisions Made", color: "text-violet-600", bg: "bg-violet-50" },
    { icon: <Trophy size={20} />, value: stats.badgesEarned, label: "Badges Earned", color: "text-purple-600", bg: "bg-purple-50" },
    { icon: <Star size={20} />, value: `Level ${stats.level}`, label: "Your Level", color: "text-amber-600", bg: "bg-amber-50" },
  ];

  const quickActions = [
    { icon: <Target size={20} />, label: "Start Simulation", desc: "Generate a new AI career path", path: "/simulator" },
    { icon: <User size={20} />, label: "Update Profile", desc: "Edit your skills and info", path: "/profile" },
    { icon: <Trophy size={20} />, label: "Achievements", desc: "View badges and progress", path: "/achievements" },
  ];

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(username || "user")}&backgroundColor=c7d2fe,ddd6fe,cffafe`;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #f3e8ff 100%)" }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

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

        <div className="max-w-6xl mx-auto px-4 py-10 relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <img
                  src={avatarUrl}
                  alt={username}
                  className="w-16 h-16 rounded-2xl bg-white border-2 border-white/30 shadow-xl"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-indigo-700"></span>
              </div>
              <div>
                <p className="text-violet-200 text-sm flex items-center gap-1.5">
                  <Sparkles size={14} /> {greeting},
                </p>
                <h1 className="text-2xl md:text-3xl font-bold">{username}</h1>
                <p className="text-violet-100 text-sm mt-0.5">
                  You've explored{" "}
                  <b className="text-white">{stats.pathsExplored}</b> path
                  {stats.pathsExplored !== 1 ? "s" : ""} and made{" "}
                  <b className="text-white">{stats.decisionsMade}</b> decision
                  {stats.decisionsMade !== 1 ? "s" : ""}.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/simulator")}
              className="inline-flex items-center gap-2 px-5 py-3 bg-white text-indigo-700 hover:bg-violet-50 font-semibold rounded-xl transition-all shadow-lg"
            >
              <Zap size={16} /> Start New Simulation
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 -mt-6 relative">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white/85 backdrop-blur-sm rounded-2xl border border-violet-100 p-5 hover:shadow-lg hover:shadow-violet-200/40 hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-11 h-11 ${stat.bg} rounded-xl flex items-center justify-center ${stat.color}`}>
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

        {/* Level Progress */}
        <div className="bg-white/85 backdrop-blur-sm rounded-xl border border-violet-100 p-6 mb-6 shadow-sm shadow-violet-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-slate-900">
                Level {stats.level} Progress
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Keep exploring to level up</p>
            </div>
            <span className="text-sm font-semibold text-indigo-600 bg-violet-100 px-3 py-1 rounded-full">
              {levelProgress}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-violet-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => navigate(action.path)}
              className="bg-white/85 backdrop-blur-sm rounded-2xl border border-violet-100 p-5 text-left hover:border-violet-300 hover:shadow-lg hover:shadow-violet-200/40 hover:-translate-y-0.5 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 bg-linear-to-br from-indigo-50 to-violet-100 rounded-xl flex items-center justify-center text-indigo-600 group-hover:from-violet-100 group-hover:to-violet-200 transition-colors">
                  {action.icon}
                </div>
                <ArrowRight
                  size={16}
                  className="text-violet-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all"
                />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{action.label}</h3>
              <p className="text-sm text-gray-500">{action.desc}</p>
            </button>
          ))}
        </div>

        {/* Saved Paths */}
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Saved Career Paths</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {savedPaths.length} path{savedPaths.length !== 1 ? "s" : ""} saved
            </p>
          </div>
        </div>

        {savedPaths.length === 0 ? (
          <div className="bg-linear-to-br from-violet-50/80 via-white/80 to-indigo-50/80 backdrop-blur-sm rounded-2xl border-2 border-dashed border-violet-200 p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-200/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
            <div className="relative">
              <div className="w-16 h-16 bg-linear-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-violet-500/30">
                <Map size={30} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Your career journey starts here
              </h3>
              <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">
                Run your first AI simulation to generate personalized career
                paths — we'll save them here so you can always come back.
              </p>
              <Button onClick={() => navigate("/simulator")}>
                <Zap size={16} className="mr-1.5" /> Generate Your First Path
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedPaths.map((path) => (
              <div
                key={path.id}
                className="bg-white/85 backdrop-blur-sm rounded-xl border border-violet-100 p-5 hover:border-violet-300 hover:shadow-md hover:shadow-violet-200/40 transition-all cursor-pointer group"
                onClick={() => navigate(`/simulator?pathId=${path.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center text-indigo-600 group-hover:bg-violet-100 transition-colors">
                    <Map size={18} />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(path.id);
                    }}
                    className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                  {path.path_name || path.pathName || "Untitled Path"}
                </h3>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(
                      path.created_at || path.createdAt,
                    ).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitFork size={14} />
                    {path.decisions_count || 0} decisions
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
