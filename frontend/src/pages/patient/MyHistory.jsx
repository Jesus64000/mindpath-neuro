import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { FileText, Calendar, ChevronDown, ChevronUp, Star, Activity, BrainCircuit } from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
import { useAuthStore } from '../../store/useAuthStore';
import { PDFExportButton } from '../../components/ReportPDF';
import { BACKEND_URL } from '../../api/constants';

const StarDisplay = ({ rating }) => (
    <div className="flex items-center gap-0.5">
        {[1,2,3,4,5].map(n => (
            <Star key={n} size={14}
                className={n <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}
            />
        ))}
    </div>
);

const MyHistory = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [records, setRecords] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [attachmentsLoading, setAttachmentsLoading] = useState(false);
    const [expanded, setExpanded] = useState(null);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('history'); // 'history' | 'attachments'

    useEffect(() => {
        api.get('/patients/my-history')
            .then(res => setRecords(res.data))
            .catch(() => setError('No se pudo cargar el historial clínico.'))
            .finally(() => setLoading(false));

        setAttachmentsLoading(true);
        api.get('/patients/me/attachments')
            .then(res => setAttachments(res.data || []))
            .catch(err => console.error("Error loading attachments", err))
            .finally(() => setAttachmentsLoading(false));
    }, []);

    const toggle = (id) => setExpanded(prev => prev === id ? null : id);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-mindpath-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-mindpath-light dark:bg-mindpath-primary/30 flex items-center justify-center">
                    <Activity size={22} className="text-mindpath-primary dark:text-mindpath-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">Mi Historial Clínico</h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                        Consulta tus informes médicos y estudios anexados.
                    </p>
                </div>
            </div>

            {/* Tab switcher */}
            <div className="flex bg-gray-100 dark:bg-slate-700/60 p-1.5 rounded-2xl w-fit gap-1 mb-6">
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
                        activeTab === 'history'
                            ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                    }`}
                >
                    Mis Informes ({records.length})
                </button>
                <button
                    onClick={() => setActiveTab('attachments')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
                        activeTab === 'attachments'
                            ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                    }`}
                >
                    Mis Estudios ({attachments.length})
                </button>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-2xl p-4 text-red-700 dark:text-red-400 text-sm">
                    {error}
                </div>
            )}

            {activeTab === 'history' ? (
                <>
                    {records.length === 0 && !error && (
                        <div className="text-center py-20">
                            <BrainCircuit size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-slate-400 font-bold">Aún no tienes informes clínicos disponibles.</p>
                            <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Los informes aparecerán aquí una vez que tu médico los comparta.</p>
                        </div>
                    )}

                    <div className="space-y-3">
                        {records.map((rec) => {
                            const isOpen = expanded === rec.appointment_id;
                            const type = rec.type === 'virtual' ? '💻 Telemedicina' : '🏥 Presencial';
                            const parsedDate = rec.appointment_date 
                                ? new Date(rec.appointment_date.split('T')[0] + 'T12:00:00') 
                                : null;

                            return (
                                <div key={rec.appointment_id}
                                    className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                                    {/* Cabecera del informe */}
                                    <button
                                        onClick={() => toggle(rec.appointment_id)}
                                        className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <div className="shrink-0">
                                            <Avatar fullName={rec.doctor_name} profilePictureUrl={rec.profile_picture} size="12" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-black text-gray-900 dark:text-white text-sm">
                                                    {rec.doctor_name}
                                                </p>
                                                <span className="text-xs px-2 py-0.5 bg-mindpath-light dark:bg-mindpath-primary/40 text-mindpath-primary dark:text-mindpath-primary rounded-full font-medium">
                                                    {rec.specialty}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                                                    <Calendar size={12} />
                                                    {parsedDate ? parsedDate.toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Fecha no disponible'}
                                                </span>
                                                <span className="text-xs text-gray-400 dark:text-slate-500">{type}</span>
                                                {rec.my_rating && <StarDisplay rating={rec.my_rating} />}
                                            </div>
                                            {rec.diagnostico && !isOpen && (
                                                <p className="text-xs text-gray-600 dark:text-slate-300 mt-1 truncate">
                                                    Dx: {rec.diagnostico}
                                                </p>
                                            )}
                                        </div>
                                        {isOpen
                                            ? <ChevronUp size={18} className="text-gray-400 shrink-0" />
                                            : <ChevronDown size={18} className="text-gray-400 shrink-0" />
                                        }
                                    </button>

                                    {/* Detalle expandible */}
                                    {isOpen && (
                                        <div className="border-t border-gray-100 dark:border-white/10 p-5 space-y-4 bg-gray-50/50 dark:bg-slate-800/50">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {[
                                                        { label: 'Motivo / Síntomas',        value: rec.motivo_sintomas },
                                                        { label: 'Antecedentes',             value: rec.antecedentes },
                                                        { label: 'Hallazgos Neurológicos',   value: rec.hallazgos },
                                                        { label: 'Diagnóstico',              value: rec.diagnostico, bold: true },
                                                        { label: 'Tratamiento',              value: rec.tratamiento },
                                                        { label: 'Estudios / Observaciones', value: rec.estudios_observaciones },
                                                    ].filter(f => f.value).map(field => (
                                                        <div key={field.label}
                                                            className={`bg-white dark:bg-slate-700/60 rounded-xl p-4 border border-gray-100 dark:border-white/10 ${field.bold ? 'sm:col-span-2 border-mindpath-primary dark:border-mindpath-primary/30 bg-mindpath-light/50 dark:bg-mindpath-primary/30' : ''}`}>
                                                            <p className="text-xs font-black uppercase text-gray-400 dark:text-slate-400 mb-1">{field.label}</p>
                                                            <p className={`text-sm text-gray-800 dark:text-slate-200 leading-relaxed ${field.bold ? 'font-bold text-mindpath-primary dark:text-mindpath-primary' : ''}`}>
                                                                {field.value}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>

                                            {/* Pie con valoración y acciones */}
                                            <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
                                                <div>
                                                    {rec.my_rating ? (
                                                        <div className="flex items-center gap-2">
                                                            <StarDisplay rating={rec.my_rating} />
                                                            <span className="text-xs text-gray-500 dark:text-slate-400">
                                                                Tu valoración
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => navigate('/patient/appointments')}
                                                            className="flex items-center gap-1 text-xs text-mindpath-primary dark:text-mindpath-primary font-bold hover:underline">
                                                            <Star size={13} /> Valorar esta consulta
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                <PDFExportButton 
                                                    report={{
                                                        motivo_sintomas: rec.motivo_sintomas,
                                                        antecedentes: rec.antecedentes,
                                                        hallazgos: rec.hallazgos,
                                                        diagnostico: rec.diagnostico,
                                                        tratamiento: rec.tratamiento,
                                                        estudios_observaciones: rec.estudios_observaciones,
                                                    }}
                                                    header={{
                                                        patient_name: user?.full_name || 'Paciente',
                                                        doctor_name: rec.doctor_name,
                                                        specialty: rec.specialty,
                                                        appointment_date: rec.appointment_date,
                                                        type: rec.type,
                                                        legal_verification_code: rec.legal_verification_code,
                                                        signature_picture: rec.signature_picture,
                                                        rif: rec.rif || 'J-12345678-9',
                                                        clinic_name: rec.clinic_name || 'Mindpath Neuro'
                                                    }}
                                                    className="!bg-mindpath-primary hover:!bg-mindpath-primaryHover text-white px-4 py-2.5 rounded-xl text-xs font-black shadow-md shadow-mindpath-primary/10 transition-all shrink-0"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                <div className="space-y-3">
                    {attachmentsLoading ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mindpath-primary" />
                        </div>
                    ) : attachments.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-slate-800 border border-gray-100 dark:border-white/10 rounded-2xl p-14">
                            <BrainCircuit size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-slate-400 font-bold">No tienes estudios clínicos cargados.</p>
                            <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Los exámenes cargados por tus médicos aparecerán en esta sección.</p>
                        </div>
                    ) : (
                        attachments.map((att) => (
                            <div key={att.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-mindpath-light dark:bg-mindpath-primary/30 text-mindpath-primary p-3 rounded-2xl">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">{att.exam_name}</h4>
                                        <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">
                                            Cargado el {new Date(att.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} por {att.doctor_name}
                                        </p>
                                    </div>
                                </div>
                                <a 
                                    href={`${BACKEND_URL}${att.file_path}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="px-4 py-2.5 bg-mindpath-primary hover:bg-mindpath-primaryHover text-white font-bold rounded-xl text-xs transition-colors shadow-sm shrink-0"
                                >
                                    Ver / Descargar
                                </a>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default MyHistory;
