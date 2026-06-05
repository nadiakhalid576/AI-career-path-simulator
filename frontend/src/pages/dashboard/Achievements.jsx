import { useState, useEffect } from "react";
import api from "../../api/api";
import { Loading } from "../../components/Loading";
import {
  Trophy,
  Star,
  Map,
  GitFork,
  Award,
  Lock,
  Sparkles,
  Medal,
} from "lucide-react";

const AchievementsPage = () => {
  const [badges, setBadges] = useState([]);
  const [progress, setProgress] = useState(null);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [badgesRes, progressRes] = await Promise.all([
        api.get("/gamification/badges/"),
        api.get("/gamification/progress/"),
      ]);
      setBadges(badgesRes.data.data || []);
      setProgress(progressRes.data.data || null);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBadges = badges.filter(
    (b) =>
      filter === "all" || (filter === "earned" ? b.is_earned : !b.is_earned),
  );
  const earnedCount = badges.filter((b) => b.is_earned).length;
  const completionPct =
    badges.length > 0 ? Math.round((earnedCount / badges.length) * 100) : 0;

  if (loading) return <Loading message="Loading achievements..." />;

  const statCards = [
    { label: "Your Level", value: `Level ${progress?.level || 1}`, icon: <Star size={20} />, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Paths Explored", value: progress?.paths_explored || 0, icon: <Map size={20} />, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Decisions Made", value: progress?.decisions_made || 0, icon: <GitFork size={20} />, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Badges Earned", value: `${earnedCount}/${badges.length}`, icon: <Trophy size={20} />, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  const filters = [
    { key: "all", label: "All", count: badges.length },
    { key: "earned", label: "Earned", count: earnedCount },
    { key: "locked", label: "Locked", count: badges.length - earnedCount },
  ];

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #f3e8ff 100%)" }}>
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-md border-b border-violet-100 py-7 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Trophy size={22} className="text-amber-500" />
            Achievements
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track your progress and unlock badges
          </p>

          {/* Completion bar */}
          <div className="mt-4 max-w-md">
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-violet-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">
                {completionPct}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stat Cards */}
        {progress && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {statCards.map((stat, i) => (
              <div
                key={i}
                className="bg-white/85 backdrop-blur-sm rounded-xl border border-violet-100 p-5 hover:shadow-md hover:shadow-violet-200/40 transition-shadow"
              >
                <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center ${stat.color} mb-3`}>
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.key
                  ? "text-white shadow-md shadow-indigo-500/30"
                  : "bg-white/80 backdrop-blur-sm border border-violet-100 text-slate-600 hover:bg-violet-50"
              }`}
              style={
                filter === f.key
                  ? { background: "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)" }
                  : undefined
              }
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* Badges Grid */}
        {filteredBadges.length === 0 ? (
          <div className="bg-white/85 backdrop-blur-sm rounded-xl border-2 border-dashed border-violet-200 p-12 text-center">
            {filter === "earned" ? (
              <Medal size={36} className="mx-auto mb-3 text-violet-400" />
            ) : (
              <Sparkles size={36} className="mx-auto mb-3 text-violet-400" />
            )}
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              {filter === "earned"
                ? "No Badges Earned Yet"
                : "All Badges Earned!"}
            </h3>
            <p className="text-slate-500 text-sm">
              Keep exploring career paths to unlock achievements
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredBadges.map((badge) => (
              <div
                key={badge.id}
                className={`bg-white/85 backdrop-blur-sm rounded-xl border p-5 text-center transition-all ${
                  badge.is_earned
                    ? "border-violet-100 hover:shadow-md hover:shadow-violet-200/40 hover:-translate-y-0.5"
                    : "border-violet-100 opacity-60"
                }`}
              >
                <div
                  className={`w-14 h-14 mx-auto mb-3 rounded-xl flex items-center justify-center text-2xl ${
                    badge.is_earned ? "bg-linear-to-br from-amber-50 to-amber-100" : "bg-gray-100"
                  }`}
                >
                  {badge.is_earned ? (
                    badge.icon || <Trophy size={24} className="text-amber-500" />
                  ) : (
                    <Lock size={24} className="text-gray-400" />
                  )}
                </div>

                <h3 className="font-semibold text-gray-900 text-sm mb-1">
                  {badge.name}
                </h3>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                  {badge.description}
                </p>

                {badge.is_earned ? (
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                    <Award size={12} /> Earned
                  </span>
                ) : (
                  <span className="inline-block bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs">
                    {badge.requirements || "Keep exploring"}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {badges.length === 0 && (
          <div className="bg-white/85 backdrop-blur-sm rounded-xl border-2 border-dashed border-violet-200 p-12 text-center">
            <Trophy size={36} className="mx-auto mb-3 text-amber-500" />
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              Achievements Coming Soon
            </h3>
            <p className="text-slate-500 text-sm">
              Start exploring career paths to earn badges
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementsPage;
