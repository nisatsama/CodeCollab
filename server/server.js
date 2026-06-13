const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");

const app = express();

const rooms = {};

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
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
      }
    }

    console.log("Current Rooms:");
    console.log(rooms);

    console.log("User disconnected", socket.id);
  });
});

// ===== PHASE 5 =====
app.post("/run-code", async (req, res) => {
  const { code, language } = req.body;

  try {
    const languageId = languageMap[language];

    if (!languageId) {
      return res.status(400).json({
        error: "Unsupported language",
      });
    }

    const submissionResponse = await axios.post(
      "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
      {
        source_code: code,
        language_id: languageId,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": "YOUR_RAPIDAPI_KEY",
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
      },
    );

    const result = submissionResponse.data;

    res.json({
      output:
        result.stdout || result.stderr || result.compile_output || "No Output",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Code execution failed",
    });
  }
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

server.listen(5000, () => {
  console.log("Server running on port http://localhost:5000");
});
