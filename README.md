Phase 3 
Architecture 
User A types
      ↓
Monaco Editor onChange
      ↓
socket.emit("code-change")
      ↓
Server receives
      ↓
socket.to(roomId).emit("code-change")
      ↓
User B receives
      ↓
Editor content updates
