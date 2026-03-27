import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import {
    Calendar as CalendarIcon, Clock, Video, MapPin, Activity, Stethoscope,
    AlertCircle, ChevronLeft, ChevronRight, FileText, X, Star
} from 'lucide-react';
import { BACKEND_URL } from '../../api/constants';
import Avatar from '../../components/ui/Avatar';

// ── Componente de Valoración con Estrellas ────────────────────────────────────
const StarRating = ({ value, onChange, readonly = false }) => (
    <div className="flex items-center gap-1">
        {[1,2,3,4,5].map(n => (
            <button
                key={n}
                onClick={() => !readonly && onChange(n)}
                type="button"
                disabled={readonly}
                className={`transition-transform ${!readonly ? 'hover:scale-125 cursor-pointer' : 'cursor-default'}`}
            >
                <Star
                    size={28}
                    className={n <= value
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }
                />
            </button>
        ))}
    </div>
);

const PatientAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Modal del informe
    const [selectedReport, setSelectedReport] = useState(null);
    const [isModalOpen,    setIsModalOpen]    = useState(false);

    // Modal de valoración
    const [ratingTarget, setRatingTarget]   = useState(null); // { appointmentId, doctorName }
    const [ratingValue, setRatingValue]     = useState(0);
    const [ratingComment, setRatingComment] = useState('');
    const [submittingRating, setSubmittingRating] = useState(false);
    const [ratingDone, setRatingDone]       = useState({}); // { [appointmentId]: true }

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limitPerPage = 5;

    useEffect(() => {
        const fetchAppointments = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/appointments/patient?page=${currentPage}&limit=${limitPerPage}`);
                setAppointments(response.data.data);
                setTotalPages(response.data.pagination.totalPages);
            } catch (err) {
                console.error(err);
                setError('Error al cargar tus citas médicas.');
            } finally {
                setLoading(false);
            }
        };
        fetchAppointments();
    }, [currentPage]);

    // Cargar valoraciones ya hechas al montar
    useEffect(() => {
        api.get('/ratings/my-pending').then(res => {
            // my-pending devuelve las SIN valorar; deducimos las que SÍ tiene (inversa)
            // Alternativamente marcamos las que el usuario ya valoró vía campo en cita
        }).catch(() => {});
    }, []);

    const handleJoinVideoCall = (appointmentId) => navigate(`/patient/video-room/${appointmentId}`);

    const handleViewReport = async (appointmentId) => {
        try {
            const res = await api.get(`/patients/appointments/${appointmentId}/report`);
            setSelectedReport(res.data);
            setIsModalOpen(true);
        } catch {
            alert('El informe aún no está disponible o el doctor no lo ha compartido.');
        }
    };

    const openRatingModal = (appt) => {
        setRatingTarget({ appointmentId: appt.appointment_id, doctorName: appt.doctor_name });
        setRatingValue(0);
        setRatingComment('');
    };

    const submitRating = async () => {
        if (ratingValue === 0) return;
        setSubmittingRating(true);
        try {
            await api.post('/ratings', {
                appointment_id: ratingTarget.appointmentId,
                rating: ratingValue,
                comment: ratingComment.trim() || null,
            });
            setRatingDone(prev => ({ ...prev, [ratingTarget.appointmentId]: true }));
            setRatingTarget(null);
        } catch (e) {
            alert(e.response?.data?.message || 'Error al enviar valoración.');
        } finally {
            setSubmittingRating(false);
        }
    };

    const statusConfig = {
        pending: { label: 'Esperando Confirmación', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
        confirmed: { label: 'Cita Confirmada', color: 'bg-blue-100 text-blue-700 border-blue-200' },
        completed: { label: 'Completada', color: 'bg-green-100 text-green-700 border-green-200' },
        cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-700 border-red-200' },
        emergency_reschedule: { label: 'Emergencia (Reagendar)', color: 'bg-red-600 text-white border-red-700 shadow-md shadow-red-500/20 animate-pulse' }
    };

    const isAppointmentToday = (dateString) => {
        const appointmentDate = new Date(dateString).toDateString();
        return appointmentDate === new Date().toDateString();
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mis Citas</h1>
                <p className="text-gray-500 dark:text-slate-400 mt-1">Revisa tu historial médico y próximas consultas.</p>
            </div>

            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl flex items-center">
                    <AlertCircle className="mr-2" size={20}/>{error}
                </div>
            )}

            {loading && appointments.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                    <Activity className="animate-spin text-mindpath-primary" size={40} />
                </div>
            ) : appointments.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 gap-4">
                        {appointments.map((app) => {
                            const isToday = isAppointmentToday(app.appointment_date);
                            const alreadyRated = ratingDone[app.appointment_id] || app.my_rating;
                            return (
                                <div key={app.appointment_id}
                                    className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow">

                                    {/* Doctor */}
                                    <div className="flex items-center w-full md:w-1/3">
                                        <div className="mr-4">
                                            <Avatar fullName={app.doctor_name} profilePictureUrl={app.profile_picture} size="16" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Dr(a). {app.doctor_name?.split(' ').slice(-1).join(' ')}</h3>
                                            <p className="text-sm font-medium text-mindpath-primary flex items-center">
                                                <Stethoscope size={14} className="mr-1" /> {app.specialty}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Detalles */}
                                    <div className="flex flex-col w-full md:w-1/3 space-y-2">
                                        <div className="flex items-center text-gray-700 dark:text-slate-300 font-medium">
                                            <CalendarIcon size={18} className="text-gray-400 mr-2" />
                                            {new Date(app.appointment_date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                                            <Clock size={18} className="text-gray-400 ml-3 mr-1" />
                                            {app.start_time.slice(0, 5)}
                                        </div>
                                        <div className="flex items-center text-sm font-bold text-gray-500 dark:text-slate-400">
                                            {app.type === 'virtual' ? (
                                                <><Video size={16} className="text-blue-500 mr-2" /> Telemedicina (Online)</>
                                            ) : (
                                                <><MapPin size={16} className="text-green-500 mr-2" /> Presencial</>
                                            )}
                                        </div>
                                        <div>
                                            <span className={`text-xs px-2.5 py-1.5 rounded-full border font-bold flex items-center w-fit mt-1 ${statusConfig[app.status]?.color}`}>
                                                {app.status === 'emergency_reschedule' && <AlertCircle size={14} className="mr-1.5" />}
                                                {statusConfig[app.status]?.label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Acciones */}
                                    <div className="flex w-full md:w-1/3 justify-end shrink-0 gap-2 flex-wrap">
                                        {/* Ver informe */}
                                        {app.status === 'completed' && (
                                            <button
                                                onClick={() => handleViewReport(app.appointment_id)}
                                                className="px-4 py-2.5 bg-mindpath-primary/10 text-mindpath-primary font-bold rounded-xl flex items-center hover:bg-mindpath-primary/20 transition-all text-sm">
                                                <FileText size={16} className="mr-1.5" /> Ver Informe
                                            </button>
                                        )}
                                        {/* Valorar */}
                                        {app.status === 'completed' && !alreadyRated && (
                                            <button
                                                onClick={() => openRatingModal(app)}
                                                className="px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-bold rounded-xl flex items-center hover:bg-amber-100 transition-all text-sm border border-amber-200 dark:border-amber-500/30">
                                                <Star size={16} className="mr-1.5" /> Valorar
                                            </button>
                                        )}
                                        {app.status === 'completed' && alreadyRated && (
                                            <span className="px-4 py-2.5 text-xs text-gray-400 dark:text-slate-500 font-medium flex items-center gap-1">
                                                <Star size={13} className="text-amber-400 fill-amber-400" /> Valorada
                                            </span>
                                        )}
                                        {/* Entrar a telemedicina */}
                                        {app.type === 'virtual' && app.status === 'confirmed' && (
                                            isToday ? (
                                                <button
                                                    onClick={() => handleJoinVideoCall(app.appointment_id)}
                                                    className="w-full md:w-auto px-6 py-3 bg-mindpath-primary hover:bg-mindpath-primaryHover text-white font-bold rounded-xl flex items-center justify-center transition-all shadow-md shadow-mindpath-primary/20 hover:scale-105">
                                                    <Video size={18} className="mr-2 animate-pulse" />
                                                    Entrar a Consulta
                                                </button>
                                            ) : (
                                                <button disabled className="w-full md:w-auto px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-400 font-bold rounded-xl flex items-center justify-center cursor-not-allowed border border-gray-200 dark:border-slate-600">
                                                    <Clock size={18} className="mr-2" />
                                                    Disponible el {new Date(app.appointment_date).getDate()}
                                                </button>
                                            )
                                        )}
                                        {app.status === 'pending' && <p className="text-sm text-gray-400 italic w-full text-right">Esperando confirmación...</p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center items-center mt-8 gap-4">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1 || loading}
                                className="p-2 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-mindpath-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                <ChevronLeft size={24} />
                            </button>
                            <span className="text-sm font-bold text-gray-700 dark:text-white bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                                Página {currentPage} de {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages || loading}
                                className="p-2 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-mindpath-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="bg-gray-50 dark:bg-slate-800 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-3xl p-12 text-center">
                    <CalendarIcon size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-700 dark:text-white mb-2">No tienes citas aún</h3>
                    <p className="text-gray-500 dark:text-slate-400 mb-6">Explora nuestro directorio y agenda tu primera consulta.</p>
                    <button
                        onClick={() => navigate('/patient/doctors')}
                        className="px-6 py-2.5 bg-mindpath-primary text-white font-medium rounded-xl hover:bg-mindpath-primaryHover transition-colors">
                        Buscar Especialistas
                    </button>
                </div>
            )}

            {/* ── MODAL: VER INFORME ── */}
            {isModalOpen && selectedReport && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 relative shadow-2xl" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-5 right-5 p-2 bg-gray-100 dark:bg-slate-700 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                            <X size={18} className="dark:text-white" />
                        </button>

                        <div className="border-b dark:border-white/10 pb-4 mb-6">
                            <h2 className="text-xl font-black text-mindpath-primary flex items-center">
                                <FileText className="mr-2" size={20} /> Resumen Médico
                            </h2>
                            <p className="text-gray-600 dark:text-slate-300 font-bold mt-1">Dr(a). {selectedReport.doctor_name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {selectedReport.specialty} &bull; {selectedReport.clinic_name || 'MindPath Online'} &bull;{' '}
                                {new Date(selectedReport.appointment_date).toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>
                        </div>

                        <div className="space-y-5">
                            <div className="bg-mindpath-light dark:bg-mindpath-primary/20 border border-mindpath-light dark:border-mindpath-primary/30 p-4 rounded-2xl">
                                <p className="text-[10px] font-black text-gray-4000 uppercase tracking-widest mb-1">Diagnóstico</p>
                                <p className="font-bold text-gray-900 dark:text-white">{selectedReport.diagnostico || 'No especificado'}</p>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-500/30 p-4 rounded-2xl">
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Tratamiento Indicado</p>
                                <p className="text-gray-800 dark:text-slate-200">{selectedReport.tratamiento || 'No especificado'}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-700/40 border border-gray-100 dark:border-white/10 p-4 rounded-2xl">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Estudios y Observaciones</p>
                                <p className="text-gray-700 dark:text-slate-300">{selectedReport.estudios_observaciones || 'Sin indicaciones adicionales'}</p>
                            </div>
                            <details className="border-t dark:border-white/10 pt-4">
                                <summary className="cursor-pointer text-sm font-bold text-mindpath-primary hover:underline">
                                    Ver detalles completos (motivo, antecedentes y hallazgos)
                                </summary>
                                <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-slate-300">
                                    <p><strong className="text-gray-500 dark:text-slate-400 block text-xs uppercase">Motivo y Síntomas:</strong> {selectedReport.motivo_sintomas}</p>
                                    <p><strong className="text-gray-500 dark:text-slate-400 block text-xs uppercase">Antecedentes:</strong> {selectedReport.antecedentes}</p>
                                    <p><strong className="text-gray-500 dark:text-slate-400 block text-xs uppercase">Hallazgos:</strong> {selectedReport.hallazgos}</p>
                                </div>
                            </details>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL: VALORACIÓN ── */}
            {ratingTarget && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
                        <button onClick={() => setRatingTarget(null)} className="absolute top-5 right-5 p-2 bg-gray-100 dark:bg-slate-700 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                            <X size={18} className="dark:text-white" />
                        </button>

                        <div className="text-center mb-6">
                            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Star size={26} className="text-amber-500" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">¿Cómo fue tu consulta?</h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                Con Dr(a). {ratingTarget.doctorName?.split(' ').slice(-1).join(' ')}
                            </p>
                        </div>

                        <div className="flex justify-center mb-6">
                            <StarRating value={ratingValue} onChange={setRatingValue} />
                        </div>

                        {ratingValue > 0 && (
                            <div className="mb-5">
                                <p className="text-center text-sm font-bold text-gray-600 dark:text-slate-300 mb-3">
                                    {['', '😔 Mala experiencia', '😐 Mejorable', '🙂 Buena atención', '😊 Muy satisfecho', '🌟 ¡Excelente!'][ratingValue]}
                                </p>
                                <textarea
                                    value={ratingComment}
                                    onChange={e => setRatingComment(e.target.value)}
                                    placeholder="Comentario opcional (ej: muy puntual y atento)..."
                                    rows={3}
                                    className="w-full border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-mindpath-primary transition-colors"
                                />
                            </div>
                        )}

                        <button
                            onClick={submitRating}
                            disabled={ratingValue === 0 || submittingRating}
                            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-black py-3 rounded-2xl transition-colors flex items-center justify-center gap-2">
                            <Star size={18} className="fill-white" />
                            {submittingRating ? 'Enviando...' : 'Enviar Valoración'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientAppointments;