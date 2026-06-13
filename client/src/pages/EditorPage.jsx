import { useParams, useLocation } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { useEffect, useState, useRef } from "react";
import axios from "axios";

import socket from "../socket";

function EditorPage() {
  const codeRef = useRef("");
  const editorRef = useRef(null);
  const languageRef = useRef("javascript");

  const { roomId } = useParams();
  const location = useLocation();

  const username = location.state?.username || "Guest";

  const [participants, setParticipants] = useState([]);
  const [code, setCode] = useState("// Start coding...");
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");

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
      if (newCode !== codeRef.current) {
        setCode(newCode);
        codeRef.current = newCode;
      }
    });

    socket.on("language-change", (newLanguage) => {
      setLanguage(newLanguage);
      languageRef.current = newLanguage;
    });

    socket.on("new-user-joined", ({ socketId }) => {
      socket.emit("sync-code", {
        socketId,
        code: codeRef.current,
      });

      socket.emit("sync-language", {
        socketId,
        language: languageRef.current,
      });
    });

    return () => {
      socket.off("user-joined");
      socket.off("participants-update");
      socket.off("code-change");
      socket.off("language-change");
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

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;

    setLanguage(newLanguage);
    languageRef.current = newLanguage;

    socket.emit("language-change", {
      roomId,
      language: newLanguage,
    });
  };

  const runCode = async () => {
    try {
      setOutput("Running...");

      const response = await axios.post(
        "http://localhost:5000/run-code",
        {
          code,
          language,
        }
      );

      setOutput(response.data.output);
    } catch (err) {
      console.error(err);
      setOutput("Execution Error");
    }
  };

  function handleEditorDidMount(editor) {
    editorRef.current = editor;
  }

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

      {/* Editor Section */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "10px",
            background: "#252526",
            display: "flex",
            gap: "8px",
            alignItems: "center",
          }}
        >
          <button onClick={runCode}>Run Code</button>

          <select value={language} onChange={handleLanguageChange}>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
          </select>
        </div>

        <Editor
          height="70vh"
          language={language}
          value={code}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
        />

        <div
          style={{
            background: "#1e1e1e",
            color: "#ffffff",
            padding: "10px",
            height: "20vh",
            overflowY: "auto",
            borderTop: "1px solid #333",
          }}
        >
          <h3>Output</h3>

          <pre
            style={{
              whiteSpace: "pre-wrap",
            }}
          >
            {output}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default EditorPage;