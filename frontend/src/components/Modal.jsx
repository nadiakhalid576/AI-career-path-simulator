// ============================================
// MODAL COMPONENT
// ============================================
import { useEffect } from "react";
export const Modal = ({ isOpen, onClose, title, children, size = "default", footer }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    small: "max-w-md",
    default: "max-w-lg",
    large: "max-w-2xl",
    full: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-indigo-950/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div
          className={`${sizes[size]} w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-indigo-500/30 border border-white animate-fade-in max-h-[90vh] flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between px-6 py-5 border-b border-violet-100">
              <h3 className="text-xl font-bold text-slate-900">{title}</h3>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-violet-50 rounded-lg transition-all"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-5 overflow-y-auto flex-1">
            {children}
          </div>

          {/* Footer (optional) */}
          {footer && (
            <div className="px-6 py-4 border-t border-violet-100 bg-violet-50/60 rounded-b-2xl">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};