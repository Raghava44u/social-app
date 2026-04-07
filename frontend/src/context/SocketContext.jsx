import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    let newSocket = null;
    
    if (user) {
      const token = localStorage.getItem('token');
      // Connect to the backend server with the JWT token
      newSocket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000', 
      {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      newSocket.on('connect', () => {
        console.log('✅ Connected to real-time socket server');
      });

      newSocket.on('connect_error', (err) => {
        console.warn('⚠️ Socket connection error, falling back to polling.', err.message);
      });

      setSocket(newSocket);
    }

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, [user?.id]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
