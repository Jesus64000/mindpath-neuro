import { useAuthStore } from '../../store/useAuthStore';
import { Video, Calendar, ArrowRight, Clock, Users, PlusCircle, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import DoctorCard from '../../components/DoctorCard';

const statusConfig = {
    confirmed: { label: 'Confirmada', cls: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    pending:   { label: 'Pendiente',  cls: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' },
};

const PatientDashboard = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [nextAppointment, setNextAppointment] = useState(null);
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [myDoctors, setMyDoctors] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const appsResponse = await api.get('/appointments/patient?limit=50');
                const appointments = Array.isArray(appsResponse.data)
                    ? appsResponse.data
                    : (appsResponse.data?.data ?? []);
                const today = new Date().toDateString();

                const todayApp = appointments.find(app =>
                    new Date(app.appointment_date).toDateString() === today &&
                    app.status === 'confirmed' &&
                    app.type === 'virtual'
                );
                if (todayApp) setNextAppointment(todayApp);

                const futureApps = appointments
                    .filter(app =>
                        new Date(app.appointment_date) >= new Date() &&
                        app.appointment_id !== todayApp?.appointment_id &&
                        (app.status === 'pending' || app.status === 'confirmed')
                    )
                    .slice(0, 3);
                setUpcomingAppointments(futureApps);

                try {
                    const doctorsResponse = await api.get('/patients/my-doctors');
                    setMyDoctors(doctorsResponse.data);
                } catch {
                    setMyDoctors([]);
                }

            } catch (error) {
                console.error('Error cargando datos del dashboard', error);
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
            
            {/* WIDGET 1: Cita de HOY */}
            {nextAppointment ? (
                <div className="bg-gradient-to-r from-mindpath-primary to-mindpath-primary rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center text-white shadow-xl shadow-mindpath-primary/20 border border-mindpath-primary">
                    <div className="flex items-center mb-4 md:mb-0">
                        <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mr-6 backdrop-blur-sm">
                            <Video size={32} className="text-white animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold mb-1">Tienes una consulta HOY</h2>
                            <p className="text-gray-400 opacity-90">
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
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 flex justify-between items-center border border-gray-100 dark:border-white/10 shadow-sm">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            ¡Hola, {user?.full_name?.split(' ')[0] || 'Paciente'}! 👋
                        </h1>
                        <p className="text-gray-500 dark:text-slate-400">
                            Bienvenido a tu centro de salud mental. ¿Cómo te sientes hoy?
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* COLUMNA IZQUIERDA: Mi Equipo Médico */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-end">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
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
                        <div className="bg-gray-50 dark:bg-slate-800 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-3xl p-10 text-center flex flex-col items-center justify-center">
                            <div className="h-16 w-16 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center shadow-sm mb-4">
                                <PlusCircle size={32} className="text-gray-300 dark:text-slate-500" />
                            </div>
                            <h4 className="text-lg font-bold text-gray-700 dark:text-slate-200 mb-2">Aún no tienes médicos asignados</h4>
                            <p className="text-gray-500 dark:text-slate-400 mb-6 max-w-sm">
                                Explora nuestro directorio de especialistas verificados y agenda tu primera consulta.
                            </p>
                            <button 
                                onClick={() => navigate('/patient/doctors')}
                                className="px-6 py-3 bg-mindpath-primary hover:bg-mindpath-primaryHover text-white font-bold rounded-xl transition-colors shadow-md"
                            >
                                Buscar Especialista
                            </button>
                        </div>
                    )}
                </div>

                {/* COLUMNA DERECHA: Próximas Citas */}
                <div className="space-y-6">
                    <div className="flex justify-between items-end">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                            <Calendar size={24} className="text-mindpath-primary mr-2"/>
                            Próximas Citas
                        </h3>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm p-6">
                        {upcomingAppointments.length > 0 ? (
                            <div className="space-y-3">
                                {upcomingAppointments.map(app => {
                                    const sc = statusConfig[app.status] || statusConfig.pending;
                                    return (
                                        <div
                                            key={app.appointment_id}
                                            className="flex items-start p-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors border border-transparent hover:border-gray-100 dark:hover:border-white/10 cursor-pointer"
                                            onClick={() => navigate('/patient/appointments')}
                                        >
                                            <div className="h-10 w-10 bg-mindpath-light dark:bg-mindpath-primary/40 rounded-full flex items-center justify-center text-mindpath-primary shrink-0 mr-4">
                                                <Clock size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">Dr(a). {app.doctor_name}</p>
                                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                                    {new Date(app.appointment_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} • {app.start_time.slice(0, 5)}
                                                </p>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${sc.cls}`}>
                                                    {sc.label}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <button 
                                    onClick={() => navigate('/patient/appointments')}
                                    className="w-full mt-2 py-2.5 text-sm font-bold text-mindpath-primary bg-mindpath-light dark:bg-mindpath-primary/30 rounded-xl hover:bg-mindpath-light dark:hover:bg-mindpath-primary/50 transition-colors"
                                >
                                    Ver todas mis citas
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Calendar size={32} className="mx-auto text-gray-200 dark:text-gray-600 mb-3" />
                                <p className="text-sm font-medium text-gray-500 dark:text-slate-400">No tienes citas programadas próximamente.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientDashboard;
