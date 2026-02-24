import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { Calendar as CalendarIcon, Clock, Video, MapPin, CheckCircle, XCircle, User, Activity, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

// Month helpers
const getMonthStart = (date) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), 1);
};

const shiftMonth = (date, delta) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + delta);
    return getMonthStart(d);
};

const getMonthDays = (monthStart) => {
    const start = new Date(monthStart);
    const firstDay = start.getDay() === 0 ? 6 : start.getDay() - 1; // lunes como inicio
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push(new Date(start.getFullYear(), start.getMonth(), d));
    }
    return cells;
};

const toLocalISO = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const DoctorSchedule = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dayLoading, setDayLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedDate, setSelectedDate] = useState(() => new Date());
    const [monthStart, setMonthStart] = useState(() => getMonthStart(new Date()));
    const [calendarCount, setCalendarCount] = useState({});
    const navigate = useNavigate();

    // Calcular edad a partir de la fecha de nacimiento (YYYY-MM-DD)
    const calculateAge = (dob) => {
        const diffMs = Date.now() - new Date(dob).getTime();
        const ageDt = new Date(diffMs); 
        return Math.abs(ageDt.getUTCFullYear() - 1970);
    };

    const fetchCalendar = async () => {
        try {
            const res = await api.get('/appointments/doctor/summary');
            const map = {};
            res.data?.calendar?.forEach(({ appointment_date, count }) => {
                map[appointment_date] = count;
            });
            setCalendarCount(map);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchDayAppointments = async (date) => {
        setDayLoading(true);
        try {
            const iso = toLocalISO(date);
            const response = await api.get(`/appointments/doctor?date=${iso}&limit=50`);
            const list = response.data?.data || response.data || [];
            setAppointments(list);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Error al cargar tu agenda.');
            setAppointments([]);
        } finally {
            setDayLoading(false);
            setLoading(false);
        }
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await Promise.all([fetchCalendar(), fetchDayAppointments(selectedDate)]);
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchDayAppointments(selectedDate);
    }, [selectedDate]);

    const updateStatus = async (id, newStatus) => {
        try {
            await api.put(`/appointments/${id}/status`, { status: newStatus });
            // Actualizamos el estado local para no recargar la página completa
            setAppointments(appointments.map(app => 
                app.appointment_id === id ? { ...app, status: newStatus } : app
            ));
            fetchCalendar();
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

    const monthDays = useMemo(() => getMonthDays(monthStart), [monthStart]);

    const handleMonthChange = (delta) => {
        const next = shiftMonth(monthStart, delta);
        setMonthStart(next);
        setSelectedDate(next);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Agenda Médica</h1>
                    <p className="text-gray-500 mt-1">Calendario mensual y citas del día.</p>
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
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-5">
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-black text-lg flex items-center"><CalendarIcon className="mr-2 text-mindpath-primary"/> Calendario mensual</h3>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleMonthChange(-1)} className="p-2 rounded-full bg-gray-100 text-gray-600 hover:text-mindpath-primary"><ChevronLeft size={18} /></button>
                                    <span className="text-sm font-bold text-gray-700">{monthStart.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</span>
                                    <button onClick={() => handleMonthChange(1)} className="p-2 rounded-full bg-gray-100 text-gray-600 hover:text-mindpath-primary"><ChevronRight size={18} /></button>
                                </div>
                            </div>
                            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-gray-400 mb-2">
                                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => <span key={d}>{d}</span>)}
                            </div>
                            <div className="grid grid-cols-7 gap-2">
                                {monthDays.map((day, idx) => {
                                    if (!day) return <div key={`blank-${idx}`} />;
                                    const iso = toLocalISO(day);
                                    const isSelected = toLocalISO(selectedDate) === iso;
                                    const hasEvents = calendarCount[iso] > 0;
                                    const isToday = toLocalISO(new Date()) === iso;
                                    return (
                                        <button
                                            key={iso}
                                            onClick={() => setSelectedDate(day)}
                                            className={`p-3 rounded-xl border text-sm transition-all ${isSelected ? 'border-mindpath-primary bg-purple-50' : 'border-gray-100 bg-gray-50 hover:border-mindpath-primary/50'} ${isToday ? 'ring-1 ring-mindpath-primary/40' : ''}`}
                                        >
                                            <div className="font-bold text-gray-700">{day.getDate()}</div>
                                            <div className={`h-1.5 w-1.5 mx-auto rounded-full mt-2 ${hasEvents ? 'bg-mindpath-primary' : 'bg-transparent'}`}></div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-7 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase text-gray-400">Citas del día</p>
                                <p className="text-lg font-black text-gray-800">{selectedDate.toLocaleDateString()}</p>
                            </div>
                            <div className="text-sm text-gray-500">{appointments.length} cita(s)</div>
                        </div>

                        {dayLoading ? (
                            <div className="flex justify-center items-center h-40">
                                <Activity className="animate-spin text-mindpath-primary" size={32} />
                            </div>
                        ) : appointments.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {appointments.map((app) => (
                                    <div key={app.appointment_id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow">
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

                                        <div className="flex w-full md:w-1/3 justify-end gap-2 shrink-0">
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

                                            {/* Botón: Ver Cita (siempre visible si no está cancelada/completada) */}
                                            {(app.status === 'pending' || app.status === 'confirmed') && (
                                                <button
                                                    onClick={() => navigate(`/doctor/appointment/${app.appointment_id}`)}
                                                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl flex items-center transition-colors"
                                                    title="Ver detalle de la cita"
                                                >
                                                    <FileText size={18} className="mr-2" />
                                                    Ver Cita
                                                </button>
                                            )}

                                            {/* Botón: Iniciar Consulta (directo al video) */}
                                            {(app.status === 'confirmed' || app.status === 'pending') && app.type === 'virtual' && (
                                                <button 
                                                    onClick={() => handleStartVideoCall(app.appointment_id)}
                                                    className="px-6 py-2.5 bg-mindpath-primary hover:bg-mindpath-primaryHover text-white font-bold rounded-xl flex items-center transition-colors shadow-sm"
                                                >
                                                    <Video size={18} className="mr-2" />
                                                    Iniciar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
                                <CalendarIcon size={48} className="mx-auto text-gray-300 mb-4" />
                                <h3 className="text-xl font-bold text-gray-700 mb-2">No hay citas en esta fecha</h3>
                                <p className="text-gray-500">Selecciona otro día en el calendario para revisar tu agenda.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorSchedule;