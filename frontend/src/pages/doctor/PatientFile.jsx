import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { ClipboardList, Calendar, ChevronDown, Lock } from 'lucide-react';

const PatientFile = () => {
    const { id } = useParams(); // patient_id
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/doctors/patient/${id}`)
            .then(res => setData(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <ClipboardList className="animate-pulse text-mindpath-primary" size={40} />
            </div>
        );
    }

    if (!data) {
        return <div className="p-10 text-center text-gray-400">No se pudo cargar el expediente.</div>;
    }

    const age = data.info.date_of_birth
        ? Math.floor((Date.now() - new Date(data.info.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))
        : null;

    return (
        <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">

            {/* ── PERFIL DEL PACIENTE ───────────────────────────────── */}
            <div className="lg:col-span-4">
                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm text-center sticky top-6">
                    <div className="w-24 h-24 bg-mindpath-light rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-black text-mindpath-primary">
                        {data.info.full_name?.charAt(0)}
                    </div>
                    <h2 className="text-xl font-black text-gray-900">{data.info.full_name}</h2>
                    <p className="text-gray-400 text-sm mt-1 mb-6">{data.info.email}</p>

                    <div className="text-left space-y-3 pt-6 border-t border-dashed border-gray-100 text-sm">
                        {age !== null && (
                            <p><span className="text-gray-400">🎂 Edad:</span> <strong>{age} años</strong></p>
                        )}
                        {data.info.gender && (
                            <p><span className="text-gray-400">🩸 Género:</span> <strong>{data.info.gender}</strong></p>
                        )}
                        {data.info.phone && (
                            <p><span className="text-gray-400">📱 Teléfono:</span> <strong>{data.info.phone}</strong></p>
                        )}
                        <p>
                            <span className="text-gray-400">📋 Consultas:</span>{' '}
                            <strong>{data.history.length} completada{data.history.length !== 1 ? 's' : ''}</strong>
                        </p>
                    </div>
                </div>
            </div>

            {/* ── HISTORIAL DE CONSULTAS ────────────────────────────── */}
            <div className="lg:col-span-8 space-y-4">
                <h3 className="text-2xl font-black text-gray-900 flex items-center">
                    <ClipboardList className="mr-3 text-mindpath-primary" size={26} />
                    Historial de Consultas
                </h3>

                {data.history.length === 0 ? (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center text-gray-400">
                        No hay consultas completadas con este paciente aún.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {data.history.map((h) => (
                            <details
                                key={h.appointment_id}
                                className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden group"
                            >
                                <summary className="p-6 cursor-pointer flex justify-between items-center bg-gray-50 group-open:bg-white transition-colors list-none">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-mindpath-primary text-white p-3 rounded-xl shrink-0">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">
                                                {new Date(h.appointment_date).toLocaleDateString('es-VE', {
                                                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                                                })}
                                            </h4>
                                            <p className="text-xs text-gray-400 uppercase font-bold mt-0.5">
                                                {h.type === 'virtual' ? 'Telemedicina' : 'Presencial'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {h.diagnostico && (
                                            <span className="hidden md:inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold max-w-[180px] truncate">
                                                {h.diagnostico}
                                            </span>
                                        )}
                                        <ChevronDown className="text-gray-400 group-open:rotate-180 transition-transform shrink-0" size={20} />
                                    </div>
                                </summary>

                                {h.motivo_sintomas ? (
                                    <div className="p-6 border-t border-gray-100">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-[10px] font-black text-mindpath-primary uppercase tracking-wider mb-1">Motivo y Síntomas</p>
                                                    <p className="text-gray-700">{h.motivo_sintomas}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-mindpath-primary uppercase tracking-wider mb-1">Antecedentes</p>
                                                    <p className="text-gray-700">{h.antecedentes}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-mindpath-primary uppercase tracking-wider mb-1">Hallazgos Neurológicos</p>
                                                    <p className="text-gray-700">{h.hallazgos}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-[10px] font-black text-mindpath-primary uppercase tracking-wider mb-1">Diagnóstico</p>
                                                    <p className="font-bold text-gray-900">{h.diagnostico}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-mindpath-primary uppercase tracking-wider mb-1">Tratamiento</p>
                                                    <p className="text-gray-700 bg-blue-50 p-2 rounded-lg">{h.tratamiento}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-mindpath-primary uppercase tracking-wider mb-1">Estudios y Observaciones</p>
                                                    <p className="text-gray-700">{h.estudios_observaciones}</p>
                                                </div>

                                                {/* Notas privadas — solo el doctor las ve */}
                                                {h.private_notes && (
                                                    <div className="bg-gray-900 text-white p-4 rounded-xl mt-2">
                                                        <p className="text-[10px] font-black text-purple-300 uppercase flex items-center mb-1">
                                                            <Lock size={11} className="mr-1" /> Notas Privadas
                                                        </p>
                                                        <p className="text-gray-300 text-xs italic">{h.private_notes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-6 text-center text-gray-400 italic text-sm border-t border-gray-100">
                                        No se redactó historia clínica para esta consulta.
                                    </div>
                                )}
                            </details>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientFile;
