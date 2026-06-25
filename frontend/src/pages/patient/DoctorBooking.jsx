import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { BACKEND_URL } from '../../api/constants';
import { Calendar as CalendarIcon, Clock, Video, MapPin, Star, ChevronRight, ChevronLeft, CheckCircle, XCircle, Activity, Building2 } from 'lucide-react';

// ── Toast ───────────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3500);
        return () => clearTimeout(timer);
    }, [onClose]);

    const colors = type === 'success'
        ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-500/30 dark:text-green-300'
        : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-500/30 dark:text-red-300';
    const Icon = type === 'success' ? CheckCircle : XCircle;

    return (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-xl ${colors} max-w-sm`}>
            <Icon size={20} className="shrink-0" />
            <p className="text-sm font-bold">{message}</p>
        </div>
    );
};

// ── Componente Principal ───────────────────────────────────────────────
const DoctorBooking = () => {
    const { doctorId } = useParams();
    const navigate = useNavigate();
    const { state } = useLocation();

    const formatDateLocal = (date) => {
        const year  = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day   = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const today = new Date();
    const [doctor, setDoctor]               = useState(state?.doctor || null);
    const [loadingDoctor, setLoadingDoctor] = useState(!state?.doctor);
    const [selectedDate, setSelectedDate]   = useState(formatDateLocal(today));
    const [weekOffset, setWeekOffset]       = useState(0);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot]   = useState(null);
    const [modality, setModality]           = useState('virtual');
    const [paymentMethod, setPaymentMethod] = useState('platform');
    const [quote, setQuote] = useState(null);
    const [quoteLoading, setQuoteLoading] = useState(false);
    const [loadingSlots, setLoadingSlots]   = useState(false);
    const [toast, setToast]                 = useState(null);

    useEffect(() => {
        const needsRefresh = !state?.doctor || !state.doctor.payment_methods;
        if (needsRefresh) {
            const fetchDoctor = async () => {
                try {
                    const res = await api.get(`/doctors/${doctorId}`);
                    setDoctor(res.data);
                } catch (err) {
                    console.error('Error al cargar el médico:', err);
                    setToast({ message: 'No se pudo cargar el perfil del especialista.', type: 'error' });
                } finally {
                    setLoadingDoctor(false);
                }
            };
            fetchDoctor();
        } else {
            setLoadingDoctor(false);
        }
    }, [doctorId, state?.doctor]);

    const getWeekStartingMonday = (offsetWeeks = 0) => {
        const base = new Date();
        const day  = base.getDay();
        const offsetToMonday = day === 0 ? 6 : day - 1;
        const monday = new Date(base);
        monday.setDate(base.getDate() - offsetToMonday + offsetWeeks * 7);
        return Array.from({ length: 7 }).map((_, i) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            return date;
        });
    };

    const next7Days = getWeekStartingMonday(weekOffset);

    useEffect(() => {
        const fetchAvailability = async () => {
            setLoadingSlots(true);
            setSelectedSlot(null);
            try {
                const res = await api.get(`/bookings/availability?doctorId=${doctorId}&date=${selectedDate}&format=object`);
                let slots = res.data;
                const todayStr = formatDateLocal(new Date());
                if (selectedDate === todayStr) {
                    const now = new Date();
                    const currentMinutes = now.getHours() * 60 + now.getMinutes();
                    slots = slots.filter(slot => {
                        const timeStr = typeof slot === 'string' ? slot : slot.time;
                        const [h, m] = timeStr.split(':').map(Number);
                        const slotMinutes = h * 60 + m;
                        return (slotMinutes - currentMinutes) >= 10;
                    });
                }
                setAvailableSlots(slots);
            } catch (error) {
                console.error('Error obteniendo horarios', error);
                setAvailableSlots([]);
            } finally {
                setLoadingSlots(false);
            }
        };
        fetchAvailability();
    }, [doctorId, selectedDate]);


    // Cuando cambia la modalidad, selecciona el primer método compatible
    useEffect(() => {
        if (doctor && Array.isArray(doctor.payment_methods) && doctor.payment_methods.length > 0) {
            setPaymentMethod(doctor.payment_methods[0]?.method_name || '');
        } else {
            setPaymentMethod('');
        }
    }, [modality, doctor]);

    useEffect(() => {
        const fetchQuote = async () => {
            if (!selectedSlot) {
                setQuote(null);
                return;
            }

            setQuoteLoading(true);
            try {
                const res = await api.get('/bookings/quote', {
                    params: {
                        doctorId,
                        date: selectedDate,
                        type: modality,
                        start_time: typeof selectedSlot === 'string' ? `${selectedSlot}:00` : `${selectedSlot.time}:00`,
                    }
                });
                setQuote(res.data);
            } catch (error) {
                console.error('Error calculando tarifa', error);
                setQuote(null);
            } finally {
                setQuoteLoading(false);
            }
        };

        fetchQuote();
    }, [doctorId, selectedDate, selectedSlot, modality]);

    const handleBooking = async () => {
        if (!selectedSlot) return;
        if (!paymentMethod) {
            setToast({ message: 'Selecciona un método de pago antes de continuar.', type: 'error' });
            return;
        }
        try {
            await api.post('/bookings/book', {
                doctor_id:        doctorId,
                appointment_date: selectedDate,
                start_time:       typeof selectedSlot === 'string' ? `${selectedSlot}:00` : `${selectedSlot.time}:00`,
                type:             modality,
                payment_method:   paymentMethod,
            });
            setToast({ message: '¡Cita agendada con éxito! Te notificaremos cuando el médico confirme.', type: 'success' });
            setTimeout(() => navigate('/patient/appointments'), 2800);
        } catch {
            setToast({ message: 'No se pudo agendar la cita. Inténtalo de nuevo.', type: 'error' });
        }
    };

    if (loadingDoctor) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="text-center animate-pulse">
                    <div className="h-24 w-24 bg-mindpath-light dark:bg-mindpath-primary/30 rounded-full mx-auto mb-4" />
                    <Activity className="animate-spin text-mindpath-primary mx-auto" size={28} />
                    <p className="text-gray-400 dark:text-slate-500 font-bold mt-3">Cargando perfil del especialista...</p>
                </div>
            </div>
        );
    }

    if (!doctor) return null;

    const avatarSrc = doctor.profile_picture
        ? (doctor.profile_picture.startsWith('http') ? doctor.profile_picture : `${BACKEND_URL}${doctor.profile_picture}`)
        : null;

    const avgRating = parseFloat(doctor.avg_rating) || 0;

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-24">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Perfil del Doctor */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm text-center flex flex-col items-center">
                <div className="h-24 w-24 bg-mindpath-light dark:bg-mindpath-primary/30 rounded-full flex items-center justify-center text-mindpath-primary text-3xl font-bold border-4 border-white dark:border-slate-700 shadow-md overflow-hidden mb-4">
                    {avatarSrc
                        ? <img src={avatarSrc} alt="Doctor" className="h-full w-full object-cover" />
                        : doctor.full_name?.charAt(0)
                    }
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{doctor.full_name}</h2>
                <p className="text-mindpath-primary font-medium">{doctor.specialty}</p>
                <div className="flex items-center mt-2">
                    <Star size={16} className={avgRating > 0 ? 'text-yellow-400 fill-yellow-400 mr-1' : 'text-gray-300 dark:text-gray-600 mr-1'} />
                    {avgRating > 0 ? (
                        <>
                            <span className="font-bold text-gray-700 dark:text-slate-200">{avgRating.toFixed(1)}</span>
                            <span className="text-gray-400 dark:text-slate-500 text-sm ml-1">({doctor.rating_count || 0} reseñas)</span>
                        </>
                    ) : (
                        <span className="text-gray-400 dark:text-slate-500 text-sm">Sin reseñas aún</span>
                    )}
                </div>
            </div>

            {/* Modalidad y método de pago */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm">
                <h3 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">Modalidad de Atención</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <button
                        onClick={() => setModality('virtual')}
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center transition-all ${
                            modality === 'virtual'
                                ? 'border-mindpath-primary bg-mindpath-light dark:bg-mindpath-primary/30 text-mindpath-primary'
                                : 'border-gray-100 dark:border-white/10 text-gray-500 dark:text-slate-400 hover:border-gray-200 dark:hover:border-white/20'
                        }`}
                    >
                        <Video size={28} className="mb-2" />
                        <span className="font-bold text-sm">Online Mind</span>
                    </button>
                    <button
                        onClick={() => setModality('presencial')}
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center transition-all ${
                            modality === 'presencial'
                                ? 'border-mindpath-primary bg-mindpath-light dark:bg-mindpath-primary/30 text-mindpath-primary'
                                : 'border-gray-100 dark:border-white/10 text-gray-500 dark:text-slate-400 hover:border-gray-200 dark:hover:border-white/20'
                        }`}
                    >
                        <MapPin size={28} className="mb-2" />
                        <span className="font-bold text-sm">Presencial</span>
                    </button>
                </div>
                {/* Selector de método de pago */}
                <div className="mt-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-300 mb-2">Selecciona método de pago</label>
                    {Array.isArray(doctor?.payment_methods) && doctor.payment_methods.length > 0 ? (
                        <>
                        <select
                            className="w-full p-3 rounded-xl border text-sm font-bold bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-200"
                            value={paymentMethod}
                            onChange={e => setPaymentMethod(e.target.value)}
                        >
                            <option value="">Selecciona...</option>
                            {doctor.payment_methods.map(method => (
                                <option key={method.id} value={method.method_name}>
                                    {method.method_name}
                                </option>
                            ))}
                        </select>
                        {/* Mostrar detalles del método seleccionado */}
                        {doctor.payment_methods.some(m => String(m.method_name) === String(paymentMethod)) && (
                            <div className="mt-3 bg-white dark:bg-slate-800/70 rounded-xl p-3 border border-amber-100 dark:border-amber-500/20">
                                <p className="font-bold text-sm text-gray-900 dark:text-white">
                                    {doctor.payment_methods.find(m => String(m.method_name) === String(paymentMethod))?.method_name}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-slate-300 mt-1 whitespace-pre-line">
                                    {doctor.payment_methods.find(m => String(m.method_name) === String(paymentMethod))?.account_details}
                                </p>
                            </div>
                        )}
                        </>
                    ) : (
                        <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-200 text-sm font-bold">
                            Este especialista aún no tiene métodos de pago configurados. No podrás reservar hasta que los configure.
                        </div>
                    )}
                </div>
            </div>

            {/* Selector de Fecha */}
            <div className="bg-mindpath-primary dark:bg-mindpath-primary p-6 rounded-3xl shadow-premium-primary text-white">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Selecciona tu fecha</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))}
                            disabled={weekOffset === 0}
                            className={`p-2 rounded-full border border-white/10 hover:border-white/30 transition-colors ${weekOffset === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/10'}`}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={() => setWeekOffset(prev => prev + 1)}
                            className="p-2 rounded-full border border-white/10 hover:border-white/30 hover:bg-white/10 transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
                <div className="flex justify-between items-center overflow-x-auto pb-1 scrollbar-hide gap-2">
                    {next7Days.map((date, i) => {
                        const dateString = formatDateLocal(date);
                        const isSelected = selectedDate === dateString;
                        const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase();
                        const dayNum  = date.getDate();
                        return (
                            <button
                                key={i}
                                onClick={() => setSelectedDate(dateString)}
                                className={`flex flex-col items-center min-w-[56px] p-3 rounded-2xl transition-all ${
                                    isSelected ? 'bg-mindpath-primary text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <span className="text-xs font-bold mb-1">{dayName}</span>
                                <span className="text-xl font-bold">{dayNum}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Slots de tiempo */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm">
                <h3 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">Horarios Disponibles</h3>
                {loadingSlots ? (
                    <div className="flex justify-center py-6">
                        <Activity className="animate-spin text-mindpath-primary" size={28} />
                    </div>
                ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {availableSlots.map(slot => {
                            const time = typeof slot === 'string' ? slot : slot.time;
                            const isSelected = selectedSlot && (typeof selectedSlot === 'string' ? selectedSlot === time : selectedSlot.time === time);
                            return (
                                <button
                                    key={time}
                                    onClick={() => setSelectedSlot(slot)}
                                    className={`p-3 rounded-xl font-bold text-xs sm:text-sm transition-all border flex flex-col items-center justify-center ${
                                        isSelected
                                            ? 'bg-mindpath-primary border-mindpath-primary text-white shadow-md'
                                            : 'bg-gray-50 dark:bg-slate-700 border-gray-100 dark:border-white/10 text-gray-700 dark:text-slate-300 hover:border-mindpath-primary hover:text-mindpath-primary'
                                    }`}
                                >
                                    <span className="flex items-center gap-1"><Clock size={13} /> {time}</span>
                                    {typeof slot === 'object' && slot.clinic_name && (
                                        <span className={`block text-[10px] mt-1 truncate max-w-full ${isSelected ? 'text-white/80' : 'text-gray-400 dark:text-slate-400'}`}>
                                            {slot.clinic_name}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-center text-red-400 dark:text-red-400 py-6 font-medium bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-500/30">
                        {selectedDate === formatDateLocal(new Date()) 
                            ? 'No hay horarios disponibles para hoy. Las citas deben agendarse con al menos 10 minutos de anticipación. Te sugerimos agendar para el día de mañana.'
                            : 'El especialista no tiene horarios disponibles para este día.'}
                    </p>
                )}
            </div>

            {/* Resumen y botón de confirmación */}
            {selectedSlot && (
                <div className="fixed bottom-0 left-0 right-0 md:relative bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-white/10 md:border-none md:bg-transparent p-4 md:p-0 z-50">
                    <div className="bg-mindpath-light dark:bg-mindpath-primary/30 border border-mindpath-light dark:border-mindpath-primary/30 p-4 rounded-2xl mb-4">
                        <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-sm">Resumen de tu hora</h4>
                        <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-slate-300">
                            <span className="flex items-center">
                                {modality === 'virtual' ? <Video size={15} className="mr-2 text-mindpath-primary" /> : <MapPin size={15} className="mr-2 text-mindpath-primary" />}
                                {modality === 'virtual' ? 'Online Mind' : 'Presencial'}
                            </span>
                            <span className="flex items-center">
                                <CalendarIcon size={15} className="mr-2 text-mindpath-primary" />
                                {new Date(selectedDate.replace(/-/g, '\/')).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} a las {typeof selectedSlot === 'string' ? selectedSlot : selectedSlot.time}
                            </span>
                            <span className="flex items-center">
                                <span className="mr-2 text-mindpath-primary">$</span>
                                {quoteLoading ? 'Calculando tarifa...' : quote ? `${quote.price.toFixed(2)} ${quote.currency}` : 'Tarifa por confirmar'}
                            </span>
                            {modality === 'presencial' && typeof selectedSlot === 'object' && selectedSlot?.clinic_name && (
                                <span className="flex items-start">
                                    <Building2 size={15} className="mr-2 mt-0.5 text-mindpath-primary shrink-0" />
                                    <div>
                                        <p className="font-bold text-gray-800 dark:text-white">{selectedSlot.clinic_name}</p>
                                        {selectedSlot.clinic_address && <p className="text-xs text-gray-550 dark:text-slate-400">{selectedSlot.clinic_address}</p>}
                                    </div>
                                </span>
                            )}
                            {modality === 'presencial' && (
                                <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
                                    {paymentMethod === 'in_person' ? 'Pago en consultorio' : 'Pago por plataforma'}
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleBooking}
                        className="w-full bg-mindpath-primary hover:bg-mindpath-primaryHover text-white font-bold py-4 rounded-2xl text-lg shadow-xl shadow-mindpath-primary/30 transition-colors flex justify-center items-center"
                    >
                        CONFIRMAR CITA <ChevronRight size={24} className="ml-1" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default DoctorBooking;