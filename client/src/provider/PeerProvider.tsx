import React, { createContext, useContext, useRef, useEffect, useState } from 'react';

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

const PeerProvider: React.FC<Props> = ({ children, iceServers }) => {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [connectionState, setConnectionState] = useState<string>('new');

  // Initialize peer connection with optional custom ICE servers
  const getPeerConnection = (): RTCPeerConnection => {
    if (!peerConnectionRef.current) {
      peerConnectionRef.current = new RTCPeerConnection({
        iceServers: iceServers ?? [
          { urls: 'stun:stun.l.google.com:19302' }, // Public STUN server
        ],
      });

      // ICE connection state monitoring
      peerConnectionRef.current.oniceconnectionstatechange = () => {
        const state = peerConnectionRef.current?.iceConnectionState;
        setConnectionState(state || 'new');
        console.log('ICE connection state:', state);
      };
    }
    return peerConnectionRef.current;
  };

  // Get local stream (audio + video)
  const getLocalStream = async (): Promise<MediaStream> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      return stream;
    } catch (error) {
      console.error('Error getting local media:', error);
      throw error; // Rethrow to handle in the caller
    }
  };

  // Create offer (used for initiating connections)
  const createOffer = async (): Promise<RTCSessionDescriptionInit> => {
    console.log(connectionState) // TODO: Remove this
    try {
      const pc = getPeerConnection();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  };

  // Create answer (used for accepting offers)
  const createAnswer = async (): Promise<RTCSessionDescriptionInit> => {
    try {
      const pc = getPeerConnection();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error('Error creating answer:', error);
      throw error;
    }
  };

  // Set remote description (used after receiving the offer or answer from the other peer)
  const setRemoteDescription = async (desc: RTCSessionDescriptionInit): Promise<void> => {
    try {
      const pc = getPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(desc));
    } catch (error) {
      console.error('Error setting remote description:', error);
      throw error;
    }
  };

  // Add ICE candidate (used to handle network traversal)
  const addIceCandidate = async (candidate: RTCIceCandidateInit): Promise<void> => {
    try {
      const pc = getPeerConnection();
      if (candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
      throw error;
    }
  };

  // Add media track (audio or video) to peer connection
  const addTrack = (track: MediaStreamTrack, stream: MediaStream) => {
    try {
      const pc = getPeerConnection();
      pc.addTrack(track, stream);
    } catch (error) {
      console.error('Error adding track to peer connection:', error);
    }
  };

  // Cleanup peer connection when component unmounts
  useEffect(() => {
    return () => {
      if (peerConnectionRef.current) {
        console.log('Cleaning up peer connection...');
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };
  }, []);

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

// Custom hook to access peer context
export const usePeer = (): PeerContextType => {
  const context = useContext(PeerContext);
  if (!context) {
    throw new Error('usePeer must be used within a PeerProvider');
  }
  return context;
};

export default PeerProvider;