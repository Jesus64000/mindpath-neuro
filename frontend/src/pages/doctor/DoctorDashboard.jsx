import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axiosConfig';
import { useAuthStore } from '../../store/useAuthStore';
import { 
    Calendar, Clock, Users, Bell, ShieldAlert, 
    TrendingUp, UserPlus, RefreshCw, XCircle, CheckCircle, CalendarClock 
} from 'lucide-react';

const DoctorDashboard = () => {
    const { user } = useAuthStore();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dayAppointments, setDayAppointments] = useState([]);
    const [dayLoading, setDayLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(() => new Date());
    const [weekStart, setWeekStart] = useState(() => getStartOfWeek(new Date()));
    const [isBlocked, setIsBlocked] = useState(false);
    const [blockLoading, setBlockLoading] = useState(false);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const res = await api.get('/appointments/doctor/summary');
            setData(res.data);
            setIsBlocked(res.data.isBlocked || false);
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

    useEffect(() => {
        loadDashboard();
    }, []);

    useEffect(() => {
        fetchDayAppointments(selectedDate);
    }, [selectedDate]);

    const handleStatus = async (id, status) => {
        await api.put(`/appointments/${id}/status`, { status });
        loadDashboard();
        fetchDayAppointments(selectedDate);
    };

    const handleBlockToggle = async () => {
        try {
            setBlockLoading(true);
            const nextState = !isBlocked;
            await api.patch('/appointments/doctor/block', { blocked: nextState });
            setIsBlocked(nextState);
        } catch (e) {
            console.error('Error al cambiar bloqueo', e);
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
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(weekStart);
            d.setDate(weekStart.getDate() + i);
            days.push(d);
        }
        return days;
    }, [weekStart]);

    const calendarCount = useMemo(() => {
        const map = {};
        data?.calendar?.forEach(({ appointment_date, count }) => {
            map[appointment_date] = count;
        });
        return map;
    }, [data]);

    if (loading) return <div className="p-20 text-center animate-pulse text-mindpath-primary font-bold">Cargando tu Centro de Mando...</div>;

    const totalPatients = data?.stats.totalPatients || 0;
    const newPct = totalPatients ? Math.min(100, Math.round((data?.stats.newVsRecurrent.new / totalPatients) * 100)) : 0;
    const recurrentPct = totalPatients ? Math.min(100, Math.round((data?.stats.newVsRecurrent.recurrent / totalPatients) * 100)) : 0;

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12 p-4">
            
            {/* BANNER PRINCIPAL */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Dr(a). {user?.full_name.split(' ').at(-1)}</h1>
                    <p className="text-gray-500">Panel de control profesional • Mindpath v1.15</p>
                </div>
                <button 
                    onClick={handleBlockToggle}
                    disabled={blockLoading}
                    className={`flex items-center px-6 py-3 font-bold rounded-2xl border transition-all ${isBlocked ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800' : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'}`}
                >
                    <ShieldAlert size={20} className="mr-2" /> {isBlocked ? 'Desbloquear agenda' : 'Bloqueo de Emergencia'}
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-mindpath-primary p-7 rounded-[2rem] text-white shadow-xl shadow-purple-100">
                    <TrendingUp className="mb-4 opacity-50" size={30} />
                    <p className="text-purple-100 text-sm font-medium">Consultas / Semana</p>
                    <h3 className="text-4xl font-black">{data?.stats.avgPerWeek}</h3>
                </div>
                <div className="bg-white p-7 rounded-[2rem] border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-sm font-medium">Pacientes Totales</p>
                        <h3 className="text-4xl font-black text-gray-900">{data?.stats.totalPatients}</h3>
                    </div>
                    <div className="h-14 w-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500"><Users size={30}/></div>
                </div>
                <div className="bg-white p-7 rounded-[2rem] border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-sm font-medium">Por Aprobar</p>
                        <h3 className="text-4xl font-black text-yellow-600">{data?.pending.length}</h3>
                    </div>
                    <div className="h-14 w-14 bg-yellow-50 rounded-2xl flex items-center justify-center text-yellow-500"><Bell size={30}/></div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* AGENDA SEMANAL */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-black text-xl flex items-center"><Calendar className="mr-3 text-mindpath-primary"/> Vista Semanal</h3>
                                <p className="text-sm text-gray-500">Selecciona un día para ver las citas.</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleWeekChange(-7)} className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold uppercase">Anterior</button>
                                <button onClick={() => handleWeekChange(7)} className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold uppercase">Siguiente</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-3">
                            {weekDays.map((day) => {
                                const iso = toLocalISO(day);
                                const isSelected = toLocalISO(selectedDate) === iso;
                                const hasEvents = calendarCount[iso] > 0;
                                return (
                                    <button
                                        key={iso}
                                        onClick={() => setSelectedDate(day)}
                                        className={`p-5 rounded-3xl border-2 text-center transition-all ${isSelected ? 'border-mindpath-primary bg-purple-50' : 'border-gray-100 bg-gray-50/50 hover:border-mindpath-primary/50'}`}
                                    >
                                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">{day.toLocaleDateString('es-ES', { weekday: 'short' })}</p>
                                        <p className="text-2xl font-black text-gray-800">{day.getDate()}</p>
                                        <div className={`h-2 w-2 mx-auto rounded-full mt-3 ${hasEvents ? 'bg-mindpath-primary animate-pulse' : 'bg-transparent'}`}></div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-8">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-xs font-bold uppercase text-gray-400">Citas del día</p>
                                    <p className="text-lg font-black text-gray-800">{selectedDate.toLocaleDateString()}</p>
                                </div>
                                <div className="text-sm text-gray-500">{dayAppointments.length} cita(s)</div>
                            </div>

                            {dayLoading ? (
                                <div className="p-6 text-center text-mindpath-primary font-bold">Cargando citas...</div>
                            ) : dayAppointments.length > 0 ? (
                                <div className="space-y-3">
                                    {dayAppointments.map((app) => (
                                        <div key={app.appointment_id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-bold text-gray-700">{app.patient_name}</p>
                                                <p className="text-xs text-gray-500 flex items-center"><Clock size={14} className="mr-1" /> {app.start_time.slice(0,5)} • {app.type === 'virtual' ? 'Telemedicina' : 'Presencial'}</p>
                                            </div>
                                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-600">{app.status}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 text-center text-gray-400 font-bold bg-gray-50 rounded-2xl border border-dashed border-gray-200">Sin citas para este día</div>
                            )}
                        </div>
                    </div>

                    {/* ANALYTICS (NUEVOS VS RECURRENTES) */}
                    <div className="bg-white p-8 rounded-[2rem] border border-gray-100">
                        <h3 className="font-black text-xl mb-8 flex items-center"><TrendingUp className="mr-3 text-blue-500"/> Retención de Pacientes</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between mb-2 italic">
                                        <span className="flex items-center text-sm font-bold text-gray-600"><UserPlus size={16} className="mr-2 text-green-500"/> Pacientes Nuevos</span>
                                        <span className="font-black text-green-600">{data?.stats.newVsRecurrent.new}</span>
                                    </div>
                                    <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 transition-all duration-1000" style={{width: `${newPct}%`}}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-2 italic">
                                        <span className="flex items-center text-sm font-bold text-gray-600"><RefreshCw size={16} className="mr-2 text-blue-500"/> Pacientes Recurrentes</span>
                                        <span className="font-black text-blue-600">{data?.stats.newVsRecurrent.recurrent}</span>
                                    </div>
                                    <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 transition-all duration-1000" style={{width: `${recurrentPct}%`}}></div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-[2rem] p-8 text-center border border-dashed border-gray-200">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Estado de Salud de la Clínica</p>
                                <p className="text-4xl font-black text-mindpath-primary mt-2">Excelente</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SOLICITUDES PENDIENTES Y PRÓXIMAS LADO A LADO */}
                <div className="lg:col-span-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                            <h3 className="font-black text-xl mb-8 flex items-center"><Bell size={24} className="mr-3 text-yellow-500 animate-bounce"/> Solicitudes</h3>
                            <div className="space-y-4">
                                {data?.pending.length > 0 ? data.pending.map(app => (
                                    <div key={app.id} className="p-5 bg-gray-50 rounded-[1.5rem] border border-transparent hover:border-mindpath-primary transition-all group">
                                        <p className="font-black text-gray-900">{app.patient_name}</p>
                                        <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-tighter">
                                            {app.start_time.slice(0,5)} • {new Date(app.appointment_date).toLocaleDateString()}
                                        </p>
                                        <div className="flex gap-2 mt-4">
                                            <button 
                                                onClick={() => handleStatus(app.id, 'confirmed')}
                                                className="flex-1 py-3 bg-mindpath-primary text-white text-[10px] font-black rounded-xl hover:scale-105 transition-transform"
                                            >
                                                ACEPTAR
                                            </button>
                                            <button 
                                                onClick={() => handleStatus(app.id, 'cancelled')}
                                                className="p-3 bg-white text-gray-400 rounded-xl border border-gray-200 hover:text-red-500 hover:border-red-200 transition-all"
                                            >
                                                <XCircle size={18}/>
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-10">
                                        <CheckCircle size={40} className="mx-auto text-green-200 mb-2"/>
                                        <p className="text-gray-400 text-sm font-bold">Todo al día</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                            <h3 className="font-black text-xl mb-6 flex items-center"><CalendarClock size={22} className="mr-3 text-mindpath-primary"/> Próximas citas</h3>
                            <div className="space-y-4">
                                {data?.upcoming?.length > 0 ? data.upcoming.map(app => (
                                    <div key={`up-${app.id}`} className="p-5 bg-gray-50 rounded-[1.25rem] border border-gray-100 flex items-center justify-between">
                                        <div>
                                            <p className="font-black text-gray-900">{app.patient_name}</p>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-tight mt-1">
                                                {app.start_time.slice(0,5)} • {new Date(app.appointment_date).toLocaleDateString()}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">{app.type === 'virtual' ? 'Telemedicina' : 'Presencial'}</p>
                                        </div>
                                        <span className="text-[10px] font-black text-mindpath-primary bg-purple-50 px-3 py-1 rounded-full border border-purple-100">Confirmada</span>
                                    </div>
                                )) : (
                                    <div className="text-center py-8 text-gray-400 text-sm font-bold">No hay próximas citas</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helpers
const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day; // lunes como inicio
    d.setDate(d.getDate() + diff);
    d.setHours(0,0,0,0);
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

export default DoctorDashboard;