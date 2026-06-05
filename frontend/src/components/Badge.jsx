// ============================================
// BADGE COMPONENT (NEW)
// ============================================
export const Badge = ({ children, variant = "default", size = "medium" }) => {
  const variants = {
    default: "bg-gray-100 text-gray-700",
    primary: "bg-indigo-100 text-indigo-700",
    secondary: "bg-cyan-100 text-cyan-700",
    success: "bg-green-100 text-green-700",
    error: "bg-red-100 text-red-700",
    warning: "bg-amber-100 text-amber-700",
  };

  const sizes = {
    small: "px-2 py-0.5 text-xs",
    medium: "px-3 py-1 text-sm",
    large: "px-4 py-1.5 text-base",
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
};
