import Editor from "@monaco-editor/react";

export default function EditorPage() {
  return (
    <div>
      <Editor
        height="90vh"
        defaultLanguage="javascript"
        defaultValue="// Start coding..."
      />
    </div>
  );
}
