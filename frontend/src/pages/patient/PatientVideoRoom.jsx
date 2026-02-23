import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

const PatientVideoRoom = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const myMeeting = async (element) => {
        if (!element) return;

        const appID = Number(import.meta.env.VITE_ZEGO_APP_ID);
        const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
            appID,
            serverSecret,
            id,
            Date.now().toString(),
            'Paciente'
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
                navigate('/patient/dashboard');
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