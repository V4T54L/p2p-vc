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
    return io(url, options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  useEffect(() => {
    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
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
