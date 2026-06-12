const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

const rooms = {};

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("join-room", ({ roomId, username }) => {
    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }

    rooms[roomId].push({
      socketId: socket.id,
      username,
    });

    socket.to(roomId).emit("new-user-joined", {
      socketId: socket.id,
    });

    io.to(roomId).emit(
      "participants-update",
      rooms[roomId].map((user) => user.username),
    );

    console.log(`${username} Joined Room ${roomId}`);
  });

  // ===== PHASE 3 =====
  socket.on("code-change", ({ roomId, code }) => {
    socket.to(roomId).emit("code-change", code);
  });

  // ===== PHASE 3.2 =====
  socket.on("sync-code", ({ socketId, code }) => {
    io.to(socketId).emit("code-change", code);
  });

  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter(
        (user) => user.socketId !== socket.id,
      );

      io.to(roomId).emit(
        "participants-update",
        rooms[roomId].map((user) => user.username),
      );

      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      }
    }

    console.log("Current Rooms:");
    console.log(rooms);

    console.log("User disconnected", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

server.listen(5000, () => {
  console.log("Server running on port http://localhost:5000");
});
