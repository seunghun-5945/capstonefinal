// src/App.jsx
import React, { useState, useRef } from "react"; // useRef import 추가
import FileExplorer from "./components/FileExplorer";
import Editor from "./components/Editor";
import Terminal from "./components/Terminal";
import VirtualEnvironmentSelector from "./components/VirtualEnvironmentSelector";

const App = () => {
  const [currentFile, setCurrentFile] = useState(null);
  const terminalRef = useRef(null); // useRef로 선언

  const handleFileSelect = (filePath) => {
    setCurrentFile(filePath);
  };

  const isFileSelected = currentFile !== null;

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div
        style={{ width: "200px", backgroundColor: "#1e1e1e", color: "#fff" }}
      >
        <FileExplorer onFileSelect={handleFileSelect} />
        <VirtualEnvironmentSelector />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            flex: 1,
            backgroundColor: isFileSelected ? "#fff" : "#f0f0f0",
          }}
        >
          {isFileSelected ? (
            <Editor
              filePath={currentFile}
              terminalRef={terminalRef} // terminalRef 전달
            />
          ) : (
            <div
              style={{ padding: "20px", textAlign: "center", color: "#888" }}
            >
              Please select a file to edit
            </div>
          )}
        </div>
        <div style={{ flex: "0 0 200px" }}>
          <Terminal
            onRef={(ref) => {
              terminalRef.current = ref;
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
