// Socket.IO service for real-time progress tracking
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../constants/theme';

let socket = null;

export const connectSocket = () => {
  if (socket?.connected) return socket;
  socket = io(API_BASE_URL, {
    transports: ['websocket'],
    reconnectionAttempts: 5,
  });
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const onProgress = (jobId, callback) => {
  const s = connectSocket();
  s.on(`progress:${jobId}`, callback);
  return () => s.off(`progress:${jobId}`, callback);
};

export const onComplete = (jobId, callback) => {
  const s = connectSocket();
  s.on(`complete:${jobId}`, callback);
  return () => s.off(`complete:${jobId}`, callback);
};

export const getSocket = () => socket;
