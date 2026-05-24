import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import {
    ClipboardList, Calendar, ChevronDown, Lock,
    Phone, Mail, MapPin, User, Activity,
    Video, MapPinned, Clock, ChevronRight, ChevronLeft,
    FileText, AlertCircle, CalendarPlus, StickyNote, Check, X
} from 'lucide-react';

import { BACKEND_URL } from '../../api/constants';
import { PDFExportButton } from '../../components/ReportPDF';
import { useAuthStore } from '../../store/useAuthStore';


const genderLabel = { M: 'Masculino', F: 'Femenino', O: 'Otro', Other: 'Otro' };

const statusConfig = {
    pending:   { label: 'Pendiente',  color: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-500/30' },
    confirmed: { label: 'Confirmada', color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-500/30' },
    completed: { label: 'Completada', color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-500/30' },
    cancelled: { label: 'Cancelada',  color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-500/30' },
};

const PatientFile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('history');
    const { user } = useAuthStore(); // Necesario para el doctor_id

    // ── Notas rápidas (Sprint 27) ────────────────────────────────────────────
    const [notes,        setNotes]       = useState('');
    const [notesSaved,   setNotesSaved]  = useState(false);
    const [notesLoaded,  setNotesLoaded] = useState(false);
    const debounceRef = useRef(null);

    const saveNotes = useCallback(async (text) => {
        try {
            await api.put(`/doctors/patient/${id}/notes`, { notes: text });
            setNotesSaved(true);
            setTimeout(() => setNotesSaved(false), 2000);
        } catch (err) {
            console.error('Error guardando notas:', err);
        }
    }, [id]);

    const handleNotesChange = (e) => {
        const val = e.target.value;
        setNotes(val);
        setNotesSaved(false);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => saveNotes(val), 1500);
    };

    // ── Agendamiento por Doctor (Sprint 28) ──────────────────────────────────
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [modality, setModality] = useState('virtual');
    const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const d2 = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${d2}`;
    });
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [loadingSlots, setLoadingSlots] = useState(false);

    const [currentMonth, setCurrentMonth] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => {
        const day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // Lunes = 0, Domingo = 6
    };

    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const days = [];
        // Huecos en blanco (días del mes anterior en la primera semana)
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }
        // Días reales del mes
        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(year, month, i);
            const yStr = d.getFullYear();
            const mStr = String(d.getMonth() + 1).padStart(2, '0');
            const dStr = String(d.getDate()).padStart(2, '0');
            days.push({ 
                date: d, 
                dateString: `${yStr}-${mStr}-${dStr}`,
                dayNum: i,
                isPast: d < new Date(new Date().setHours(0,0,0,0))
            });
        }
        return days;
    }, [currentMonth]);

    const handlePrevMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    // Cargar disponibilidad al cambiar fecha
    useEffect(() => {
        if (!showScheduleModal || !user?.id) return;
        const fetchAvailability = async () => {
            setLoadingSlots(true);
            setSelectedSlot(null);
            try {
                const res = await api.get(`/bookings/availability?doctorId=${user.id}&date=${selectedDate}`);
                setAvailableSlots(res.data);
            } catch (error) {
                console.error('Error obteniendo horarios:', error);
            } finally {
                setLoadingSlots(false);
            }
        };
        fetchAvailability();
    }, [selectedDate, showScheduleModal, user?.id]);

    const handleBooking = async () => {
        if (!selectedSlot) return;
        try {
            await api.post('/bookings/book', {
                doctor_id: user.id,
                patient_id: id,
                appointment_date: selectedDate,
                start_time: `${selectedSlot}:00`,
                type: modality,
            });
            setShowScheduleModal(false);
            
            // Recargar datos para mostrar la nueva cita
            api.get(`/doctors/patient/${id}`).then(res => setData(res.data));
            
        } catch (error) {
            alert(error.response?.data?.message || 'Error al agendar la cita.');
            console.error(error);
        }
    };


    useEffect(() => {
        api.get(`/doctors/patient/${id}`)
            .then(res => setData(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));

        // Cargar notas del paciente
        api.get(`/doctors/patient/${id}/notes`)
            .then(res => {
                setNotes(res.data.notes || '');
                setNotesLoaded(true);
            })
            .catch(() => setNotesLoaded(true));
    }, [id]);


    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Activity className="animate-spin text-mindpath-primary" size={40} />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="max-w-lg mx-auto mt-20 p-10 bg-red-50 dark:bg-red-900/20 rounded-3xl text-center border border-red-100 dark:border-red-500/30">
                <AlertCircle size={40} className="mx-auto text-red-400 mb-3" />
                <p className="font-bold text-red-700 dark:text-red-400">No se pudo cargar el expediente.</p>
            </div>
        );
    }

    const { info, history, upcoming = [] } = data;

    const age = info.date_of_birth
        ? Math.floor((Date.now() - new Date(info.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))
        : null;

    const firstAppt = history.length > 0
        ? new Date(history[history.length - 1].appointment_date).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
        : null;

    const lastAppt = history.length > 0
        ? new Date(history[0].appointment_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
        : null;

    const avatarSrc = info.profile_picture ? `${BACKEND_URL}${info.profile_picture}` : null;

    return (
        <div className="max-w-6xl mx-auto pb-12 space-y-6">

            {/* ── HEADER ──────────────────────────────────────────────────── */}
            <div className="bg-mindpath-primary dark:bg-mindpath-primary rounded-[2rem] p-6 sm:p-8 text-white relative overflow-hidden border border-white/5 shadow-premium-primary">
                <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    {avatarSrc ? (
                        <img src={avatarSrc} alt={info.full_name}
                            className="w-20 h-20 rounded-full object-cover border-4 border-white/20 shadow-xl shrink-0" />
                    ) : (
                        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-3xl font-black text-white border-4 border-white/20 shrink-0">
                            {info.full_name?.[0]}
                        </div>
                    )}
                    <div className="flex-1">
                        <h1 className="text-3xl font-black">{info.full_name}</h1>
                        <p className="text-mindpath-primary text-sm mt-1">{info.email}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                            {age !== null && (
                                <span className="bg-white/10 text-white text-xs font-bold px-3 py-1 rounded-full">
                                    {age} años
                                </span>
                            )}
                            {info.gender && (
                                <span className="bg-white/10 text-white text-xs font-bold px-3 py-1 rounded-full">
                                    {genderLabel[info.gender] || info.gender}
                                </span>
                            )}
                            <span className="bg-white/10 text-white text-xs font-bold px-3 py-1 rounded-full">
                                {history.length} consulta{history.length !== 1 ? 's' : ''}
                            </span>
                            {upcoming.length > 0 && (
                                <span className="bg-mindpath-primary/30 text-gray-400 text-xs font-bold px-3 py-1 rounded-full border border-mindpath-primary/30">
                                    {upcoming.length} cita{upcoming.length !== 1 ? 's' : ''} próxima{upcoming.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* ── COLUMNA IZQUIERDA ──────────────────────────────────── */}
                <div className="lg:col-span-4 space-y-5">

                    {/* Datos de contacto */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm">
                        <h3 className="font-black text-base mb-5 text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-white/10 pb-4">
                            <User size={16} className="text-mindpath-primary" /> Datos de Contacto
                        </h3>
                        <div className="space-y-3">
                            {info.phone && (
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 bg-gray-100 dark:bg-slate-700 rounded-xl flex items-center justify-center shrink-0">
                                        <Phone size={14} className="text-gray-500 dark:text-slate-400" />
                                    </div>
                                    <span className="font-medium text-gray-700 dark:text-slate-300">{info.phone}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 bg-gray-100 dark:bg-slate-700 rounded-xl flex items-center justify-center shrink-0">
                                    <Mail size={14} className="text-gray-500 dark:text-slate-400" />
                                </div>
                                <span className="font-medium text-gray-700 dark:text-slate-300 truncate">{info.email}</span>
                            </div>
                            {info.address && (
                                <div className="flex items-start gap-3 text-sm">
                                    <div className="w-8 h-8 bg-gray-100 dark:bg-slate-700 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                                        <MapPin size={14} className="text-gray-500 dark:text-slate-400" />
                                    </div>
                                    <span className="font-medium text-gray-700 dark:text-slate-300">{info.address}</span>
                                </div>
                            )}
                            {info.date_of_birth && (
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 bg-gray-100 dark:bg-slate-700 rounded-xl flex items-center justify-center shrink-0">
                                        <Calendar size={14} className="text-gray-500 dark:text-slate-400" />
                                    </div>
                                    <span className="font-medium text-gray-700 dark:text-slate-300">
                                        {new Date(info.date_of_birth).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Resumen clínico */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm">
                        <h3 className="font-black text-base mb-5 text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-white/10 pb-4">
                            <Activity size={16} className="text-mindpath-primary" /> Resumen Clínico
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500 dark:text-slate-400">Consultas completadas</span>
                                <span className="font-black text-2xl text-mindpath-primary">{history.length}</span>
                            </div>
                            {firstAppt && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500 dark:text-slate-400">Primera consulta</span>
                                    <span className="text-sm font-bold text-gray-700 dark:text-slate-300">{firstAppt}</span>
                                </div>
                            )}
                            {lastAppt && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500 dark:text-slate-400">Última consulta</span>
                                    <span className="text-sm font-bold text-gray-700 dark:text-slate-300">{lastAppt}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500 dark:text-slate-400">Próximas citas</span>
                                <span className="font-bold text-gray-700 dark:text-slate-300">{upcoming.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Botón agendar */}
                    <button
                        onClick={() => setShowScheduleModal(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-mindpath-primary hover:bg-mindpath-primaryHover text-white font-bold rounded-2xl transition-colors shadow-sm shadow-mindpath-primary text-sm"
                    >
                        <CalendarPlus size={16} />
                        Agendar nueva cita
                    </button>

                    {/* Notas rápidas — Sprint 27 */}
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm">
                        <h3 className="font-black text-base mb-3 text-gray-900 dark:text-white flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2">
                                <StickyNote size={16} className="text-mindpath-primary" /> Notas Rápidas
                            </span>
                            {notesSaved && (
                                <span className="flex items-center gap-1 text-green-500 text-xs font-bold">
                                    <Check size={12} /> Guardado
                                </span>
                            )}
                        </h3>
                        <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">Privado • solo tú lo ves</p>
                        <textarea
                            disabled={!notesLoaded}
                            value={notes}
                            onChange={handleNotesChange}
                            rows={5}
                            placeholder="Observaciones personales sobre este paciente..."
                            className="w-full resize-none rounded-xl bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-white/10 text-sm text-gray-800 dark:text-slate-200 p-3 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-mindpath-primary/50 transition"
                        />
                    </div>
                </div>


                {/* ── COLUMNA DERECHA: Tabs ───────────────────────────────── */}
                <div className="lg:col-span-8 space-y-4">

                    {/* Tab switcher */}
                    <div className="flex bg-gray-100 dark:bg-slate-700/60 p-1.5 rounded-2xl w-fit gap-1">
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
                                activeTab === 'history'
                                    ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                            }`}
                        >
                            <ClipboardList size={15} className="inline mr-2" />
                            Historial ({history.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('upcoming')}
                            className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
                                activeTab === 'upcoming'
                                    ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                            }`}
                        >
                            <Calendar size={15} className="inline mr-2" />
                            Próximas ({upcoming.length})
                        </button>
                    </div>

                    {/* TAB: HISTORIAL */}
                    {activeTab === 'history' && (
                        <div className="space-y-3">
                            {history.length === 0 ? (
                                <div className="bg-gray-50 dark:bg-slate-800 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-14 text-center">
                                    <FileText size={40} className="mx-auto text-gray-200 dark:text-slate-600 mb-3" />
                                    <p className="font-bold text-gray-400 dark:text-slate-500">No hay consultas completadas aún.</p>
                                </div>
                            ) : history.map((h) => {
                                const hSc = statusConfig[h.status] || statusConfig.completed;
                                return (
                                    <details
                                        key={h.appointment_id}
                                        className="bg-white dark:bg-slate-800 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden group"
                                    >
                                        <summary className="p-6 cursor-pointer flex justify-between items-center hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors list-none">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-mindpath-primary text-white p-3 rounded-2xl shrink-0">
                                                    <Calendar size={18} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 dark:text-white capitalize">
                                                        {new Date(h.appointment_date).toLocaleDateString('es-ES', {
                                                            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                                                        })}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${hSc.color}`}>
                                                            {hSc.label}
                                                        </span>
                                                        <span className="text-xs text-gray-400 dark:text-slate-500 font-bold">
                                                            {h.type === 'virtual' ? '🎥 Telemedicina' : '🏥 Presencial'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                {h.diagnostico && (
                                                    <span className="hidden md:inline-block bg-mindpath-light dark:bg-mindpath-primary/30 text-mindpath-primary dark:text-mindpath-primary px-3 py-1 rounded-full text-xs font-bold max-w-[160px] truncate">
                                                        {h.diagnostico}
                                                    </span>
                                                )}
                                                <ChevronDown className="text-gray-400 dark:text-slate-500 group-open:rotate-180 transition-transform" size={20} />
                                            </div>
                                        </summary>

                                        {h.motivo_sintomas ? (
                                            <div className="p-6 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-slate-700/30">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <p className="text-[10px] font-black text-mindpath-primary uppercase tracking-wider mb-1">Motivo y Síntomas</p>
                                                            <p className="text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 p-3 rounded-xl border border-gray-100 dark:border-white/10">{h.motivo_sintomas}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-mindpath-primary uppercase tracking-wider mb-1">Antecedentes</p>
                                                            <p className="text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 p-3 rounded-xl border border-gray-100 dark:border-white/10">{h.antecedentes}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-mindpath-primary uppercase tracking-wider mb-1">Hallazgos Neurológicos</p>
                                                            <p className="text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 p-3 rounded-xl border border-gray-100 dark:border-white/10">{h.hallazgos}</p>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <p className="text-[10px] font-black text-mindpath-primary uppercase tracking-wider mb-1">Diagnóstico</p>
                                                            <p className="font-bold text-gray-900 dark:text-white bg-white dark:bg-slate-700 p-3 rounded-xl border border-gray-100 dark:border-white/10">{h.diagnostico}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-mindpath-primary uppercase tracking-wider mb-1">Tratamiento</p>
                                                            <p className="text-gray-700 dark:text-slate-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-500/30">{h.tratamiento}</p>
                                                        </div>
                                                        {h.estudios_observaciones && (
                                                            <div>
                                                                <p className="text-[10px] font-black text-mindpath-primary uppercase tracking-wider mb-1">Estudios y Observaciones</p>
                                                                <p className="text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 p-3 rounded-xl border border-gray-100 dark:border-white/10">{h.estudios_observaciones}</p>
                                                            </div>
                                                        )}
                                                        {h.private_notes && (
                                                            <div className="bg-gray-900 dark:bg-black/40 text-white p-4 rounded-2xl border border-white/10">
                                                                <p className="text-[10px] font-black text-mindpath-primary uppercase flex items-center mb-1">
                                                                    <Lock size={11} className="mr-1" /> Notas Privadas
                                                                </p>
                                                                <p className="text-gray-300 text-xs italic">{h.private_notes}</p>
                                                            </div>
                                                        )}
                                                        <div className="md:col-span-2 flex justify-end mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                                                            <PDFExportButton 
                                                                report={{
                                                                    motivo_sintomas: h.motivo_sintomas || '',
                                                                    antecedentes: h.antecedentes || '',
                                                                    hallazgos: h.hallazgos || '',
                                                                    diagnostico: h.diagnostico || '',
                                                                    tratamiento: h.tratamiento || '',
                                                                    estudios_observaciones: h.estudios_observaciones || '',
                                                                    private_notes: h.private_notes || ''
                                                                }}
                                                                header={{
                                                                    patient_name: info.full_name,
                                                                    appointment_date: h.appointment_date,
                                                                    type: h.type
                                                                }}
                                                            />
                                                        </div>

                                                    </div>
                                                </div>
                                            </div>
                                        ) : (

                                            <div className="p-6 text-center text-gray-400 dark:text-slate-500 italic text-sm border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-slate-700/20">
                                                No se redactó historia clínica para esta consulta.
                                            </div>
                                        )}
                                    </details>
                                );
                            })}
                        </div>
                    )}

                    {/* TAB: PRÓXIMAS CITAS */}
                    {activeTab === 'upcoming' && (
                        <div className="space-y-3">
                            {upcoming.length === 0 ? (
                                <div className="bg-gray-50 dark:bg-slate-800 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-14 text-center">
                                    <Calendar size={40} className="mx-auto text-gray-200 dark:text-slate-600 mb-3" />
                                    <p className="font-bold text-gray-400 dark:text-slate-500">No hay citas próximas programadas.</p>
                                </div>
                            ) : upcoming.map((appt) => {
                                const sc = statusConfig[appt.status] || statusConfig.pending;
                                return (
                                    <div
                                        key={appt.appointment_id}
                                        onClick={() => navigate(`/doctor/appointment/${appt.appointment_id}`)}
                                        className="bg-white dark:bg-slate-800 p-5 rounded-[1.75rem] border border-gray-100 dark:border-white/10 shadow-sm flex items-center justify-between cursor-pointer hover:border-mindpath-primary/30 dark:hover:border-mindpath-primary/30 hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-mindpath-light dark:bg-mindpath-primary/30 rounded-2xl flex flex-col items-center justify-center shrink-0">
                                                <span className="text-xs font-black text-mindpath-primary uppercase">
                                                    {new Date(appt.appointment_date).toLocaleDateString('es-ES', { month: 'short' })}
                                                </span>
                                                <span className="text-xl font-black text-mindpath-primary leading-tight">
                                                    {new Date(appt.appointment_date).getDate()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-black text-gray-900 dark:text-white group-hover:text-mindpath-primary transition-colors capitalize">
                                                    {new Date(appt.appointment_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="flex items-center text-xs text-gray-500 dark:text-slate-400 font-bold">
                                                        <Clock size={12} className="mr-1"/> {appt.start_time?.slice(0, 5)}
                                                    </span>
                                                    <span className="flex items-center text-xs text-gray-500 dark:text-slate-400 font-bold">
                                                        {appt.type === 'virtual'
                                                            ? <><Video size={12} className="mr-1"/> Telemedicina</>
                                                            : <><MapPinned size={12} className="mr-1"/> Presencial</>}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className={`text-xs px-3 py-1.5 rounded-full border font-bold ${sc.color}`}>
                                                {sc.label}
                                            </span>
                                            <ChevronRight size={18} className="text-gray-300 dark:text-slate-600 group-hover:text-mindpath-primary transition-colors" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── MODAL AGENDAR CITA ──────────────────────────────────────────────── */}
            {showScheduleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-white/10 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-white/10">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <CalendarPlus size={20} className="text-mindpath-primary" />
                                Agendar Cita
                            </h2>
                            <button onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            {/* Modalidad */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <button 
                                    onClick={() => setModality('virtual')}
                                    className={`p-4 rounded-2xl border-2 flex flex-col items-center transition-all ${modality === 'virtual' ? 'border-mindpath-primary bg-mindpath-light dark:bg-mindpath-primary/30 text-mindpath-primary' : 'border-gray-100 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:border-gray-200'}`}
                                >
                                    <Video size={24} className="mb-2" />
                                    <span className="font-bold text-sm">Telemedicina</span>
                                </button>
                                <button 
                                    onClick={() => setModality('presencial')}
                                    className={`p-4 rounded-2xl border-2 flex flex-col items-center transition-all ${modality === 'presencial' ? 'border-mindpath-primary bg-mindpath-light dark:bg-mindpath-primary/30 text-mindpath-primary' : 'border-gray-100 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:border-gray-200'}`}
                                >
                                    <MapPin size={24} className="mb-2" />
                                    <span className="font-bold text-sm">Presencial</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                {/* Fecha - COMPACT MONTH CALENDAR */}
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Fecha</h3>
                                        
                                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700/50 rounded-xl p-1">
                                            <button onClick={handlePrevMonth} className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-600 text-gray-500 hover:text-mindpath-primary transition-colors">
                                                <ChevronLeft size={16} />
                                            </button>
                                            <span className="text-xs font-bold text-gray-700 dark:text-slate-200 capitalize w-24 text-center">
                                                {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                                            </span>
                                            <button onClick={handleNextMonth} className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-600 text-gray-500 hover:text-mindpath-primary transition-colors">
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-slate-700/30 rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                                        <div className="grid grid-cols-7 gap-1 mb-2">
                                            {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map(day => (
                                                <div key={day} className="text-center text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase">
                                                    {day}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-7 gap-1">
                                            {calendarDays.map((dayObj, i) => {
                                                if (!dayObj) return <div key={`empty-${i}`} className="p-2" />;
                                                
                                                const isSelected = selectedDate === dayObj.dateString;
                                                return (
                                                    <button 
                                                        key={dayObj.dateString}
                                                        disabled={dayObj.isPast}
                                                        onClick={() => setSelectedDate(dayObj.dateString)}
                                                        className={`
                                                            aspect-square flex items-center justify-center rounded-xl text-sm font-bold transition-all
                                                            ${dayObj.isPast ? 'text-gray-300 dark:text-slate-600 cursor-not-allowed' : ''}
                                                            ${!dayObj.isPast && !isSelected ? 'text-gray-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600 hover:shadow-sm' : ''}
                                                            ${isSelected ? 'bg-mindpath-primary text-white shadow-md shadow-mindpath-primary dark:shadow-mindpath-primary/30 ring-2 ring-mindpath-primary ring-offset-2 dark:ring-offset-slate-800' : ''}
                                                        `}
                                                    >
                                                        {dayObj.dayNum}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Horarios */}
                                <div className="flex flex-col h-full">
                                    <h3 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">Horarios Disponibles</h3>
                                    {loadingSlots ? (
                                        <div className="py-10 flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-700/30 rounded-2xl border border-gray-100 dark:border-white/5 flex-1">
                                            <Activity size={32} className="animate-spin text-mindpath-primary mb-2"/>
                                            <p className="text-sm text-gray-500 dark:text-slate-400 font-bold">Buscando horarios...</p>
                                        </div>
                                    ) : availableSlots.length > 0 ? (
                                        <div className="bg-gray-50 dark:bg-slate-700/30 rounded-2xl p-4 border border-gray-100 dark:border-white/5 flex-1 overflow-y-auto max-h-[280px]">
                                            <div className="grid grid-cols-3 gap-2">
                                                {availableSlots.map(time => (
                                                    <button
                                                        key={time}
                                                        onClick={() => setSelectedSlot(time)}
                                                        className={`p-3 rounded-xl font-bold text-sm transition-all border ${selectedSlot === time ? 'bg-mindpath-primary border-mindpath-primary text-white shadow-md' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:border-mindpath-primary hover:text-mindpath-primary'}`}
                                                    >
                                                        {time}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-10 flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-500/30 flex-1">
                                            <p className="text-sm text-red-500 dark:text-red-400 font-bold text-center px-4">
                                                No tienes horarios creados para este día en "Mi Disponibilidad".
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Confirmar */}
                            <button 
                                onClick={handleBooking}
                                disabled={!selectedSlot}
                                className="w-full bg-mindpath-primary hover:bg-mindpath-primaryHover disabled:bg-gray-300 dark:disabled:bg-slate-700 disabled:text-gray-500 dark:disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-lg shadow-xl shadow-mindpath-primary/30 transition-all flex justify-center items-center"
                            >
                                Confirmar Agendamiento <ChevronRight size={20} className="ml-1" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientFile;
