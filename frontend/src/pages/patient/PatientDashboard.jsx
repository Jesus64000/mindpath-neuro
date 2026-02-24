import { useAuthStore } from '../../store/useAuthStore';
import { Video, Calendar, ArrowRight, Clock, Users, PlusCircle, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import DoctorCard from '../../components/DoctorCard';

const PatientDashboard = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [nextAppointment, setNextAppointment] = useState(null); // La cita de HOY (Urgente)
    const [upcomingAppointments, setUpcomingAppointments] = useState([]); // Próximas citas (Mini-lista)
    const [myDoctors, setMyDoctors] = useState([]); // El equipo médico del paciente

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // 1. Cargamos TODAS las citas del paciente
                const appsResponse = await api.get('/appointments/patient?limit=50');
                // La API devuelve { data: [], pagination: {} } — extraemos el array
                const appointments = Array.isArray(appsResponse.data)
                    ? appsResponse.data
                    : (appsResponse.data?.data ?? []);
                const today = new Date().toDateString();

                // Separar la cita de HOY (si existe)
                const todayApp = appointments.find(app =>
                    new Date(app.appointment_date).toDateString() === today &&
                    app.status === 'confirmed' &&
                    app.type === 'virtual'
                );
                if (todayApp) setNextAppointment(todayApp);

                // Separar las PRÓXIMAS citas
                const futureApps = appointments
                    .filter(app =>
                        new Date(app.appointment_date) >= new Date() &&
                        app.appointment_id !== todayApp?.appointment_id &&
                        (app.status === 'pending' || app.status === 'confirmed')
                    )
                    .slice(0, 3);
                setUpcomingAppointments(futureApps);

                // 2. Cargamos "Mi Equipo Médico" (Idealmente, el backend hará esta lógica, 
                // pero por ahora hacemos una petición a una ruta que crearemos luego)
                try {
                    const doctorsResponse = await api.get('/patients/my-doctors');
                    setMyDoctors(doctorsResponse.data);
                } catch (error) {
                    console.warn("Ruta /my-doctors aún no existe en el backend, usando arreglo vacío por ahora.");
                    setMyDoctors([]); // Fallback temporal
                }

            } catch (error) {
                console.error("Error cargando datos del dashboard", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[70vh]">
                <Activity className="animate-spin text-mindpath-primary" size={48} />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            
            {/* 🚨 WIDGET 1: LA CITA DE HOY (El más importante) */}
            {nextAppointment ? (
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
            ) : (
                <div className="bg-white rounded-3xl p-8 flex justify-between items-center border border-gray-100 shadow-sm">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            ¡Hola, {user?.full_name?.split(' ')[0] || 'Paciente'}! 👋
                        </h1>
                        <p className="text-gray-500">
                            Bienvenido a tu centro de salud mental. ¿Cómo te sientes hoy?
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* ⬅️ COLUMNA IZQUIERDA: Mi Equipo Médico (Ocupa 2/3 del espacio) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-end">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center">
                            <Users size={24} className="text-mindpath-primary mr-2"/>
                            Mi Equipo Médico
                        </h3>
                        <Link to="/patient/doctors" className="text-sm font-bold text-mindpath-primary hover:underline flex items-center">
                            Explorar Directorio <ArrowRight size={16} className="ml-1" />
                        </Link>
                    </div>

                    {myDoctors.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {myDoctors.map(doc => <DoctorCard key={doc.doctor_id} doctor={doc} />)}
                        </div>
                    ) : (
                        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-10 text-center flex flex-col items-center justify-center">
                            <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                <PlusCircle size={32} className="text-gray-300" />
                            </div>
                            <h4 className="text-lg font-bold text-gray-700 mb-2">Aún no tienes médicos asignados</h4>
                            <p className="text-gray-500 mb-6 max-w-sm">
                                Explora nuestro directorio de especialistas verificados y agenda tu primera consulta para empezar a construir tu equipo médico.
                            </p>
                            <button 
                                onClick={() => navigate('/patient/doctors')}
                                className="px-6 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-colors shadow-md"
                            >
                                Buscar Especialista
                            </button>
                        </div>
                    )}
                </div>

                {/* ➡️ COLUMNA DERECHA: Mini-Lista de Próximas Citas (Ocupa 1/3 del espacio) */}
                <div className="space-y-6">
                    <div className="flex justify-between items-end">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center">
                            <Calendar size={24} className="text-mindpath-primary mr-2"/>
                            Próximas Citas
                        </h3>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                        {upcomingAppointments.length > 0 ? (
                            <div className="space-y-4">
                                {upcomingAppointments.map(app => (
                                    <div key={app.appointment_id} className="flex items-start p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100 cursor-pointer" onClick={() => navigate('/patient/appointments')}>
                                        <div className="h-10 w-10 bg-mindpath-light rounded-full flex items-center justify-center text-mindpath-primary shrink-0 mr-4">
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 line-clamp-1">Dr(a). {app.doctor_name}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(app.appointment_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} • {app.start_time.slice(0, 5)}
                                            </p>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${app.status === 'confirmed' ? 'bg-blue-50 text-blue-600' : 'bg-yellow-50 text-yellow-600'}`}>
                                                {app.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                <button 
                                    onClick={() => navigate('/patient/appointments')}
                                    className="w-full mt-4 py-2 text-sm font-bold text-mindpath-primary bg-mindpath-light rounded-xl hover:bg-purple-100 transition-colors"
                                >
                                    Ver todas mis citas
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Calendar size={32} className="mx-auto text-gray-300 mb-3" />
                                <p className="text-sm font-medium text-gray-500">No tienes citas programadas próximamente.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PatientDashboard;
