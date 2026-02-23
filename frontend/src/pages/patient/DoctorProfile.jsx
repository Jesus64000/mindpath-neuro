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
    Clock,
    ShieldCheck,
    Activity
} from 'lucide-react';

const DoctorProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { state } = useLocation();

    // Perfil
    const [doctor, setDoctor] = useState(state?.doctor || null);
    const [loadingProfile, setLoadingProfile] = useState(!state?.doctor);

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
        }
    };

    if (loadingProfile && !doctor) {
        return <div className="flex justify-center items-center h-[70vh]"><Activity className="animate-spin text-mindpath-primary" size={48} /></div>;
    }

    if (!doctor) {
        return <div className="text-center py-20 text-gray-500">Especialista no encontrado.</div>;
    }

    return (
        <div className="max-w-7xl mx-auto pb-20">
            <div className="flex flex-col lg:flex-row gap-8">
                
                {/* ⬅️ Perfil del Doctor */}
                <div className="w-full lg:w-3/5 space-y-8">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
                        <div className="h-32 w-32 bg-mindpath-light rounded-full flex items-center justify-center text-mindpath-primary text-4xl font-bold border-4 border-white shadow-md overflow-hidden shrink-0">
                            {doctor.profile_picture ? (
                                <img src={doctor.profile_picture} alt={doctor.full_name} className="h-full w-full object-cover" />
                            ) : doctor.full_name.charAt(0)}
                        </div>
                        <div className="text-center md:text-left">
                            <h1 className="text-3xl font-bold text-gray-900">Dr(a). {doctor.full_name}</h1>
                            <p className="text-lg font-medium text-mindpath-primary mt-1">{doctor.specialty}</p>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                                <span className="flex items-center text-sm font-bold text-gray-600">
                                    <Star size={16} className="text-yellow-400 fill-yellow-400 mr-1" /> 4.9 (120 reseñas)
                                </span>
                                <span className="flex items-center text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                                    <ShieldCheck size={16} className="mr-1" /> Licencia Verificada
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                            <Award size={24} className="mx-auto text-mindpath-primary mb-2" />
                            <p className="text-xs text-gray-500 font-medium">Experiencia</p>
                            <p className="font-bold text-gray-800">{doctor.experience_years ?? '+5'} años</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                            <Globe size={24} className="mx-auto text-mindpath-primary mb-2" />
                            <p className="text-xs text-gray-500 font-medium">Idiomas</p>
                            <p className="font-bold text-gray-800">{doctor.languages || 'Español'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                            <GraduationCap size={24} className="mx-auto text-mindpath-primary mb-2" />
                            <p className="text-xs text-gray-500 font-medium">Formación</p>
                            <p className="font-bold text-gray-800 text-xs mt-1">{doctor.education || 'Universidad Especializada'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                            <ShieldCheck size={24} className="mx-auto text-mindpath-primary mb-2" />
                            <p className="text-xs text-gray-500 font-medium">Colegiatura</p>
                            <p className="font-bold text-gray-800 text-xs mt-1">{doctor.license_number || 'N/A'}</p>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Acerca del especialista</h3>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                            {doctor.bio || 'Especialista comprometido con la salud mental y el bienestar integral de sus pacientes.'}
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-start">
                        <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 mr-4">
                            <MapPin size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Consultorio Presencial</h3>
                            <p className="font-medium text-gray-800">{doctor.clinic_name || 'Centro Médico Mindpath'}</p>
                            <p className="text-gray-500 text-sm mt-1">{doctor.clinic_address || 'Consultorio virtual disponible para telemedicina.'}</p>
                        </div>
                    </div>
                </div>

                {/* ➡️ Booking sticky */}
                <div className="w-full lg:w-2/5">
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-xl sticky top-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Agendar Consulta</h2>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <button 
                                onClick={() => setModality('virtual')}
                                className={`p-4 rounded-2xl border-2 flex flex-col items-center transition-all ${modality === 'virtual' ? 'border-mindpath-primary bg-mindpath-light text-mindpath-primary' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
                            >
                                <Video size={24} className="mb-2" />
                                <span className="font-bold text-sm">Online Mind</span>
                            </button>
                            <button 
                                onClick={() => setModality('presencial')}
                                className={`p-4 rounded-2xl border-2 flex flex-col items-center transition-all ${modality === 'presencial' ? 'border-mindpath-primary bg-mindpath-light text-mindpath-primary' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
                            >
                                <MapPin size={24} className="mb-2" />
                                <span className="font-bold text-sm">Presencial</span>
                            </button>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Fecha de consulta</h3>
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
                                            className={`flex flex-col items-center min-w-[56px] p-3 rounded-2xl transition-all border ${isSelected ? 'bg-mindpath-primary border-mindpath-primary text-white shadow-md' : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-mindpath-primary hover:text-mindpath-primary'}`}
                                        >
                                            <span className="text-xs font-bold mb-1">{dayName}</span>
                                            <span className="text-lg font-bold">{dayNum}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Horarios</h3>
                            {loadingSlots ? (
                                <div className="py-4 flex justify-center"><Activity size={24} className="animate-spin text-mindpath-primary"/></div>
                            ) : availableSlots.length > 0 ? (
                                <div className="grid grid-cols-3 gap-2">
                                    {availableSlots.map(time => (
                                        <button
                                            key={time}
                                            onClick={() => setSelectedSlot(time)}
                                            className={`p-2 rounded-xl font-bold text-sm transition-all border ${selectedSlot === time ? 'bg-mindpath-primary border-mindpath-primary text-white shadow-md' : 'bg-white border-gray-200 text-gray-700 hover:border-mindpath-primary hover:text-mindpath-primary'}`}
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl font-medium border border-red-100">Sin horarios disponibles para este día.</p>
                            )}
                        </div>

                        <div className="pt-2">
                            <button 
                                onClick={handleBooking}
                                disabled={!selectedSlot}
                                className="w-full bg-mindpath-primary hover:bg-mindpath-primaryHover disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-lg shadow-xl shadow-purple-500/30 transition-all flex justify-center items-center"
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
