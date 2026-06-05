// ============================================
// ALERT COMPONENT (NEW)
// ============================================
export const Alert = ({ type = "info", title, message, onClose }) => {
  const types = {
    info: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-800", icon: "ℹ️" },
    success: { bg: "bg-green-50", border: "border-green-200", text: "text-green-800", icon: "✅" },
    warning: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", icon: "⚠️" },
    error: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", icon: "❌" },
  };

  const config = types[type] || types.info;

  return (
    <div className={`${config.bg} ${config.border} ${config.text} border-2 rounded-lg p-4 mb-4`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{config.icon}</span>
        <div className="flex-1">
          {title && <h4 className="font-semibold mb-1">{title}</h4>}
          <p className="text-sm">{message}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="flex-shrink-0 hover:opacity-70 transition-opacity">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};