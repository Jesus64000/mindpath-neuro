import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { Mic, Pause, Play, BrainCircuit, Activity, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../api/axiosConfig';

const VideoRoom = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const doctorName = user?.full_name ? `Dr(a). ${user.full_name}` : 'Dr. Especialista';

    // ── Sprint 27: Activar sala cuando el doctor entra ───────────────────────
    useEffect(() => {
        api.patch(`/appointments/${id}/doctor-ready`)
            .catch(err => console.warn('No se pudo activar sala:', err.message));
    }, [id]);

    // ── Estado de la transcripción ──────────────────────────────────────────
    const [isListening, setIsListening]   = useState(false);
    const [isPaused, setIsPaused]         = useState(false);
    const [speechSupported, setSpeechSupported] = useState(true);

    // finalTranscript: texto confirmado por el motor (no se repite)
    const [finalTranscript, setFinalTranscript] = useState('');
    // interimTranscript: palabra que está diciendo ahora (temporal, se reemplaza)
    const [interimTranscript, setInterimTranscript] = useState('');

    // Ref para que ZegoCloud (onLeaveRoom) pueda leer el transcript más reciente
    const finalTranscriptRef = useRef('');

    const recognitionRef = useRef(null);

    // Inicializar Web Speech API
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            // Bug #13 fix: avisar al doctor en vez de fallar silenciosamente
            setSpeechSupported(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous     = true;
        recognition.interimResults = true;
        recognition.lang           = 'es-VE';

        recognition.onresult = (event) => {
            let newFinal   = '';
            let newInterim = '';

            // Solo procesamos desde resultIndex (los anteriores ya fueron confirmados)
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const text = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    newFinal += text + ' ';   // Resultado confirmado → acumular
                } else {
                    newInterim += text;       // Resultado parcial → temporal
                }
            }

            if (newFinal) {
                setFinalTranscript(prev => {
                    const updated = prev + newFinal;
                    finalTranscriptRef.current = updated; // Mantener ref en sync
                    return updated;
                });
            }
            setInterimTranscript(newInterim);
        };

        recognition.onerror = (e) => {
            console.warn('SpeechRecognition error:', e.error);
            // Si pierde conexión o es abortado, simplemente reseteamos
            if (e.error === 'aborted') return;
            setIsListening(false);
            setIsPaused(false);
        };

        recognitionRef.current = recognition;
        return () => recognition.stop();
    }, []);

    // ── Controles del micrófono ─────────────────────────────────────────────
    const handleStart = () => {
        if (!recognitionRef.current) {
            return alert('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.');
        }
        recognitionRef.current.start();
        setIsListening(true);
        setIsPaused(false);
    };

    const handlePause = () => {
        recognitionRef.current.stop();
        setInterimTranscript('');
        setIsPaused(true);
    };

    const handleResume = () => {
        recognitionRef.current.start();
        setIsPaused(false);
    };

    // Finalizar: detener y navegar a WrapUp con el texto acumulado
    const navigateToWrapUp = (transcriptText) => {
        navigate(`/doctor/wrap-up/${id}`, {
            state: { initialText: transcriptText.trim() }
        });
    };

    const handleEndCall = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        navigateToWrapUp(finalTranscriptRef.current);
    };
    // handleEndCall se mantiene para ser llamado desde onLeaveRoom de ZegoCloud

    // ── ZegoCloud ──────────────────────────────────────────────────────────
    const myMeeting = async (element) => {
        if (!element) return;

        const appID        = Number(import.meta.env.VITE_ZEGO_APP_ID);
        const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
            appID, serverSecret, id, Date.now().toString(), doctorName
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zp.joinRoom({
            container: element,
            scenario: { mode: ZegoUIKitPrebuilt.OneONoneCall },
            showScreenSharingButton: false,
            showPreJoinView: false,
            onLeaveRoom: () => {
                // Al colgar desde el botón de ZegoCloud también vamos a WrapUp
                if (recognitionRef.current) recognitionRef.current.stop();
                navigateToWrapUp(finalTranscriptRef.current);
            },
        });
    };

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="flex h-screen bg-gray-900 font-sans overflow-hidden">
            {/* Video de ZegoCloud (ocupa todo el espacio izquierdo) */}
            <div className="flex-1 relative" ref={myMeeting}></div>

            {/* Panel lateral de transcripción */}
            <div className="w-80 md:w-96 bg-white border-l border-gray-200 flex flex-col shadow-2xl z-20">

                {/* Header del panel */}
                <div className="p-5 border-b border-gray-100 bg-mindpath-light/30 flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-gray-800 flex items-center">
                            <BrainCircuit size={20} className="text-mindpath-primary mr-2" />
                            Mindpath AI
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">Asistente de Transcripción</p>
                    </div>
                    {isListening && !isPaused && (
                        <div className="flex items-center text-red-500 text-xs font-bold animate-pulse bg-red-50 px-2 py-1 rounded-full">
                            <Activity size={12} className="mr-1" /> EN VIVO
                        </div>
                    )}
                    {isPaused && (
                        <div className="flex items-center text-yellow-600 text-xs font-bold bg-yellow-50 px-2 py-1 rounded-full">
                            ⏸ PAUSADO
                        </div>
                    )}
                </div>

                {/* Cuerpo del panel */}
                <div className="flex-1 p-5 flex flex-col gap-4 overflow-hidden">

                    {/* Banner Bug #13: navegador no compatible */}
                    {!speechSupported && (
                        <div className="flex items-start bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-2xl text-xs font-bold">
                            <AlertTriangle size={16} className="mr-2 shrink-0 mt-0.5 text-yellow-500" />
                            Tu navegador no soporta la transcripción de voz. Usa <strong className="mx-1">Google Chrome</strong> o <strong>Microsoft Edge</strong> para habilitarla.
                        </div>
                    )}

                    {/* Controles del micrófono */}
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                            <Mic size={15} className="mr-2 text-mindpath-primary" />
                            Transcripción en Vivo
                        </h3>

                        {!isListening ? (
                            <button
                                onClick={handleStart}
                                className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl flex items-center justify-center hover:bg-black transition-all"
                            >
                                <Mic size={16} className="mr-2" /> Iniciar Transcripción
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                {isPaused ? (
                                    <button
                                        onClick={handleResume}
                                        className="flex-1 py-2 bg-yellow-100 text-yellow-700 font-bold rounded-xl flex items-center justify-center hover:bg-yellow-200 transition-all"
                                    >
                                        <Play size={16} className="mr-1" /> Reanudar
                                    </button>
                                ) : (
                                    <button
                                        onClick={handlePause}
                                        className="w-full py-2 bg-orange-100 text-orange-700 font-bold rounded-xl flex items-center justify-center hover:bg-orange-200 transition-all"
                                    >
                                        <Pause size={16} className="mr-1" /> Pausar
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Texto transcrito */}
                    <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-100 p-4 overflow-y-auto flex flex-col">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Texto capturado</p>
                        <div className="flex-1 text-sm text-gray-700 leading-relaxed">
                            {/* Texto confirmado por el motor */}
                            <span>{finalTranscript}</span>
                            {/* Texto en proceso (atenuado) */}
                            {interimTranscript && (
                                <span className="text-gray-400 italic">{interimTranscript}</span>
                            )}
                            {/* Estado vacío */}
                            {!finalTranscript && !interimTranscript && (
                                <span className="italic text-gray-400">
                                    Presiona "Iniciar Transcripción" y comienza a hablar...
                                </span>
                            )}
                        </div>
                    </div>

                    {isListening && (
                        <p className="text-xs text-center text-gray-400 pb-1">
                            Al <strong>colgar la llamada</strong> se guardará el expediente automáticamente.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoRoom;
