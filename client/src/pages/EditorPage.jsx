import { useParams, useLocation } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { useEffect, useState, useRef } from "react";

import socket from "../socket";

function EditorPage() {
  const codeRef = useRef("");

  const { roomId } = useParams();
  const location = useLocation();

  const username = location.state?.username || "Guest";

  const [participants, setParticipants] = useState([]);
  const [code, setCode] = useState("// Start coding...");

  useEffect(() => {
    socket.emit("join-room", {
      roomId,
      username,
    });

    socket.on("user-joined", ({ username }) => {
      console.log(`${username} joined`);
    });

    socket.on("participants-update", (users) => {
      console.log("Participants Update:", users);
      setParticipants(users);
    });

    socket.on("code-change", (newCode) => {
      setCode(newCode);
      codeRef.current = newCode;
    });

    // When a new user joins, send them current code
    socket.on("new-user-joined", ({ socketId }) => {
      socket.emit("sync-code", {
        socketId,
        code: codeRef.current,
      });
    });

    return () => {
      socket.off("user-joined");
      socket.off("participants-update");
      socket.off("code-change");
      socket.off("new-user-joined");
    };
  }, [roomId, username]);

  const handleCodeChange = (value) => {
    const updatedCode = value || "";

    setCode(updatedCode);
    codeRef.current = updatedCode;

    socket.emit("code-change", {
      roomId,
      code: updatedCode,
    });
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: "250px",
          background: "#1e1e1e",
          color: "white",
          padding: "20px",
        }}
      >
        <h2>🚀 CodeCollab</h2>

        <hr />

        <p>
          <strong>User:</strong> {username}
        </p>

        <p>
          <strong>Room:</strong> {roomId}
        </p>

        <hr />

        <h3>Participants</h3>

        <ul>
          {participants.map((user, index) => (
            <li key={index}>{user}</li>
          ))}
        </ul>
      </div>

      {/* Editor */}
      <div style={{ flex: 1 }}>
        <Editor
          height="100vh"
          defaultLanguage="javascript"
          value={code}
          onChange={handleCodeChange}
          theme="vs-dark"
        />
      </div>
    </div>
  );
}

export default EditorPage;
