import { io, type Socket } from "socket.io-client";

import { API_BASE_URL } from "@/lib/api-client";

const SOCKET_BASE_URL = process.env.EXPO_PUBLIC_SOCKET_URL?.replace(/\/$/, "") || API_BASE_URL;

let socket: Socket | null = null;
let currentToken: string | null = null;

export function getDeliverySocket(token: string) {
  if (!SOCKET_BASE_URL) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL or EXPO_PUBLIC_SOCKET_URL is not configured.");
  }

  if (socket && currentToken === token) {
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
  currentToken = token;
  return socket;
}

export function disconnectDeliverySocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  currentToken = null;
}
