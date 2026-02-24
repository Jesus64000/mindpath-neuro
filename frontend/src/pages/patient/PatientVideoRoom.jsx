import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useAuthStore } from '../../store/useAuthStore';

// Bug #3 Fix: usar nombre real del paciente (de useAuthStore) en lugar de 'Paciente' hardcoded

const PatientVideoRoom = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const patientName = user?.full_name || 'Paciente';

    const myMeeting = async (element) => {
        if (!element) return;

        const appID = Number(import.meta.env.VITE_ZEGO_APP_ID);
        const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;

        if (!appID || !serverSecret) {
            console.error('Faltan credenciales de ZegoCloud. Verifica VITE_ZEGO_APP_ID y VITE_ZEGO_SERVER_SECRET en .env');
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
            scenario: {
                mode: ZegoUIKitPrebuilt.OneONoneCall,
            },
            showScreenSharingButton: false,
            showPreJoinView: true,
            onLeaveRoom: () => {
                navigate('/patient/appointments');
            },
        });
    };

    return (
        <div className="w-screen h-screen bg-gray-900 overflow-hidden">
            <div ref={myMeeting} className="w-full h-full" />
        </div>
    );
};

export default PatientVideoRoom;