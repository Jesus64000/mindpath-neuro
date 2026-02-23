import { useAuthStore } from '../../store/useAuthStore';
import { Search, Video, Calendar, ArrowRight, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import DoctorCard from '../../components/DoctorCard';

const PatientDashboard = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [nextAppointment, setNextAppointment] = useState(null);
    
    // 🧠 NUEVO: Estado para el buscador inteligente
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const docsResponse = await api.get('/doctors');
                setDoctors(docsResponse.data);

                const appsResponse = await api.get('/appointments/patient');
                const today = new Date().toDateString();
                const upcoming = appsResponse.data.find(app => 
                    new Date(app.appointment_date).toDateString() === today && 
                    app.status === 'confirmed' && 
                    app.type === 'virtual'
                );
                if (upcoming) setNextAppointment(upcoming);

            } catch (error) {
                console.error("Error cargando datos del dashboard", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // 🧠 NUEVO: Lógica de filtrado en tiempo real
    const filteredDoctors = doctors.filter(doc => {
        const searchLower = searchTerm.toLowerCase();
        const nameMatch = doc.full_name?.toLowerCase().includes(searchLower);
        const specialtyMatch = doc.specialty?.toLowerCase().includes(searchLower);
        return nameMatch || specialtyMatch;
    });

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            
            {/* WIDGET INTELIGENTE: Consulta de Hoy */}
            {nextAppointment && (
                <div className="bg-gradient-to-r from-mindpath-primary to-purple-600 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center text-white shadow-xl shadow-purple-500/20 animate-fade-in border border-purple-400">
                    <div className="flex items-center mb-4 md:mb-0">
                        <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mr-6 backdrop-blur-sm">
                            <Video size={32} className="text-white animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold mb-1">Tienes una consulta HOY</h2>
                            <p className="text-purple-100 opacity-90">
                                Con el Dr(a). {nextAppointment.doctor_name} a las {nextAppointment.start_time.slice(0,5)}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate(`/patient/video-room/${nextAppointment.appointment_id}`)}
                        className="w-full md:w-auto px-8 py-3 bg-white text-mindpath-primary font-bold rounded-xl shadow-lg hover:bg-gray-50 transition-all flex items-center justify-center hover:scale-105"
                    >
                        Entrar a la Sala <ArrowRight size={18} className="ml-2" />
                    </button>
                </div>
            )}

            {/* Banner de Bienvenida Clásico */}
            {!nextAppointment && (
                <div className="bg-mindpath-light rounded-3xl p-8 flex justify-between items-center border border-violet-100">
                    <div>
                        <h1 className="text-3xl font-bold text-mindpath-dark mb-2">
                            ¡Hola, {user?.full_name?.split(' ')[0] || 'Paciente'}! 👋
                        </h1>
                        <p className="text-gray-600">
                            Encuentra al mejor especialista para tus necesidades y agenda una cita en minutos.
                        </p>
                    </div>
                </div>
            )}

            {/* 🔍 BUSCADOR INTELIGENTE INTEGRADO */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search size={20} className={`transition-colors ${searchTerm ? 'text-mindpath-primary' : 'text-gray-400 group-hover:text-mindpath-primary'}`} />
                </div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-mindpath-primary focus:border-transparent outline-none text-gray-700 transition-all"
                    placeholder="Buscar especialista por nombre o especialidad (ej. Neurólogo)..."
                />
                {/* Botón para limpiar la búsqueda rápidamente */}
                {searchTerm && (
                    <button 
                        onClick={() => setSearchTerm('')}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Contenedor de Doctores */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <Calendar size={20} className="text-mindpath-primary mr-2"/>
                    {searchTerm ? `Resultados para "${searchTerm}"` : 'Especialistas Destacados'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {loading ? (
                        <p className="text-gray-400 col-span-full text-center py-10">Cargando especialistas...</p>
                    ) : filteredDoctors.length > 0 ? (
                        filteredDoctors.map(doc => <DoctorCard key={doc.doctor_id} doctor={doc} />)
                    ) : (
                        <div className="col-span-full bg-gray-50 rounded-2xl p-8 text-center border-2 border-dashed border-gray-200">
                            <Search size={40} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium">No se encontraron especialistas que coincidan con "{searchTerm}".</p>
                            <button onClick={() => setSearchTerm('')} className="mt-4 text-mindpath-primary font-bold hover:underline">
                                Limpiar búsqueda
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PatientDashboard;
