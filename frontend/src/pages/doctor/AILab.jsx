import { useState, useRef, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { Mic, MicOff, Stethoscope, RefreshCw, FileText, CheckCircle } from 'lucide-react';

const AILab = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const recognitionRef = useRef(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'es-VE';
            recognitionRef.current.onresult = (event) => {
                let currentTranscript = '';
                for (let i = 0; i < event.results.length; i++) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setTranscript(currentTranscript);
            };
            recognitionRef.current.onerror = (event) => {
                console.error('Error en el micrófono: ', event.error);
                setIsListening(false);
            };
        } else {
            alert('Tu navegador no soporta transcripción de voz. Usa Google Chrome o Edge.');
        }
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            setTranscript('');
            setReport(null);
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const generateReport = async () => {
        if (!transcript) return alert('Primero debes grabar algo de audio.');
        setLoading(true);
        try {
            const response = await api.post('/ia/generate-report', { text: transcript });
            setReport(response.data.report);
        } catch (error) {
            console.error(error);
            alert('Error al generar el informe con la IA.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <h1 className="text-3xl font-black flex items-center gap-3">
                <Stethoscope className="text-mindpath-primary" size={36}/> Laboratorio de IA
            </h1>
            <p className="text-gray-500">Prueba la transcripción en tiempo real y la generación de informes médicos gratuitos.</p>
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Mic className={isListening ? 'text-red-500 animate-pulse' : 'text-gray-400'}/> 
                        1. Transcripción en Vivo
                    </h2>
                    <button 
                        onClick={toggleListening}
                        className={`px-6 py-3 rounded-2xl font-black text-white transition-all flex items-center gap-2 ${isListening ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200' : 'bg-gray-900 hover:bg-black'}`}
                    >
                        {isListening ? <><MicOff size={18}/> Detener Grabación</> : <><Mic size={18}/> Iniciar Grabación</>}
                    </button>
                </div>
                <div className="min-h-[150px] p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                    {transcript ? (
                        <p className="text-gray-800 leading-relaxed">{transcript}</p>
                    ) : (
                        <p className="text-gray-400 italic text-center mt-10">Presiona "Iniciar Grabación" y empieza a simular una consulta médica...</p>
                    )}
                </div>
                <button 
                    onClick={generateReport}
                    disabled={!transcript || isListening || loading}
                    className="w-full py-4 bg-mindpath-primary text-white font-black rounded-2xl disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-mindpath-primaryHover transition-all flex items-center justify-center gap-2"
                >
                    {loading ? <RefreshCw className="animate-spin"/> : <FileText />}
                    {loading ? 'ANALIZANDO CON IA...' : '2. GENERAR INFORME MÉDICO'}
                </button>
            </div>
            {report && (
                <div className="bg-mindpath-primary dark:bg-mindpath-primary p-6 sm:p-8 rounded-[2rem] shadow-premium-primary text-white animate-fade-in space-y-6">
                    <h2 className="text-2xl font-black flex items-center gap-2 text-white">
                        <CheckCircle className="text-green-400 shrink-0"/> Informe Generado por IA
                    </h2>
                    <div className="space-y-4">
                        <div className="bg-white/15 p-5 rounded-2xl border border-white/10">
                            <h3 className="text-xs font-black text-amber-300 uppercase tracking-widest mb-2">Motivo y Antecedentes</h3>
                            <p className="text-white/95 text-sm leading-relaxed">{report.antecedentes}</p>
                        </div>
                        <div className="bg-white/15 p-5 rounded-2xl border border-white/10">
                            <h3 className="text-xs font-black text-amber-300 uppercase tracking-widest mb-2">Hallazgos Neurológicos</h3>
                            <p className="text-white/95 text-sm leading-relaxed">{report.hallazgos}</p>
                        </div>
                        <div className="bg-white/15 p-5 rounded-2xl border border-white/10">
                            <h3 className="text-xs font-black text-amber-300 uppercase tracking-widest mb-2">Plan Terapéutico</h3>
                            <p className="text-white/95 text-sm leading-relaxed">{report.plan}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AILab;
