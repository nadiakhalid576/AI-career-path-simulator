import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/api";
import { Toast } from "../../components/Toast";
import {
  Target,
  Loader,
  User,
  Lock,
  Eye,
  EyeOff,
  Check,
  ShieldCheck,
} from "lucide-react";

const LoginPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      setToast({ message: "Please fill in all fields", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/login/", formData);
      const { token, user } = response.data.data;
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      localStorage.removeItem("isAdmin");
      localStorage.setItem("authToken", token);
      localStorage.setItem("userId", user.id);
      localStorage.setItem("username", user.username);
      onLogin(user);
      setToast({ message: "Login successful!", type: "success" });
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (error) {
      const status = error.response?.status;
      const errMsg = error.response?.data?.error || "Login failed";
      if (status === 403) {
        setToast({
          message: "Admin accounts sign in through the admin portal.",
          type: "error",
        });
        setTimeout(() => navigate("/admin/login"), 1500);
      } else {
        setToast({ message: errMsg, type: "error" });
      }
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

      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-105 h-105 rounded-full bg-violet-300/40 blur-3xl"></div>
      <div className="pointer-events-none absolute top-1/3 -left-20 w-72 h-72 rounded-full bg-indigo-200/40 blur-3xl"></div>
      <div className="pointer-events-none absolute -bottom-40 right-0 w-120 h-120 rounded-full bg-violet-400/40 blur-3xl"></div>
      <div className="pointer-events-none absolute bottom-10 right-1/4 w-56 h-56 rounded-full bg-indigo-300/30 blur-3xl"></div>

      {/* Decorative dot grid (top-right) */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-24 right-10 w-40 h-40 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle, #7c3aed 1.4px, transparent 1.4px)",
          backgroundSize: "16px 16px",
        }}
      />
      {/* Decorative dot grid (bottom-left) */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-16 left-12 w-32 h-32 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle, #6366f1 1.2px, transparent 1.2px)",
          backgroundSize: "14px 14px",
        }}
      />

      <div className="max-w-md w-full relative z-10">
        {/* Brand row */}
        <Link to="/" className="flex items-center justify-center mb-7">
          <img
            src="/Logo.png"
            alt="CareerPath AI Simulator"
            className="h-20 w-auto"
          />
        </Link>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-[0_20px_60px_-20px_rgba(99,102,241,0.35)] p-8 sm:p-10">
          <div className="text-center mb-7">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Welcome Back!
            </h1>
            <p className="text-slate-500 text-sm mt-2">
              Sign in to continue your journey
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email / username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-semibold text-slate-800 mb-2"
              >
                User Name
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500">
                  <User size={18} />
                </span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  placeholder="you@example.com"
                  required
                  className="w-full bg-violet-50/70 border border-violet-100 rounded-xl pl-12 pr-4 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-800 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500">
                  <Lock size={18} />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder="Enter your password"
                  required
                  className="w-full bg-violet-50/70 border border-violet-100 rounded-xl pl-12 pr-12 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <span
                  onClick={() => setRememberMe((v) => !v)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                    rememberMe
                      ? "bg-indigo-600 border-indigo-600"
                      : "bg-white border-slate-300"
                  }`}
                >
                  {rememberMe && (
                    <Check size={13} className="text-white" strokeWidth={3} />
                  )}
                </span>
                <span className="text-slate-700 font-medium">Remember me</span>
              </label>
              <button
                type="button"
                className="text-indigo-600 font-semibold hover:text-indigo-700"
                onClick={() =>
                  setToast({
                    message:
                      "Password reset isn't available yet — contact admin.",
                    type: "info",
                  })
                }
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In button */}
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
                  <Loader size={18} className="animate-spin" /> Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>

            {/* OR divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">or</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Admin portal shortcut (replaces Google for now) */}
            <Link
              to="/admin/login"
              className="w-full inline-flex items-center justify-center gap-3 py-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40 text-slate-700 font-semibold transition-all"
            >
              <ShieldCheck size={18} className="text-indigo-600" />
              Continue as Admin
            </Link>

            <p className="text-center text-sm text-slate-500 pt-1">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-indigo-600 font-semibold hover:text-indigo-700"
              >
                Sign up
              </Link>
            </p>
          </form>
        </div>

        {/* Footer trust strip */}
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
          <ShieldCheck size={16} className="text-indigo-500" />
          <span>Your data is safe with us</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
