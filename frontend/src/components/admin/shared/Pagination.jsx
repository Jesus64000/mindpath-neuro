import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ pagination, onPageChange }) => {
    if (!pagination || pagination.totalPages <= 1) return null;

    const { page, totalPages, total } = pagination;

    // Generar array de páginas para mostrar (máximo 5)
    const getPageNumbers = () => {
        const pages = [];
        const start = Math.max(1, page - 2);
        const end = Math.min(totalPages, start + 4);
        
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-white dark:bg-[var(--bg-card)] border-t border-gray-100 dark:border-[var(--border-color)]">
            <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                Mostrando <span className="text-mindpath-primary">{total}</span> resultados totales
            </p>

            <div className="flex items-center gap-2">
                <button
                    disabled={page === 1}
                    onClick={() => onPageChange(page - 1)}
                    className="p-2 rounded-xl border border-gray-100 dark:border-slate-800 text-gray-500 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-all hover:border-mindpath-primary/30"
                >
                    <ChevronLeft size={16} />
                </button>

                <div className="flex items-center gap-1.5 px-2">
                    {getPageNumbers().map(num => (
                        <button
                            key={num}
                            onClick={() => onPageChange(num)}
                            className={`h-9 w-9 rounded-xl text-xs font-black transition-all ${
                                page === num 
                                ? 'bg-mindpath-primary text-white shadow-lg shadow-mindpath-primary/25' 
                                : 'text-gray-400 dark:text-slate-500 hover:text-mindpath-primary hover:bg-mindpath-primary/5'
                            }`}
                        >
                            {num}
                        </button>
                    ))}
                    {totalPages > 5 && getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
                        <span className="text-gray-400 dark:text-slate-600 px-1 text-xs">...</span>
                    )}
                </div>

                <button
                    disabled={page === totalPages}
                    onClick={() => onPageChange(page + 1)}
                    className="p-2 rounded-xl border border-gray-100 dark:border-slate-800 text-gray-500 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-all hover:border-mindpath-primary/30"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
