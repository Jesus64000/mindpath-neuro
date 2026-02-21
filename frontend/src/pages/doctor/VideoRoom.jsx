import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClinicalRecorder } from '../../hooks/useClinicalRecorder';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Sparkles, Send, BrainCircuit } from 'lucide-react';
import api from '../../api/axiosConfig';

const VideoRoom = () => {
    const { id } = useParams(); // ID de la cita
    const navigate = useNavigate();
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [privateNote, setPrivateNote] = useState('');

    // Extraemos las funciones de tu Custom Hook
    const { status, startRecording, stopRecording, audioBlob, formattedDuration } = useClinicalRecorder();

    // Iniciar grabación automáticamente al entrar a la sala
    useEffect(() => {
        startRecording();
        
        // Cleanup: Asegurarnos de apagar todo si el médico cierra la pestaña de golpe
        return () => {
            if (status === 'recording') stopRecording();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const uploadAudioToAI = async () => {
            if (audioBlob && !isUploading) {
                setIsUploading(true);
                try {
                    // Preparamos el FormData (así se envían archivos en JS)
                    const formData = new FormData();
                    formData.append('audio_file', audioBlob, 'consulta.webm');

                    // Mostramos estado de carga visual si quieres
                    console.log("Subiendo audio al motor de IA...");

                    const response = await api.post(`/consultations/${id}/process-audio`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });

                    // Si la IA fue exitosa, redirigimos al Editor pasándole el ID del reporte
                    navigate(`/doctor/report-editor/${response.data.report_id}`);
                } catch (error) {
                    console.error("Error al procesar la IA", error);
                    alert("Hubo un error al procesar el audio con la IA.");
                    setIsUploading(false);
                }
            }
        };
        
        uploadAudioToAI();
    }, [audioBlob, id, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleEndCall = () => {
        // Al detener, el Hook generará el audioBlob y disparará el useEffect de arriba
        stopRecording();
    };

    return (
        <div className="flex h-screen bg-gray-900 font-sans overflow-hidden">
            
            {/* PANEL PRINCIPAL: Video Feed (70%) */}
            <div className="relative flex-1 flex flex-col justify-between p-4 md:p-6">
                
                {/* Cabecera Flotante (Status) */}
                <div className="flex justify-between items-start z-10">
                    <div className="flex items-center bg-gray-800/80 backdrop-blur-md px-4 py-2 rounded-full border border-gray-700">
                        <div className={`h-2.5 w-2.5 rounded-full mr-3 ${status === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
                        <span className="text-white font-medium text-sm">Ana Diaz (Paciente)</span>
                        <div className="w-px h-4 bg-gray-600 mx-3"></div>
                        <span className="text-gray-300 text-sm font-mono">{formattedDuration}</span>
                    </div>

                    <div className="flex items-center bg-mindpath-primary/20 backdrop-blur-md border border-mindpath-primary/50 px-4 py-2 rounded-full">
                        <BrainCircuit size={16} className="text-mindpath-light mr-2" />
                        <span className="text-mindpath-light text-xs font-bold tracking-wider uppercase">IA Analizando Sentimiento</span>
                    </div>
                </div>

                {/* Video Feed Mockup (Fondo) */}
                <div className="absolute inset-0 z-0 px-6 py-6 pb-28 pt-20">
                    <div className="w-full h-full bg-gray-800 rounded-3xl overflow-hidden border border-gray-700 relative shadow-2xl">
                        {/* Placeholder de imagen de paciente simulando la videollamada */}
                        <img 
                            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1200" 
                            alt="Paciente" 
                            className="w-full h-full object-cover opacity-80"
                        />
                    </div>
                </div>

                {/* Self View (Video del Doctor) */}
                <div className="absolute bottom-28 right-10 z-20 w-48 h-32 bg-gray-800 rounded-2xl border-2 border-gray-600 overflow-hidden shadow-xl">
                    <img 
                        src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400" 
                        alt="Tú" 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-xs text-white">TÚ</div>
                </div>

                {/* Barra de Controles Inferior */}
                <div className="relative z-10 flex justify-center w-full">
                    <div className="flex items-center gap-4 bg-gray-800/90 backdrop-blur-xl px-8 py-4 rounded-3xl border border-gray-700 shadow-2xl">
                        <button 
                            onClick={() => setIsMuted(!isMuted)}
                            className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-red-500/20 text-red-500' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                        >
                            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                        </button>
                        
                        <button 
                            onClick={() => setIsVideoOff(!isVideoOff)}
                            className={`p-4 rounded-full transition-colors ${isVideoOff ? 'bg-red-500/20 text-red-500' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                        >
                            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                        </button>

                        <div className="w-px h-8 bg-gray-600 mx-2"></div>

                        <div className="flex items-center bg-gray-900/50 px-4 py-2 rounded-full border border-gray-700">
                            <Sparkles size={16} className="text-mindpath-primary mr-2 animate-pulse" />
                            <span className="text-gray-300 text-xs">IA procesando audio...</span>
                        </div>

                        <div className="w-px h-8 bg-gray-600 mx-2"></div>

                        {/* BOTÓN COLGAR */}
                        <button 
                            onClick={handleEndCall}
                            className="flex items-center px-6 py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full transition-colors shadow-lg shadow-red-500/30"
                        >
                            <PhoneOff size={20} className="mr-2" />
                            Finalizar Llamada
                        </button>
                    </div>
                </div>
            </div>

            {/* PANEL LATERAL DERECHO: Inteligencia Artificial (30%) */}
            <div className="w-full md:w-[400px] bg-gray-800 border-l border-gray-700 flex flex-col z-20">
                <div className="p-6 border-b border-gray-700 bg-gray-800/50">
                    <h3 className="text-white font-bold text-lg flex items-center">
                        <Sparkles size={18} className="text-mindpath-primary mr-2" />
                        Transcripción en Vivo
                    </h3>
                    <p className="text-mindpath-primary text-xs font-bold mt-1 tracking-wider">POTENCIADO POR MINDPATH AI</p>
                </div>

                {/* Mockup del Chat de Transcripción */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                    <div className="space-y-1">
                        <span className="text-xs text-gray-400 font-bold ml-1">Dr. Alistair</span>
                        <div className="bg-gray-700 text-white p-3 rounded-2xl rounded-tl-sm text-sm">
                            Hola Ana, ¿cómo han estado tus migrañas desde nuestra última sesión?
                        </div>
                    </div>

                    <div className="space-y-1 flex flex-col items-end">
                        <span className="text-xs text-gray-400 font-bold mr-1">Ana Diaz</span>
                        <div className="bg-mindpath-primary/20 border border-mindpath-primary/30 text-white p-3 rounded-2xl rounded-tr-sm text-sm">
                            Han estado un poco mejor, en realidad. Creo que los ejercicios están ayudando.
                        </div>
                    </div>

                    {/* Alerta de IA (Nota Clínica) */}
                    <div className="bg-blue-900/30 border border-blue-500/30 p-4 rounded-xl mt-4">
                        <h4 className="text-blue-400 text-xs font-bold mb-2 flex items-center uppercase tracking-wider">
                            <BrainCircuit size={14} className="mr-1" /> Nota Clínica IA
                        </h4>
                        <p className="text-gray-300 text-sm">
                            La paciente informa fotosensibilidad persistente. Considerar revisar la dosis o sugerir lentes tintados.
                        </p>
                    </div>
                </div>

                {/* Footer: Notas Privadas */}
                <div className="p-4 border-t border-gray-700 bg-gray-900">
                    <div className="relative">
                        <input 
                            type="text" 
                            value={privateNote}
                            onChange={(e) => setPrivateNote(e.target.value)}
                            placeholder="Añadir nota privada..."
                            className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-xl pl-4 pr-12 py-3 focus:ring-2 focus:ring-mindpath-primary focus:border-transparent outline-none"
                        />
                        <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-mindpath-primary hover:text-mindpath-light transition-colors">
                            <Send size={18} />
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-3 text-center animate-pulse">Ana está hablando...</p>
                </div>
            </div>

        </div>
    );
};

export default VideoRoom;