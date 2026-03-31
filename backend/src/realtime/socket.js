const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const { env } = require("../config/env");
const { User } = require("../modules/users/user.model");

let ioInstance = null;

function getSocketCorsOrigin() {
  return env.clientUrl === "*" ? true : env.clientUrl;
}

function ownerRoom(userId) {
  return `owner:${userId}`;
}

function deliveryRoom(userId) {
  return `delivery:${userId}`;
}

function customerRoom(userId) {
  return `customer:${userId}`;
}

function emitToRoom(room, event, payload) {
  if (!ioInstance || !room) {
    return;
  }

  ioInstance.to(room).emit(event, payload);
}

function emitOwnerOrderChanged(ownerId, payload) {
  emitToRoom(ownerRoom(ownerId), "owner:orders:changed", payload);
}

function emitDeliveryOrdersChanged(deliveryPartnerId, payload) {
  emitToRoom(deliveryRoom(deliveryPartnerId), "delivery:orders:changed", payload);
}

function emitCustomerOrderChanged(customerId, payload) {
  emitToRoom(customerRoom(customerId), "customer:orders:changed", payload);
}

async function authenticateSocket(socket, next) {
  try {
    const authToken =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, "").trim();

    if (!authToken || !env.jwtSecret) {
      return next(new Error("Authentication required"));
    }

    const payload = jwt.verify(authToken, env.jwtSecret);
    const user = await User.findOne({ _id: payload.sub, isActive: true }).lean();

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.data.user = {
      id: String(user._id),
      role: user.role,
    };

    return next();
  } catch (_error) {
    return next(new Error("Invalid or expired token"));
  }
}

function bindSocketHandlers(io) {
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    const user = socket.data.user;

    if (!user) {
      socket.disconnect();
      return;
    }

    if (user.role === "restaurant_owner") {
      socket.join(ownerRoom(user.id));
    }

    if (user.role === "delivery_partner") {
      socket.join(deliveryRoom(user.id));
    }

    if (user.role === "customer") {
      socket.join(customerRoom(user.id));
    }
  });
}

function initSocket(server) {
  ioInstance = new Server(server, {
    cors: {
      origin: getSocketCorsOrigin(),
      credentials: true,
    },
  });

  bindSocketHandlers(ioInstance);
  return ioInstance;
}

function getIo() {
  return ioInstance;
}

module.exports = {
  initSocket,
  getIo,
  emitOwnerOrderChanged,
  emitDeliveryOrdersChanged,
  emitCustomerOrderChanged,
};
