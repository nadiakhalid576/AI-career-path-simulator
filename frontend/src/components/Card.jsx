// ============================================
// CARD COMPONENTS
// ============================================
export const Card = ({ children, className = "", padding = true, hover = false }) => {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 ${hover ? "transition-all duration-300 hover:shadow-lg hover:-translate-y-1" : "shadow-sm"} ${padding ? "p-6" : ""} ${className}`}>
      {children}
    </div>
  );
};

export const StatsCard = ({ icon, value, label, trend }) => {
  return (
    <Card className="text-center" hover>
      <div className="text-4xl mb-3">{icon}</div>
      <div className="text-3xl font-bold text-slate-900">{value}</div>
      <div className="text-sm text-slate-500 mt-1">{label}</div>
      {trend && (
        <div className="mt-2 text-xs text-green-600 font-medium">
          ↑ {trend}
        </div>
      )}
    </Card>
  );
};

export const FeatureCard = ({ icon, title, description }) => {
  return (
    <Card className="text-center" hover>
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
    </Card>
  );
};
