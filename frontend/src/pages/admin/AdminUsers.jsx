import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import { Loading } from "../../components/Loading";
import { Toast } from "../../components/Toast";
import { AdminNav } from "./AdminDashboard";
import { Users, GraduationCap, Search, Trash2, Mail } from "lucide-react";

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/admin/users/");
      setUsers(response.data.data || []);
    } catch (error) {
      setToast({ message: "Failed to load users", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`Remove student "${username}" from the platform?`))
      return;
    try {
      await api.delete(`/admin/users/${userId}/`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setToast({ message: "Student removed", type: "success" });
    } catch (error) {
      setToast({
        message: error.response?.data?.error || "Failed to remove student",
        type: "error",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("isAdmin");
    navigate("/admin/login");
  };

  if (loading) return <Loading message="Loading students..." />;

  const filtered = users.filter((u) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #f3e8ff 100%)" }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <AdminNav onLogout={handleLogout} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap size={22} className="text-indigo-600" />
              Registered Students
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {users.length} student{users.length !== 1 ? "s" : ""} on the
              platform
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email"
              className="w-full pl-9 pr-3 py-2.5 bg-white/80 backdrop-blur-sm border border-violet-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300"
            />
          </div>
        </div>

        <div className="bg-white/85 backdrop-blur-sm rounded-2xl border border-violet-100 overflow-hidden shadow-sm shadow-violet-100/40">
          {filtered.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users size={26} className="text-indigo-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">
                {users.length === 0 ? "No students yet" : "No matches found"}
              </h3>
              <p className="text-sm text-slate-500">
                {users.length === 0
                  ? "When students register, they'll appear here."
                  : "Try a different search term."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-violet-50/70 border-b border-violet-100">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-violet-100">
                  {filtered.map((user) => {
                    const avatar = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(
                      user.username,
                    )}&backgroundColor=c7d2fe,ddd6fe,cffafe`;
                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-violet-50/60 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={avatar}
                              alt={user.username}
                              className="w-9 h-9 rounded-full bg-violet-50 border border-violet-200"
                            />
                            <span className="font-medium text-slate-900 text-sm">
                              {user.username}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {user.email ? (
                            <span className="inline-flex items-center gap-1.5 text-slate-600 text-sm">
                              <Mail size={13} className="text-violet-400" />
                              {user.email}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-sm italic">
                              — not set —
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-500">
                          {new Date(user.date_joined).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() =>
                              handleDelete(user.id, user.username)
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
                          >
                            <Trash2 size={13} /> Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
