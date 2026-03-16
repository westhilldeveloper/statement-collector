// app/context/SocketContext.js
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client'; // Change this import

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children, isAdmin = false, customerId = null }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);

  useEffect(() => {
    // Initialize socket connection with socket.io-client
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('🔌 Socket connected:', socketInstance.id);
      setIsConnected(true);
      setSocketId(socketInstance.id);
      
      if (isAdmin) {
        console.log('👑 Emitting admin-auth');
        socketInstance.emit('admin-auth', { isAdmin: true });
      }
      
      if (customerId) {
        console.log(`👤 Emitting customer-connect for ${customerId}`);
        socketInstance.emit('customer-connect', { customerId });
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setIsConnected(false);
      setSocketId(null);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    setSocket(socketInstance);

    return () => {
      console.log('🧹 Cleaning up socket connection');
      socketInstance.disconnect();
    };
  }, [isAdmin, customerId]);

  const emit = useCallback((event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
      return true;
    } else {
      console.warn('Socket not connected, cannot emit:', event);
      return false;
    }
  }, [socket, isConnected]);

  const on = useCallback((event, callback) => {
    if (socket) {
      socket.on(event, callback);
      return () => socket.off(event, callback);
    }
  }, [socket]);

  const off = useCallback((event, callback) => {
  if (socket) {
    socket.off(event, callback);
  }
}, [socket]);

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      socketId,
      emit,
      on,
      off
    }}>
      {children}
    </SocketContext.Provider>
  );
};