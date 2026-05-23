import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getAccessToken } from '../services/api';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    console.log(`🔌 Connecting Socket.IO to: ${socketUrl}`);

    const newSocket = io(socketUrl, {
      auth: {
        token: getAccessToken()
      },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('⚡ Socket.IO Connected successfully!');
    });

    // 1) Direct assignment notifications
    newSocket.on('task:assigned', (data) => {
      console.log('📬 Socket Task Assigned:', data);
      setNotifications(prev => [
        {
          id: `${Date.now()}-${Math.random()}`,
          message: data.message,
          task: data.task,
          read: false,
          type: 'assignment',
          timestamp: new Date()
        },
        ...prev
      ]);
    });

    // 2) Project wide updates
    newSocket.on('task:updated', (data) => {
      console.log('📬 Socket Task Updated:', data);
      // We only log notification if status changed to prevent notification flooding
      if (data.isStatusChanged) {
        setNotifications(prev => [
          {
            id: `${Date.now()}-${Math.random()}`,
            message: data.message,
            task: data.task,
            read: false,
            type: 'status_change',
            timestamp: new Date()
          },
          ...prev
        ]);
      }
    });

    newSocket.on('connect_error', (err) => {
      console.warn('⚠️ Socket connection error:', err.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      console.log('🔌 Socket disconnected');
    };
  }, [user]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SocketContext.Provider value={{ socket, notifications, unreadCount, markAllAsRead, clearNotifications, markAsRead }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
