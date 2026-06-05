import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/api";
import { Toast } from "../../components/Toast";
import {
  Target,
  Loader,
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.username || formData.username.length < 4) {
      newErrors.username = "Username must be at least 4 characters";
    }
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await api.post("/auth/register/", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirmPassword,
      });
      setToast({ message: "Account created! Please login.", type: "success" });
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Registration failed";
      setToast({
        message:
          typeof errorMsg === "string" ? errorMsg : "Registration failed",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
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

      {/* Decorative dots */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-24 right-10 w-40 h-40 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle, #7c3aed 1.4px, transparent 1.4px)",
          backgroundSize: "16px 16px",
        }}
      />
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
        <Link to="/" className="flex items-center justify-center mb-6">
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
              Create Your Account
            </h1>
            <p className="text-slate-500 text-sm mt-2">
              Start planning your career path with AI
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500">
                  <User size={18} />
                </span>
                <input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  required
                  className={`w-full bg-violet-50/70 border rounded-xl pl-12 pr-4 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 transition-all ${
                    errors.username ? "border-red-300" : "border-violet-100"
                  }`}
                />
              </div>
              {errors.username && (
                <p className="mt-1.5 text-xs text-red-500">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className={`w-full bg-violet-50/70 border rounded-xl pl-12 pr-4 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 transition-all ${
                    errors.email ? "border-red-300" : "border-violet-100"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Password */}
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 8 characters"
                  required
                  className={`w-full bg-violet-50/70 border rounded-xl pl-12 pr-12 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 transition-all ${
                    errors.password ? "border-red-300" : "border-violet-100"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500">
                  <Lock size={18} />
                </span>
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  required
                  className={`w-full bg-violet-50/70 border rounded-xl pl-12 pr-12 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 transition-all ${
                    errors.confirmPassword
                      ? "border-red-300"
                      : "border-violet-100"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-500">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 rounded-xl text-white font-semibold tracking-wide shadow-lg shadow-indigo-500/30 disabled:opacity-60 transition-all hover:shadow-xl hover:shadow-indigo-500/40 flex items-center justify-center gap-2"
              style={{
                background:
                  "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)",
              }}
            >
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin" /> Creating
                  account...
                </>
              ) : (
                "Create Account"
              )}
            </button>

            <p className="text-center text-sm text-slate-500 pt-2">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-indigo-600 font-semibold hover:text-indigo-700"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
          <ShieldCheck size={16} className="text-indigo-500" />
          <span>Your data is safe with us</span>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
