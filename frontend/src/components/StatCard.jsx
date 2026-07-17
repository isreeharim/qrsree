export default function StatCard({ label, value, icon: Icon, accent = 'teal' }) {
  const accentClasses = {
    teal: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
    sky: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
    purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  };

  const hoverClasses = {
    teal: 'hover:border-teal-500/30 hover:shadow-[0_8px_30px_rgb(20,250,200,0.03)]',
    sky: 'hover:border-sky-500/30 hover:shadow-[0_8px_30px_rgb(41,176,238,0.03)]',
    purple: 'hover:border-purple-500/30 hover:shadow-[0_8px_30px_rgb(168,85,247,0.03)]',
  };

  return (
    <div className={`rounded-2xl border border-slate-200/60 dark:border-navy-700/60 bg-white/70 dark:bg-navy-800/60 backdrop-blur-md p-6 shadow-sm transition-all duration-300 ${hoverClasses[accent]}`}>
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border ${accentClasses[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
          <p className="font-display text-3xl font-bold text-slate-900 dark:text-white mt-1">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
