import React, { useState, useRef } from "react";
import FileExplorer from "./components/FileExplorer";
import Editor from "./components/Editor";
import Terminal from "./components/Terminal";
import VirtualEnvironmentSelector from "./components/VirtualEnvironmentSelector";

const App = () => {
  const [currentFile, setCurrentFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const terminalRef = useRef(null);

  // 파일 선택 시 실행되는 핸들러
  const handleFileSelect = (filePath) => {
    setCurrentFile(filePath);
  };

  // 파일 내용 변경 시 실행되는 핸들러
  const handleFileContentChange = (content) => {
    setFileContent(content);
  };

  const isFileSelected = currentFile !== null;

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div
        style={{ width: "250px", backgroundColor: "#1e1e1e", color: "#fff" }}
      >
        <FileExplorer 
          onFileSelect={handleFileSelect}
          onFileContentChange={handleFileContentChange} 
        />
        <VirtualEnvironmentSelector />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            flex: 1,
            backgroundColor: isFileSelected ? "#fff" : "#f0f0f0",
          }}
        >
          <Editor
            filePath={currentFile}
            terminalRef={terminalRef}
            initialContent={fileContent}  // 초기 파일 내용 전달
          />
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