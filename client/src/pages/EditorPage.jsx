import { useParams, useLocation } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./EditorPage.css";

import socket from "../socket";

const API_BASE =
  "https://code-collab-sjgz.vercel.app/" || "http://localhost:5000";

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

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/messages/${roomId}`);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

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
    <div className="editor-page">
      {/* Sidebar */}
      <div className="sidebar">
        <h2 className="logo">🚀 CodeCollab</h2>

        <div className="sidebar-card">
          <div className="sidebar-label">User</div>
          <div className="sidebar-value">{username}</div>
        </div>

        <div className="sidebar-card">
          <div className="sidebar-label">Room ID</div>
          <div className="sidebar-value">{roomId}</div>
        </div>

        <h3 className="participants-title">Participants</h3>

        <ul className="participant-list">
          {participants.map((user, index) => (
            <li key={index} className="participant-item">
              <span className="participant-avatar"></span>
              {user}
            </li>
          ))}
        </ul>
      </div>

      {/* Editor Section */}
      <div className="editor-section">
        <div className="toolbar">
          <div className="toolbar-left">
            <button className="run-btn" onClick={runCode}>
              ▶ Run Code
            </button>

            <select
              className="language-select"
              value={language}
              onChange={handleLanguageChange}
            >
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
            </select>
          </div>
        </div>

        <div className="editor-container">
          <Editor
            height="70vh"
            language={language}
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorDidMount}
            theme="vs-dark"
          />
        </div>

        <div className="output-panel">
          <h3 className="output-header">Output</h3>

          <pre className="output-content">{output}</pre>
        </div>
      </div>

      {/* Chat Section */}
      <div className="chat-section">
        <h3 className="chat-header">💬 Chat</h3>

        <div className="chat-body">
          {messages.map((msg, index) => (
            <div key={msg._id || index} className="chat-message">
              <div className="chat-user">{msg.sender?.name || "Unknown"}</div>

              <div className="chat-content">{msg.content}</div>

              <small className="chat-time">
                {msg.createdAt
                  ? new Date(msg.createdAt).toLocaleTimeString()
                  : ""}
              </small>
            </div>
          ))}

          <div ref={bottomRef}></div>
        </div>

        <div className="chat-input-container">
          <input
            className="chat-input"
            type="text"
            value={text}
            placeholder="Type a message..."
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
          />

          <button className="send-btn" onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditorPage;
