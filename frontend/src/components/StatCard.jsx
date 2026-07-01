export default function StatCard({ label, value, icon: Icon, accent = 'teal' }) {
  const accentClasses = {
    teal: 'bg-teal-500/10 text-teal-500',
    sky: 'bg-sky-500/10 text-sky-500',
    purple: 'bg-purple-500/10 text-purple-500',
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${accentClasses[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
