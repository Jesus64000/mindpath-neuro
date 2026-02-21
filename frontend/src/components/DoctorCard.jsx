import { Star, Clock } from 'lucide-react';

const DoctorCard = ({ doctor }) => {
    return (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                    {/* Avatar Circular */}
                    <div className="h-16 w-16 bg-mindpath-light rounded-full flex items-center justify-center text-mindpath-primary text-xl font-bold border-2 border-white shadow-sm overflow-hidden">
                        {doctor.profile_picture ? (
                            <img src={doctor.profile_picture} alt={doctor.full_name} className="h-full w-full object-cover" />
                        ) : (
                            doctor.full_name.charAt(0)
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{doctor.full_name}</h3>
                        <p className="text-mindpath-primary font-medium text-sm">{doctor.specialty}</p>
                        <div className="flex items-center mt-1">
                            <Star size={14} className="text-yellow-400 fill-yellow-400 mr-1" />
                            <span className="text-xs font-bold text-gray-700">4.9</span>
                            <span className="text-xs text-gray-400 ml-1">(120 reseñas)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mockup de Horarios Disponibles */}
            <div className="mt-6 border-t border-gray-50 pt-4">
                <p className="text-xs font-bold text-gray-400 mb-3 tracking-wider uppercase">Horarios Disponibles Hoy</p>
                <div className="flex gap-2">
                    <span className="px-3 py-1.5 bg-gray-50 text-gray-600 text-xs rounded-lg font-medium border border-gray-100">10:00 AM</span>
                    <span className="px-3 py-1.5 bg-mindpath-light text-mindpath-primary text-xs rounded-lg font-bold border border-violet-100">01:30 PM</span>
                    <span className="px-3 py-1.5 bg-gray-50 text-gray-600 text-xs rounded-lg font-medium border border-gray-100">04:30 PM</span>
                </div>
            </div>

            <button className="w-full mt-6 bg-mindpath-primary hover:bg-mindpath-primaryHover text-white font-medium py-2.5 rounded-xl transition-colors text-sm">
                Agendar Cita
            </button>
        </div>
    );
};

export default DoctorCard;
