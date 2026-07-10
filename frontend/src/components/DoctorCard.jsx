import { Star, MapPin, Video, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Avatar from './ui/Avatar';

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

const formatDoctorName = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length <= 2) return fullName;
    if (parts.length === 3) return `${parts[0]} ${parts[1]}`;
    return `${parts[0]} ${parts[2]}`;
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
                <Avatar fullName={doctor.full_name} profilePictureUrl={doctor.profile_picture} size="16" />

                
                {/* Info Básica */}
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-mindpath-primary dark:group-hover:text-mindpath-primary transition-colors">
                        Dr(a). {formatDoctorName(doctor.full_name)}
                    </h3>
                    <p className="text-sm font-medium text-mindpath-primary dark:text-mindpath-primary">{doctor.specialty}</p>
                    <MiniStars rating={doctor.avg_rating} count={doctor.rating_count} />
                </div>
            </div>

            {/* Modalidades que atiende y Costo */}
            <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-50 dark:border-white/10">
                <div className="flex gap-2">
                    <span className="flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md">
                        <Video size={12} className="mr-1" /> Online
                    </span>
                    <span className="flex items-center text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md">
                        <MapPin size={12} className="mr-1" /> Presencial
                    </span>
                </div>
                {doctor.consultation_fee !== undefined && doctor.consultation_fee !== null && (
                    <span className="text-sm font-black text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-700/50 px-2.5 py-1 rounded-lg">
                        ${parseFloat(doctor.consultation_fee).toFixed(0)}
                    </span>
                )}
            </div>

            {/* Botón de acción */}
            <div className="mt-4 flex items-center text-sm font-bold text-mindpath-primary dark:text-mindpath-primary opacity-80 group-hover:opacity-100 transition-opacity">
                Ver perfil y agendar <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
        </div>
    );
};

export default DoctorCard;
