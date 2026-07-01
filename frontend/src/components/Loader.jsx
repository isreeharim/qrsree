export default function Loader({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-[3px]',
  };

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`animate-spin rounded-full border-teal-500/25 border-t-teal-500 ${sizes[size]} ${className}`}
    />
  );
}

export function FullPageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-navy-950">
      <Loader size="lg" />
    </div>
  );
}
