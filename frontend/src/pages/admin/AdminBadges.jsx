import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import { Loading } from "../../components/Loading";
import { Toast } from "../../components/Toast";
import { Input } from "../../components/Input";
import { Dropdown } from "../../components/Dropdown";
import { Modal } from "../../components/Modal";
import { Button } from "../../components/Button";
import { AdminNav } from "./AdminDashboard";
import { Trophy, Plus, Pencil, Trash2 } from "lucide-react";

const EMOJI_OPTIONS = ["🏆", "🎯", "⭐", "🔥", "💎", "🚀", "🥇", "👑"];

const CATEGORY_OPTIONS = [
  { label: "Explorer", value: "explorer" },
  { label: "Decision Maker", value: "decision" },
  { label: "Planner", value: "planner" },
  { label: "Specialist", value: "specialist" },
];

const EMPTY_FORM = {
  name: "",
  description: "",
  icon: "🏆",
  category: "explorer",
  points_required: 1,
  requirements: "",
};

const AdminBadges = () => {
  const navigate = useNavigate();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBadge, setEditingBadge] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      const response = await api.get("/admin/badges/");
      setBadges(response.data.data || []);
    } catch {
      setToast({ message: "Failed to load badges", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      setToast({
        message: "Name and description are required",
        type: "error",
      });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        icon: form.icon,
        category: form.category,
        points_required: Number(form.points_required) || 0,
        requirements:
          form.requirements?.trim() ||
          `Reach ${form.points_required} milestone${form.points_required === 1 ? "" : "s"}`,
      };
      if (editingBadge) {
        await api.put(`/admin/badges/${editingBadge.id}/`, payload);
        setToast({ message: "Badge updated", type: "success" });
      } else {
        await api.post("/admin/badges/", payload);
        setToast({ message: "Badge created", type: "success" });
      }
      setShowModal(false);
      setEditingBadge(null);
      setForm(EMPTY_FORM);
      fetchBadges();
    } catch (error) {
      const err = error?.response?.data?.error;
      const detail =
        typeof err === "string"
          ? err
          : err && typeof err === "object"
            ? Object.entries(err)
                .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
                .join(" · ")
            : "Failed to save badge";
      setToast({ message: detail, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (badge) => {
    setEditingBadge(badge);
    setForm({
      name: badge.name || "",
      description: badge.description || "",
      icon: badge.icon || "🏆",
      category: badge.category || "explorer",
      points_required: badge.points_required ?? 1,
      requirements: badge.requirements || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (badgeId) => {
    if (!window.confirm("Delete this badge?")) return;
    try {
      await api.delete(`/admin/badges/${badgeId}/`);
      setBadges((prev) => prev.filter((b) => b.id !== badgeId));
      setToast({ message: "Badge deleted", type: "success" });
    } catch {
      setToast({ message: "Failed to delete", type: "error" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("isAdmin");
    navigate("/admin/login");
  };

  const openCreate = () => {
    setEditingBadge(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  if (loading) return <Loading message="Loading badges..." />;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #f3e8ff 100%)" }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <AdminNav onLogout={handleLogout} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Trophy size={22} className="text-amber-500" />
              Achievement Badges
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {badges.length} badge{badges.length !== 1 ? "s" : ""} configured
              for students
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)" }}
          >
            <Plus size={16} /> New Badge
          </button>
        </div>

        {badges.length === 0 ? (
          <div className="bg-linear-to-br from-amber-50/60 via-white/70 to-violet-50/80 backdrop-blur-sm rounded-2xl border-2 border-dashed border-amber-200 p-12 text-center">
            <div className="w-16 h-16 bg-linear-to-br from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-400/30">
              <Trophy size={28} className="text-white" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1">No badges yet</h3>
            <p className="text-slate-600 text-sm mb-5 max-w-sm mx-auto">
              Create your first achievement badge to motivate students as they
              explore career paths.
            </p>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-500/30"
              style={{ background: "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)" }}
            >
              <Plus size={16} /> Create First Badge
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className="bg-white/85 backdrop-blur-sm rounded-2xl border border-violet-100 p-5 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-200/40 hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-linear-to-br from-amber-50 to-amber-100 rounded-xl flex items-center justify-center text-2xl">
                      {badge.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">
                        {badge.name}
                      </h3>
                      <span className="text-xs text-slate-400 capitalize">
                        {badge.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(badge)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-violet-50 rounded transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(badge.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                  {badge.description}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-indigo-700 bg-violet-100 border border-violet-200 px-2.5 py-1 rounded-md font-medium">
                    {badge.points_required > 0
                      ? `${badge.points_required} pts`
                      : "Starter"}
                  </span>
                  {badge.earned_count != null && (
                    <span className="text-xs text-slate-500 bg-violet-50/70 border border-violet-100 px-2.5 py-1 rounded-md">
                      {badge.earned_count} earned
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          isOpen={showModal}
          title={editingBadge ? "Edit Badge" : "Create Badge"}
          onClose={() => setShowModal(false)}
        >
          <div className="space-y-4">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. First Steps"
              required
            />
            <Input
              label="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Shown to students on the achievements page"
              required
            />
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Icon
              </label>
              <div className="flex gap-2 flex-wrap">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setForm({ ...form, icon: emoji })}
                    className={`w-10 h-10 rounded-lg border text-lg flex items-center justify-center transition-colors ${
                      form.icon === emoji
                        ? "border-indigo-500 bg-violet-100 ring-2 ring-violet-300"
                        : "border-violet-100 hover:border-violet-300"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <Dropdown
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              options={CATEGORY_OPTIONS}
            />
            <Input
              label="Points Required"
              type="number"
              min="0"
              value={form.points_required}
              onChange={(e) =>
                setForm({
                  ...form,
                  points_required: parseInt(e.target.value, 10) || 0,
                })
              }
              helperText="Milestone threshold — e.g. number of paths explored"
            />
            <Input
              label="Requirements (shown to students)"
              value={form.requirements}
              onChange={(e) =>
                setForm({ ...form, requirements: e.target.value })
              }
              placeholder="e.g. Explore 5 career paths"
              helperText="Optional — auto-generated if left blank"
            />
            <Button
              onClick={handleSubmit}
              loading={saving}
              className="w-full"
            >
              {editingBadge ? "Update Badge" : "Create Badge"}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminBadges;
