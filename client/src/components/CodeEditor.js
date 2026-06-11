import MonacoEditor from "@monaco-editor/react";

function Editor() {
  return (
    <MonacoEditor
      height="100vh"
      defaultLanguage="javascript"
      defaultValue="// Start coding here..."
      theme="vs-dark"
    />
  );
}

export default Editor;
