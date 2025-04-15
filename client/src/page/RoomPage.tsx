import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';
import { SOCKET_SERVER_URL } from '../constant';
import PeerProvider, {  usePeer } from '../provider/PeerProvider';
import { SocketProvider, useSocket } from '../provider/SocketProvider';
import { connectPeerPayload, sendAnswerPayload } from '../types';

type RoomContentProps = {
    username: string;
};

const RoomContent: React.FC<RoomContentProps> = ({ username }) => {
    const {
        peerConnection,
        addTrack,
        getLocalStream,
        createAnswer,
        createOffer,
        setRemoteDescription
    } = usePeer();

    const socket = useSocket();

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [remoteVolume, setRemoteVolume] = useState(1);

    const emitConnected = useCallback(() => {
        if (!socket) return;
        socket.emit('join-room');
        console.log('Join event sent');
    }, [socket]);

    const handleOfferRequested = useCallback(async () => {
        if (!socket) return;
        try {
            console.log('Offer requested');
            const offer = await createOffer();
            socket.emit('offer', { offer: JSON.stringify(offer) });
            console.log('Offer sent:', offer);
        } catch (err) {
            console.error('Error creating/sending offer:', err);
        }
    }, [socket, createOffer]);

    const handleAnswerRequested = useCallback(
        async ({ offer, senderUsername }: sendAnswerPayload) => {
            if (!socket) return;
            try {
                console.log('Answer requested by: ', senderUsername, '\n Offer : ', offer);
                await setRemoteDescription(JSON.parse(offer));
                const answer = await createAnswer();
                socket.emit('answer', { answer: JSON.stringify(answer) });
                console.log('Answer sent:', answer);
            } catch (err) {
                console.error('Error handling answer:', err);
            }
        },
        [socket, setRemoteDescription, createAnswer]
    );

    const handleConnectRequest = useCallback(
        async ({ answer, senderUsername }: connectPeerPayload) => {
            if (!socket) return;
            try {
                console.log('Answer sent by: ', senderUsername, '\n answer : ', answer);
                await setRemoteDescription(JSON.parse(answer));
            } catch (err) {
                console.error('Error setting remote answer:', err);
            }
        },
        [socket, setRemoteDescription]
    );

    const handleICECandidate = useCallback(
        (event: RTCPeerConnectionIceEvent) => {
            if (event.candidate) {
                socket?.emit('ice-candidate', { candidate: event.candidate });
            }
        },
        [socket]
    );

    const handleIncomingICECandidate = useCallback(
        ({ candidate }: { candidate: RTCIceCandidateInit }) => {
            try {
                peerConnection?.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
                console.error('Failed to add ICE candidate:', err);
            }
        },
        [peerConnection]
    );

    // const handleConnected = () => {
    //     console.log('Socket connected with ID:', socket?.id);
    //     emitConnected();
    // }

    // const handleConnectionError = (error) => {
    //     console.log('Socket connection error: ', error);
    // }

    useEffect(() => {
        const setupConnection = async () => {
            if (!peerConnection) return;

            const stream = await getLocalStream();
            setLocalStream(stream);

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            stream.getTracks().forEach((track) => {
                addTrack(track, stream);
            });

            peerConnection.ontrack = (event) => {
                const [remoteTrackStream] = event.streams;
                setRemoteStream(remoteTrackStream);

                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteTrackStream;
                }
            };

            peerConnection.onicecandidate = handleICECandidate;
        };

        setupConnection();

        return () => {
            localStream?.getTracks().forEach((track) => track.stop());
        };
    }, [peerConnection, getLocalStream, addTrack, handleICECandidate, localStream]);

    useEffect(() => {
        const setupSocketConn = () => {
            if (!socket) return;
            console.log("Setting up socket listeners")

            // socket.on('connect', handleConnected);
            // socket.on('connect_error', handleConnectionError);
            socket.on('send-offer', handleOfferRequested);
            socket.on('send-answer', handleAnswerRequested);
            socket.on('connect-peer', handleConnectRequest);
            socket.on('ice-candidate', handleIncomingICECandidate);

            return () => {
                // socket.off('connect', handleConnected);
                // socket.off('connect_error', handleConnectionError);
                socket.off('send-offer', handleOfferRequested);
                socket.off('send-answer', handleAnswerRequested);
                socket.off('connect-peer', handleConnectRequest);
                socket.off('ice-candidate', handleIncomingICECandidate);
            };
        };

        setupSocketConn();
    }, [
        socket,
        handleOfferRequested,
        handleAnswerRequested,
        handleConnectRequest,
        emitConnected,
        handleIncomingICECandidate
    ]);

    const toggleMic = () => {
        if (!localStream) return;
        localStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
        setIsMicOn((prev) => !prev);
    };

    const toggleCamera = () => {
        if (!localStream) return;
        localStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
        setIsCameraOn((prev) => !prev);
    };

    const toggleScreenShare = async () => {
        if (!localStream || !peerConnection) return;

        try {
            if (!isScreenSharing) {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const screenTrack = screenStream.getVideoTracks()[0];

                const sender = peerConnection.getSenders().find((s) => s.track?.kind === 'video');

                if (sender && screenTrack) {
                    sender.replaceTrack(screenTrack);
                    screenTrack.onended = () => {
                        toggleScreenShare(); // Revert back to webcam
                    };
                    setIsScreenSharing(true);
                }
            } else {
                const videoTrack = localStream.getVideoTracks()[0];
                const sender = peerConnection.getSenders().find((s) => s.track?.kind === 'video');

                if (sender && videoTrack) {
                    sender.replaceTrack(videoTrack);
                    setIsScreenSharing(false);
                }
            }
        } catch (err) {
            console.error('Error sharing screen:', err);
        }
    };

    useEffect(() => {
        if (remoteVideoRef.current) {
            remoteVideoRef.current.volume = remoteVolume;
        }
    }, [remoteVolume]);

    return (
        <div className="min-h-screen bg-background p-6 flex flex-col gap-6">
            <h2 className="text-2xl font-bold text-secondary text-center">Connected</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card rounded-lg shadow-md p-4 flex flex-col items-center">
                    <h3 className="text-primary font-semibold mb-2">{username} (You)</h3>
                    <video
                        className="w-full h-64 object-cover rounded"
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                    />
                </div>

                {remoteStream && (
                    <div className="bg-card rounded-lg shadow-md p-4 flex flex-col items-center">
                        <h3 className="text-accent font-semibold mb-2">Partner's Feed</h3>
                        <video
                            className="w-full h-64 object-cover rounded"
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                        />
                        <label className="mt-3 text-sm text-secondary">
                            Volume:
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.01}
                                value={remoteVolume}
                                onChange={(e) => setRemoteVolume(parseFloat(e.target.value))}
                                className="ml-2 w-32"
                            />
                        </label>
                    </div>
                )}
            </div>

            <div className="mt-4 flex justify-center gap-4 flex-wrap">
                <button
                    onClick={emitConnected}
                    className={`px-4 py-2 rounded font-medium ${isCameraOn ? 'bg-accent text-white' : 'bg-danger text-white'
                        }`}
                >
                    Initialize
                </button>
                <button
                    onClick={toggleCamera}
                    className={`px-4 py-2 rounded font-medium ${isCameraOn ? 'bg-accent text-white' : 'bg-danger text-white'
                        }`}
                >
                    {isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
                </button>

                <button
                    onClick={toggleMic}
                    className={`px-4 py-2 rounded font-medium ${isMicOn ? 'bg-accent text-white' : 'bg-danger text-white'
                        }`}
                >
                    {isMicOn ? 'Mute Mic' : 'Unmute Mic'}
                </button>

                <button
                    onClick={toggleScreenShare}
                    className={`px-4 py-2 rounded font-medium ${isScreenSharing ? 'bg-accent text-white' : 'bg-primary text-white'
                        }`}
                >
                    {isScreenSharing ? 'Stop Share' : 'Share Screen'}
                </button>
            </div>
        </div>
    );
};

type RoomPageProps = {
    token: string;
    username: string;
};

const RoomPage: React.FC<RoomPageProps> = ({ token, username }) => {
    const options = useMemo(
        () => ({
            auth: { token }
        }),
        [token]
    );

    return (
        <SocketProvider url={SOCKET_SERVER_URL} options={options}>
            <PeerProvider>
                <RoomContent username={username} />
            </PeerProvider>
        </SocketProvider>
    );
};

export default RoomPage;
