import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useAuthStore } from '../../store/useAuthStore';
import { useState, useEffect, useRef } from 'react';
import api from '../../api/axiosConfig';
import { Clock, Wifi, CheckCircle, RefreshCw } from 'lucide-react';

const POLL_INTERVAL = 4000; // ms entre polling

const PatientVideoRoom = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const patientName = user?.full_name || 'Paciente';

    const [doctorReady, setDoctorReady] = useState(false);
    const [pollError, setPollError]     = useState(false);
    const [dots, setDots]               = useState('');
    const intervalRef = useRef(null);

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

        if (!appID || !serverSecret) {
            console.error('Faltan credenciales de ZegoCloud.');
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
            showPreJoinView: true,
            onLeaveRoom: () => navigate('/patient/appointments'),
        });
    };

    // ── Sala de espera ──────────────────────────────────────────────────────
    if (!doctorReady) {
        return (
            <div className="w-screen h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center max-w-sm px-6">
                    {/* Icono animado */}
                    <div className="relative mx-auto mb-8 w-28 h-28">
                        <div className="absolute inset-0 rounded-full bg-purple-600/20 animate-ping" />
                        <div className="absolute inset-3 rounded-full bg-purple-600/30 animate-ping animation-delay-150" />
                        <div className="relative flex items-center justify-center w-28 h-28 rounded-full bg-slate-800 border-2 border-purple-500/50">
                            <Wifi size={48} className="text-purple-400" />
                        </div>
                    </div>

                    <h1 className="text-2xl font-black text-white mb-2">Sala de espera</h1>
                    <p className="text-slate-400 mb-6">
                        Esperando a que el especialista entre a la sala{dots}
                    </p>

                    {/* Barra animada */}
                    <div className="h-1.5 w-48 mx-auto bg-slate-800 rounded-full overflow-hidden mb-8">
                        <div className="h-full w-1/2 bg-purple-500 rounded-full animate-[slide_2s_ease-in-out_infinite]" />
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
        <div className="w-screen h-screen bg-gray-900 relative overflow-hidden">
            {/* Notificación de entrada */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-green-900/80 text-green-300 px-5 py-2.5 rounded-full border border-green-500/30 text-sm font-bold backdrop-blur-sm animate-fade-in">
                <CheckCircle size={16} />
                El médico está listo — conectando…
            </div>
            <div ref={myMeeting} className="w-full h-full" />
        </div>
    );
};

export default PatientVideoRoom;