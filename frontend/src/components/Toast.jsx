
// ============================================
// TOAST COMPONENT
// ============================================
import { useEffect, useState } from "react";
export const Toast = ({ message, type = "info", duration = 4000, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose?.(), 200);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  const types = {
    success: { bg: "bg-green-500", icon: "✓", label: "Success" },
    error: { bg: "bg-red-500", icon: "✕", label: "Error" },
    warning: { bg: "bg-amber-500", icon: "!", label: "Warning" },
    info: { bg: "bg-indigo-600", icon: "ℹ", label: "Info" },
  };

  const config = types[type] || types.info;

  return (
    <div className="fixed top-5 right-5 z-50 animate-slide-in max-w-md">
      <div className={`flex items-start gap-4 px-5 py-4 rounded-xl text-white shadow-2xl ${config.bg}`}>
        <div className="shrink-0">
          <span className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-full text-base font-bold">
            {config.icon}
          </span>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm mb-0.5">{config.label}</p>
          <p className="text-sm opacity-95">{message}</p>
        </div>
        <button 
          onClick={() => { setVisible(false); onClose?.(); }} 
          className="shrink-0 hover:bg-white/20 rounded-lg p-1.5 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
