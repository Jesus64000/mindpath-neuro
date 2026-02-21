import { useAuthStore } from '../../store/useAuthStore';
import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import DoctorCard from '../../components/DoctorCard';

const PatientDashboard = () => {
    const { user } = useAuthStore();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const response = await api.get('/doctors');
                setDoctors(response.data);
            } catch (error) {
                console.error("Error cargando doctores", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDoctors();
    }, []);

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

            {/* Contenedor de Doctores */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Especialistas Destacados en el Zulia</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {loading ? (
                        <p className="text-gray-400 col-span-full text-center py-10">Cargando especialistas...</p>
                    ) : doctors.length > 0 ? (
                        doctors.map(doc => <DoctorCard key={doc.doctor_id} doctor={doc} />)
                    ) : (
                        <p className="text-gray-400 col-span-full text-center py-10">No hay especialistas verificados disponibles en este momento.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PatientDashboard;
