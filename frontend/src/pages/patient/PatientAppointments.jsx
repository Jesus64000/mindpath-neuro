import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { Calendar as CalendarIcon, Clock, Video, MapPin, Activity, Stethoscope, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const PatientAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limitPerPage = 5;

    useEffect(() => {
        const fetchAppointments = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/appointments/patient?page=${currentPage}&limit=${limitPerPage}`);
                setAppointments(response.data.data);
                setTotalPages(response.data.pagination.totalPages);
            } catch (err) {
                console.error(err);
                setError('Error al cargar tus citas médicas.');
            } finally {
                setLoading(false);
            }
        };
        fetchAppointments();
    }, [currentPage]);

    const handleJoinVideoCall = (appointmentId) => {
        // Redirigir a la sala de espera / videollamada del paciente
        navigate(`/patient/video-room/${appointmentId}`); 
    };

    // Diccionario visual para los estados
    const statusConfig = {
        pending: { label: 'Esperando Confirmación', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
        confirmed: { label: 'Cita Confirmada', color: 'bg-blue-100 text-blue-700 border-blue-200' },
        completed: { label: 'Completada', color: 'bg-green-100 text-green-700 border-green-200' },
        cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-700 border-red-200' }
    };

    // 🧠 LÓGICA INTELIGENTE: Verifica si la cita es HOY
    const isAppointmentToday = (dateString) => {
        const appointmentDate = new Date(dateString).toDateString();
        const today = new Date().toDateString();
        return appointmentDate === today;
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Mis Citas</h1>
                <p className="text-gray-500 mt-1">Revisa tu historial médico y próximas consultas.</p>
            </div>

            {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center"><AlertCircle className="mr-2" size={20}/>{error}</div>}

            {loading && appointments.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                    <Activity className="animate-spin text-mindpath-primary" size={40} />
                </div>
            ) : appointments.length > 0 ? (
                <>
                    {/* Lista de Citas */}
                    <div className="grid grid-cols-1 gap-4">
                        {appointments.map((app) => {
                            const isToday = isAppointmentToday(app.appointment_date);
                            return (
                                <div key={app.appointment_id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow">
                                    
                                    {/* Info del Doctor */}
                                    <div className="flex items-center w-full md:w-1/3">
                                        <div className="h-16 w-16 bg-mindpath-light rounded-full flex items-center justify-center text-mindpath-primary text-xl font-bold border-2 border-white shadow-sm overflow-hidden mr-4 shrink-0">
                                            {app.profile_picture ? (
                                                <img src={app.profile_picture} alt={app.doctor_name} className="h-full w-full object-cover" />
                                            ) : app.doctor_name?.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">Dr(a). {app.doctor_name?.split(' ').slice(-1).join(' ')}</h3>
                                            <p className="text-sm font-medium text-mindpath-primary flex items-center">
                                                <Stethoscope size={14} className="mr-1" /> {app.specialty}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Detalles de la Cita */}
                                    <div className="flex flex-col w-full md:w-1/3 space-y-2">
                                        <div className="flex items-center text-gray-700 font-medium">
                                            <CalendarIcon size={18} className="text-gray-400 mr-2" />
                                            {new Date(app.appointment_date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })} 
                                            <Clock size={18} className="text-gray-400 ml-3 mr-1" />
                                            {app.start_time.slice(0, 5)}
                                        </div>
                                        <div className="flex items-center text-sm font-bold text-gray-500">
                                            {app.type === 'virtual' ? (
                                                <><Video size={16} className="text-blue-500 mr-2" /> Telemedicina (Online)</>
                                            ) : (
                                                <><MapPin size={16} className="text-green-500 mr-2" /> Presencial</>
                                            )}
                                        </div>
                                        <div>
                                            <span className={`text-xs px-2.5 py-1 rounded-full border font-bold inline-block mt-1 ${statusConfig[app.status]?.color}`}>
                                                {statusConfig[app.status]?.label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Acción */}
                                    <div className="flex w-full md:w-1/3 justify-end shrink-0">
                                        {app.type === 'virtual' && app.status === 'confirmed' && (
                                            isToday ? (
                                                <button 
                                                    onClick={() => handleJoinVideoCall(app.appointment_id)}
                                                    className="w-full md:w-auto px-6 py-3 bg-mindpath-primary hover:bg-mindpath-primaryHover text-white font-bold rounded-xl flex items-center justify-center transition-all shadow-md shadow-purple-500/20 hover:scale-105"
                                                >
                                                    <Video size={18} className="mr-2 animate-pulse" />
                                                    Entrar a Consulta
                                                </button>
                                            ) : (
                                                <button disabled className="w-full md:w-auto px-6 py-3 bg-gray-100 text-gray-400 font-bold rounded-xl flex items-center justify-center cursor-not-allowed border border-gray-200">
                                                    <Clock size={18} className="mr-2" />
                                                    Disponible el {new Date(app.appointment_date).getDate()}
                                                </button>
                                            )
                                        )}
                                        {app.status === 'pending' && <p className="text-sm text-gray-400 italic w-full text-right">Esperando confirmación...</p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Paginación */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center mt-8 gap-4">
                            <button 
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1 || loading}
                                className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-mindpath-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            
                            <span className="text-sm font-bold text-gray-700 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                                Página {currentPage} de {totalPages}
                            </span>

                            <button 
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages || loading}
                                className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-mindpath-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
                    <CalendarIcon size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-700 mb-2">No tienes citas aún</h3>
                    <p className="text-gray-500 mb-6">Explora nuestro directorio y agenda tu primera consulta.</p>
                    <button 
                        onClick={() => navigate('/patient/doctors')}
                        className="px-6 py-2.5 bg-mindpath-primary text-white font-medium rounded-xl hover:bg-mindpath-primaryHover transition-colors"
                    >
                        Buscar Especialistas
                    </button>
                </div>
            )}
        </div>
    );
};

export default PatientAppointments;