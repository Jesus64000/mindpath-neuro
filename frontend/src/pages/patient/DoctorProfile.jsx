import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { 
    Calendar as CalendarIcon,
    Video,
    MapPin,
    Star,
    ChevronRight,
    Award,
    GraduationCap,
    Globe,
    ShieldCheck,
    Activity,
    MessageSquare
} from 'lucide-react';

// Componente de estrellas de solo lectura
const StarDisplay = ({ rating = 0, size = 16 }) => (
    <div className="flex items-center gap-0.5">
        {[1,2,3,4,5].map(n => (
            <Star key={n} size={size}
                className={n <= Math.round(parseFloat(rating) || 0)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-gray-200 dark:text-gray-600'
                }
            />
        ))}
    </div>
);

const DoctorProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { state } = useLocation();

    // Perfil
    const [doctor, setDoctor] = useState(state?.doctor || null);
    const [loadingProfile, setLoadingProfile] = useState(!state?.doctor);

    // Ratings (el backend devuelve: avg_rating, total_ratings, reviews)
    const [ratingsData, setRatingsData] = useState({ avg_rating: 0, total_ratings: 0, reviews: [] });

    // Booking
    const formatDateLocal = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const today = useMemo(() => new Date(), []);
    const [selectedDate, setSelectedDate] = useState(formatDateLocal(new Date()));
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [modality, setModality] = useState('virtual');
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Calendario simple: próximos 7 días desde hoy
    const next7Days = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() + i);
            return d;
        });
    }, []);

    // 1. Cargar perfil
    useEffect(() => {
        if (doctor) return; // ya viene por state
        const fetchDoctor = async () => {
            try {
                const res = await api.get(`/doctors/${id}`);
                setDoctor(res.data);
            } catch (error) {
                console.error('Error cargando perfil', error);
            } finally {
                setLoadingProfile(false);
            }
        };
        fetchDoctor();
    }, [doctor, id]);

    // 1b. Cargar ratings
    useEffect(() => {
        api.get(`/ratings/doctor/${id}`)
            .then(res => setRatingsData(res.data))
            .catch(() => {});
    }, [id]);

    // 2. Cargar disponibilidad
    useEffect(() => {
        const fetchAvailability = async () => {
            setLoadingSlots(true);
            setSelectedSlot(null);
            try {
                const res = await api.get(`/bookings/availability?doctorId=${id}&date=${selectedDate}`);
                setAvailableSlots(res.data);
            } catch (error) {
                console.error('Error obteniendo horarios', error);
            } finally {
                setLoadingSlots(false);
            }
        };
        fetchAvailability();
    }, [id, selectedDate]);

    // Silenciar advertencia de 'today' no usado
    void today;

    const handleBooking = async () => {
        if (!selectedSlot) return;
        try {
            await api.post('/bookings/book', {
                doctor_id: id,
                appointment_date: selectedDate,
                start_time: `${selectedSlot}:00`,
                type: modality,
            });
            alert('¡Cita agendada con éxito!');
            navigate('/patient/appointments');
        } catch (error) {
            alert('Error al agendar la cita. Intenta de nuevo.');
            console.error(error);
        }
    };

    if (loadingProfile && !doctor) {
        return <div className="flex justify-center items-center h-[70vh]"><Activity className="animate-spin text-mindpath-primary" size={48} /></div>;
    }

    if (!doctor) {
        return <div className="text-center py-20 text-gray-500">Especialista no encontrado.</div>;
    }

    const avgRating = parseFloat(ratingsData.avg_rating) || 0;

    return (
        <div className="max-w-7xl mx-auto pb-20">
            <div className="flex flex-col lg:flex-row gap-8">
                
                {/* ⬅️ Perfil del Doctor */}
                <div className="w-full lg:w-3/5 space-y-8">
                    {/* Header del perfil */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
                        <div className="h-32 w-32 bg-mindpath-light rounded-full flex items-center justify-center text-mindpath-primary text-4xl font-bold border-4 border-white shadow-md overflow-hidden shrink-0">
                            {doctor.profile_picture ? (
                                <img src={doctor.profile_picture} alt={doctor.full_name} className="h-full w-full object-cover" />
                            ) : doctor.full_name.charAt(0)}
                        </div>
                        <div className="text-center md:text-left">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dr(a). {doctor.full_name}</h1>
                            <p className="text-lg font-medium text-mindpath-primary mt-1">{doctor.specialty}</p>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                                {/* Rating real */}
                                <span className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-slate-300">
                                    <StarDisplay rating={avgRating} size={16} />
                                    {avgRating > 0 ? (
                                        <>{avgRating.toFixed(1)} <span className="font-normal text-gray-400">({ratingsData.total_ratings} {ratingsData.total_ratings === 1 ? 'reseña' : 'reseñas'})</span></>
                                    ) : (
                                        <span className="font-normal text-gray-400">Sin reseñas aún</span>
                                    )}
                                </span>
                                <span className="flex items-center text-sm font-bold text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 rounded-md">
                                    <ShieldCheck size={16} className="mr-1" /> Licencia Verificada
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm text-center">
                            <Award size={24} className="mx-auto text-mindpath-primary mb-2" />
                            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Experiencia</p>
                            <p className="font-bold text-gray-800 dark:text-white">{doctor.experience_years ?? '+5'} años</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm text-center">
                            <Globe size={24} className="mx-auto text-mindpath-primary mb-2" />
                            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Idiomas</p>
                            <p className="font-bold text-gray-800 dark:text-white">{doctor.languages || 'Español'}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm text-center">
                            <GraduationCap size={24} className="mx-auto text-mindpath-primary mb-2" />
                            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Formación</p>
                            <p className="font-bold text-gray-800 dark:text-white text-xs mt-1">{doctor.education || 'Universidad Especializada'}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm text-center">
                            <ShieldCheck size={24} className="mx-auto text-mindpath-primary mb-2" />
                            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Colegiatura</p>
                            <p className="font-bold text-gray-800 dark:text-white text-xs mt-1">{doctor.license_number || 'N/A'}</p>
                        </div>
                    </div>

                    {/* Bio */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Acerca del especialista</h3>
                        <p className="text-gray-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                            {doctor.bio || 'Especialista comprometido con la salud mental y el bienestar integral de sus pacientes.'}
                        </p>
                    </div>

                    {/* Consultorio */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm flex items-start">
                        <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0 mr-4">
                            <MapPin size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Consultorio Presencial</h3>
                            <p className="font-medium text-gray-800 dark:text-slate-200">{doctor.clinic_name || 'Centro Médico Mindpath'}</p>
                            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">{doctor.clinic_address || 'Consultorio virtual disponible para telemedicina.'}</p>
                        </div>
                    </div>

                    {/* Sección de Reseñas */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            <MessageSquare size={20} className="text-mindpath-primary" />
                            Reseñas de Pacientes
                        </h3>
                        {ratingsData.reviews?.length > 0 ? (
                            <div className="space-y-4 mt-4">
                                {ratingsData.reviews.map((r, i) => (
                                    <div key={i} className="border-b dark:border-white/10 pb-4 last:border-0">
                                        <div className="flex items-start gap-3">
                                            <div className="h-9 w-9 rounded-full bg-mindpath-light flex items-center justify-center text-mindpath-primary font-bold text-sm shrink-0">
                                                {r.patient_name?.charAt(0) || 'P'}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-gray-800 dark:text-white text-sm">{r.patient_name || 'Paciente'}</span>
                                                    <StarDisplay rating={r.rating} size={13} />
                                                    <span className="text-xs text-gray-400">
                                                        {new Date(r.created_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                {r.comment && (
                                                    <p className="text-sm text-gray-600 dark:text-slate-400 mt-1 leading-relaxed">"{r.comment}"</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Star size={32} className="mx-auto text-gray-200 dark:text-gray-600 mb-2" />
                                <p className="text-sm text-gray-400 dark:text-slate-500">Este especialista aún no tiene reseñas.</p>
                                <p className="text-xs text-gray-300 dark:text-slate-600 mt-1">¡Sé el primero en valorar su atención!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ➡️ Booking sticky */}
                <div className="w-full lg:w-2/5">
                    <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-white/10 shadow-xl sticky top-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Agendar Consulta</h2>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <button 
                                onClick={() => setModality('virtual')}
                                className={`p-4 rounded-2xl border-2 flex flex-col items-center transition-all ${modality === 'virtual' ? 'border-mindpath-primary bg-mindpath-light text-mindpath-primary' : 'border-gray-100 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:border-gray-200'}`}
                            >
                                <Video size={24} className="mb-2" />
                                <span className="font-bold text-sm">Online Mind</span>
                            </button>
                            <button 
                                onClick={() => setModality('presencial')}
                                className={`p-4 rounded-2xl border-2 flex flex-col items-center transition-all ${modality === 'presencial' ? 'border-mindpath-primary bg-mindpath-light text-mindpath-primary' : 'border-gray-100 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:border-gray-200'}`}
                            >
                                <MapPin size={24} className="mb-2" />
                                <span className="font-bold text-sm">Presencial</span>
                            </button>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">Fecha de consulta</h3>
                            <div className="flex justify-between items-center overflow-x-auto pb-2 scrollbar-hide gap-2">
                                {next7Days.map((date, i) => {
                                    const dateString = formatDateLocal(date);
                                    const isSelected = selectedDate === dateString;
                                    const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase();
                                    const dayNum = date.getDate();

                                    return (
                                        <button 
                                            key={i}
                                            onClick={() => setSelectedDate(dateString)}
                                            className={`flex flex-col items-center min-w-[56px] p-3 rounded-2xl transition-all border ${isSelected ? 'bg-mindpath-primary border-mindpath-primary text-white shadow-md' : 'bg-gray-50 dark:bg-slate-700 border-gray-100 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:border-mindpath-primary hover:text-mindpath-primary'}`}
                                        >
                                            <span className="text-xs font-bold mb-1">{dayName}</span>
                                            <span className="text-lg font-bold">{dayNum}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">Horarios</h3>
                            {loadingSlots ? (
                                <div className="py-4 flex justify-center"><Activity size={24} className="animate-spin text-mindpath-primary"/></div>
                            ) : availableSlots.length > 0 ? (
                                <div className="grid grid-cols-3 gap-2">
                                    {availableSlots.map(time => (
                                        <button
                                            key={time}
                                            onClick={() => setSelectedSlot(time)}
                                            className={`p-2 rounded-xl font-bold text-sm transition-all border ${selectedSlot === time ? 'bg-mindpath-primary border-mindpath-primary text-white shadow-md' : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:border-mindpath-primary hover:text-mindpath-primary'}`}
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl font-medium border border-red-100 dark:border-red-500/30">Sin horarios disponibles para este día.</p>
                            )}
                        </div>

                        <div className="pt-2">
                            <button 
                                onClick={handleBooking}
                                disabled={!selectedSlot}
                                className="w-full bg-mindpath-primary hover:bg-mindpath-primaryHover disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-lg shadow-xl shadow-mindpath-primary/30 transition-all flex justify-center items-center"
                            >
                                Confirmar Cita <ChevronRight size={20} className="ml-1" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorProfile;
