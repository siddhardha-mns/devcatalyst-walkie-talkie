const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const cors = require("cors");
const app = express();
app.use(cors()); // Enable CORS for Express routes
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for the socket connection
    methods: ["GET", "POST"]
  },
  maxHttpBufferSize: 1e7, // 10MB for audio chunks
});

// Serve static client files
app.use(express.static(path.join(__dirname, "..")));

// Room state
const rooms = {}; // { roomId: { members: Set<socketId>, activeSpeaker: socketId|null } }

function getOrCreateRoom(roomId) {
  if (!rooms[roomId]) {
    rooms[roomId] = { members: new Set(), activeSpeaker: null };
  }
  return rooms[roomId];
}

io.on("connection", (socket) => {
  console.log(`[+] Connected: ${socket.id}`);

  let currentRoom = null;
  let currentUsername = null;

  socket.on("join-room", ({ roomId, username }) => {
    if (currentRoom) {
      socket.leave(currentRoom);
      const prev = rooms[currentRoom];
      if (prev) {
        prev.members.delete(socket.id);
        if (prev.activeSpeaker === socket.id) prev.activeSpeaker = null;
        io.to(currentRoom).emit("room-update", getRoomInfo(currentRoom));
      }
    }

    currentRoom = roomId;
    currentUsername = username;
    socket.join(roomId);

    const room = getOrCreateRoom(roomId);
    room.members.add(socket.id);

    // Notify room of new member
    io.to(roomId).emit("room-update", getRoomInfo(roomId));
    socket.emit("joined", { roomId, socketId: socket.id });

    console.log(`[~] ${username} joined room: ${roomId} (${room.members.size} members)`);
  });

  // PTT start — request to speak
  socket.on("ptt-start", () => {
    if (!currentRoom) return;
    const room = rooms[currentRoom];
    if (!room) return;

    // Only allow if no one else is speaking
    if (room.activeSpeaker && room.activeSpeaker !== socket.id) {
      socket.emit("ptt-denied", { reason: "Channel busy" });
      return;
    }

    room.activeSpeaker = socket.id;
    io.to(currentRoom).emit("speaker-active", {
      id: socket.id,
      username: currentUsername,
    });
  });

  // PTT stop
  socket.on("ptt-stop", () => {
    if (!currentRoom) return;
    const room = rooms[currentRoom];
    if (!room) return;

    if (room.activeSpeaker === socket.id) {
      room.activeSpeaker = null;
      io.to(currentRoom).emit("speaker-idle");
    }
  });

  // Audio chunk relay — forward to all others in room
  socket.on("audio-chunk", ({ chunk, roomId }) => {
    if (!currentRoom || currentRoom !== roomId) return;
    const room = rooms[currentRoom];
    if (!room || room.activeSpeaker !== socket.id) return;

    // Broadcast chunk to everyone else in room
    socket.to(currentRoom).emit("audio-chunk", {
      chunk,
      from: socket.id,
      username: currentUsername,
    });
  });

  socket.on("disconnect", () => {
    if (currentRoom && rooms[currentRoom]) {
      const room = rooms[currentRoom];
      room.members.delete(socket.id);
      if (room.activeSpeaker === socket.id) {
        room.activeSpeaker = null;
        io.to(currentRoom).emit("speaker-idle");
      }
      io.to(currentRoom).emit("room-update", getRoomInfo(currentRoom));
      console.log(`[-] ${currentUsername} left room: ${currentRoom} (${room.members.size} members)`);

      if (room.members.size === 0) delete rooms[currentRoom];
    }
    console.log(`[-] Disconnected: ${socket.id}`);
  });
});

function getRoomInfo(roomId) {
  const room = rooms[roomId];
  if (!room) return { memberCount: 0, activeSpeaker: null };
  return {
    memberCount: room.members.size,
    activeSpeaker: room.activeSpeaker,
  };
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🎙️  Walkie-talkie server running on http://localhost:${PORT}`));
