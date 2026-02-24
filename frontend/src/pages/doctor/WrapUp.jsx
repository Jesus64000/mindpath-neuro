import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { FileText, RefreshCw, Save, Lock, Share2, Bot, AlertTriangle } from 'lucide-react';

const WrapUp = () => {
    const { appointmentId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // 1. Texto crudo (editable: viene de la transcripción o manual)
    const [rawText, setRawText] = useState(location.state?.initialText || '');

    // 2. Informe final estructurado (generado por IA, editable)
    const [report, setReport] = useState(null);
    const [privateNotes, setPrivateNotes] = useState('');
    const [isShared, setIsShared] = useState(true);

    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Prevención de pérdida de datos
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    const generateAIReport = async () => {
        if (!rawText.trim()) return alert('El texto de la consulta está vacío. Escribe algo primero.');
        setIsGenerating(true);
        try {
            const res = await api.post('/ia/generate-report', { text: rawText });
            setReport({
                antecedentes: res.data.report.antecedentes || '',
                hallazgos: res.data.report.hallazgos || '',
                plan: res.data.report.plan || '',
            });
        } catch (error) {
            console.error('Error generando informe IA:', error);
            alert('Error al conectar con la IA. Revisa que el servidor esté activo.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!report) return alert('Debes generar el informe con IA antes de guardar.');
        setIsSaving(true);
        try {
            await api.post('/reports/wrap-up', {
                appointmentId,
                antecedentes: report.antecedentes,
                hallazgos: report.hallazgos,
                plan: report.plan,
                privateNotes,
                isShared,
            });
            alert('✅ Consulta guardada y completada exitosamente.');
            navigate('/doctor/dashboard');
        } catch (error) {
            console.error('Error al guardar:', error);
            alert('Error al guardar en la base de datos. Intenta de nuevo.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6 pb-20">
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center">
                        <FileText className="mr-3 text-mindpath-primary" />
                        Cierre de Consulta
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Revisa, corrige y firma el expediente clínico.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* ── COLUMNA IZQUIERDA: Transcripción y acción de IA ── */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-gray-700 flex items-center mb-1">
                            <Bot className="mr-2 text-mindpath-primary" />
                            1. Transcripción
                        </h3>
                        <p className="text-xs text-gray-400 mb-4">
                            Puedes editar o escribir notas manuales aquí si no usaste el micrófono.
                        </p>
                        <textarea
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                            className="w-full h-64 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-mindpath-primary"
                            placeholder="Escribe o revisa lo que capturó el micrófono..."
                        />

                        <button
                            onClick={generateAIReport}
                            disabled={isGenerating}
                            className="w-full mt-4 py-3 bg-mindpath-primary text-white font-black rounded-xl hover:bg-mindpath-primaryHover flex justify-center items-center transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {isGenerating
                                ? <><RefreshCw size={18} className="animate-spin mr-2" /> Estructurando...</>
                                : <><Bot size={18} className="mr-2" /> {report ? 'Regenerar Informe' : 'Generar Informe IA'}</>
                            }
                        </button>
                    </div>
                </div>

                {/* ── COLUMNA DERECHA: Informe editable y guardado ── */}
                <div className="lg:col-span-8 space-y-4">
                    {!report ? (
                        <div className="bg-gray-50 h-full rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-10 text-center min-h-[400px]">
                            <Bot size={52} className="text-gray-300 mb-4" />
                            <h3 className="font-bold text-gray-500 text-lg">Esperando a la Inteligencia Artificial</h3>
                            <p className="text-sm text-gray-400 mt-2">
                                Presiona <strong>"Generar Informe IA"</strong> en el panel izquierdo para estructurar la consulta.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                            {/* Aviso de responsabilidad */}
                            <div className="flex items-center bg-yellow-50 text-yellow-800 p-3 rounded-xl text-xs font-bold border border-yellow-100">
                                <AlertTriangle className="mr-2 shrink-0" size={16} />
                                Revisa y corrige el texto antes de guardar. Tú eres el responsable médico del expediente.
                            </div>

                            {/* Campos editables del informe */}
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-1">
                                        Antecedentes y Motivo de Consulta
                                    </label>
                                    <textarea
                                        value={report.antecedentes}
                                        onChange={(e) => setReport({ ...report, antecedentes: e.target.value })}
                                        className="w-full h-24 p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-mindpath-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-1">
                                        Hallazgos Neurológicos
                                    </label>
                                    <textarea
                                        value={report.hallazgos}
                                        onChange={(e) => setReport({ ...report, hallazgos: e.target.value })}
                                        className="w-full h-24 p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-mindpath-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-1">
                                        Plan Terapéutico
                                    </label>
                                    <textarea
                                        value={report.plan}
                                        onChange={(e) => setReport({ ...report, plan: e.target.value })}
                                        className="w-full h-24 p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-mindpath-primary"
                                    />
                                </div>
                            </div>

                            {/* Notas privadas + Guardado */}
                            <div className="pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Notas Privadas */}
                                <div className="bg-gray-900 p-4 rounded-2xl text-white shadow-inner">
                                    <label className="text-xs font-black text-purple-300 uppercase flex items-center mb-2">
                                        <Lock size={14} className="mr-1" /> Notas Privadas
                                    </label>
                                    <p className="text-xs text-gray-400 mb-2">Solo visibles para ti, no aparecen en el expediente compartido.</p>
                                    <textarea
                                        value={privateNotes}
                                        onChange={(e) => setPrivateNotes(e.target.value)}
                                        className="w-full h-20 p-2 bg-white/10 rounded-lg border-none text-xs text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-1 focus:ring-purple-400"
                                        placeholder="Observaciones confidenciales..."
                                    />
                                </div>

                                {/* Compartir y Guardar */}
                                <div className="flex flex-col justify-end space-y-4">
                                    <label className="flex items-center cursor-pointer bg-gray-50 p-3 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={isShared}
                                            onChange={(e) => setIsShared(e.target.checked)}
                                            className="w-4 h-4 text-mindpath-primary rounded"
                                        />
                                        <span className="ml-2 text-sm font-bold text-gray-900 flex items-center">
                                            <Share2 size={14} className="mr-1 text-green-500" />
                                            Compartir informe con el paciente
                                        </span>
                                    </label>

                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed shadow-xl"
                                    >
                                        {isSaving
                                            ? <><RefreshCw size={18} className="animate-spin mr-2" /> GUARDANDO...</>
                                            : <><Save size={18} className="mr-2" /> FIRMAR Y COMPLETAR</>
                                        }
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WrapUp;
