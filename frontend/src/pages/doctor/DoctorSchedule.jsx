import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { Calendar as CalendarIcon, Clock, Video, MapPin, CheckCircle, XCircle, User, Activity, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

// ─── Month helpers ────────────────────────────────────────────────────────────
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
    const firstDay = start.getDay() === 0 ? 6 : start.getDay() - 1;
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

// ─── Config de estados ────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    pending:   { label: 'Pendiente',  color: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-500/30' },
    confirmed: { label: 'Confirmada', color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-500/30' },
    completed: { label: 'Completada', color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-500/30' },
    cancelled: { label: 'Cancelada',  color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-500/30' },
};

// ─── Componente principal ─────────────────────────────────────────────────────
const DoctorSchedule = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dayLoading, setDayLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedDate, setSelectedDate] = useState(() => new Date());
    const [monthStart, setMonthStart] = useState(() => getMonthStart(new Date()));
    const [calendarCount, setCalendarCount] = useState({});
    const navigate = useNavigate();

    const calculateAge = (dob) => {
        if (!dob) return '?';
        const diffMs = Date.now() - new Date(dob).getTime();
        return Math.abs(new Date(diffMs).getUTCFullYear() - 1970);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate]);

    const updateStatus = async (id, newStatus) => {
        try {
            await api.put(`/appointments/${id}/status`, { status: newStatus });
            setAppointments(appointments.map(app =>
                app.appointment_id === id ? { ...app, status: newStatus } : app
            ));
            fetchCalendar();
        } catch {
            alert('No se pudo actualizar el estado de la cita.');
        }
    };

    const monthDays = useMemo(() => getMonthDays(monthStart), [monthStart]);

    const handleMonthChange = (delta) => {
        const next = shiftMonth(monthStart, delta);
        setMonthStart(next);
        setSelectedDate(next);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Agenda Médica</h1>
                    <p className="text-gray-500 dark:text-slate-400 mt-1">Calendario mensual y citas del día.</p>
                </div>
                <div className="bg-mindpath-light dark:bg-purple-900/30 text-mindpath-primary px-4 py-2 rounded-xl font-bold border border-violet-100 dark:border-purple-500/30 flex items-center text-sm">
                    <CalendarIcon size={18} className="mr-2" />
                    Hoy: {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
            </div>

            {error && <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-500/30">{error}</div>}

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Activity className="animate-spin text-mindpath-primary" size={40} />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Calendario Mensual */}
                    <div className="lg:col-span-4 xl:col-span-5">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm sticky top-4">
                            {/* Navegación del mes */}
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-black text-base text-gray-900 dark:text-white flex items-center">
                                    <CalendarIcon className="mr-2 text-mindpath-primary" size={18}/> Calendario
                                </h3>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleMonthChange(-1)}
                                        className="p-2 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:text-mindpath-primary hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="text-sm font-bold text-gray-700 dark:text-slate-200 min-w-[110px] text-center capitalize">
                                        {monthStart.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                                    </span>
                                    <button
                                        onClick={() => handleMonthChange(1)}
                                        className="p-2 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:text-mindpath-primary hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Encabezado días de la semana */}
                            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-gray-400 dark:text-slate-500 mb-2">
                                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => <span key={d}>{d}</span>)}
                            </div>

                            {/* Grid del mes */}
                            <div className="grid grid-cols-7 gap-1">
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
                                            className={`p-2 rounded-xl border text-sm transition-all text-center ${
                                                isSelected
                                                    ? 'border-mindpath-primary bg-purple-50 dark:bg-purple-900/40'
                                                    : 'border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-slate-700/30 hover:border-mindpath-primary/50'
                                            } ${isToday ? 'ring-1 ring-mindpath-primary/40' : ''}`}
                                        >
                                            <div className={`font-bold text-xs ${isSelected ? 'text-mindpath-primary' : 'text-gray-700 dark:text-slate-200'}`}>
                                                {day.getDate()}
                                            </div>
                                            <div className={`h-1 w-1 mx-auto rounded-full mt-1 ${hasEvents ? 'bg-mindpath-primary' : 'bg-transparent'}`}></div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Lista de citas del día */}
                    <div className="lg:col-span-8 xl:col-span-7 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase text-gray-400 dark:text-slate-500">Citas del día</p>
                                <p className="text-lg font-black text-gray-800 dark:text-white capitalize">
                                    {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </p>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-slate-400 font-medium">{appointments.length} cita(s)</div>
                        </div>

                        {dayLoading ? (
                            <div className="flex justify-center items-center h-40">
                                <Activity className="animate-spin text-mindpath-primary" size={32} />
                            </div>
                        ) : appointments.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {appointments.map((app) => {
                                    const sc = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
                                    return (
                                        <div
                                            key={app.appointment_id}
                                            className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:shadow-md dark:hover:border-purple-500/20 transition-all"
                                        >
                                            {/* Info paciente */}
                                            <div className="flex items-center w-full md:w-auto">
                                                <div className="h-12 w-12 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-gray-500 dark:text-slate-400 mr-4 shrink-0">
                                                    <User size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-bold text-gray-900 dark:text-white">{app.patient_name}</h3>
                                                    <p className="text-sm text-gray-500 dark:text-slate-400">
                                                        {app.gender === 'M' ? 'Masculino' : app.gender === 'F' ? 'Femenino' : 'Otro'}, {calculateAge(app.date_of_birth)} años
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Detalles de la cita */}
                                            <div className="flex flex-col space-y-1.5 flex-1">
                                                <div className="flex items-center text-gray-700 dark:text-slate-300 font-medium text-sm">
                                                    <Clock size={16} className="text-mindpath-primary mr-2 shrink-0" />
                                                    {new Date(app.appointment_date).toLocaleDateString('es-ES')} a las {app.start_time.slice(0, 5)}
                                                </div>
                                                <div className="flex items-center text-sm font-bold text-gray-500 dark:text-slate-400">
                                                    {app.type === 'virtual' ? (
                                                        <><Video size={14} className="text-blue-500 mr-2" />Telemedicina</>
                                                    ) : (
                                                        <><MapPin size={14} className="text-green-500 mr-2" />Presencial</>
                                                    )}
                                                </div>
                                                <span className={`text-xs px-2.5 py-1 rounded-full border font-bold inline-block self-start ${sc.color}`}>
                                                    {sc.label}
                                                </span>
                                            </div>

                                            {/* Acciones */}
                                            <div className="flex gap-2 shrink-0">
                                                {app.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => updateStatus(app.appointment_id, 'confirmed')}
                                                            className="p-2.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-xl transition-colors border border-green-100 dark:border-green-500/30"
                                                            title="Confirmar"
                                                        >
                                                            <CheckCircle size={20} />
                                                        </button>
                                                        <button
                                                            onClick={() => updateStatus(app.appointment_id, 'cancelled')}
                                                            className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-colors border border-red-100 dark:border-red-500/30"
                                                            title="Cancelar"
                                                        >
                                                            <XCircle size={20} />
                                                        </button>
                                                    </>
                                                )}
                                                {(app.status === 'pending' || app.status === 'confirmed') && (
                                                    <button
                                                        onClick={() => navigate(`/doctor/appointment/${app.appointment_id}`)}
                                                        className="px-4 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 font-bold rounded-xl flex items-center transition-colors text-sm"
                                                    >
                                                        <FileText size={16} className="mr-1.5" />Ver Cita
                                                    </button>
                                                )}
                                                {(app.status === 'confirmed' || app.status === 'pending') && app.type === 'virtual' && (
                                                    <button
                                                        onClick={() => navigate(`/doctor/video-room/${app.appointment_id}`)}
                                                        className="px-4 py-2.5 bg-mindpath-primary hover:bg-mindpath-primaryHover text-white font-bold rounded-xl flex items-center transition-colors shadow-sm text-sm"
                                                    >
                                                        <Video size={16} className="mr-1.5" />Iniciar
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-gray-50 dark:bg-slate-800 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-3xl p-12 text-center">
                                <CalendarIcon size={48} className="mx-auto text-gray-200 dark:text-slate-600 mb-4" />
                                <h3 className="text-xl font-bold text-gray-700 dark:text-slate-300 mb-2">No hay citas en esta fecha</h3>
                                <p className="text-gray-500 dark:text-slate-400">Selecciona otro día en el calendario para revisar tu agenda.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorSchedule;