import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/api";
import { Toast } from "../../components/Toast";
import {
  Shield,
  Loader,
  Target,
  ArrowLeft,
  User,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/admin/login/", form);
      const data = response.data.data;
      localStorage.removeItem("authToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("username");
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminUser", data.username);
      localStorage.setItem("isAdmin", "true");
      navigate("/admin/dashboard");
    } catch (error) {
      setToast({
        message:
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Login failed",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #f3e8ff 100%)",
      }}
    >
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="pointer-events-none absolute -top-32 -left-32 w-105 h-105 rounded-full bg-violet-300/40 blur-3xl"></div>
      <div className="pointer-events-none absolute top-1/3 -left-20 w-72 h-72 rounded-full bg-indigo-200/40 blur-3xl"></div>
      <div className="pointer-events-none absolute -bottom-40 right-0 w-120 h-120 rounded-full bg-violet-400/40 blur-3xl"></div>
      <div
        aria-hidden
        className="pointer-events-none absolute top-24 right-10 w-40 h-40 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle, #7c3aed 1.4px, transparent 1.4px)",
          backgroundSize: "16px 16px",
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Brand row */}
        <Link to="/" className="flex items-center justify-center mb-7">
          <img
            src="/Logo.png"
            alt="CareerPath AI Simulator"
            className="h-20 w-auto"
          />
        </Link>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-[0_20px_60px_-20px_rgba(99,102,241,0.35)] p-8 sm:p-10">
          <div className="text-center mb-7">
            <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-4 border border-indigo-100">
              <Shield size={12} /> Admin Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Administrator Sign In
            </h1>
            <p className="text-slate-500 text-sm mt-2">
              Secure access for platform administrators only
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500">
                  <User size={18} />
                </span>
                <input
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  placeholder="Admin username"
                  required
                  className="w-full bg-violet-50/70 border border-violet-100 rounded-xl pl-12 pr-4 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500">
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="Password"
                  required
                  className="w-full bg-violet-50/70 border border-violet-100 rounded-xl pl-12 pr-12 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-semibold tracking-wide shadow-lg shadow-indigo-500/30 disabled:opacity-60 transition-all hover:shadow-xl hover:shadow-indigo-500/40 flex items-center justify-center gap-2"
              style={{
                background:
                  "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)",
              }}
            >
              {loading ? (
                <>
                  <Loader size={16} className="animate-spin" /> Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft size={14} /> Back to student login
            </Link>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
          <ShieldCheck size={16} className="text-indigo-500" />
          <span>Unauthorized access is prohibited</span>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
