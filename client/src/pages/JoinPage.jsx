import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./JoinPage.css";

function JoinPage() {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");

  const navigate = useNavigate();

  const createRoom = () => {
    const id = crypto.randomUUID().slice(0, 8);
    setRoomId(id);
  };

  const copyRoomId = async () => {
    if (!roomId) return;

    try {
      await navigator.clipboard.writeText(roomId);
      alert("Room ID copied!");
    } catch (error) {
      console.error("Failed to copy Room ID:", error);
      alert("Failed to copy Room ID");
    }
  };

  const joinRoom = () => {
    if (!username.trim()) {
      alert("Please enter a username");
      return;
    }

    if (!roomId.trim()) {
      alert("Please enter a Room ID");
      return;
    }

    console.log("Username:", username);
    console.log("Joining Room:", roomId);

    navigate(`/editor/${roomId}`, {
      state: {
        username,
      },
    });
  };

  return (
    <div className="container">
      <div className="card">
        <h1>🚀 CodeCollab</h1>

        <p className="subtitle">Real-Time Collaborative Coding Platform</p>

        <input
          type="text"
          placeholder="Enter Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && joinRoom()}
        />

        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && joinRoom()}
            style={{ flex: 1 }}
          />

          {roomId && <button onClick={copyRoomId}>📋 Copy</button>}
        </div>

        <div className="button-group">
          <button onClick={createRoom}>Create Room</button>
          <button onClick={joinRoom}>Join Room</button>
        </div>
      </div>
    </div>
  );
}

export default JoinPage;
