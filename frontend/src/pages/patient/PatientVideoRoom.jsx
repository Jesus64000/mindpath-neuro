import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, PhoneOff, ShieldCheck, Activity } from 'lucide-react';

const PatientVideoRoom = () => {
    const { id } = useParams(); // ID de la cita
    const navigate = useNavigate();
    
    // Controles locales del hardware del paciente
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isConnecting, setIsConnecting] = useState(true);

    // Simulamos el tiempo de conexión con el servidor de WebRTC
    setTimeout(() => setIsConnecting(false), 2000);

    const handleEndCall = () => {
        // En una app real, aquí se cierra la conexión WebRTC
        alert("Has finalizado la consulta médica.");
        navigate('/patient/appointments'); 
    };

    return (
        <div className="flex h-screen bg-gray-900 font-sans overflow-hidden">
            
            {/* PANEL ÚNICO: Video Feed Inmersivo (100% de la pantalla) */}
            <div className="relative flex-1 flex flex-col justify-between p-4 md:p-6">
                
                {/* Cabecera Flotante (Status y Seguridad) */}
                <div className="flex justify-between items-start z-10">
                    <div className="flex items-center bg-gray-800/80 backdrop-blur-md px-5 py-2.5 rounded-full border border-gray-700 shadow-lg">
                        <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse mr-3"></div>
                        <span className="text-white font-medium text-sm">Consultorio Virtual</span>
                        <div className="w-px h-4 bg-gray-600 mx-3"></div>
                        <span className="text-gray-300 text-sm">Dr. Alistair</span>
                    </div>

                    <div className="flex items-center bg-green-500/10 backdrop-blur-md border border-green-500/30 px-4 py-2 rounded-full">
                        <ShieldCheck size={16} className="text-green-400 mr-2" />
                        <span className="text-green-400 text-xs font-bold tracking-wider uppercase">Conexión Segura E2E</span>
                    </div>
                </div>

                {/* Video Feed del Doctor (Fondo Principal) */}
                <div className="absolute inset-0 z-0 px-4 py-4 pb-28 pt-20">
                    <div className="w-full h-full bg-gray-800 rounded-3xl overflow-hidden border border-gray-700 relative shadow-2xl flex items-center justify-center">
                        {isConnecting ? (
                            <div className="flex flex-col items-center text-gray-400">
                                <Activity className="animate-spin mb-4" size={48} />
                                <p>Conectando con el especialista...</p>
                            </div>
                        ) : (
                            <img 
                                src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=1200" 
                                alt="Doctor" 
                                className="w-full h-full object-cover opacity-90"
                            />
                        )}
                    </div>
                </div>

                {/* Self View (Video del Paciente) */}
                <div className="absolute bottom-32 right-8 md:right-12 z-20 w-32 h-48 md:w-48 md:h-64 bg-gray-800 rounded-2xl border-2 border-gray-600 overflow-hidden shadow-2xl transition-all">
                    {!isVideoOff ? (
                        <img 
                            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400" 
                            alt="Tú" 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                            <VideoOff size={32} className="text-gray-500" />
                        </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-xs text-white backdrop-blur-sm">TÚ</div>
                </div>

                {/* Barra de Controles Inferior */}
                <div className="relative z-10 flex justify-center w-full">
                    <div className="flex items-center gap-3 md:gap-6 bg-gray-800/90 backdrop-blur-xl px-6 md:px-10 py-4 rounded-3xl border border-gray-700 shadow-2xl">
                        
                        <button 
                            onClick={() => setIsMuted(!isMuted)}
                            className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-red-500/20 text-red-500' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                            title={isMuted ? "Activar micrófono" : "Silenciar micrófono"}
                        >
                            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                        </button>
                        
                        <button 
                            onClick={() => setIsVideoOff(!isVideoOff)}
                            className={`p-4 rounded-full transition-colors ${isVideoOff ? 'bg-red-500/20 text-red-500' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                            title={isVideoOff ? "Activar cámara" : "Apagar cámara"}
                        >
                            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                        </button>

                        <div className="w-px h-8 bg-gray-600 mx-2 md:mx-4"></div>

                        {/* BOTÓN COLGAR */}
                        <button 
                            onClick={handleEndCall}
                            className="flex items-center px-6 py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full transition-colors shadow-lg shadow-red-500/30"
                        >
                            <PhoneOff size={20} className="md:mr-2" />
                            <span className="hidden md:inline">Salir de la Consulta</span>
                        </button>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientVideoRoom;