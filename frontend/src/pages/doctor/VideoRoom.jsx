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
    const joinedRef = useRef(false);
    const hasJoinedRef = useRef(false);
    const [isJoining, setIsJoining] = useState(false);
    const [connectionError, setConnectionError] = useState(false);
    const [showTranscript, setShowTranscript] = useState(true);

    const myMeeting = async (element) => {
        if (!element || joinedRef.current) return;

        const appID        = Number(import.meta.env.VITE_ZEGO_APP_ID);
        const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;

        if (!appID || isNaN(appID) || !serverSecret || serverSecret.includes('YOUR') || serverSecret.includes('_AQUI')) {
            console.error('Faltan credenciales válidas de ZegoCloud.');
            setConnectionError(true);
            return;
        }

        joinedRef.current = true;
        setIsJoining(true);

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
            appID, serverSecret, id, Date.now().toString(), doctorName
        );

        // Si se trabó y no conectó en 5 segundos, forzamos recarga
        const reloadTimeout = setTimeout(() => {
            console.warn('ZEGOCLOUD tardó demasiado, forzando recarga...');
            window.location.reload();
        }, 5000);

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zp.joinRoom({
            container: element,
            scenario: { mode: ZegoUIKitPrebuilt.OneONoneCall },
            showScreenSharingButton: false,
            showPreJoinView: false,
            onJoinRoom: () => {
                clearTimeout(reloadTimeout);
                setIsJoining(false);
                hasJoinedRef.current = true; // La llamada realmente comenzó
            },
            onLeaveRoom: () => {
                if (recognitionRef.current) recognitionRef.current.stop();
                if (hasJoinedRef.current) {
                    navigateToWrapUp(finalTranscriptRef.current);
                } else {
                    setConnectionError(true);
                }
            },
        });
    };

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col lg:flex-row w-full h-[100dvh] bg-gray-900 dark:bg-black font-sans overflow-hidden">
            {/* Video de ZegoCloud (ocupa todo el espacio izquierdo/superior) */}
            <div className={`flex-1 relative bg-gray-900 dark:bg-black flex items-center justify-center ${showTranscript ? 'h-[45dvh] lg:h-full' : 'h-[100dvh]'}`}>
                {connectionError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 text-white p-6 z-30">
                        <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/10 shadow-2xl text-center">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                                <AlertTriangle className="text-red-500" size={32} />
                            </div>
                            <h2 className="text-2xl font-black mb-3">Error de Telemedicina</h2>
                            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                                No se pudo establecer la conexión de video. Esto ocurre típicamente por credenciales de ZegoCloud faltantes o erróneas en las variables de entorno de producción.
                            </p>
                            
                            <div className="bg-black/40 rounded-2xl p-4 text-left mb-6 border border-white/5 text-xs font-mono space-y-2 text-gray-400">
                                <p className="font-bold text-white mb-1">Diagnóstico:</p>
                                <p>• AppID: {import.meta.env.VITE_ZEGO_APP_ID ? `Configurado (${import.meta.env.VITE_ZEGO_APP_ID})` : 'Falta (VITE_ZEGO_APP_ID)'}</p>
                                <p>• Secret: {import.meta.env.VITE_ZEGO_SERVER_SECRET ? 'Configurado' : 'Falta (VITE_ZEGO_SERVER_SECRET)'}</p>
                                <p>• Causa Común: Credenciales no añadidas en el dashboard de Vercel/Railway.</p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={() => window.location.reload()}
                                    className="w-full py-3 bg-mindpath-primary hover:bg-mindpath-primaryHover text-white font-bold rounded-xl transition-all shadow-lg shadow-mindpath-primary/20"
                                >
                                    Reintentar Conexión
                                </button>
                                <button 
                                    onClick={handleEndCall}
                                    className="w-full py-3 bg-transparent hover:bg-white/5 text-gray-300 hover:text-white font-bold rounded-xl transition-all border border-white/10"
                                >
                                    Ir a Transcripción Manual
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {isJoining && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10 text-white">
                                <Activity size={40} className="animate-spin text-mindpath-primary mb-4" />
                                <p className="font-bold">Conectando a la sala de espera...</p>
                                <p className="text-sm text-gray-400 mt-2">Si demora más de 5 segundos, se recargará automáticamente.</p>
                            </div>
                        )}
                        <div className="w-full h-full" ref={myMeeting}></div>
                        
                        {/* Botón flotante premium para alternar panel de transcripción */}
                        <button
                            onClick={() => setShowTranscript(prev => !prev)}
                            className="absolute top-4 right-4 z-30 p-3 bg-gray-900/80 hover:bg-gray-800 text-white rounded-2xl border border-white/15 backdrop-blur-md shadow-lg transition-all flex items-center gap-2 text-xs font-bold font-sans"
                        >
                            <BrainCircuit size={16} className={showTranscript ? "text-mindpath-primary" : "text-white"} />
                            {showTranscript ? "Ocultar IA" : "Mostrar Asistente IA"}
                        </button>
                    </>
                )}
            </div>

            {/* Panel lateral de transcripción */}
            {showTranscript && (
                <div className="w-full lg:w-96 h-[55dvh] lg:h-full bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-white/10 flex flex-col shadow-2xl z-20">

                    {/* Header del panel */}
                    <div className="p-5 border-b border-gray-100 dark:border-white/10 bg-mindpath-light/30 dark:bg-mindpath-primary/10 flex items-center justify-between">
                        <div>
                            <h2 className="font-bold text-gray-800 dark:text-white flex items-center">
                                <BrainCircuit size={20} className="text-mindpath-primary mr-2" />
                                Mindpath AI
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Asistente de Transcripción</p>
                        </div>
                        {isListening && !isPaused && (
                            <div className="flex items-center text-red-500 dark:text-red-400 text-xs font-bold animate-pulse bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-full">
                                <Activity size={12} className="mr-1" /> EN VIVO
                            </div>
                        )}
                        {isPaused && (
                            <div className="flex items-center text-yellow-600 dark:text-yellow-400 text-xs font-bold bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 rounded-full">
                                <Pause size={12} className="mr-1" /> PAUSADO
                            </div>
                        )}
                    </div>

                    {/* Cuerpo del panel */}
                    <div className="flex-1 p-5 flex flex-col gap-4 overflow-hidden">

                        {/* Banner Bug #13: navegador no compatible */}
                        {!speechSupported && (
                            <div className="flex items-start bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-500/30 text-yellow-800 dark:text-yellow-300 p-4 rounded-2xl text-xs font-bold">
                                <AlertTriangle size={16} className="mr-2 shrink-0 mt-0.5 text-yellow-500 dark:text-yellow-400" />
                                Tu navegador no soporta la transcripción de voz. Usa <strong className="mx-1">Google Chrome</strong> 
                            </div>
                        )}

                        {/* Controles del micrófono */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-white/10 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-700 dark:text-slate-200 mb-4 flex items-center">
                                <Mic size={15} className="mr-2 text-mindpath-primary" />
                                Transcripción en Vivo
                            </h3>

                            {!isListening ? (
                                <button
                                    onClick={handleStart}
                                    className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl flex items-center justify-center hover:bg-black dark:hover:bg-gray-100 transition-all shadow-sm"
                                >
                                    <Mic size={16} className="mr-2" /> Iniciar Transcripción
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    {isPaused ? (
                                        <button
                                            onClick={handleResume}
                                            className="flex-1 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 font-bold rounded-xl flex items-center justify-center hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-all"
                                        >
                                            <Play size={16} className="mr-1" /> Reanudar
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handlePause}
                                            className="w-full py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-bold rounded-xl flex items-center justify-center hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-all"
                                        >
                                            <Pause size={16} className="mr-1" /> Pausar
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Texto transcrito */}
                        <div className="flex-1 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-white/5 p-4 overflow-y-auto flex flex-col">
                            <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase mb-2">Texto capturado</p>
                            <div className="flex-1 text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
                                {/* Texto confirmado por el motor */}
                                <span>{finalTranscript}</span>
                                {/* Texto en proceso (atenuado) */}
                                {interimTranscript && (
                                    <span className="text-gray-400 dark:text-slate-500 italic">{interimTranscript}</span>
                                )}
                                {/* Estado vacío */}
                                {!finalTranscript && !interimTranscript && (
                                    <span className="italic text-gray-400 dark:text-slate-500">
                                        Presiona "Iniciar Transcripción" y comienza a hablar...
                                    </span>
                                )}
                            </div>
                        </div>

                        {isListening && (
                            <p className="text-xs text-center text-gray-400 dark:text-slate-500 pb-1">
                                Al <strong>colgar la llamada</strong> se guardará el expediente automáticamente.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoRoom;
