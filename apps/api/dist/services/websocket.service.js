"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastAlert = exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
let io;
const initSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });
    io.on("connection", (socket) => {
        console.log("Client connected to WebSocket:", socket.id);
        socket.on("joinProject", (projectId) => {
            socket.join(`project_${projectId}`);
            console.log(`Socket ${socket.id} joined project_${projectId}`);
        });
        socket.on("disconnect", () => {
            console.log("Client disconnected");
        });
    });
    return io;
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized");
    }
    return io;
};
exports.getIO = getIO;
const broadcastAlert = (projectId, alert) => {
    if (io) {
        io.to(`project_${projectId}`).emit("newAlert", alert);
    }
};
exports.broadcastAlert = broadcastAlert;
