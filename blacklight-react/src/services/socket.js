// ============================================================
//  SOCKET.IO SERVICE
// ============================================================
import { io } from 'socket.io-client';
import { Auth } from './auth';

let socket = null;

export const getSocket = () => {
  if (!socket && Auth.isLoggedIn()) {
    // Automatically uses window.location.origin
    socket = io(window.location.origin);
    
    socket.on('connect', () => {
      socket.emit('authenticate', { token: Auth.getToken() });
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
