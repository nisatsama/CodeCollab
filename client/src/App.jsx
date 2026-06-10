import { useState } from "react";
import "./App.css";

function App() {
  const [roomId, setRoomId] = useState("");

  const joinRoom = () => {
    if (!roomId.trim()) {
      alert("Please enter a Room ID");
      return;
    }

    console.log("Joining Room:", roomId);

    // Later:
    // navigate(`/editor/${roomId}`)
  };

  return (
    <div className="container">
      <div className="card">
        <h1>🚀 CodeCollab</h1>

        <p className="subtitle">Real-Time Collaborative Coding Platform</p>

        <input
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />

        <button onClick={joinRoom}>Join Room</button>
      </div>
    </div>
  );
}

export default App;
