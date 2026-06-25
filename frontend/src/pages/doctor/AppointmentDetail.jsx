import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import {
    ArrowLeft, Video, User, Phone, MapPin, Mail, Clock,
    Calendar, FileText, AlertCircle, Activity, ChevronDown,
    ChevronUp, CheckCircle, XCircle, Stethoscope
} from 'lucide-react';

import { BACKEND_URL } from '../../api/constants';

const genderLabel = { M: 'Masculino', F: 'Femenino', O: 'Otro' };

const parseSafeDate = (dateStr) => {
    if (!dateStr) return new Date();
    const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.includes(' ') ? dateStr.split(' ')[0] : dateStr;
    return new Date(`${datePart}T12:00:00`);
};

const statusConfig = {
    pending:   { label: 'Pendiente',  color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    confirmed: { label: 'Confirmada', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    completed: { label: 'Completada', color: 'bg-green-100 text-green-700 border-green-200' },
    cancelled: { label: 'Cancelada',  color: 'bg-red-100 text-red-700 border-red-200' }
};

const AppointmentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedHistory, setExpandedHistory] = useState(null);
    const [statusLoading, setStatusLoading] = useState(false);
    // Hooks de comprobante de pago siempre al inicio
    const [verifying, setVerifying] = useState(false);
    const [verifyMsg, setVerifyMsg] = useState('');
    const [zoomImage, setZoomImage] = useState(null);

    // Función para recargar el detalle de la cita
    const fetchDetail = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/appointments/doctor/${id}/detail`);
            setData(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'No se pudo cargar la cita.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
        // eslint-disable-next-line
    }, [id]);

    const handleStatus = async (newStatus) => {
        setStatusLoading(true);
        try {
            await api.put(`/appointments/${id}/status`, { status: newStatus });
            setData(prev => ({
                ...prev,
                appointment: { ...prev.appointment, status: newStatus }
            }));
        } catch {
            alert('No se pudo actualizar el estado.');
        } finally {
            setStatusLoading(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <Activity className="animate-spin text-mindpath-primary" size={40} />
        </div>
    );

    if (error) return (
        <div className="max-w-lg mx-auto mt-20 p-8 bg-red-50 dark:bg-red-900/20 rounded-3xl text-center">
            <AlertCircle size={40} className="mx-auto text-red-400 mb-4" />
            <p className="font-bold text-red-700 dark:text-red-400">{error}</p>
            <button onClick={() => navigate(-1)} className="mt-4 text-sm text-mindpath-primary dark:text-mindpath-primary font-bold hover:underline">
                ← Volver a la agenda
            </button>
        </div>
    );

    // Desestructuración segura para evitar errores de hooks
    const { appointment: appt, patient, history } = data || { appointment: {}, patient: {}, history: [] };

    // Aprobar o rechazar comprobante
    const handleVerifyProof = async (approved) => {
        if (!appt || !appt.appointment_id) return;
        setVerifying(true);
        setVerifyMsg('');
        try {
            await api.post(`/appointments/${appt.appointment_id}/verify-payment`, { approved });
            setVerifyMsg(approved ? 'Pago verificado correctamente.' : 'Comprobante rechazado. El paciente podrá volver a subirlo.');
            // Recargar el detalle desde el backend para reflejar cambios reales
            await fetchDetail();
        } catch (e) {
            setVerifyMsg(e.response?.data?.message || 'Error al procesar la verificación.');
        } finally {
            setVerifying(false);
        }
    };

        const renderPaymentProof = () => {
            if (!appt.payment_proof_url) return null;
            const url = appt.payment_proof_url.startsWith('http') ? appt.payment_proof_url : `${BACKEND_URL}${appt.payment_proof_url}`;
            const isPDF = url.toLowerCase().endsWith('.pdf');
            return (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 rounded-2xl p-4 my-4">
                    <p className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase mb-2">Comprobante de pago enviado por el paciente</p>
                    {appt.payment_reference && (
                        <p className="text-xs text-gray-700 dark:text-slate-300 mb-2"><b>Referencia:</b> {appt.payment_reference}</p>
                    )}
                    {isPDF ? (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-mindpath-primary underline font-bold">Ver PDF</a>
                    ) : (
                        <img 
                            src={url} 
                            alt="Comprobante de pago" 
                            className="max-w-xs rounded-xl border mt-2 cursor-zoom-in hover:opacity-90 transition-opacity" 
                            onClick={() => setZoomImage(url)} 
                        />
                    )}

                    {/* Botones de verificación solo si está pendiente */}
                    {appt.payment_status !== 'paid' && appt.status !== 'completed' && (
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => handleVerifyProof(true)}
                                disabled={verifying}
                                className="px-5 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:bg-gray-400"
                            >
                                {verifying ? 'Verificando...' : 'Aprobar pago'}
                            </button>
                            <button
                                onClick={() => handleVerifyProof(false)}
                                disabled={verifying}
                                className="px-5 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:bg-gray-400"
                            >
                                {verifying ? 'Procesando...' : 'Rechazar'}
                            </button>
                        </div>
                    )}
                    {verifyMsg && <div className="mt-2 text-sm font-bold text-mindpath-primary">{verifyMsg}</div>}
                </div>
            );
        };
    const sc = statusConfig[appt.status] || statusConfig.pending;

    const avatarSrc = patient.profile_picture
        ? `${BACKEND_URL}${patient.profile_picture}`
        : null;

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)}
                        className="p-3 bg-gray-100 dark:bg-slate-700 rounded-2xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                        <ArrowLeft size={20} className="text-gray-600 dark:text-slate-300" />
                    </button>
                    <div>
                        <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase">Cita con</p>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white">{patient.full_name}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center text-xs px-3 py-1 rounded-full border font-bold ${sc.color}`}>
                                {sc.label}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-slate-400 font-bold">
                                {appt.type === 'virtual' ? '🎥 Telemedicina' : '🏥 Presencial'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 flex-wrap">
                    {appt.status === 'pending' && (
                        <>
                            <button 
                                onClick={() => handleStatus('confirmed')} 
                                disabled={statusLoading || (appt.type === 'virtual' && appt.payment_method !== 'in_person' && appt.payment_status !== 'paid')}
                                className={`flex items-center gap-2 px-4 py-2.5 font-bold rounded-2xl transition-colors ${
                                    (appt.type === 'virtual' && appt.payment_method !== 'in_person' && appt.payment_status !== 'paid')
                                    ? 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed border border-gray-200 dark:border-slate-600'
                                    : 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 border border-green-100 dark:border-green-800'
                                }`}
                                title={appt.type === 'virtual' && appt.payment_method !== 'in_person' && appt.payment_status !== 'paid' ? 'Debes verificar el pago antes de confirmar' : 'Confirmar Cita'}
                            >
                                <CheckCircle size={18}/> Confirmar
                            </button>
                            <button onClick={() => handleStatus('cancelled')} disabled={statusLoading}
                                className="flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-bold rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-100 dark:border-red-800 transition-colors">
                                <XCircle size={18}/> Cancelar
                            </button>
                        </>
                    )}
                    {(appt.status === 'confirmed' || appt.status === 'pending') && appt.type === 'virtual' && (
                        <button 
                            onClick={() => navigate(`/doctor/video-room/${id}`)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-mindpath-primary hover:bg-mindpath-primaryHover text-white font-black rounded-2xl shadow-lg shadow-mindpath-primary/20 transition-all"
                        >
                            <Video size={20}/> INICIAR LLAMADA
                        </button>
                    )}
                    {(appt.status === 'confirmed' || appt.status === 'pending') && appt.type === 'presencial' && (
                        <button onClick={() => navigate(`/doctor/consultation/${id}`)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl shadow-lg shadow-teal-100 transition-all">
                            <Stethoscope size={20}/> INICIAR CONSULTA
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* COLUMNA IZQUIERDA: Paciente */}
                <div className="lg:col-span-2 space-y-5">

                    {/* Datos del paciente */}
                    <div className="bg-white dark:bg-slate-800 p-7 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm">
                        <h2 className="font-black text-lg text-gray-900 dark:text-white mb-5 flex items-center gap-2 border-b dark:border-white/10 pb-4">
                            <User size={18} className="text-mindpath-primary"/> Datos del Paciente
                        </h2>
                        <div className="flex items-center gap-4 mb-5">
                            {avatarSrc ? (
                                <img src={avatarSrc} alt={patient.full_name}
                                    className="w-16 h-16 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow" />
                            ) : (
                                <div className="w-16 h-16 bg-mindpath-light dark:bg-slate-700 rounded-full flex items-center justify-center text-2xl font-black text-mindpath-primary dark:text-mindpath-primary border-4 border-white dark:border-slate-800 shadow">
                                    {patient.full_name?.[0] || 'P'}
                                </div>
                            )}
                            <div>
                                <p className="font-black text-gray-900 dark:text-white text-lg">{patient.full_name}</p>
                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                    {genderLabel[patient.gender] || '—'}
                                    {patient.age ? ` • ${patient.age} años` : ''}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {patient.email && (
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 bg-gray-100 dark:bg-slate-700 rounded-xl flex items-center justify-center shrink-0">
                                        <Mail size={15} className="text-gray-500 dark:text-slate-400"/>
                                    </div>
                                    <span className="text-gray-700 dark:text-slate-300 font-medium truncate">{patient.email}</span>
                                </div>
                            )}
                            {patient.phone && (
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 bg-gray-100 dark:bg-slate-700 rounded-xl flex items-center justify-center shrink-0">
                                        <Phone size={15} className="text-gray-500 dark:text-slate-400"/>
                                    </div>
                                    <span className="text-gray-700 dark:text-slate-300 font-medium">{patient.phone}</span>
                                </div>
                            )}
                            {patient.address && (
                                <div className="flex items-start gap-3 text-sm">
                                    <div className="w-8 h-8 bg-gray-100 dark:bg-slate-700 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                                        <MapPin size={15} className="text-gray-500 dark:text-slate-400"/>
                                    </div>
                                    <span className="text-gray-700 dark:text-slate-300 font-medium">{patient.address}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Detalles de la cita */}
                    <div className="bg-white dark:bg-slate-800 p-7 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm space-y-4">
                                                {/* Comprobante de pago */}
                                                {renderPaymentProof()}
                        <h2 className="font-black text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2 border-b dark:border-white/10 pb-4">
                            <Calendar size={18} className="text-mindpath-primary"/> Detalles de la Cita
                        </h2>
                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
                                <Calendar size={15} className="text-blue-500 dark:text-blue-400"/>
                            </div>
                            <span className="font-bold text-gray-700 dark:text-slate-300">
                                {parseSafeDate(appt.appointment_date).toLocaleDateString('es-ES', {
                                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                })}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 bg-mindpath-light dark:bg-mindpath-primary/40 rounded-xl flex items-center justify-center">
                                <Clock size={15} className="text-gray-4000 dark:text-mindpath-primary"/>
                            </div>
                            <span className="font-bold text-gray-700 dark:text-slate-300">
                                {appt.start_time?.slice(0, 5)}
                                {appt.end_time ? `  ${appt.end_time.slice(0, 5)}` : ''}
                            </span>
                        </div>
                        {/* Monto y método de pago */}
                        <div className="text-xs mt-2 text-gray-700 dark:text-slate-300">
                            <b>Monto:</b> {appt.consultation_fee_snapshot ? `$${Number(appt.consultation_fee_snapshot).toFixed(2)}` : 'No definido'}<br/>
                            <b>Método de pago:</b> {appt.payment_method === 'platform' ? 'Pago por plataforma' : appt.payment_method === 'in_person' ? 'En consultorio' : (appt.payment_method || 'No definido')}
                        </div>
                        {appt.invoice_pdf && (
                            <div className="mt-3">
                                <a
                                    href={`${BACKEND_URL}${appt.invoice_pdf}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-mindpath-primary text-white text-xs font-bold rounded-xl hover:bg-mindpath-primaryHover transition-all shadow-md shadow-mindpath-primary/10"
                                >
                                    📄 Descargar Factura (Recibo)
                                </a>
                            </div>
                        )}
                        {appt.notes && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/50 p-4 rounded-2xl">
                                <p className="text-xs font-bold text-yellow-700 dark:text-yellow-500 uppercase mb-1">Notas del paciente</p>
                                <p className="text-sm text-yellow-800 dark:text-yellow-200/80">{appt.notes}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* COLUMNA DERECHA: Historial */}
                <div className="lg:col-span-3">
                    <div className="bg-white dark:bg-slate-800 p-7 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm h-full">
                        <h2 className="font-black text-lg text-gray-900 dark:text-white mb-5 flex items-center gap-2 border-b dark:border-white/10 pb-4">
                            <Stethoscope size={18} className="text-mindpath-primary"/> Historial con este Paciente
                        </h2>

                        {history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <FileText size={48} className="text-gray-200 dark:text-slate-600 mb-4" />
                                <p className="font-bold text-gray-400 dark:text-slate-400">Primera cita con este paciente</p>
                                <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">No hay historial previo.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {history.map((h, idx) => {
                                    const isOpen = expandedHistory === idx;
                                    const hsc = statusConfig[h.status] || statusConfig.completed;
                                    return (
                                        <div key={h.appt_id}
                                            className="border border-gray-100 dark:border-white/10 rounded-2xl overflow-hidden hover:border-mindpath-primary/30 transition-all">
                                            <button
                                                type="button"
                                                onClick={() => setExpandedHistory(isOpen ? null : idx)}
                                                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-mindpath-light dark:bg-slate-700/50 rounded-xl flex items-center justify-center text-xs font-black text-mindpath-primary shrink-0">
                                                        {parseSafeDate(h.appointment_date).getDate()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800 dark:text-slate-200 text-sm">
                                                            {parseSafeDate(h.appointment_date).toLocaleDateString('es-ES', {
                                                                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                                                            })}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${hsc.color}`}>
                                                                {hsc.label}
                                                            </span>
                                                            {h.diagnostico && (
                                                                <span className="text-xs text-gray-500 dark:text-slate-400 truncate max-w-[150px]">
                                                                    {h.diagnostico}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {isOpen ? <ChevronUp size={18} className="text-gray-400 shrink-0"/> : <ChevronDown size={18} className="text-gray-400 shrink-0"/>}
                                            </button>

                                            {isOpen && (
                                                <div className="px-4 pb-4 bg-gray-50/50 dark:bg-slate-700/30 space-y-3">
                                                    {h.motivo_sintomas && (
                                                        <div className="bg-white dark:bg-slate-800 rounded-xl p-3">
                                                            <p className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase mb-1">Motivo / Síntomas</p>
                                                            <p className="text-sm text-gray-700 dark:text-slate-300">{h.motivo_sintomas}</p>
                                                        </div>
                                                    )}
                                                    {h.diagnostico && (
                                                        <div className="bg-white dark:bg-slate-800 rounded-xl p-3">
                                                            <p className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase mb-1">Diagnóstico</p>
                                                            <p className="text-sm text-gray-700 dark:text-slate-300">{h.diagnostico}</p>
                                                        </div>
                                                    )}
                                                    {h.tratamiento && (
                                                        <div className="bg-white dark:bg-slate-800 rounded-xl p-3">
                                                            <p className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase mb-1">Tratamiento</p>
                                                            <p className="text-sm text-gray-700 dark:text-slate-300">{h.tratamiento}</p>
                                                        </div>
                                                    )}
                                                    {h.consultation_id && (
                                                        <button
                                                            onClick={() => navigate(`/doctor/wrap-up/${h.appt_id}`)}
                                                            className="text-xs font-bold text-mindpath-primary dark:text-mindpath-primary hover:underline flex items-center gap-1 mt-2">
                                                            <FileText size={13}/> Ver informe completo
                                                        </button>
                                                    )}
                                                    {!h.diagnostico && !h.motivo_sintomas && (
                                                        <p className="text-xs text-gray-400 dark:text-slate-500 py-2 text-center">Sin informe clínico registrado.</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {zoomImage && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out"
                    onClick={() => setZoomImage(null)}
                >
                    <div className="relative max-w-4xl w-full flex flex-col items-center">
                        <button 
                            className="absolute -top-12 right-0 text-white hover:text-gray-300 font-black text-sm bg-white/10 hover:bg-white/20 rounded-full px-4 py-2 transition-all flex items-center gap-1"
                            onClick={() => setZoomImage(null)}
                        >
                            <XCircle size={16} /> Cerrar
                        </button>
                        <img 
                            src={zoomImage} 
                            alt="Comprobante de pago ampliado" 
                            className="max-h-[80vh] max-w-full rounded-2xl object-contain border border-white/20 shadow-2xl cursor-default" 
                            onClick={(e) => e.stopPropagation()}
                        />
                        {appt.payment_reference && (
                            <p className="mt-4 text-white font-bold bg-black/60 px-4 py-2 rounded-xl text-sm" onClick={(e) => e.stopPropagation()}>
                                Referencia: {appt.payment_reference}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentDetail;
