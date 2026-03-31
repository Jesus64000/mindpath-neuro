const KpiCard = ({ icon: Icon, label, value, color = 'text-mindpath-primary', bg = 'bg-mindpath-light', onClick }) => (
    <div 
        onClick={onClick} 
        className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-gray-100 dark:border-[var(--border-color)] p-5 flex items-center gap-4 shadow-sm cursor-pointer hover:ring-2 hover:ring-mindpath-primary/30 transition-all"
    >
        <div className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
            <Icon size={22} className={color} />
        </div>
        <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value ?? '—'}</p>
            <p className="text-xs text-gray-500 dark:text-[var(--text-muted)] font-medium">{label}</p>
        </div>
    </div>
);

export default KpiCard;
