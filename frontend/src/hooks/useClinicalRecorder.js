import { useState, useRef, useEffect, useCallback } from 'react';

export const useClinicalRecorder = () => {
    const [status, setStatus] = useState('idle'); // idle, recording, paused, stopped
    const [audioBlob, setAudioBlob] = useState(null);
    const [duration, setDuration] = useState(0);
    const mediaRecorderRef = useRef(null);
    const timerRef = useRef(null);
    const streamRef = useRef(null);

    const startRecording = useCallback(async () => {
        try {
            // Solicitamos acceso al micrófono
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            // Usamos WebM por defecto, altamente compatible en navegadores modernos
            const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
            const recorder = new MediaRecorder(stream, { mimeType });
            const chunks = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: mimeType });
                setAudioBlob(blob);
                setStatus('stopped');
                // IMPORTANTE: Apagamos el micrófono para que desaparezca el punto rojo del navegador
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                }
            };

            recorder.start();
            setStatus('recording');
            mediaRecorderRef.current = recorder;

            // Iniciamos el cronómetro
            setDuration(0);
            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error("Error al acceder al micrófono:", error);
            setStatus('error');
            alert("No se pudo acceder al micrófono. Por favor, revisa los permisos del navegador.");
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && status === 'recording') {
            mediaRecorderRef.current.stop();
            clearInterval(timerRef.current);
        }
    }, [status]);

    // Limpieza de memoria (Cleanup) si el componente se desmonta inesperadamente
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Formatear segundos a MM:SS para la UI
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return { 
        status, 
        startRecording, 
        stopRecording, 
        audioBlob, 
        duration, 
        formattedDuration: formatTime(duration) 
    };
};