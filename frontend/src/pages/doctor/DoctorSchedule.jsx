import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { Calendar as CalendarIcon, Clock, Video, MapPin, CheckCircle, XCircle, User, Activity, ChevronLeft, ChevronRight, FileText, Settings, Trash2, Plus, AlertTriangle } from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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

const STATUS_CONFIG = {
    pending:   { label: 'Pendiente',  color: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-500/30' },
    confirmed: { label: 'Confirmada', color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-500/30' },
    completed: { label: 'Completada', color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-500/30' },
    cancelled: { label: 'Cancelada',  color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-500/30' },
    emergency_reschedule: { label: 'Em. Médica', color: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-500/30' },
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
    
    // UI State para Pestañas (Mis Citas vs Mi Disponibilidad)
    const [activeTab, setActiveTab] = useState('appointments'); // 'appointments' | 'availability'
    const [activeSubTab, setActiveSubTab] = useState('regular'); // 'regular' o 'exceptions'

    // --- Estado para "Mi Disponibilidad" ---
    const [schedules, setSchedules] = useState([]);
    const [scheduleLoading, setScheduleLoading] = useState(false);
    const [formSchedule, setFormSchedule] = useState({
        day_of_week: 'Monday',
        start_time: '08:00',
        end_time: '12:00',
        slot_duration: '30'
    });

    // --- Estado para Bloqueo de Emergencia ---
    const [isBlocked, setIsBlocked] = useState(false);
    const [blockLoading, setBlockLoading] = useState(false);
    const [showExtensionModal, setShowExtensionModal] = useState(false);
    const [extensionDuration, setExtensionDuration] = useState('1_week');

    // --- Estado para Excepciones (Sprint 33) ---
    const [exceptions, setExceptions] = useState([]);
    const [dateRange, setDateRange] = useState([null, null]);
    const [startDate, endDate] = dateRange;
    const [newException, setNewException] = useState({
        isDayOff: true,
        startTime: '08:00',
        endTime: '12:00'
    });

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

    const fetchSchedules = async () => {
        setScheduleLoading(true);
        try {
            const res = await api.get('/doctors/schedules');
            setSchedules(res.data);
        } catch (err) {
            console.error("Error cargando disponibilidad:", err);
        } finally {
            setScheduleLoading(false);
        }
    };

    const fetchProfileSettings = async () => {
        try {
            const res = await api.get('/doctors/profile/settings');
            setIsBlocked(!!res.data.is_blocked);
            
            if (res.data.is_blocked && res.data.emergency_block_until) {
                if (new Date(res.data.emergency_block_until) < new Date()) {
                    setShowExtensionModal(true);
                }
            }
        } catch (err) {
            console.error("Error fetching doctor profile", err);
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
            await Promise.all([fetchCalendar(), fetchDayAppointments(selectedDate), fetchSchedules(), fetchProfileSettings(), fetchExceptions()]);
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

    // --- Controlador de Emergencia ---
    const handleEmergencyBlock = async () => {
        if (isBlocked) {
            setShowExtensionModal(true);
            return;
        }

        const confirmBlock = window.confirm("⚠️ ¿Estás seguro? Esto suspenderá tus citas médicas de las próximas 24 horas y notificará a los pacientes afectados.");
        if (!confirmBlock) return;

        try {
            const res = await api.post('/doctors/emergency-block', { action: 'activate' });
            
            setIsBlocked(!isBlocked);
            alert(`${res.data.message} ${res.data.affectedAppointments !== undefined ? `Pacientes reasignados: ${res.data.affectedAppointments}` : ''}`);
            
            // Refrescar calendario y citas para ver los cancelados
            fetchCalendar();
            fetchDayAppointments(selectedDate);
            fetchProfileSettings();
        } catch (error) {
            console.error("Error al activar bloqueo:", error);
            alert("Hubo un error al procesar el bloqueo de emergencia.");
        }
    };

    const handleExtendBlock = async () => {
        try {
            setBlockLoading(true);
            const res = await api.post('/doctors/emergency-block', { action: 'extend', duration: extensionDuration });
            alert(res.data.message);
            setShowExtensionModal(false);
            fetchProfileSettings();
        } catch (error) {
            console.error(error);
            alert("Error al extender el bloqueo");
        } finally {
            setBlockLoading(false);
        }
    };

    const handleReactivateAgenda = async () => {
        try {
            setBlockLoading(true);
            const res = await api.post('/doctors/emergency-block', { action: 'deactivate' });
            alert(`${res.data.message} ${res.data.affectedAppointments !== undefined ? `Citas restauradas automáticamente: ${res.data.affectedAppointments}` : ''}`);
            setIsBlocked(false);
            setShowExtensionModal(false);
            fetchCalendar();
            fetchDayAppointments(selectedDate);
            fetchProfileSettings();
        } catch (error) {
            console.error(error);
            alert("Error al reactivar la agenda");
        } finally {
            setBlockLoading(false);
        }
    };

    // --- Controladores para Pestaña de Disponibilidad ---
    const handleAddSchedule = async (e) => {
        e.preventDefault();
        try {
            await api.post('/doctors/schedules', formSchedule);
            fetchSchedules();
            // Reset form but keep the day
            setFormSchedule(prev => ({ ...prev, start_time: '08:00', end_time: '12:00' }));
        } catch (err) {
            alert(err.response?.data?.message || 'Error al guardar el horario');
        }
    };

    const handleDeleteSchedule = async (id) => {
        if (!confirm('¿Seguro que deseas eliminar este bloque de horario?')) return;
        try {
            await api.delete(`/doctors/schedules/${id}`);
            fetchSchedules();
        } catch {
            alert('Error al eliminar el horario');
        }
    };

    // --- Controladores para Excepciones ---
    const fetchExceptions = async () => {
        try {
            const res = await api.get('/doctors/exceptions');
            setExceptions(res.data);
        } catch (error) {
            console.error("Error fetching exceptions", error);
        }
    };

    const handleAddException = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newException,
                startDate: toLocalISO(startDate),
                endDate: endDate ? toLocalISO(endDate) : toLocalISO(startDate)
            };
            await api.post('/doctors/exceptions', payload);
            alert("Regla aplicada exitosamente");
            fetchExceptions(); 
            setNewException({ isDayOff: true, startTime: '08:00', endTime: '12:00' });
            setDateRange([null, null]);
        } catch (error) {
            console.error(error);
            alert("Error al aplicar regla.");
        }
    };

    const handleDeleteException = async (id) => {
        if(!window.confirm("¿Deseas eliminar esta regla y volver a tu horario normal ese día?")) return;
        try {
            await api.delete(`/doctors/exceptions/${id}`);
            fetchExceptions();
        } catch (error) {
            console.error("Error deleting exception", error);
        }
    };

    const dayLabels = {
        'Monday': 'Lunes', 'Tuesday': 'Martes', 'Wednesday': 'Miércoles',
        'Thursday': 'Jueves', 'Friday': 'Viernes', 'Saturday': 'Sábado', 'Sunday': 'Domingo'
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Agenda Médica</h1>
                    <p className="text-gray-500 dark:text-slate-400 mt-1">Calendario mensual y citas del día.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                        onClick={handleEmergencyBlock}
                        className={`px-4 py-2 rounded-xl font-bold border flex items-center justify-center text-sm transition-colors ${
                            isBlocked
                                ? 'bg-red-600 text-white hover:bg-red-700 border-red-600 shadow-md shadow-red-500/30'
                                : 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200 dark:bg-red-900/30 dark:border-red-500/30 dark:text-red-400'
                        }`}
                        title="Bloqueo de Emergencia (24h)"
                    >
                        <AlertTriangle size={18} className="mr-2" />
                        {isBlocked ? 'Inactivo por Emergencia' : 'Reportar Emergencia'}
                    </button>
                    <div className="bg-mindpath-light dark:bg-mindpath-primary/30 text-mindpath-primary px-4 py-2 rounded-xl font-bold border border-mindpath-light dark:border-mindpath-primary/30 flex items-center justify-center text-sm">
                        <CalendarIcon size={18} className="mr-2" />
                        Hoy: {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                </div>
            </div>

            {error && <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-500/30">{error}</div>}

            {/* Pestañas de Navegación */}
            <div className="flex border-b border-gray-200 dark:border-white/10 mt-6 mb-8">
                <button
                    onClick={() => setActiveTab('appointments')}
                    className={`pb-4 px-6 font-bold text-sm transition-colors flex items-center border-b-2 ${
                        activeTab === 'appointments'
                            ? 'border-mindpath-primary text-mindpath-primary dark:text-mindpath-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                >
                    <CalendarIcon size={18} className="mr-2" /> Mis Citas
                </button>
                <button
                    onClick={() => setActiveTab('availability')}
                    className={`pb-4 px-6 font-bold text-sm transition-colors flex items-center border-b-2 ${
                        activeTab === 'availability'
                            ? 'border-mindpath-primary text-mindpath-primary dark:text-mindpath-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                >
                    <Clock size={18} className="mr-2" /> Mi Disponibilidad
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Activity className="animate-spin text-mindpath-primary" size={40} />
                </div>
            ) : activeTab === 'appointments' ? (
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
                                                    ? 'border-mindpath-primary bg-mindpath-light dark:bg-mindpath-primary/40'
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
                                            className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:shadow-md dark:hover:border-mindpath-primary/20 transition-all"
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
                                                {app.payment_proof_url && app.payment_status !== 'paid' && (
                                                    <span className="text-[10px] uppercase font-black tracking-wider px-2 py-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 inline-block self-start mt-1.5 animate-pulse">
                                                        📄 Pago por Verificar
                                                    </span>
                                                )}
                                            </div>

                                            {/* Acciones */}
                                            <div className="flex gap-2 shrink-0">
                                                {(app.status === 'pending' || app.status === 'confirmed') && (
                                                    <button
                                                        onClick={() => navigate(`/doctor/appointment/${app.appointment_id}`)}
                                                        className="px-4 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 font-bold rounded-xl flex items-center transition-colors text-sm"
                                                    >
                                                        <FileText size={16} className="mr-1.5" />Ver Cita
                                                    </button>
                                                )}
                                                {(app.status === 'confirmed' || app.status === 'pending') && app.type === 'virtual' && (
                                                    app.payment_status === 'paid' ? (
                                                        <button
                                                            onClick={() => navigate(`/doctor/video-room/${app.appointment_id}`)}
                                                            className="px-4 py-2.5 bg-mindpath-primary hover:bg-mindpath-primaryHover text-white font-bold rounded-xl flex items-center transition-colors shadow-sm text-sm"
                                                        >
                                                            <Video size={16} className="mr-1.5" />Iniciar
                                                        </button>
                                                    ) : (
                                                        <button
                                                            disabled
                                                            className="px-4 py-2.5 bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed font-bold rounded-xl flex items-center text-sm border border-gray-300 dark:border-slate-600"
                                                            title="El paciente aún no ha pagado o el pago no ha sido verificado"
                                                        >
                                                            <Video size={16} className="mr-1.5" />Iniciar (Sin Pago)
                                                        </button>
                                                    )
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
            ) : (
                // --- PESTAÑA: MI DISPONIBILIDAD ---
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Mi Disponibilidad</h2>
                    <p className="text-gray-500 dark:text-slate-400 mb-8 max-w-2xl">
                        Gestiona tu horario semanal y programa tus días libres.
                    </p>

                    {/* 🗂️ MENÚ DE SUB-PESTAÑAS */}
                    <div className="flex space-x-6 border-b border-gray-200 dark:border-slate-700 mb-8">
                        <button
                            onClick={() => setActiveSubTab('regular')}
                            className={`pb-3 text-sm font-bold transition-colors ${
                                activeSubTab === 'regular' 
                                ? 'border-b-2 border-mindpath-primary text-mindpath-primary' 
                                : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                        >
                            🕒 Horario Regular
                        </button>
                        <button
                            onClick={() => setActiveSubTab('exceptions')}
                            className={`pb-3 text-sm font-bold transition-colors ${
                                activeSubTab === 'exceptions' 
                                ? 'border-b-2 border-mindpath-primary text-mindpath-primary' 
                                : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                        >
                            🌴 Vacaciones y Días Libres
                        </button>
                    </div>

                    {/* 🔄 HORARIO REGULAR */}
                    {activeSubTab === 'regular' && (
                        <div className="animate-fadeIn grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Formulario */}
                        <div>
                            <form onSubmit={handleAddSchedule} className="space-y-5 bg-gray-50 dark:bg-slate-700/30 p-6 rounded-3xl border border-gray-100 dark:border-white/5">
                                <h3 className="font-bold text-gray-800 dark:text-white pb-3 border-b border-gray-200 dark:border-white/10 mb-4">Añadir Nuevo Bloque</h3>
                                
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-2 uppercase">Día de la Semana</label>
                                    <select 
                                        value={formSchedule.day_of_week}
                                        onChange={e => setFormSchedule({...formSchedule, day_of_week: e.target.value})}
                                        className="w-full p-3.5 bg-white dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-mindpath-primary/30 text-gray-800 dark:text-white shadow-sm font-medium"
                                    >
                                        <option value="Monday">Lunes</option>
                                        <option value="Tuesday">Martes</option>
                                        <option value="Wednesday">Miércoles</option>
                                        <option value="Thursday">Jueves</option>
                                        <option value="Friday">Viernes</option>
                                        <option value="Saturday">Sábado</option>
                                        <option value="Sunday">Domingo</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-2 uppercase">Hora Inicio</label>
                                        <input 
                                            type="time" 
                                            value={formSchedule.start_time}
                                            onChange={e => setFormSchedule({...formSchedule, start_time: e.target.value})}
                                            className="w-full p-3.5 bg-white dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-mindpath-primary/30 text-gray-800 dark:text-white shadow-sm font-medium"
                                            required 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-2 uppercase">Hora Fin</label>
                                        <input 
                                            type="time" 
                                            value={formSchedule.end_time}
                                            onChange={e => setFormSchedule({...formSchedule, end_time: e.target.value})}
                                            className="w-full p-3.5 bg-white dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-mindpath-primary/30 text-gray-800 dark:text-white shadow-sm font-medium"
                                            required 
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-2 uppercase">Duración de cada Consulta</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" value="30" checked={formSchedule.slot_duration === '30'} onChange={e => setFormSchedule({...formSchedule, slot_duration: e.target.value})} className="accent-mindpath-primary w-4 h-4" />
                                            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">30 minutos</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" value="60" checked={formSchedule.slot_duration === '60'} onChange={e => setFormSchedule({...formSchedule, slot_duration: e.target.value})} className="accent-mindpath-primary w-4 h-4" />
                                            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">1 hora</span>
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
                                        El sistema dividirá automáticamente esta franja en ranuras de <span className="font-bold text-mindpath-primary dark:text-mindpath-primary">{formSchedule.slot_duration} minutos</span>.
                                    </p>
                                </div>

                                <button 
                                    type="submit"
                                    className="w-full mt-4 py-3.5 bg-mindpath-primary text-white font-bold rounded-2xl flex justify-center items-center hover:bg-mindpath-primaryHover transition-all shadow-md shadow-mindpath-primary/20"
                                >
                                    <Plus size={18} className="mr-2" /> Agregar Franja Horaria
                                </button>
                            </form>
                        </div>

                        {/* Visualización */}
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-white mb-4">Tus Horarios Configurados</h3>
                            
                            {scheduleLoading ? (
                                <div className="flex justify-center p-8"><Activity className="animate-spin text-mindpath-primary" size={30} /></div>
                            ) : schedules.length > 0 ? (
                                <div className="space-y-3">
                                    {Object.keys(dayLabels).map(dayKey => {
                                        const daySchedules = schedules.filter(s => s.day_of_week === dayKey);
                                        if (daySchedules.length === 0) return null;
                                        
                                        return (
                                            <div key={dayKey} className="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                                                <h4 className="font-black text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-white/10 uppercase">
                                                    <CalendarIcon size={14} className="text-mindpath-primary dark:text-mindpath-primary" /> {dayLabels[dayKey]}
                                                </h4>
                                                <div className="space-y-2">
                                                    {daySchedules.map(slot => (
                                                        <div key={slot.id} className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-sm font-bold text-gray-700 dark:text-slate-200">
                                                                    {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                                                                </span>
                                                                <span className="text-xs bg-mindpath-light dark:bg-mindpath-primary/30 text-mindpath-primary dark:text-mindpath-primary px-2.5 py-1 rounded-md font-bold">
                                                                    {slot.slot_duration} min
                                                                </span>
                                                            </div>
                                                            <button 
                                                                onClick={() => handleDeleteSchedule(slot.id)}
                                                                className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                                title="Eliminar Franja"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center p-10 bg-gray-50 dark:bg-slate-700/30 rounded-3xl border border-dashed border-gray-200 dark:border-slate-600">
                                    <Settings size={40} className="mx-auto text-gray-300 dark:text-slate-600 mb-3" />
                                    <p className="text-gray-500 dark:text-slate-400 text-sm">Aún no has configurado disponibilidad.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 🔄 VACACIONES Y EXCEPCIONES */}
                    {activeSubTab === 'exceptions' && (
                        <div className="animate-fadeIn space-y-8">
                            <div className="bg-gray-50 dark:bg-slate-700/30 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-slate-700">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">🌴 Días Libres y Horarios Especiales</h3>
                                <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
                                    Selecciona el rango de fechas en el calendario interactivo. Esta excepción anulará tu horario de la semana regular.
                                </p>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white dark:bg-slate-800 p-3 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 mb-8">
                                    {/* COLUMNA IZQUIERDA: EL CALENDARIO VISUAL */}
                                    <div className="w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 p-2 sm:p-6 rounded-xl border border-gray-200 dark:border-slate-700 overflow-x-auto">
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 text-center">
                                            Selecciona el rango en el calendario
                                        </label>
                                        <DatePicker
                                            selectsRange={true}
                                            startDate={startDate}
                                            endDate={endDate}
                                            onChange={(update) => setDateRange(update)}
                                            inline 
                                            minDate={new Date()} 
                                            calendarClassName="mindpath-calendar shadow-md border-0 rounded-xl" 
                                        />
                                    </div>

                                    {/* COLUMNA DERECHA: LOS CONTROLES */}
                                    <div className="flex flex-col justify-center space-y-6">
                                        <div className="bg-mindpath-primary/10 p-4 rounded-xl border border-mindpath-primary/20">
                                            <label className="flex items-center space-x-3 cursor-pointer text-sm font-bold text-gray-800 dark:text-gray-200">
                                                <input 
                                                    type="checkbox" 
                                                    checked={newException.isDayOff} 
                                                    onChange={e => setNewException({...newException, isDayOff: e.target.checked})}
                                                    className="w-5 h-5 accent-mindpath-primary rounded focus:ring-mindpath-primary"
                                                />
                                                <span>¿Serán días libres completos?</span>
                                            </label>
                                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 ml-8">
                                                Si desmarcas esta opción, podrás definir un horario especial para los días seleccionados.
                                            </p>
                                        </div>

                                        {!newException.isDayOff && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Hora Inicio</label>
                                                    <input type="time" required value={newException.startTime} onChange={e => setNewException({...newException, startTime: e.target.value})} className="w-full p-3 border rounded-xl dark:bg-slate-900 dark:border-slate-700 dark:text-white"/>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Hora Fin</label>
                                                    <input type="time" required value={newException.endTime} onChange={e => setNewException({...newException, endTime: e.target.value})} className="w-full p-3 border rounded-xl dark:bg-slate-900 dark:border-slate-700 dark:text-white"/>
                                                </div>
                                            </div>
                                        )}

                                        <button 
                                            onClick={handleAddException} 
                                            disabled={!startDate}
                                            className="w-full py-3 bg-mindpath-primary text-white rounded-xl font-bold hover:bg-mindpath-primaryHover transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                        >
                                            <Plus size={16} className="mr-2" /> Guardar Excepción
                                        </button>
                                    </div>
                                </div>

                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-3">Excepciones Programadas</h4>
                            {exceptions.length === 0 ? (
                                <p className="text-sm text-gray-500 italic bg-white dark:bg-slate-800 p-4 py-8 text-center rounded-xl border border-dashed border-gray-200 dark:border-slate-600">No tienes excepciones futuras programadas.</p>
                            ) : (
                                <div className="space-y-2">
                                    {exceptions.map(exc => (
                                        <div key={exc.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg shadow-sm">
                                            <div className="flex items-center">
                                                <span className="font-bold text-gray-800 dark:text-white mr-4 flex items-center text-sm">
                                                    <CalendarIcon size={14} className="mr-1.5 text-mindpath-primary"/>
                                                    {new Date(exc.exception_date).toLocaleDateString()}
                                                </span>
                                                {exc.is_day_off ? (
                                                    <span className="bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/40 dark:border-red-500/30 text-xs px-2.5 py-1 rounded font-bold uppercase tracking-wide">Día Libre</span>
                                                ) : (
                                                    <span className="bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/40 dark:border-blue-500/30 text-xs px-2.5 py-1 rounded font-bold uppercase tracking-wide">
                                                        Turno Especial: {exc.start_time.substring(0,5)} - {exc.end_time.substring(0,5)}
                                                    </span>
                                                )}
                                            </div>
                                            <button onClick={() => handleDeleteException(exc.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition" title="Eliminar regla">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            </div>
        )}

            {/* MODAL DE EXTENSIÓN DE EMERGENCIA */}
            {showExtensionModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative">
                        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mb-6">
                            <AlertTriangle size={32} className="text-red-600 dark:text-red-400 animate-pulse" />
                        </div>
                        <h2 className="text-2xl font-black text-center text-gray-900 dark:text-white mb-2">Bloqueo de Emergencia Activo</h2>
                        <p className="text-center text-gray-500 dark:text-slate-400 mb-8 border-b dark:border-white/10 pb-6 text-sm">
                            Tu agenda está bloqueada. ¿Necesitas más tiempo para resolver tu emergencia o deseas reactivar tu agenda para recibir pacientes nuevamente?
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Extender Bloqueo:</label>
                                <select 
                                    value={extensionDuration}
                                    onChange={(e) => setExtensionDuration(e.target.value)}
                                    className="w-full border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl px-4 py-3 font-medium focus:border-red-500 focus:outline-none transition-colors"
                                >
                                    <option value="2_days">2 Días adicionales</option>
                                    <option value="1_week">1 Semana</option>
                                    <option value="2_weeks">2 Semanas</option>
                                    <option value="1_month">1 Mes</option>
                                    <option value="3_months">3 Meses</option>
                                    <option value="indefinite">Hasta Nuevo Aviso</option>
                                </select>
                            </div>
                            <button
                                onClick={handleExtendBlock}
                                disabled={blockLoading}
                                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-black py-4 rounded-xl shadow-lg transition-all"
                            >
                                {blockLoading ? 'Procesando...' : 'Aplicar Extensión'}
                            </button>

                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
                                <span className="flex-shrink-0 mx-4 text-gray-400 text-[10px] font-black uppercase tracking-widest">o</span>
                                <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
                            </div>

                            <button
                                onClick={handleReactivateAgenda}
                                disabled={blockLoading}
                                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white font-black py-4 rounded-xl shadow-lg transition-all"
                            >
                                {blockLoading ? 'Procesando...' : 'Reactivar Agenda Ahora'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorSchedule;