import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import {
    Calendar as CalendarIcon, Clock, Video, MapPin, Activity, Stethoscope,
    AlertCircle, ChevronLeft, ChevronRight, FileText, X, Star
} from 'lucide-react';
import { BACKEND_URL } from '../../api/constants';
import Avatar from '../../components/ui/Avatar';
import UploadProofModal from '../../components/UploadProofModal';

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

    // Modal de comprobante de pago
    const [proofModal, setProofModal] = useState({ open: false, appointmentId: null });
    
    // Refrescar citas tras subir comprobante
    const handleProofSuccess = () => {
        setProofModal({ open: false, appointmentId: null });
        fetchAppointments();
    };

    // Modal del informe
    const [selectedReport, setSelectedReport] = useState(null);
    const [isModalOpen,    setIsModalOpen]    = useState(false);

    // Modal de valoración
    const [ratingTarget, setRatingTarget]   = useState(null); // { appointmentId, doctorName }
    const [ratingValue, setRatingValue]     = useState(0);
    const [ratingComment, setRatingComment] = useState('');
    const [submittingRating, setSubmittingRating] = useState(false);
    const [ratingDone, setRatingDone]       = useState({}); // { [appointmentId]: true }

    // Filtros
    const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'completed', 'cancelled'
    const [filterType, setFilterType] = useState('all'); // 'all', 'virtual', 'presencial'

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            // Obtenemos un límite generoso para manejar localmente las pestañas
            const response = await api.get('/appointments/patient?limit=100');
            setAppointments(response.data.data);
        } catch (err) {
            console.error(err);
            setError('Error al cargar tus citas médicas.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const handleCancelAppointment = async (id) => {
        if (!window.confirm("¿Estás seguro de que deseas cancelar esta cita?")) return;
        try {
            await api.put(`/patients/appointments/${id}/cancel`);
            alert("Cita cancelada exitosamente.");
            fetchAppointments(); // Recargar la lista
        } catch (error) {
            alert(error.response?.data?.message || "Error al cancelar la cita.");
        }
    };

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
        confirmed: { label: 'Cita Confirmada', color: 'bg-mindpath-light dark:bg-mindpath-primary/20 text-mindpath-primary dark:text-mindpath-primary border-mindpath-primary/30' },
        completed: { label: 'Completada', color: 'bg-green-100 text-green-700 border-green-200' },
        cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-700 border-red-200' },
        emergency_reschedule: { label: 'Emergencia (Reagendar)', color: 'bg-red-600 text-white border-red-700 shadow-md shadow-red-500/20 animate-pulse' }
    };

    const isAppointmentToday = (dateString) => {
        const appointmentDate = new Date(dateString).toDateString();
        return appointmentDate === new Date().toDateString();
    };

    // ── LÓGICA DE FILTRADO MAESTRO ──
    const filteredAppointments = appointments.filter(app => {
        // 1. Filtro por Pestaña (Tab)
        const isUpcoming = ['scheduled', 'pending', 'confirmed', 'emergency_reschedule'].includes(app.status);
        const isCompleted = app.status === 'completed';
        const isCancelled = app.status === 'cancelled';

        let matchesTab = false;
        if (activeTab === 'upcoming') matchesTab = isUpcoming;
        if (activeTab === 'completed') matchesTab = isCompleted;
        if (activeTab === 'cancelled') matchesTab = isCancelled;

        // 2. Filtro por Modalidad/Tipo
        let matchesType = filterType === 'all' ? true : app.type === filterType;

        return matchesTab && matchesType;
    });

    return (
        <div className="p-6 max-w-5xl mx-auto pb-12">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Mis Citas</h1>
            <p className="text-gray-500 dark:text-slate-400 mb-8">Revisa tu historial médico y gestiona tus consultas.</p>

            {error && (
                <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl flex items-center">
                    <AlertCircle className="mr-2" size={20}/>{error}
                </div>
            )}

            {/* PESTAÑAS (TABS) */}
            <div className="flex space-x-4 border-b border-gray-200 dark:border-slate-700 mb-6 w-full overflow-x-auto">
                {['upcoming', 'completed', 'cancelled'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 px-4 text-sm whitespace-nowrap font-semibold transition-colors ${
                            activeTab === tab 
                            ? 'border-b-2 border-mindpath-primary text-mindpath-primary' 
                            : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                        {tab === 'upcoming' && 'Próximas y Pendientes'}
                        {tab === 'completed' && 'Completadas e Historial'}
                        {tab === 'cancelled' && 'Canceladas y Reasignadas'}
                    </button>
                ))}
            </div>

            {/* FILTROS RÁPIDOS (PÍLDORAS) */}
            <div className="flex space-x-3 mb-6 w-full overflow-x-auto pb-2">
                {['all', 'virtual', 'presencial'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-5 py-2 whitespace-nowrap rounded-full text-xs font-bold transition-all ${
                            filterType === type
                            ? 'bg-mindpath-primary text-white shadow-md shadow-mindpath-primary/30'
                            : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                        }`}
                    >
                        {type === 'all' && 'Todas mis citas'}
                        {type === 'virtual' && '🎥 Solo Telemedicina'}
                        {type === 'presencial' && '🏥 Solo Presencial'}
                    </button>
                ))}
            </div>

            {/* LISTA DE TARJETAS */}
            {loading && appointments.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                    <Activity className="animate-spin text-mindpath-primary" size={40} />
                </div>
            ) : filteredAppointments.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 dark:bg-slate-800/50 rounded-[2rem] border border-dashed border-gray-200 dark:border-slate-700">
                    <CalendarIcon size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-xl font-bold text-gray-700 dark:text-white mb-2">No tienes citas en esta categoría</h3>
                    <p className="text-gray-500 dark:text-slate-400 mb-6">Explora tus otras listas o agenda tu próxima consulta.</p>
                    <button
                        onClick={() => navigate('/patient/doctors')}
                        className="px-6 py-2.5 bg-mindpath-primary text-white font-medium rounded-xl hover:bg-mindpath-primaryHover transition-colors">
                        Buscar Especialistas
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredAppointments.map(app => {
                        const isToday = isAppointmentToday(app.appointment_date);
                        const alreadyRated = ratingDone[app.appointment_id] || app.my_rating;
                        const sc = statusConfig[app.status] || statusConfig.pending;

                        return (
                            <div key={app.appointment_id} className="flex flex-col md:flex-row items-center justify-between p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700/50 hover:shadow-md transition-all gap-6">
                                
                                {/* Info del Doctor */}
                                <div className="flex items-center space-x-4 w-full md:w-1/3">
                                    <Avatar fullName={app.doctor_name} profilePictureUrl={app.profile_picture} size="16" />
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">Dr(a). {app.doctor_name?.split(' ').slice(-1).join(' ')}</h3>
                                        <p className="text-sm font-medium flex items-center text-mindpath-primary">
                                            <Stethoscope size={14} className="mr-1" /> {app.specialty}
                                        </p>
                                    </div>
                                </div>

                                {/* Info de la Cita */}
                                <div className="w-full md:w-1/3">
                                    <div className="flex items-center text-gray-700 dark:text-slate-300 font-medium mb-1.5">
                                        <CalendarIcon size={16} className="text-gray-400 mr-2" />
                                        {new Date(app.appointment_date).toLocaleDateString()} 
                                        <Clock size={16} className="text-gray-400 ml-3 mr-1.5" />
                                        {app.start_time.slice(0, 5)}
                                    </div>
                                    <p className="text-sm font-bold text-gray-500 dark:text-slate-400 flex items-center">
                                        {app.type === 'virtual' ? <><Video size={16} className="text-blue-500 mr-2" /> Telemedicina (Online)</> : <><MapPin size={16} className="text-green-500 mr-2" /> Presencial</>}
                                    </p>
                                    {/* Monto y método de pago */}
                                    <div className="text-xs mt-2 text-gray-700 dark:text-slate-300">
                                        <b>Monto:</b> {app.consultation_fee_snapshot ? `$${Number(app.consultation_fee_snapshot).toFixed(2)}` : 'No definido'}<br/>
                                        <b>Método de pago:</b> {app.payment_method === 'platform' ? 'Pago por plataforma' : app.payment_method === 'in_person' ? 'En consultorio' : (app.payment_method || 'No definido')}<br/>
                                        <b>Estatus de pago:</b> {{
                                            paid: '✅ Pagado',
                                            pending: '⏳ Pendiente',
                                            unpaid: '❌ Sin pagar',
                                            verified: '✅ Verificado',
                                        }[app.payment_status] || (app.payment_status || 'No definido')}
                                    </div>
                                    <span className={`inline-flex items-center mt-2.5 px-2.5 py-1 text-xs font-bold rounded-lg border flex-shrink-0 w-fit ${sc.color}`}>
                                        {app.status === 'emergency_reschedule' && <AlertCircle size={14} className="mr-1.5" />}
                                        {sc.label}
                                    </span>
                                </div>

                                {/* BOTONES DINÁMICOS POR PESTAÑA */}
                                <div className="w-full md:w-1/3 flex flex-wrap gap-2 md:justify-end">
                                    {/* Botón para subir comprobante de pago */}
                                    {activeTab === 'upcoming' && (app.status === 'pending' || app.status === 'scheduled') && !app.payment_proof_url && (
                                        <button
                                            onClick={() => setProofModal({ open: true, appointmentId: app.appointment_id })}
                                            className="w-full md:w-auto px-6 py-2.5 text-sm bg-mindpath-primary text-white font-bold rounded-xl hover:bg-mindpath-primaryHover transition flex items-center justify-center"
                                        >
                                            Subir comprobante de pago
                                        </button>
                                    )}
                                                {/* MODAL: SUBIR COMPROBANTE DE PAGO */}
                                                <UploadProofModal
                                                    isOpen={proofModal.open}
                                                    onClose={() => setProofModal({ open: false, appointmentId: null })}
                                                    onSuccess={handleProofSuccess}
                                                    appointment={appointments.find(a => a.appointment_id === proofModal.appointmentId) || null}
                                                />
                                    {activeTab === 'upcoming' && (
                                        <>
                                            {app.type === 'virtual' && app.status === 'confirmed' && (
                                                (() => {
                                                    const canJoin = (isToday || app.doctor_ready) && app.payment_status === 'paid';
                                                    const formattedDate = new Date(app.appointment_date).toLocaleDateString('es-ES');
                                                    return (
                                                        <button 
                                                            onClick={() => handleJoinVideoCall(app.appointment_id)}
                                                            disabled={!canJoin}
                                                            className={`w-full md:w-auto px-6 py-2.5 text-sm font-bold rounded-xl flex items-center justify-center transition-all ${
                                                                canJoin 
                                                                ? 'bg-mindpath-primary hover:bg-mindpath-primaryHover text-white shadow-md' 
                                                                : 'bg-gray-100 dark:bg-slate-700 text-gray-400 cursor-not-allowed border border-gray-200 dark:border-slate-600'
                                                            }`}
                                                        >
                                                            <Video size={16} className="mr-2" />
                                                            {app.payment_status !== 'paid' 
                                                                ? 'Esperando Confirmación Pago'
                                                                : app.doctor_ready 
                                                                    ? 'Entrar (Doctor en sala)' 
                                                                    : isToday 
                                                                        ? 'Entrar a Consulta' 
                                                                        : `Disponible: ${formattedDate}`
                                                            }
                                                        </button>
                                                    );
                                                })()
                                            )}
                                            {app.type === 'presencial' && app.status === 'confirmed' && (
                                                 <button className="w-full md:w-auto px-6 py-2.5 text-sm bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition flex items-center justify-center">
                                                    <MapPin size={16} className="mr-2" /> Ver Ubicación
                                                </button>
                                            )}
                                            
                                            {/* Cancelación o Reagendamiento */}
                                            {(app.status === 'pending' || app.status === 'scheduled' || app.status === 'confirmed' || app.status === 'emergency_reschedule') && (
                                                <button 
                                                    onClick={() => handleCancelAppointment(app.appointment_id)}
                                                    className="w-full md:w-auto px-6 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition font-bold"
                                                >
                                                    {app.status === 'emergency_reschedule' ? 'Eliminar y Reagendar' : 'Cancelar Cita'}
                                                </button>
                                            )}
                                        </>
                                    )}

                                    {activeTab === 'completed' && (
                                        <>
                                            <button 
                                                onClick={() => handleViewReport(app.appointment_id)}
                                                className="w-full md:w-auto px-6 py-2.5 text-sm bg-mindpath-light/50 dark:bg-mindpath-primary/10 text-mindpath-primary font-bold rounded-xl hover:bg-mindpath-light dark:hover:bg-mindpath-primary/20 transition flex items-center justify-center"
                                            >
                                                <FileText size={16} className="mr-2" /> Ver Informe
                                            </button>
                                            {!alreadyRated ? (
                                                <button 
                                                    onClick={() => openRatingModal(app)}
                                                    className="w-full md:w-auto px-6 py-2.5 text-sm text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 rounded-xl transition flex items-center justify-center"
                                                >
                                                    <Star size={16} className="mr-2" /> Calificar
                                                </button>
                                            ) : (
                                                <span className="px-4 py-2.5 text-xs text-gray-400 dark:text-slate-500 font-medium flex items-center justify-center gap-1">
                                                    <Star size={13} className="text-amber-400 fill-amber-400" /> Valorada
                                                </span>
                                            )}
                                            {app.invoice_pdf && (
                                                <a
                                                    href={`${BACKEND_URL}${app.invoice_pdf}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full md:w-auto px-6 py-2.5 text-sm bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-700/40 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition flex items-center justify-center gap-2"
                                                >
                                                    📄 Descargar Factura
                                                </a>
                                            )}
                                        </>
                                    )}

                                    {activeTab === 'cancelled' && (
                                        <button 
                                            onClick={() => navigate(`/patient/doctor/${app.doctor_id}`)}
                                            className="w-full md:w-auto px-6 py-2.5 text-sm border-2 border-mindpath-primary text-mindpath-primary font-bold rounded-xl hover:bg-mindpath-light/50 dark:hover:bg-mindpath-primary/10 transition flex items-center justify-center"
                                        >
                                            <CalendarIcon size={16} className="mr-2" /> Volver a Agendar
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
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
                            <div className="bg-mindpath-light dark:bg-mindpath-primary/20 border border-mindpath-light dark:border-mindpath-primary/30 p-4 rounded-2xl">
                                <p className="text-[10px] font-black text-mindpath-primary dark:text-mindpath-primary uppercase tracking-widest mb-1">Tratamiento Indicado</p>
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