import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useAuthStore } from '../../store/useAuthStore';
import { useState, useEffect, useRef } from 'react';
import api from '../../api/axiosConfig';
import { Clock, Wifi, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react';

const POLL_INTERVAL = 4000; // ms entre polling

const PatientVideoRoom = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const patientName = user?.full_name || 'Paciente';

    const [doctorReady, setDoctorReady] = useState(false);
    const [pollError, setPollError]     = useState(false);
    const [dots, setDots]               = useState('');
    const [connectionError, setConnectionError] = useState(false);
    const intervalRef = useRef(null);
    const hasJoinedRef = useRef(false);
    const joinTimeRef = useRef(0);

    // ── Animación de puntos ─────────────────────────────────────────────────
    useEffect(() => {
        const t = setInterval(() => setDots(d => d.length < 3 ? d + '.' : ''), 500);
        return () => clearInterval(t);
    }, []);

    // ── Polling: preguntar si el doctor ya entró ─────────────────────────────
    useEffect(() => {
        if (doctorReady) return;

        const checkStatus = async () => {
            try {
                const res = await api.get(`/appointments/${id}/room-status`);
                if (res.data?.doctorReady) {
                    setDoctorReady(true);
                    setPollError(false);
                }
            } catch {
                setPollError(true);
            }
        };

        checkStatus();
        intervalRef.current = setInterval(checkStatus, POLL_INTERVAL);
        return () => clearInterval(intervalRef.current);
    }, [id, doctorReady]);

    // ── ZegoCloud callback ref — solo se inicializa cuando doctorReady ───────
    const myMeeting = async (element) => {
        if (!element || !doctorReady) return;

        const appID        = Number(import.meta.env.VITE_ZEGO_APP_ID);
        const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;

        if (!appID || isNaN(appID) || !serverSecret || serverSecret.includes('YOUR') || serverSecret.includes('_AQUI')) {
            console.error('Faltan credenciales válidas de ZegoCloud.');
            setConnectionError(true);
            return;
        }

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
            appID,
            serverSecret,
            id,
            Date.now().toString(),
            patientName
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zp.joinRoom({
            container: element,
            scenario: { mode: ZegoUIKitPrebuilt.OneONoneCall },
            showScreenSharingButton: false,
            showPreJoinView: false, // Bypass the clunky, non-responsive pre-join screen on mobile
            turnOnMicrophoneWhenJoining: true,
            turnOnCameraWhenJoining: true,
            showUserList: false,
            showLayoutButton: false,
            showPinButton: false,
            onJoinRoom: () => {
                hasJoinedRef.current = true;
                joinTimeRef.current = Date.now(); // Guardar el momento de conexión exitosa
            },
            onLeaveRoom: () => {
                const duration = Date.now() - joinTimeRef.current;
                
                // Si la sesión duró menos de 4 segundos, se considera fallo inmediato de inicio de sesión o aborto prematuro de ZegoCloud
                if (hasJoinedRef.current && duration > 4000) {
                    navigate('/patient/appointments');
                } else {
                    setConnectionError(true);
                }
            },
        });
    };

    // ── Pantalla de error de conexión ───────────────────────────────────────
    if (connectionError) {
        return (
            <div className="w-full h-[100dvh] bg-slate-950 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/10 shadow-2xl text-center text-white">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                        <AlertTriangle className="text-red-500" size={32} />
                    </div>
                    <h2 className="text-2xl font-black mb-3">Error de Conexión</h2>
                    <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                        No se pudo establecer la conexión de video de telemedicina. Esto ocurre típicamente por credenciales de ZegoCloud faltantes o erróneas en las variables de entorno de producción.
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
                            onClick={() => navigate('/patient/appointments')}
                            className="w-full py-3 bg-transparent hover:bg-white/5 text-gray-300 hover:text-white font-bold rounded-xl transition-all border border-white/10"
                        >
                            Volver a mis citas
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Sala de espera ──────────────────────────────────────────────────────
    if (!doctorReady) {
        return (
            <div className="w-full h-[100dvh] bg-slate-950 flex items-center justify-center">
                <div className="text-center max-w-sm px-6">
                    {/* Icono animado */}
                    <div className="relative mx-auto mb-8 w-28 h-28">
                        <div className="absolute inset-0 rounded-full bg-mindpath-primary/20 animate-ping" />
                        <div className="absolute inset-3 rounded-full bg-mindpath-primary/30 animate-ping animation-delay-150" />
                        <div className="relative flex items-center justify-center w-28 h-28 rounded-full bg-slate-800 border-2 border-mindpath-primary/50">
                            <Wifi size={48} className="text-mindpath-primary" />
                        </div>
                    </div>

                    <h1 className="text-2xl font-black text-white mb-2">Sala de espera</h1>
                    <p className="text-slate-400 mb-6">
                        Esperando a que el especialista entre a la sala{dots}
                    </p>

                    {/* Barra animada */}
                    <div className="h-1.5 w-48 mx-auto bg-slate-800 rounded-full overflow-hidden mb-8">
                        <div className="h-full w-1/2 bg-mindpath-light0 rounded-full animate-[slide_2s_ease-in-out_infinite]" />
                    </div>

                    {pollError && (
                        <div className="flex items-center justify-center gap-2 text-yellow-400 text-sm bg-yellow-500/10 rounded-xl px-4 py-3 border border-yellow-500/20">
                            <RefreshCw size={14} className="animate-spin" />
                            Reconectando…
                        </div>
                    )}

                    <p className="text-xs text-slate-600 mt-6">
                        La sesión comenzará automáticamente cuando el médico esté listo.
                    </p>

                    <button
                        onClick={() => navigate('/patient/appointments')}
                        className="mt-8 text-sm text-slate-500 hover:text-slate-300 transition-colors underline"
                    >
                        Cancelar y volver
                    </button>
                </div>

                <style>{`
                    @keyframes slide {
                        0%, 100% { transform: translateX(-100%); }
                        50% { transform: translateX(200%); }
                    }
                `}</style>
            </div>
        );
    }

    // ── Sala activa ─────────────────────────────────────────────────────────
    return (
        <div className="w-full h-[100dvh] bg-gray-900 relative overflow-hidden">
            {/* Notificación de entrada */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-green-900/80 text-green-300 px-5 py-2.5 rounded-full border border-green-500/30 text-sm font-bold backdrop-blur-sm animate-fade-in animate-pulse">
                <CheckCircle size={16} />
                Conectando llamada…
            </div>
            <div ref={myMeeting} className="w-full h-full" />
        </div>
    );
};

export default PatientVideoRoom;