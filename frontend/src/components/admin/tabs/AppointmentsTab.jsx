import { Calendar, Hammer } from 'lucide-react';

const AppointmentsTab = () => {
    return (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[var(--bg-card)] rounded-3xl border border-gray-100 dark:border-[var(--border-color)] animate-fadeIn">
            <div className="h-20 w-20 bg-mindpath-light rounded-full flex items-center justify-center mb-6">
                <Calendar size={40} className="text-mindpath-primary" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Historial de Citas</h2>
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-100 rounded-full text-yellow-700 text-sm font-bold mb-4">
                <Hammer size={16} />
                <span>Módulo en Construcción</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm px-6">
                Estamos trabajando para traerte una vista detallada y potente de todas las citas del sistema. Muy pronto podrás filtrar por doctor, paciente y estado.
            </p>
        </div>
    );
};

export default AppointmentsTab;
