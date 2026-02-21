import { useAuthStore } from '../../store/useAuthStore';
import ScheduleManager from '../../components/ScheduleManager';
import { Users, CalendarCheck, BrainCircuit } from 'lucide-react';

const DoctorDashboard = () => {
    const { user } = useAuthStore();

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Banner de Bienvenida */}
            <div className="bg-mindpath-dark rounded-3xl p-8 flex justify-between items-center relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 w-64 h-64 bg-mindpath-primary rounded-full mix-blend-multiply filter blur-3xl opacity-50 transform translate-x-1/2 -translate-y-1/2"></div>
                <div className="relative z-10 text-white">
                    <h1 className="text-3xl font-bold mb-2">
                        ¡Hola, Dr. {user?.full_name.split(' ')[1] || user?.full_name.split(' ')[0]}!
                    </h1>
                    <p className="text-gray-300">
                        Tu panel de control está listo. Gestiona tu agenda y revisa los reportes generados por IA.
                    </p>
                </div>
            </div>

            {/* KPIs Rápidos (Mockups estructurales) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl mr-4">
                        <CalendarCheck size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Citas Hoy</p>
                        <p className="text-3xl font-bold text-gray-900">0</p>
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center">
                    <div className="p-4 bg-green-50 text-green-600 rounded-2xl mr-4">
                        <Users size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Pacientes Totales</p>
                        <p className="text-3xl font-bold text-gray-900">0</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center">
                    <div className="p-4 bg-mindpath-light text-mindpath-primary rounded-2xl mr-4">
                        <BrainCircuit size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Informes IA Pendientes</p>
                        <p className="text-3xl font-bold text-gray-900">0</p>
                    </div>
                </div>
            </div>

            {/* Gestor de Disponibilidad */}
            <ScheduleManager />

        </div>
    );
};

export default DoctorDashboard;