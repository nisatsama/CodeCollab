import { useParams, useLocation } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { useEffect, useState, useRef } from "react";
import axios from "axios";

import socket from "../socket";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function EditorPage() {
  const codeRef = useRef("");
  const editorRef = useRef(null);
  const languageRef = useRef("javascript");
  const bottomRef = useRef(null);

  const { roomId } = useParams();
  const location = useLocation();

  const username = location.state?.username || "Guest";

  const [participants, setParticipants] = useState([]);
  const [code, setCode] = useState("// Start coding...");
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  // Load chat history
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/messages/${roomId}`);

        // Normalize response: backend may return an array or an object { messages: [...] }
        const data = res.data;
        if (Array.isArray(data)) {
          setMessages(data);
        } else if (data && Array.isArray(data.messages)) {
          setMessages(data.messages);
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    fetchMessages();
  }, [roomId]);

  // Auto scroll chat
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // Listen for new messages and chat history
  useEffect(() => {
    const handleMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    const handleChatHistory = (history) => {
      if (Array.isArray(history)) {
        setMessages(history);
      }
    };

    socket.on("receive-message", handleMessage);
    socket.on("chat-history", handleChatHistory);

    return () => {
      socket.off("receive-message", handleMessage);
      socket.off("chat-history", handleChatHistory);
    };
  }, []);

  const sendMessage = () => {
    if (!text.trim()) return;

    socket.emit("send-message", {
      roomId,
      content: text,
    });

    setText("");
  };

  // Room + Collaboration logic
  useEffect(() => {
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

    socket.emit("join-room", {
      roomId,
      username,
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

      const response = await axios.post(`${API_BASE}/execute`, {
        code,
        language,
      });

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

      {/* Chat Section */}
      <div
        style={{
          width: "320px",
          background: "#252526",
          color: "white",
          display: "flex",
          flexDirection: "column",
          borderLeft: "1px solid #333",
        }}
      >
        <h3
          style={{
            padding: "12px",
            margin: 0,
            borderBottom: "1px solid #333",
          }}
        >
          Chat
        </h3>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "10px",
          }}
        >
          {messages.map((msg, index) => (
            <div
              key={msg._id || index}
              style={{
                marginBottom: "10px",
                padding: "8px",
                background: "#1e1e1e",
                borderRadius: "6px",
              }}
            >
              <strong>{msg.sender?.name || "Unknown"}</strong>

              <p
                style={{
                  margin: "5px 0",
                }}
              >
                {msg.content}
              </p>

              <small>
                {msg.createdAt
                  ? new Date(msg.createdAt).toLocaleTimeString()
                  : ""}
              </small>
            </div>
          ))}

          <div ref={bottomRef}></div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "5px",
            padding: "10px",
            borderTop: "1px solid #333",
          }}
        >
          <input
            type="text"
            value={text}
            placeholder="Type a message..."
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
            style={{
              flex: 1,
              padding: "8px",
            }}
          />

          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default EditorPage;
