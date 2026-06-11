import { useParams, useLocation } from "react-router-dom";
import Editor from "@monaco-editor/react";

function EditorPage() {
  const { roomId } = useParams();
  const location = useLocation();

  const username = location.state?.username || "Guest";

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
      </div>

      {/* Editor */}
      <div style={{ flex: 1 }}>
        <Editor
          height="100vh"
          defaultLanguage="javascript"
          defaultValue="// Start coding..."
          theme="vs-dark"
        />
      </div>
    </div>
  );
}

export default EditorPage;
