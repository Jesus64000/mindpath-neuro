import { Star, MapPin, Video, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Mini display de estrellas
const MiniStars = ({ rating, count }) => {
    const r = parseFloat(rating) || 0;
    return (
        <div className="flex items-center mt-1 text-xs font-bold text-gray-500">
            <Star size={14} className={r > 0 ? 'text-yellow-400 fill-yellow-400 mr-1' : 'text-gray-300 mr-1'} />
            {r > 0 ? (
                <>
                    {r.toFixed(1)} <span className="font-normal text-gray-400 ml-1">({count || 0} {count === 1 ? 'reseña' : 'reseñas'})</span>
                </>
            ) : (
                <span className="font-normal text-gray-400">Sin reseñas aún</span>
            )}
        </div>
    );
};

const DoctorCard = ({ doctor }) => {
    const navigate = useNavigate();

    return (
        <div 
            onClick={() => navigate(`/patient/doctor/${doctor.doctor_id}`, { state: { doctor } })}
            className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col h-full"
        >
            <div className="flex items-start gap-4 mb-4">
                {/* Foto del Doctor */}
                <div className="h-16 w-16 bg-mindpath-light dark:bg-slate-700 rounded-full flex items-center justify-center text-mindpath-primary dark:text-mindpath-primary text-xl font-bold border-2 border-white dark:border-slate-800 shadow-sm overflow-hidden shrink-0">
                    {doctor.profile_picture ? (
                        <img src={doctor.profile_picture} alt={doctor.full_name} className="h-full w-full object-cover" />
                    ) : (
                        doctor.full_name.charAt(0)
                    )}
                </div>
                
                {/* Info Básica */}
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-mindpath-primary dark:group-hover:text-mindpath-primary transition-colors">
                        Dr(a). {doctor.full_name.split(' ').slice(-1).join(' ')}
                    </h3>
                    <p className="text-sm font-medium text-mindpath-primary dark:text-mindpath-primary">{doctor.specialty}</p>
                    <MiniStars rating={doctor.avg_rating} count={doctor.rating_count} />
                </div>
            </div>

            {/* Modalidades que atiende */}
            <div className="flex gap-2 mt-auto pt-4 border-t border-gray-50 dark:border-white/10">
                <span className="flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md">
                    <Video size={12} className="mr-1" /> Online
                </span>
                <span className="flex items-center text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md">
                    <MapPin size={12} className="mr-1" /> Presencial
                </span>
            </div>

            {/* Botón de acción */}
            <div className="mt-4 flex items-center text-sm font-bold text-mindpath-primary dark:text-mindpath-primary opacity-80 group-hover:opacity-100 transition-opacity">
                Ver perfil y agendar <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
        </div>
    );
};

export default DoctorCard;
