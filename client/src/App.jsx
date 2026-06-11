import { Routes, Route } from "react-router-dom";
import JoinPage from "./pages/JoinPage";
import EditorPage from "./pages/EditorPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<JoinPage />} />
      <Route path="/editor/:roomId" element={<EditorPage />} />
    </Routes>
  );
}

export default App;
