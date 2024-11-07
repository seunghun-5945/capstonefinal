import React, { useEffect, useRef, useState } from "react";
import AceEditor from "react-ace";

// Ace Editor 테마와 언어 모드 import
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/mode-css";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/mode-markdown";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";

const Editor = ({ filePath, terminalRef, initialContent }) => {
  const editorRef = useRef(null);
  const [editorContent, setEditorContent] = useState("");
  const [editorLanguage, setEditorLanguage] = useState("javascript");
  const [isRunning, setIsRunning] = useState(false);

  // 누나 여기부분 추가해줘 1
  useEffect(() => {
    if (initialContent) {
      setEditorContent(initialContent);
    }
  }, [initialContent]);

  useEffect(() => {
    if (filePath) {
      loadFileContent(filePath);
    }
  }, [filePath]);

  const loadFileContent = async (path) => {
    try {
      const content = await window.electronAPI.readFile(path);
      setEditorContent(content);
      const language = getLanguageFromExtension(path.split(".").pop());
      setEditorLanguage(language);
    } catch (error) {
      console.error("Error loading file:", error);
    }
  };

  const getLanguageFromExtension = (extension) => {
    const languageMap = {
      js: "javascript",
      py: "python",
      html: "html",
      css: "css",
      json: "json",
      md: "markdown",
      txt: "text",
    };
    return languageMap[extension] || "text";
  };

  const handleSave = async () => {
    if (filePath && editorRef.current) {
      try {
        const content = editorRef.current.editor.getValue();
        await window.electronAPI.writeFile(filePath, content);
        return true;
      } catch (error) {
        console.error("Error saving file:", error);
        return false;
      }
    }
    return false;
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filePath]);

  const handleRunCode = async () => {
    if (!filePath || !terminalRef?.current?.executeCommandFromExternal) {
      console.warn("Terminal or file not ready");
      return;
    }

    const extension = filePath.split(".").pop().toLowerCase();
    let command = "";

    switch (extension) {
      case "py":
        command = `python "${filePath}"`;
        break;
      case "js":
        command = `node "${filePath}"`;
        break;
      default:
        console.warn("Unsupported file type");
        return;
    }

    const saveSuccess = await handleSave();
    if (saveSuccess) {
      setIsRunning(true);
      terminalRef.current.executeCommandFromExternal(command);
    }
  };

  const handleStopCode = async () => {
    if (!terminalRef?.current?.executeCommandFromExternal) {
      return;
    }

    try {
      await window.electronAPI.stopCode();
      setIsRunning(false);
      terminalRef.current.executeCommandFromExternal("\x03");
    } catch (error) {
      console.error("Error stopping code:", error);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        className="editor-toolbar"
        style={{
          padding: "4px 8px",
          backgroundColor: "#1e1e1e",
          borderBottom: "1px solid #333",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <button
          onClick={handleSave}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Save
        </button>
        {filePath && (
          <>
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className={`px-3 py-1 text-sm rounded focus:outline-none focus:ring-2 ${
                isRunning
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600 focus:ring-green-500"
              } text-white`}
            >
              {isRunning ? "Running..." : "Run"}
            </button>
            {isRunning && (
              <button
                onClick={handleStopCode}
                className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
              >
                Stop
              </button>
            )}
          </>
        )}
        {filePath && (
          <span className="text-gray-400 text-sm ml-2">{filePath}</span>
        )}
      </div>
      <div style={{ flex: 1, position: "relative" }}>
        <AceEditor
          ref={editorRef}
          mode={editorLanguage}
          theme="monokai"
          name="editor"
          value={editorContent}
          onChange={setEditorContent}
          width="100%"
          height="100%"
          fontSize={14}
          showPrintMargin={true}
          showGutter={true}
          highlightActiveLine={true}
          setOptions={{
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            enableSnippets: true,
            showLineNumbers: true,
            tabSize: 2,
            useWorker: false,
          }}
        />
      </div>
    </div>
  );
};

Editor.defaultProps = {
  terminalRef: { current: null },
};

export default Editor;
