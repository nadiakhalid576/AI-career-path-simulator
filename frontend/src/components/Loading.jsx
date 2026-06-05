// ============================================
// LOADING COMPONENTS
// ============================================
export const Loading = ({ message = "Loading..." }) => {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center animate-fade-in">
      <div className="relative">
        <div className="w-14 h-14 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-indigo-500/10 rounded-full animate-pulse"></div>
        </div>
      </div>
      <p className="text-gray-600 mt-5 font-medium">{message}</p>
    </div>
  );
};

export const Skeleton = ({ className = "", height = "h-4" }) => {
  return (
    <div className={`bg-slate-200 animate-pulse rounded-lg ${height} ${className}`} />
  );
};

// Skeleton variants for common use cases
export const SkeletonCard = () => {
  return (
    <Card>
      <Skeleton height="h-8" className="w-3/4 mb-4" />
      <Skeleton height="h-4" className="w-full mb-2" />
      <Skeleton height="h-4" className="w-5/6 mb-2" />
      <Skeleton height="h-4" className="w-4/5" />
    </Card>
  );
};
