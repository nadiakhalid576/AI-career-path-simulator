export const Button = ({
  children,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  type = "button",
  className = "",
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "text-white shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/40 bg-[linear-gradient(135deg,_#6366f1_0%,_#7c3aed_100%)]",
    secondary: "bg-violet-100 hover:bg-violet-200 text-indigo-700",
    outlined:
      "border-2 border-violet-200 hover:border-indigo-500 hover:bg-violet-50 bg-white/80 text-slate-700 hover:text-indigo-600",
    ghost: "hover:bg-violet-50 text-slate-600 hover:text-indigo-700",
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-sm",
  };

  const sizes = {
    small: "px-4 py-2 text-sm",
    medium: "px-6 py-2.5 text-base",
    large: "px-8 py-3 text-lg",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  );
};