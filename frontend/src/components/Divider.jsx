// ============================================
// DIVIDER COMPONENT (NEW)
// ============================================
export const Divider = ({ label, className = "" }) => {
  if (label) {
    return (
      <div className={`flex items-center gap-4 my-6 ${className}`}>
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>
    );
  }

  return <div className={`h-px bg-slate-200 my-6 ${className}`} />;
};