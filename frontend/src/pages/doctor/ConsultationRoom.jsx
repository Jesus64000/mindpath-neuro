import { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../api/axiosConfig';
import { Mic, MicOff, StopCircle, BrainCircuit, User, Clock } from 'lucide-react';
import { useEffect } from 'react';

// ── Detección de soporte ────────────────────────────────────────────────────────
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

const ConsultationRoom = () => {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [appointment, setAppointment]       = useState(null);
    const [isListening, setIsListening]       = useState(false);
    const [finalText, setFinalText]           = useState('');
    const [interimText, setInterimText]       = useState('');
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [supported]                         = useState(() => !!SpeechRecognitionAPI);
    const [error, setError]                   = useState('');

    const recognitionRef = useRef(null);
    const timerRef       = useRef(null);
    const startTimeRef   = useRef(null);

    // ── Cargar datos de la cita ────────────────────────────────────────────────
    useEffect(() => {
        api.get(`/appointments/doctor/${appointmentId}/detail`)

            .then(res => setAppointment(res.data))
            .catch(() => setError('No se pudo cargar la cita.'));
    }, [appointmentId]);

    // ── Configurar Web Speech API ─────────────────────────────────────────────
    useEffect(() => {
        if (!SpeechRecognitionAPI) return;

        const rec = new SpeechRecognitionAPI();
        rec.lang = 'es-MX';
        rec.continuous = true;
        rec.interimResults = true;
        rec.maxAlternatives = 1;

        rec.onresult = (e) => {
            let interim = '';
            let final = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const transcript = e.results[i][0].transcript;
                if (e.results[i].isFinal) final += transcript + ' ';
                else interim += transcript;
            }
            if (final) setFinalText(prev => prev + final);
            setInterimText(interim);
        };

        rec.onerror = (e) => {
            if (e.error !== 'no-speech') setError(`Error de micrófono: ${e.error}`);
        };

        rec.onend = () => {
            if (rec._shouldRestart) rec.start();
        };

        recognitionRef.current = rec;
        return () => {
            rec._shouldRestart = false;
            rec.stop();
        };
    }, []);

    // ── Timer ─────────────────────────────────────────────────────────────────
    const stopTimer = () => clearInterval(timerRef.current);

    const startTimer = () => {
        startTimeRef.current = Date.now() - elapsedSeconds * 1000;
        timerRef.current = setInterval(() => {
            setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);
    };

    const formatTime = (secs) => {
        const m = String(Math.floor(secs / 60)).padStart(2, '0');
        const s = String(secs % 60).padStart(2, '0');
        return `${m}:${s}`;
    };

    useEffect(() => () => stopTimer(), []);

    // ── Controles ─────────────────────────────────────────────────────────────
    const startListening = () => {
        if (!recognitionRef.current) return;
        recognitionRef.current._shouldRestart = true;
        recognitionRef.current.start();
        setIsListening(true);
        setError('');
        startTimer();
    };

    const pauseListening = () => {
        if (!recognitionRef.current) return;
        recognitionRef.current._shouldRestart = false;
        recognitionRef.current.stop();
        setIsListening(false);
        stopTimer();
    };

    const endConsultation = () => {
        if (recognitionRef.current) {
            recognitionRef.current._shouldRestart = false;
            recognitionRef.current.stop();
        }
        stopTimer();
        const fullText = (finalText + interimText).trim();
        sessionStorage.setItem(`transcription_${appointmentId}`, fullText);
        navigate(`/doctor/wrap-up/${appointmentId}`);
    };

    // ── Render ────────────────────────────────────────────────────────────────
    if (!supported) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                    <p className="text-4xl mb-4">🚫</p>
                    <h2 className="text-xl font-bold text-white mb-2">Navegador no compatible</h2>
                    <p className="text-slate-400 text-sm">La transcripción requiere Chrome o Edge.</p>
                </div>
            </div>
        );
    }

    const wordCount = finalText.trim().split(/\s+/).filter(Boolean).length;

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col">
            {/* Header */}
            <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <BrainCircuit size={24} className="text-violet-400" />
                    <div>
                        <p className="font-bold text-white text-sm">Consulta Presencial</p>
                        {appointment && (
                            <p className="text-xs text-slate-400">
                                {appointment.patient_name || 'Paciente'} · {new Date(appointment.appointment_date + 'T00:00:00').toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {isListening && (
                        <div className="flex items-center gap-2 text-green-400 text-sm font-mono">
                            <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                            GRABANDO · {formatTime(elapsedSeconds)}
                        </div>
                    )}
                    {!isListening && elapsedSeconds > 0 && (
                        <div className="flex items-center gap-2 text-yellow-400 text-sm font-mono">
                            <Clock size={14} /> PAUSADO · {formatTime(elapsedSeconds)}
                        </div>
                    )}
                </div>
            </div>

            {/* Área principal */}
            <div className="flex flex-1 overflow-hidden">
                {/* Panel de transcripción */}
                <div className="flex-1 flex flex-col p-6 overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-semibold text-slate-300 text-sm uppercase tracking-wider">Transcripción en tiempo real</h2>
                        <span className="text-xs text-slate-500">{wordCount} palabras</span>
                    </div>
                    <div className="flex-1 bg-white/5 rounded-2xl border border-white/10 p-6 overflow-y-auto text-sm leading-relaxed">
                        {!finalText && !interimText ? (
                            <p className="text-slate-500 italic select-none">
                                {isListening ? 'Escuchando… habla claramente frente al micrófono.' : 'Pulsa el botón de micrófono para iniciar la transcripción.'}
                            </p>
                        ) : (
                            <p>
                                <span className="text-white">{finalText}</span>
                                <span className="text-slate-400 italic">{interimText}</span>
                            </p>
                        )}
                    </div>
                    {error && (
                        <div className="mt-3 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{error}</div>
                    )}
                </div>

                {/* Panel lateral */}
                <div className="w-72 border-l border-white/10 p-5 flex flex-col gap-5">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                                <User size={18} className="text-violet-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">{user?.full_name}</p>
                                <p className="text-xs text-slate-400">Médico tratante</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500">Sesión presencial — transcripción automática activa</p>
                    </div>

                    <div className="space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Controles</p>
                        {!isListening ? (
                            <button onClick={startListening}
                                className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors">
                                <Mic size={18} />
                                {elapsedSeconds === 0 ? 'Iniciar grabación' : 'Reanudar'}
                            </button>
                        ) : (
                            <button onClick={pauseListening}
                                className="flex items-center justify-center gap-2 w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl transition-colors">
                                <MicOff size={18} /> Pausar
                            </button>
                        )}
                        <button onClick={endConsultation}
                            disabled={!finalText.trim() && !interimText.trim()}
                            className="flex items-center justify-center gap-2 w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors">
                            <StopCircle size={18} /> Finalizar consulta
                        </button>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                        <p className="text-xs font-bold text-blue-400 mb-2">💡 Consejos</p>
                        <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                            <li>Habla directo al micrófono</li>
                            <li>Puedes pausar y retomar</li>
                            <li>Al finalizar se abre el editor de informe</li>
                            <li>La transcripción se precargará automáticamente</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConsultationRoom;
