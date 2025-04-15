import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';

type SocketContextType = {
  socket: Socket | null;
};

const SocketContext = createContext<SocketContextType>({ socket: null });

type Props = {
  children: React.ReactNode;
  url: string;
  options?: Parameters<typeof io>[1];
};

export const SocketProvider: React.FC<Props> = ({ children, url, options }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  const socketInstance = useMemo(() => {
    console.log("Sock Server URL : ", url)
    return io(url, options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);
  // const socketInstance = io(url, options);

  useEffect(() => {
    setSocket(socketInstance);
    console.log("Socket instabnce : ", socketInstance)

    socketInstance.on('connect', () => {
      console.log('Socket connected with ID:', socketInstance.id);
    });

    socketInstance.on('init', () => {
      console.log('Init called:', socketInstance.id);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // return () => {
    //   socketInstance.disconnect();
    // };
  }, [socketInstance]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): Socket | null => {
  const context = useContext(SocketContext);
  return context.socket;
};
