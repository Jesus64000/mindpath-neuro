import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import {
    FileText, Calendar, Star, ChevronDown, ChevronUp,
    Activity, BrainCircuit, Stethoscope
} from 'lucide-react';

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
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/patients/my-history')
            .then(res => setRecords(res.data))
            .catch(() => setError('No se pudo cargar el historial clínico.'))
            .finally(() => setLoading(false));
    }, []);

    const toggle = (id) => setExpanded(prev => prev === id ? null : id);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <Activity size={22} className="text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">Mi Historial Clínico</h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                        {records.length} consulta{records.length !== 1 ? 's' : ''} registrada{records.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-2xl p-4 text-red-700 dark:text-red-400 text-sm">
                    {error}
                </div>
            )}

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

                    return (
                        <div key={rec.appointment_id}
                            className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                            {/* Cabecera del informe */}
                            <button
                                onClick={() => toggle(rec.appointment_id)}
                                className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                                    <Stethoscope size={22} className="text-violet-600 dark:text-violet-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-black text-gray-900 dark:text-white text-sm">
                                            {rec.doctor_name}
                                        </p>
                                        <span className="text-xs px-2 py-0.5 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 rounded-full font-medium">
                                            {rec.specialty}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                                            <Calendar size={12} />
                                            {rec.appointment_date ? new Date(rec.appointment_date).toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Fecha no disponible'}
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
                                                    className={`bg-white dark:bg-slate-700/60 rounded-xl p-4 border border-gray-100 dark:border-white/10 ${field.bold ? 'sm:col-span-2 border-violet-200 dark:border-violet-500/30 bg-violet-50/50 dark:bg-violet-900/30' : ''}`}>
                                                    <p className="text-xs font-black uppercase text-gray-400 dark:text-slate-400 mb-1">{field.label}</p>
                                                    <p className={`text-sm text-gray-800 dark:text-slate-200 leading-relaxed ${field.bold ? 'font-bold text-violet-700 dark:text-violet-300' : ''}`}>
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
                                                    className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 font-bold hover:underline">
                                                    <Star size={13} /> Valorar esta consulta
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MyHistory;
