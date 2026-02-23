import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { Calendar as CalendarIcon, Clock, Video, MapPin, Star, ChevronRight, ChevronLeft } from 'lucide-react';

const DoctorBooking = () => {
    const { doctorId } = useParams();
    const navigate = useNavigate();
    const { state } = useLocation(); // Recibimos datos del doctor si venimos del Dashboard
    const doctor = state?.doctor || null; // Fallback por si refresca la página

    const formatDateLocal = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const today = new Date();
    const [selectedDate, setSelectedDate] = useState(formatDateLocal(today));
    const [weekOffset, setWeekOffset] = useState(0); // Semanas desde la actual
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [modality, setModality] = useState('virtual');
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Generar semana desde lunes en adelante (7 días) con desplazamiento por semanas
    const getWeekStartingMonday = (offsetWeeks = 0) => {
        const base = new Date();
        const day = base.getDay(); // 0 domingo ... 6 sábado
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
            setSelectedSlot(null); // Reseteamos la hora si cambia el día
            try {
                const res = await api.get(`/bookings/availability?doctorId=${doctorId}&date=${selectedDate}`);
                setAvailableSlots(res.data);
            } catch (error) {
                console.error("Error obteniendo horarios", error);
            } finally {
                setLoadingSlots(false);
            }
        };
        fetchAvailability();
    }, [doctorId, selectedDate]);

    const handleBooking = async () => {
        if (!selectedSlot) return;
        try {
            await api.post('/bookings/book', {
                doctor_id: doctorId,
                appointment_date: selectedDate,
                start_time: `${selectedSlot}:00`,
                type: modality
            });
            alert('¡Cita agendada con éxito!');
            navigate('/patient/dashboard'); // O a "Mis Citas" si ya la tienes
        } catch (error) {
            alert('Error al agendar la cita. Intenta de nuevo.');
        }
    };

    if (!doctor) return <div className="p-8 text-center text-gray-500">Cargando perfil del especialista...</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
            {/* Header: Perfil del Doctor */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center flex flex-col items-center">
                <div className="h-24 w-24 bg-mindpath-light rounded-full flex items-center justify-center text-mindpath-primary text-3xl font-bold border-4 border-white shadow-md overflow-hidden mb-4">
                    {doctor.profile_picture ? (
                        <img src={doctor.profile_picture} alt="Doctor" className="h-full w-full object-cover" />
                    ) : doctor.full_name.charAt(0)}
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{doctor.full_name}</h2>
                <p className="text-mindpath-primary font-medium">{doctor.specialty}</p>
                <div className="flex items-center mt-2">
                    <Star size={16} className="text-yellow-400 fill-yellow-400 mr-1" />
                    <span className="font-bold text-gray-700">4.9</span>
                    <span className="text-gray-400 text-sm ml-1">(120 reseñas)</span>
                </div>
            </div>

            {/* Selector de Modalidad */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Modalidad de Atención</h3>
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => setModality('virtual')}
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center transition-all ${modality === 'virtual' ? 'border-mindpath-primary bg-mindpath-light text-mindpath-primary' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
                    >
                        <Video size={28} className="mb-2" />
                        <span className="font-bold text-sm">Online Mind</span>
                    </button>
                    <button 
                        onClick={() => setModality('presencial')}
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center transition-all ${modality === 'presencial' ? 'border-mindpath-primary bg-mindpath-light text-mindpath-primary' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
                    >
                        <MapPin size={28} className="mb-2" />
                        <span className="font-bold text-sm">Presencial</span>
                    </button>
                </div>
            </div>

            {/* Selector de Fecha (Calendario Horizontal) */}
            <div className="bg-mindpath-dark p-6 rounded-3xl shadow-sm text-white">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Selecciona tu fecha</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setWeekOffset((prev) => Math.max(0, prev - 1))}
                            disabled={weekOffset === 0}
                            className={`p-2 rounded-full border border-white/10 hover:border-white/30 transition-colors ${weekOffset === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/10'}`}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={() => setWeekOffset((prev) => prev + 1)}
                            className="p-2 rounded-full border border-white/10 hover:border-white/30 transition-colors hover:bg-white/10"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
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
                                className={`flex flex-col items-center min-w-[60px] p-3 rounded-2xl transition-all ${isSelected ? 'bg-mindpath-primary text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                            >
                                <span className="text-xs font-bold mb-1">{dayName}</span>
                                <span className="text-xl font-bold">{dayNum}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Selector de Horas */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Horarios Disponibles</h3>
                {loadingSlots ? (
                    <p className="text-center text-gray-400 py-6">Calculando disponibilidad...</p>
                ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                        {availableSlots.map(time => (
                            <button
                                key={time}
                                onClick={() => setSelectedSlot(time)}
                                className={`p-3 rounded-xl font-bold text-sm transition-all border ${selectedSlot === time ? 'bg-mindpath-primary border-mindpath-primary text-white shadow-md' : 'bg-gray-50 border-gray-100 text-gray-700 hover:border-mindpath-primary hover:text-mindpath-primary'}`}
                            >
                                {time}
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-red-400 py-6 font-medium">El especialista no tiene horarios disponibles para este día.</p>
                )}
            </div>

            {/* Resumen Flotante y Botón (Solo aparece si selecciona hora) */}
            {selectedSlot && (
                <div className="fixed bottom-0 left-0 right-0 md:relative bg-white border-t border-gray-200 md:border-none md:bg-transparent p-6 md:p-0 z-50">
                    <div className="bg-mindpath-light border border-violet-100 p-4 rounded-2xl mb-4 md:mb-6">
                        <h4 className="font-bold text-mindpath-dark mb-2 text-sm">Resumen de tu hora</h4>
                        <div className="flex flex-col gap-2 text-sm text-gray-600">
                            <span className="flex items-center"><Video size={16} className="mr-2 text-mindpath-primary" /> {modality === 'virtual' ? 'Online Mind' : 'Presencial'}</span>
                            <span className="flex items-center"><CalendarIcon size={16} className="mr-2 text-mindpath-primary" /> {new Date(selectedDate).toLocaleDateString('es-ES')} a las {selectedSlot}</span>
                        </div>
                    </div>
                    <button 
                        onClick={handleBooking}
                        className="w-full bg-mindpath-primary hover:bg-mindpath-primaryHover text-white font-bold py-4 rounded-2xl text-lg shadow-xl shadow-purple-500/30 transition-colors flex justify-center items-center"
                    >
                        CONTINUAR <ChevronRight size={24} className="ml-1" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default DoctorBooking;