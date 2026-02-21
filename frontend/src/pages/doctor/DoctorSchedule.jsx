import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { Calendar as CalendarIcon, Clock, Video, MapPin, CheckCircle, XCircle, User, Activity } from 'lucide-react';

const DoctorSchedule = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Calcular edad a partir de la fecha de nacimiento (YYYY-MM-DD)
    const calculateAge = (dob) => {
        const diffMs = Date.now() - new Date(dob).getTime();
        const ageDt = new Date(diffMs); 
        return Math.abs(ageDt.getUTCFullYear() - 1970);
    };

    const fetchAppointments = async () => {
        try {
            const response = await api.get('/appointments/doctor');
            setAppointments(response.data);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Error al cargar tu agenda.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const updateStatus = async (id, newStatus) => {
        try {
            await api.patch(`/appointments/${id}/status`, { status: newStatus });
            // Actualizamos el estado local para no recargar la página completa
            setAppointments(appointments.map(app => 
                app.appointment_id === id ? { ...app, status: newStatus } : app
            ));
        } catch (err) {
            alert('No se pudo actualizar el estado de la cita.');
        }
    };

    const handleStartVideoCall = (appointmentId) => {
        // Redirigiremos a la sala de videollamada en el próximo sprint
        navigate(`/doctor/video-room/${appointmentId}`);
    };

    // Diccionario visual para los estados
    const statusConfig = {
        pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
        confirmed: { label: 'Confirmada', color: 'bg-blue-100 text-blue-700 border-blue-200' },
        completed: { label: 'Completada', color: 'bg-green-100 text-green-700 border-green-200' },
        cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-700 border-red-200' }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Agenda Médica</h1>
                    <p className="text-gray-500 mt-1">Gestiona tus consultas programadas y telemedicina.</p>
                </div>
                <div className="bg-mindpath-light text-mindpath-primary px-4 py-2 rounded-xl font-bold border border-violet-100 flex items-center">
                    <CalendarIcon size={20} className="mr-2" />
                    Hoy: {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
            </div>

            {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl">{error}</div>}

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Activity className="animate-spin text-mindpath-primary" size={40} />
                </div>
            ) : appointments.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {appointments.map((app) => (
                        <div key={app.appointment_id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow">
                            
                            {/* Info del Paciente */}
                            <div className="flex items-center w-full md:w-1/3">
                                <div className="h-14 w-14 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 mr-4 shrink-0">
                                    <User size={28} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{app.patient_name}</h3>
                                    <p className="text-sm text-gray-500">
                                        {app.gender === 'M' ? 'Masculino' : app.gender === 'F' ? 'Femenino' : 'Otro'}, {calculateAge(app.date_of_birth)} años
                                    </p>
                                </div>
                            </div>

                            {/* Detalles de la Cita */}
                            <div className="flex flex-col w-full md:w-1/3 space-y-2">
                                <div className="flex items-center text-gray-700 font-medium">
                                    <Clock size={18} className="text-mindpath-primary mr-2" />
                                    {new Date(app.appointment_date).toLocaleDateString('es-ES')} a las {app.start_time.slice(0, 5)}
                                </div>
                                <div className="flex items-center text-sm font-bold text-gray-500">
                                    {app.type === 'virtual' ? (
                                        <><Video size={16} className="text-blue-500 mr-2" /> Telemedicina (Online Mind)</>
                                    ) : (
                                        <><MapPin size={16} className="text-green-500 mr-2" /> Consulta Presencial</>
                                    )}
                                </div>
                                <div>
                                    <span className={`text-xs px-2.5 py-1 rounded-full border font-bold ${statusConfig[app.status].color}`}>
                                        {statusConfig[app.status].label}
                                    </span>
                                </div>
                            </div>

                            {/* Acciones */}
                            <div className="flex w-full md:w-1/3 justify-end gap-2 shrink-0">
                                {/* Botones de Gestión (Solo si está pendiente) */}
                                {app.status === 'pending' && (
                                    <>
                                        <button onClick={() => updateStatus(app.appointment_id, 'confirmed')} className="p-2.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-xl transition-colors" title="Confirmar Cita">
                                            <CheckCircle size={22} />
                                        </button>
                                        <button onClick={() => updateStatus(app.appointment_id, 'cancelled')} className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors" title="Cancelar Cita">
                                            <XCircle size={22} />
                                        </button>
                                    </>
                                )}

                                {/* BOTÓN ESTRELLA: Iniciar Videoconsulta */}
                                {(app.status === 'confirmed' || app.status === 'pending') && app.type === 'virtual' && (
                                    <button 
                                        onClick={() => handleStartVideoCall(app.appointment_id)}
                                        className="px-6 py-2.5 bg-mindpath-primary hover:bg-mindpath-primaryHover text-white font-bold rounded-xl flex items-center transition-colors shadow-sm"
                                    >
                                        <Video size={18} className="mr-2" />
                                        Iniciar Consulta
                                    </button>
                                )}
                            </div>

                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
                    <CalendarIcon size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-700 mb-2">Tu agenda está vacía</h3>
                    <p className="text-gray-500">No tienes citas programadas en este momento.</p>
                </div>
            )}
        </div>
    );
};

export default DoctorSchedule;