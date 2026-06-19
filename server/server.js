const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");

const app = express();

const rooms = {};
const roomMessages = {};
const executeRoute = require("./routes/execute");
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);
app.use(express.json());
app.use("/execute", executeRoute);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://code-collab-phi-one.vercel.app"],
    methods: ["GET", "POST"],
  },
});

const languageMap = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54,
};

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("join-room", ({ roomId, username }) => {
    socket.join(roomId);

    socket.username = username;

    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }

    if (!roomMessages[roomId]) {
      roomMessages[roomId] = [];
    }

    rooms[roomId].push({
      socketId: socket.id,
      username,
    });

    socket.emit("chat-history", roomMessages[roomId]);

    socket.to(roomId).emit("new-user-joined", {
      socketId: socket.id,
    });

    io.to(roomId).emit(
      "participants-update",
      rooms[roomId].map((user) => user.username),
    );

    console.log(`${username} Joined Room ${roomId}`);
  });

  // ===== CHAT SYSTEM =====

  socket.on("send-message", ({ roomId, content }) => {
    const message = {
      _id: Date.now().toString(),
      sender: {
        name: socket.username || "Guest",
      },
      content,
      createdAt: new Date(),
    };

    if (!roomMessages[roomId]) {
      roomMessages[roomId] = [];
    }

    roomMessages[roomId].push(message);

    io.to(roomId).emit("receive-message", message);
  });

  // ===== PHASE 3 =====

  socket.on("code-change", ({ roomId, code }) => {
    socket.to(roomId).emit("code-change", code);
  });

  // ===== PHASE 3.2 =====

  socket.on("sync-code", ({ socketId, code }) => {
    io.to(socketId).emit("code-change", code);
  });

  // ===== PHASE 4 =====

  socket.on("language-change", ({ roomId, language }) => {
    socket.to(roomId).emit("language-change", language);
  });

  socket.on("sync-language", ({ socketId, language }) => {
    io.to(socketId).emit("language-change", language);
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
        // Keep roomMessages so room chat history persists even after all users leave.
      }
    }

    console.log("Current Rooms:");
    console.log(rooms);

    console.log("User disconnected", socket.id);
  });
});

// ===== CHAT HISTORY =====

app.get("/api/messages/:roomId", (req, res) => {
  const roomId = req.params.roomId;

  res.json(roomMessages[roomId] || []);
});

// ===== PHASE 5 =====

app.get("/", (req, res) => {
  res.send("Server is running");
});

server.listen(5000, () => {
  console.log("Server running on port http://localhost:5000");
});
