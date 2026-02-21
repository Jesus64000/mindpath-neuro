import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { BrainCircuit, Save, XCircle, FileText, Activity, User } from 'lucide-react';

const ReportEditor = () => {
    const { reportId } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const res = await api.get(`/consultations/report/${reportId}`);
                setReport(res.data);
            } catch (err) {
                alert("Error cargando el informe");
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [reportId]);

    const handleSave = async () => {
        // Aquí harías un PATCH para poner is_validated = true y actualizar textos si el doctor los editó.
        alert("¡Informe validado y firmado digitalmente con éxito!");
        navigate('/doctor/dashboard');
    };

    if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50"><Activity className="animate-spin text-mindpath-primary" size={40} /></div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6 py-8">
            {/* Header del Paciente */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
                <div className="flex items-center">
                    <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 mr-4">
                        <User size={30} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{report.patient_name}</h2>
                        <p className="text-sm text-gray-500 font-medium">
                            Visita: {new Date(report.appointment_date).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                        Revisión Borrador
                    </span>
                    <div className="flex items-center text-sm text-gray-500">
                        <BrainCircuit size={16} className="text-mindpath-primary mr-1" />
                        Precisión IA: {report.ai_confidence_score}%
                    </div>
                </div>
            </div>

            {/* Editor de Texto */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-mindpath-dark px-6 py-4 flex items-center justify-between">
                    <h3 className="text-white font-bold flex items-center">
                        <FileText size={18} className="mr-2 text-mindpath-primary" />
                        Informe de Consulta Neurológica
                    </h3>
                    <span className="text-xs text-gray-400">Borrador generado por IA basado en transcripción</span>
                </div>

                <div className="p-8 space-y-6">
                    {/* Campo: Antecedentes */}
                    <div>
                        <label className="flex items-center text-sm font-bold text-gray-900 mb-2">
                            <span className="bg-mindpath-light text-mindpath-primary w-6 h-6 rounded-full flex items-center justify-center mr-2">1</span>
                            Antecedentes Personales
                        </label>
                        <textarea 
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-gray-700 focus:ring-2 focus:ring-mindpath-primary outline-none min-h-[100px]"
                            value={report.background}
                            onChange={(e) => setReport({...report, background: e.target.value})}
                        />
                    </div>

                    {/* Campo: Hallazgos */}
                    <div>
                        <label className="flex items-center text-sm font-bold text-gray-900 mb-2">
                            <span className="bg-mindpath-light text-mindpath-primary w-6 h-6 rounded-full flex items-center justify-center mr-2">2</span>
                            Hallazgos Neurológicos
                        </label>
                        <textarea 
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-gray-700 focus:ring-2 focus:ring-mindpath-primary outline-none min-h-[100px]"
                            value={report.neurological_findings}
                            onChange={(e) => setReport({...report, neurological_findings: e.target.value})}
                        />
                    </div>

                    {/* Campo: Plan Terapéutico */}
                    <div>
                        <label className="flex items-center text-sm font-bold text-gray-900 mb-2">
                            <span className="bg-mindpath-light text-mindpath-primary w-6 h-6 rounded-full flex items-center justify-center mr-2">3</span>
                            Plan Terapéutico
                        </label>
                        <div className="relative">
                            <textarea 
                                className="w-full bg-violet-50/50 border border-violet-200 rounded-2xl p-4 text-gray-700 focus:ring-2 focus:ring-mindpath-primary outline-none min-h-[100px]"
                                value={report.treatment_plan}
                                onChange={(e) => setReport({...report, treatment_plan: e.target.value})}
                            />
                            {/* Alerta de IA según PDF */}
                            <div className="absolute top-4 right-4 bg-white p-3 rounded-xl shadow-sm border border-gray-100 max-w-[200px]">
                                <div className="flex items-center text-mindpath-primary text-xs font-bold mb-1">
                                    <BrainCircuit size={14} className="mr-1" /> Nota de IA
                                </div>
                                <p className="text-[10px] text-gray-500 leading-tight">
                                    La IA ha marcado la dosis de medicación en el Plan Terapéutico para revisión manual.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer de Acciones */}
                <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex justify-between items-center">
                    <button className="text-gray-500 hover:text-red-500 font-medium flex items-center text-sm transition-colors">
                        <XCircle size={18} className="mr-1" /> Descartar Cambios
                    </button>
                    <div className="flex gap-3">
                        <button className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium rounded-xl transition-colors text-sm shadow-sm">
                            Guardar Borrador
                        </button>
                        <button onClick={handleSave} className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl flex items-center transition-colors text-sm shadow-sm shadow-green-500/20">
                            <Save size={18} className="mr-2" /> VALIDAR Y GUARDAR
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportEditor;
