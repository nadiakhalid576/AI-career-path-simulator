
// ============================================
// DROPDOWN COMPONENT
// ============================================
export const Dropdown = ({
  label,
  options = [],
  value,
  onChange,
  placeholder = "Select an option",
  error,
  required = false,
  disabled = false,
  className = "",
}) => {
  return (
    <div className={`mb-5 ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`w-full px-4 py-3 border-2 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none cursor-pointer transition-all ${error ? "border-red-400" : "border-gray-200 hover:border-gray-300"} ${!value ? "text-slate-400" : ""}`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234f46e5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
          backgroundSize: "20px"
        }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((option, idx) => (
          <option key={idx} value={typeof option === "object" ? option.value : option}>
            {typeof option === "object" ? option.label : option}
          </option>
        ))}
      </select>
      {error && <p className="mt-2 text-sm text-red-500 flex items-center gap-1">⚠️ {error}</p>}
    </div>
  );
};
