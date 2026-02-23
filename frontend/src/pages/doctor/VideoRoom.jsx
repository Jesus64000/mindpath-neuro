import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useClinicalRecorder } from '../../hooks/useClinicalRecorder';
import { Mic, Square, Activity, UploadCloud, CheckCircle, BrainCircuit } from 'lucide-react';
import api from '../../api/axiosConfig';

const VideoRoom = () => {
    const { id } = useParams(); // El ID de la cita es el Room ID
    const navigate = useNavigate();

    // Grabador clínico (audio + IA)
    const { status: recordStatus, startRecording, stopRecording, audioBlob, formattedDuration } = useClinicalRecorder();
    const [isUploading, setIsUploading] = useState(false);
    const [aiResult, setAiResult] = useState(null);

    // ZegoCloud: crea y une la sala
    const myMeeting = async (element) => {
        if (!element) return;

        // Credenciales desde .env (Vite requiere prefijo VITE_)
        const appID = Number(import.meta.env.VITE_ZEGO_APP_ID);
        const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
            appID,
            serverSecret,
            id,
            Date.now().toString(),
            'Dr. Especialista'
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);

        zp.joinRoom({
            container: element,
            scenario: {
                mode: ZegoUIKitPrebuilt.OneONoneCall,
            },
            showScreenSharingButton: false,
            showPreJoinView: false,
            onLeaveRoom: () => {
                navigate('/doctor/schedules');
            },
        });
    };

    // Procesar audio con IA
    const handleProcessAI = async () => {
        if (!audioBlob) return;
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'consulta.webm');
            formData.append('appointmentId', id);

            const response = await api.post('/consultations/process-audio', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setAiResult(response.data.data);
            alert('Audio procesado con éxito.');
        } catch (error) {
            console.error('Error procesando audio con IA:', error);
            alert('Error al procesar el audio.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-900 font-sans overflow-hidden">
            {/* ZegoCloud controla el video */}
            <div className="flex-1 relative" ref={myMeeting}></div>

            {/* Panel clínico IA */}
            <div className="w-80 md:w-96 bg-white border-l border-gray-200 flex flex-col shadow-2xl z-20">
                <div className="p-5 border-b border-gray-100 bg-mindpath-light/30 flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-gray-800 flex items-center">
                            <BrainCircuit size={20} className="text-mindpath-primary mr-2" />
                            Mindpath AI
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">Asistente Clínico Activo</p>
                    </div>
                    {recordStatus === 'recording' && (
                        <div className="flex items-center text-red-500 text-xs font-bold animate-pulse bg-red-50 px-2 py-1 rounded-full">
                            <Activity size={12} className="mr-1" /> GRABANDO
                        </div>
                    )}
                </div>

                <div className="flex-1 p-5 overflow-y-auto bg-gray-50/50">
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-6">
                        <h3 className="text-sm font-bold text-gray-700 mb-4">Captura de Audio</h3>

                        <div className="flex justify-center mb-4">
                            <div className={`text-3xl font-mono tabular-nums ${recordStatus === 'recording' ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                {formattedDuration}
                            </div>
                        </div>

                        <div className="flex gap-3 justify-center">
                            {recordStatus !== 'recording' ? (
                                <button
                                    onClick={startRecording}
                                    className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl flex items-center justify-center transition-colors border border-red-200"
                                >
                                    <Mic size={18} className="mr-2" /> Iniciar
                                </button>
                            ) : (
                                <button
                                    onClick={stopRecording}
                                    className="flex-1 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl flex items-center justify-center transition-colors shadow-lg shadow-gray-900/20"
                                >
                                    <Square size={18} className="mr-2" /> Detener
                                </button>
                            )}
                        </div>
                    </div>

                    {audioBlob && !aiResult && (
                        <div className="bg-mindpath-light/30 rounded-2xl p-5 border border-mindpath-primary/20 animate-fade-in">
                            <h3 className="text-sm font-bold text-mindpath-primary mb-2 flex items-center">
                                <CheckCircle size={16} className="mr-1.5" /> Audio Capturado
                            </h3>
                            <p className="text-xs text-gray-600 mb-4">Listo para análisis con Whisper.</p>
                            <button
                                onClick={handleProcessAI}
                                disabled={isUploading}
                                className="w-full py-3 bg-mindpath-primary hover:bg-mindpath-primaryHover disabled:bg-purple-300 text-white font-bold rounded-xl flex items-center justify-center transition-all shadow-md shadow-purple-500/20"
                            >
                                {isUploading ? (
                                    <><Activity size={18} className="mr-2 animate-spin" /> Procesando IA...</>
                                ) : (
                                    <><UploadCloud size={18} className="mr-2" /> Generar Nota Clínica</>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoRoom;
