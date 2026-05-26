import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { useAuthStore } from '../../store/useAuthStore';
import { 
    Calendar, Clock, Users, Bell, ShieldAlert, 
    TrendingUp, UserPlus, RefreshCw, XCircle, CheckCircle, CalendarClock, ChevronRight
} from 'lucide-react';

// ─── Date helpers ─────────────────────────────────────────────────────────────
const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

const shiftDate = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return getStartOfWeek(d);
};

const toLocalISO = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// ─── Componente principal ─────────────────────────────────────────────────────
const DoctorDashboard = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dayAppointments, setDayAppointments] = useState([]);
    const [dayLoading, setDayLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(() => new Date());
    const [weekStart, setWeekStart] = useState(() => getStartOfWeek(new Date()));
    const [isBlocked, setIsBlocked] = useState(false);
    const [blockLoading, setBlockLoading] = useState(false);
    
    // Extensión de bloqueo
    const [showExtensionModal, setShowExtensionModal] = useState(false);
    const [extensionDuration, setExtensionDuration] = useState('1_week');

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const [summaryRes, profileRes] = await Promise.all([
                api.get('/appointments/doctor/summary'),
                api.get('/doctors/profile/settings')
            ]);
            setData(summaryRes.data);
            setIsBlocked(!!profileRes.data.is_blocked);
            
            if (profileRes.data.is_blocked && profileRes.data.emergency_block_until) {
                if (new Date(profileRes.data.emergency_block_until) < new Date()) {
                    setShowExtensionModal(true);
                }
            }
        } catch (e) {
            console.error('Error', e);
        }
        setLoading(false);
    };

    const fetchDayAppointments = async (date) => {
        setDayLoading(true);
        try {
            const iso = toLocalISO(date);
            const res = await api.get(`/appointments/doctor?date=${iso}&limit=50`);
            setDayAppointments(res.data.data || []);
        } catch (e) {
            console.error('Error cargando citas del día', e);
            setDayAppointments([]);
        }
        setDayLoading(false);
    };

    useEffect(() => { loadDashboard(); }, []);
    useEffect(() => { fetchDayAppointments(selectedDate); }, [selectedDate]);

    const handleStatus = async (id, status) => {
        await api.put(`/appointments/${id}/status`, { status });
        loadDashboard();
        fetchDayAppointments(selectedDate);
    };
    
    const handleExtendBlock = async () => {
        try {
            setBlockLoading(true);
            const res = await api.post('/doctors/emergency-block', { action: 'extend', duration: extensionDuration });
            alert(res.data.message);
            setShowExtensionModal(false);
            loadDashboard();
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
            alert(`${res.data.message} ${res.data.affectedAppointments !== undefined ? `Pacientes reasignados a pendiente: ${res.data.affectedAppointments}` : ''}`);
            setIsBlocked(false);
            setShowExtensionModal(false);
            loadDashboard();
        } catch (error) {
            console.error(error);
            alert("Error al reactivar la agenda");
        } finally {
            setBlockLoading(false);
        }
    };

    const handleBlockToggle = async () => {
        if (isBlocked) {
            setShowExtensionModal(true);
            return;
        }

        const confirmBlock = window.confirm("⚠️ ¿Estás seguro? Esto suspenderá tus citas médicas de las próximas 24 horas y notificará a los pacientes afectados.");
        if (!confirmBlock) return;

        try {
            setBlockLoading(true);
            const res = await api.post('/doctors/emergency-block', { action: 'activate' });
            
            setIsBlocked(true);
            alert(`${res.data.message} ${res.data.affectedAppointments !== undefined ? `Pacientes reasignados: ${res.data.affectedAppointments}` : ''}`);
            
            loadDashboard();
        } catch (error) {
            console.error("Error al activar bloqueo:", error);
            alert("Hubo un error al procesar el bloqueo de emergencia.");
        } finally {
            setBlockLoading(false);
        }
    };

    const handleWeekChange = (days) => {
        const nextStart = shiftDate(weekStart, days);
        setWeekStart(nextStart);
        setSelectedDate(nextStart);
    };

    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(weekStart);
            d.setDate(weekStart.getDate() + i);
            return d;
        });
    }, [weekStart]);

    const calendarCount = useMemo(() => {
        const map = {};
        data?.calendar?.forEach(({ appointment_date, count }) => {
            map[appointment_date] = count;
        });
        return map;
    }, [data]);

    if (loading) return (
        <div className="p-20 text-center animate-pulse text-mindpath-primary font-bold">
            Cargando tu Centro de Mando...
        </div>
    );

    const totalPatients = data?.stats.totalPatients || 0;
    const newPct = totalPatients ? Math.min(100, Math.round((data?.stats.newVsRecurrent.new / totalPatients) * 100)) : 0;
    const recurrentPct = totalPatients ? Math.min(100, Math.round((data?.stats.newVsRecurrent.recurrent / totalPatients) * 100)) : 0;

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12 p-4">
            
            {/* BANNER PRINCIPAL */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">Dr(a). {user?.full_name.split(' ').at(-1)}</h1>
                    <p className="text-gray-500 dark:text-slate-400">Panel de control profesional • Mindpath v1.15</p>
                </div>
                <button 
                    onClick={handleBlockToggle}
                    disabled={blockLoading}
                    className={`flex items-center px-6 py-3 font-bold rounded-2xl border transition-all ${
                        isBlocked 
                            ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800' 
                            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/30 hover:bg-red-100 dark:hover:bg-red-900/40'
                    }`}
                >
                    <ShieldAlert size={20} className="mr-2" />
                    {isBlocked ? 'Inactivo por Emergencia' : 'Reportar Emergencia'}
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-mindpath-primary p-7 rounded-[2rem] text-white shadow-premium-primary transition-all hover:scale-[1.02] duration-300">
                    <TrendingUp className="mb-4 opacity-50" size={30} />
                    <p className="text-gray-400/80 text-xs font-semibold uppercase tracking-wider">Consultas / Semana</p>
                    <h3 className="text-4xl font-black mt-1">{data?.stats.avgPerWeek}</h3>
                </div>
                <div className="bg-white dark:bg-slate-800 p-7 rounded-[2rem] border border-gray-100 dark:border-white/10 flex items-center justify-between shadow-premium-card transition-all hover:scale-[1.02] duration-300">
                    <div>
                        <p className="text-gray-400 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Pacientes Totales</p>
                        <h3 className="text-4xl font-black text-gray-900 dark:text-white mt-1">{data?.stats.totalPatients}</h3>
                    </div>
                    <div className="h-14 w-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-500 dark:text-blue-400">
                        <Users size={30}/>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-7 rounded-[2rem] border border-gray-100 dark:border-white/10 flex items-center justify-between shadow-premium-card transition-all hover:scale-[1.02] duration-300">
                    <div>
                        <p className="text-gray-400 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Por Aprobar</p>
                        <h3 className="text-4xl font-black text-yellow-600 dark:text-yellow-400 mt-1">{data?.pending.length}</h3>
                    </div>
                    <div className="h-14 w-14 bg-yellow-50 dark:bg-yellow-900/30 rounded-2xl flex items-center justify-center text-yellow-500 dark:text-yellow-400">
                        <Bell size={30}/>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* AGENDA SEMANAL */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h3 className="font-black text-xl text-gray-900 dark:text-white flex items-center">
                                    <Calendar className="mr-3 text-mindpath-primary"/>Vista Semanal
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-slate-400">Selecciona un día para ver las citas.</p>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto justify-start sm:justify-end">
                                <button
                                    onClick={() => handleWeekChange(-7)}
                                    className="flex-1 sm:flex-initial px-4 py-2 bg-gray-100 dark:bg-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold uppercase hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    Anterior
                                </button>
                                <button
                                    onClick={() => handleWeekChange(7)}
                                    className="flex-1 sm:flex-initial px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-xs font-bold uppercase hover:opacity-80 transition-opacity"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>

                        {/* Grid de días */}
                        <div className="grid grid-cols-7 gap-1 sm:gap-2">
                            {weekDays.map((day) => {
                                const iso = toLocalISO(day);
                                const isSelected = toLocalISO(selectedDate) === iso;
                                const hasEvents = calendarCount[iso] > 0;
                                return (
                                    <button
                                        key={iso}
                                        onClick={() => setSelectedDate(day)}
                                        className={`py-2.5 px-0.5 sm:p-4 md:p-5 rounded-2xl sm:rounded-3xl border-2 text-center transition-all min-w-0 ${
                                            isSelected 
                                                ? 'border-mindpath-primary bg-mindpath-light dark:bg-mindpath-primary/30' 
                                                : 'border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-slate-700/30 hover:border-mindpath-primary/50'
                                        }`}
                                    >
                                        <p className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase mb-1">
                                            {day.toLocaleDateString('es-ES', { weekday: 'short' })}
                                        </p>
                                        <p className="text-xl font-black text-gray-800 dark:text-white">{day.getDate()}</p>
                                        <div className={`h-2 w-2 mx-auto rounded-full mt-2 ${hasEvents ? 'bg-mindpath-primary animate-pulse' : 'bg-transparent'}`}></div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Citas del día seleccionado */}
                        <div className="mt-8">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-xs font-bold uppercase text-gray-400 dark:text-slate-400">Citas del día</p>
                                    <p className="text-lg font-black text-gray-800 dark:text-white">{selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                </div>
                                <div className="text-sm text-gray-500 dark:text-slate-400">{dayAppointments.length} cita(s)</div>
                            </div>

                            {dayLoading ? (
                                <div className="p-6 text-center text-mindpath-primary font-bold">Cargando citas...</div>
                            ) : dayAppointments.length > 0 ? (
                                <div className="space-y-3">
                                    {dayAppointments.map((app) => (
                                        <div
                                            key={app.appointment_id}
                                            className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border border-gray-100 dark:border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3 cursor-pointer hover:border-mindpath-primary/30 dark:hover:border-mindpath-primary/30 transition-all"
                                            onClick={() => navigate(`/doctor/appointment/${app.appointment_id}`)}
                                        >
                                            <div>
                                                <p className="text-sm font-bold text-gray-700 dark:text-white">{app.patient_name}</p>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center mt-1">
                                                    <Clock size={14} className="mr-1" /> {app.start_time.slice(0,5)} • {app.type === 'virtual' ? 'Telemedicina' : 'Presencial'}
                                                </p>
                                                {app.payment_proof_url && app.payment_status !== 'paid' && (
                                                    <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 inline-block mt-1 animate-pulse">
                                                        📄 Pago por Verificar
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-white dark:bg-slate-650 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-slate-300 uppercase tracking-wider">
                                                {({
                                                    completed: 'Completada',
                                                    cancelled: 'Cancelada',
                                                    scheduled: 'Programada',
                                                    confirmed: 'Confirmada',
                                                    pending: 'Pendiente'
                                                }[app.status] || app.status)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 text-center text-gray-400 dark:text-slate-500 font-bold bg-gray-50 dark:bg-slate-700/30 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                                    Sin citas para este día
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ANALYTICS */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-gray-100 dark:border-white/10">
                        <h3 className="font-black text-xl mb-8 text-gray-900 dark:text-white flex items-center">
                            <TrendingUp className="mr-3 text-blue-500"/>Retención de Pacientes
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="flex items-center text-sm font-bold text-gray-600 dark:text-slate-300">
                                            <UserPlus size={16} className="mr-2 text-green-500"/>Pacientes Nuevos
                                        </span>
                                        <span className="font-black text-green-600 dark:text-green-400">{data?.stats.newVsRecurrent.new}</span>
                                    </div>
                                    <div className="h-4 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 transition-all duration-1000" style={{width: `${newPct}%`}}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="flex items-center text-sm font-bold text-gray-600 dark:text-slate-300">
                                            <RefreshCw size={16} className="mr-2 text-blue-500"/>Pacientes Recurrentes
                                        </span>
                                        <span className="font-black text-blue-600 dark:text-blue-400">{data?.stats.newVsRecurrent.recurrent}</span>
                                    </div>
                                    <div className="h-4 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 transition-all duration-1000" style={{width: `${recurrentPct}%`}}></div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-700/40 rounded-[2rem] p-8 text-center border border-dashed border-gray-200 dark:border-white/10">
                                <p className="text-xs font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest">Estado de Salud de la Clínica</p>
                                <p className="text-4xl font-black text-mindpath-primary mt-2">Excelente</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUMNA DERECHA: Solicitudes + Próximas */}
                <div className="lg:col-span-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                        {/* Solicitudes pendientes */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm">
                            <h3 className="font-black text-lg mb-6 text-gray-900 dark:text-white flex items-center">
                                <Bell size={22} className="mr-3 text-yellow-500 animate-bounce"/>Solicitudes
                            </h3>
                            <div className="space-y-3">
                                {data?.pending.length > 0 ? data.pending.map(app => (
                                    <div key={app.id} className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-[1.5rem] border border-transparent hover:border-mindpath-primary dark:hover:border-mindpath-primary/50 transition-all group">
                                        <div
                                            className="cursor-pointer"
                                            onClick={() => navigate(`/doctor/appointment/${app.id}`)}
                                        >
                                            <p className="font-black text-gray-900 dark:text-white group-hover:text-mindpath-primary transition-colors">{app.patient_name}</p>
                                            <p className="text-xs font-bold text-gray-400 dark:text-slate-500 mt-1 uppercase tracking-tighter">
                                                {app.start_time.slice(0,5)} • {new Date(app.appointment_date).toLocaleDateString('es-ES', {day:'numeric',month:'short'})}
                                            </p>
                                            {app.payment_proof_url && app.payment_status !== 'paid' && (
                                                <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 inline-block mt-1 animate-pulse">
                                                    📄 Pago por Verificar
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <button 
                                                onClick={() => navigate(`/doctor/appointment/${app.id}`)}
                                                className="w-full py-2.5 bg-mindpath-primary text-white text-xs font-bold rounded-xl hover:scale-105 transition-transform flex items-center justify-center gap-1.5"
                                            >
                                                <CalendarClock size={14}/> Ver Cita
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-8">
                                        <CheckCircle size={36} className="mx-auto text-green-200 dark:text-green-800 mb-2"/>
                                        <p className="text-gray-400 dark:text-slate-500 text-sm font-bold">Todo al día</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Próximas confirmadas */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm">
                            <h3 className="font-black text-lg mb-5 text-gray-900 dark:text-white flex items-center">
                                <CalendarClock size={22} className="mr-3 text-mindpath-primary"/>Próximas citas
                            </h3>
                            <div className="space-y-3">
                                {data?.upcoming?.length > 0 ? data.upcoming.map(app => (
                                    <div
                                        key={`up-${app.id}`}
                                        onClick={() => navigate(`/doctor/appointment/${app.id}`)}
                                        className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-[1.25rem] border border-gray-100 dark:border-white/10 flex items-center justify-between cursor-pointer hover:border-mindpath-primary/40 dark:hover:border-mindpath-primary/30 hover:bg-mindpath-light/30 dark:hover:bg-mindpath-primary/10 transition-all group"
                                    >
                                        <div>
                                            <p className="font-black text-gray-900 dark:text-white group-hover:text-mindpath-primary transition-colors text-sm">{app.patient_name}</p>
                                            <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-tight mt-1">
                                                {app.start_time.slice(0,5)} • {new Date(app.appointment_date).toLocaleDateString('es-ES',{day:'numeric',month:'short'})}
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{app.type === 'virtual' ? 'Telemedicina' : 'Presencial'}</p>
                                            {app.payment_proof_url && app.payment_status !== 'paid' && (
                                                <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 inline-block mt-1 animate-pulse">
                                                    📄 Pago por Verificar
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-[10px] font-black text-mindpath-primary bg-mindpath-light dark:bg-mindpath-primary/30 px-2 py-1 rounded-full border border-mindpath-light dark:border-mindpath-primary/30">
                                                {app.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                                            </span>
                                            <ChevronRight size={14} className="text-gray-300 dark:text-slate-600 group-hover:text-mindpath-primary transition-colors" />
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-8 text-gray-400 dark:text-slate-500 text-sm font-bold">
                                        No hay próximas citas
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL DE EXTENSIÓN DE EMERGENCIA */}
            {showExtensionModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative">
                        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mb-6">
                            <ShieldAlert size={32} className="text-red-600 dark:text-red-400 animate-pulse" />
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

export default DoctorDashboard;
