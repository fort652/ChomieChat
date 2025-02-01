import { Server } from 'socket.io';

export function initSocket(server) {
  return new Server(server, {
    path: '/api/socketio',
    addTrailingSlash: false,
    transports: ['websocket', 'polling'],
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });
} 