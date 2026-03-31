import { io, type Socket } from "socket.io-client";

const SOCKET_BASE_URL =
  import.meta.env.VITE_SOCKET_URL?.replace(/\/$/, "") ||
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "";

let socket: Socket | null = null;
let currentSocketToken: string | null = null;

export function getOwnerSocket(token: string) {
  if (!SOCKET_BASE_URL) {
    throw new Error("VITE_API_BASE_URL or VITE_SOCKET_URL is not configured.");
  }

  if (socket && currentSocketToken === token) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_BASE_URL, {
    transports: ["websocket"],
    auth: {
      token,
    },
  });
  currentSocketToken = token;

  return socket;
}

export function disconnectOwnerSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  currentSocketToken = null;
}
