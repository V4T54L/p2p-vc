import React, { createContext, useContext, useRef } from 'react';

type PeerContextType = {
  peerConnection: RTCPeerConnection | null;
  createOffer: () => Promise<RTCSessionDescriptionInit>;
  createAnswer: () => Promise<RTCSessionDescriptionInit>;
  setRemoteDescription: (desc: RTCSessionDescriptionInit) => Promise<void>;
  addIceCandidate: (candidate: RTCIceCandidateInit) => Promise<void>;
  getLocalStream: () => Promise<MediaStream>;
  addTrack: (track: MediaStreamTrack, stream: MediaStream) => void;
};

const PeerContext = createContext<PeerContextType | null>(null);

type Props = {
  children: React.ReactNode;
  iceServers?: RTCIceServer[];
};

// exports getPeerConnection, createOffer, createAnswer,
// setRemoteDescription, addIceCandidate, getLocalStream,
// and addTrack
export const PeerProvider: React.FC<Props> = ({ children, iceServers }) => {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const getPeerConnection = (): RTCPeerConnection => {
    if (!peerConnectionRef.current) {
      peerConnectionRef.current = new RTCPeerConnection({
        iceServers: iceServers ?? [
          { urls: 'stun:stun.l.google.com:19302' }, // public STUN
        ],
      });
    }
    return peerConnectionRef.current;
  };

  const getLocalStream = async (): Promise<MediaStream> => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    return stream;
  };

  const createOffer = async (): Promise<RTCSessionDescriptionInit> => {
    const pc = getPeerConnection();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer;
  };

  const createAnswer = async (): Promise<RTCSessionDescriptionInit> => {
    const pc = getPeerConnection();
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  };

  const setRemoteDescription = async (desc: RTCSessionDescriptionInit): Promise<void> => {
    const pc = getPeerConnection();
    await pc.setRemoteDescription(new RTCSessionDescription(desc));
  };

  const addIceCandidate = async (candidate: RTCIceCandidateInit): Promise<void> => {
    const pc = getPeerConnection();
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  };

  const addTrack = (track: MediaStreamTrack, stream: MediaStream) => {
    const pc = getPeerConnection();
    pc.addTrack(track, stream);
  };

  return (
    <PeerContext.Provider
      value={{
        peerConnection: peerConnectionRef.current,
        createOffer,
        createAnswer,
        setRemoteDescription,
        addIceCandidate,
        getLocalStream,
        addTrack,
      }}
    >
      {children}
    </PeerContext.Provider>
  );
};

export const usePeer = (): PeerContextType => {
  const context = useContext(PeerContext);
  if (!context) {
    throw new Error('usePeer must be used within a PeerProvider');
  }
  return context;
};
