// ============================================
// PROGRESS BAR COMPONENT (NEW)
// ============================================
export const ProgressBar = ({ value = 0, max = 100, label, showPercentage = true, size = "medium" }) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizes = {
    small: "h-2",
    medium: "h-3",
    large: "h-4",
  };

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showPercentage && <span className="text-sm font-semibold text-indigo-600">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizes[size]}`}>
        <div
          className="bg-linear-to-r from-indigo-500 to-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
