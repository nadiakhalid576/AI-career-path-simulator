// ============================================
// INPUT COMPONENTS
// ============================================
export const Input = ({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  className = "",
  icon,
}) => {
  return (
    <div className={`mb-5 ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-semibold text-slate-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            {icon}
          </div>
        )}
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full ${icon ? "pl-11" : "pl-4"} pr-4 py-3 border-2 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all ${error ? "border-red-400" : "border-gray-200 hover:border-gray-300"}`}
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-500 flex items-center gap-1">⚠️ {error}</p>}
      {helperText && !error && <p className="mt-2 text-sm text-slate-500">{helperText}</p>}
    </div>
  );
};

export const Textarea = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  error,
  rows = 4,
  required = false,
  disabled = false,
  className = "",
}) => {
  return (
    <div className={`mb-5 ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-semibold text-slate-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        disabled={disabled}
        className={`w-full px-4 py-3 border-2 rounded-lg text-slate-900 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all ${error ? "border-red-400" : "border-gray-200 hover:border-gray-300"}`}
      />
      {error && <p className="mt-2 text-sm text-red-500 flex items-center gap-1">⚠️ {error}</p>}
    </div>
  );
};
