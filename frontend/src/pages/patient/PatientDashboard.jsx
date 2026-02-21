import { useAuthStore } from '../../store/useAuthStore';
import { Search } from 'lucide-react';

const PatientDashboard = () => {
    const { user } = useAuthStore();

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Banner de Bienvenida */}
            <div className="bg-mindpath-light rounded-3xl p-8 flex justify-between items-center border border-violet-100">
                <div>
                    <h1 className="text-3xl font-bold text-mindpath-dark mb-2">
                        ¡Hola, {user?.full_name.split(' ')[0]}! 👋
                    </h1>
                    <p className="text-gray-600">
                        Encuentra al mejor neurólogo para tus necesidades y agenda una cita en minutos.
                    </p>
                </div>
            </div>

            {/* Buscador Mockup */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search size={20} className="text-gray-400" />
                </div>
                <input
                    type="text"
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-mindpath-primary focus:border-transparent outline-none text-gray-700"
                    placeholder="Buscar neurólogo por nombre o especialidad..."
                />
            </div>

            {/* Contenedor de Doctores (Placeholder para el próximo sprint) */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Especialistas Destacados en el Zulia</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Aquí irán las DoctorCards */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center h-48 text-gray-400">
                        Cargando especialistas...
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientDashboard;
