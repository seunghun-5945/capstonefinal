import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import AceEditor from "react-ace";
import AiSupport from "./AiSupport";

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

import { IoIosSave } from "react-icons/io"; 
import { VscRunAll } from "react-icons/vsc";
import { TiMediaStop } from "react-icons/ti";
import { IoChatboxEllipsesOutline } from "react-icons/io5";

const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
`; 

const MenuBar = styled.div`
  width: 100%;
  height: 10%;
  background-color: black;
`;

const EditorFrame = styled.div`
  width: 100%;
  height: 90%;
  position: relative;
    .ace_scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
    background: transparent;
  }

  .ace_scrollbar::-webkit-scrollbar-thumb {
    background: #4a4a4a;
    border-radius: 4px;

    &:hover {
      background: #5a5a5a;
    }
  }

  .ace_scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }

  /* 가로 스크롤바 */
  .ace_scrollbar-h::-webkit-scrollbar {
    height: 8px;
  }

  /* 세로 스크롤바 */
  .ace_scrollbar-v::-webkit-scrollbar {
    width: 8px;
  }
`;

const Editor = ({ filePath, terminalRef, initialContent }) => {
  const editorRef = useRef(null);
  const [editorContent, setEditorContent] = useState("");
  const [editorLanguage, setEditorLanguage] = useState("javascript");
  const [isRunning, setIsRunning] = useState(false);
  const [openAiSupport, setOpenAiSupport] = useState(true)

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
    setIsRunning(!isRunning);
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
    setIsRunning(!isRunning);
  };

  const handleopenAiSupport = () => {
    return (
      setOpenAiSupport(!openAiSupport)
    )
  }

  return (
    <Container>
      <MenuBar
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
        <IoIosSave 
          onClick={handleSave}
          style={{fontSize:"35px", color:"white"}}
        />
        {filePath && (
          <>
            {isRunning ? (
              <VscRunAll 
                onClick={handleRunCode}
                style={{fontSize:"35px", color:"green", cursor:"pointer"}}
                disabled={isRunning}
              />
              ) : (<TiMediaStop 
                onClick={handleStopCode}
                style={{fontSize:"35px", color:"red", cursor:"pointer"}}
                disabled={isRunning}
              />
            )}
          </>
        )}
        {filePath && (
          <span style={{color:"white"}}>{filePath}</span>
        )}
        <IoChatboxEllipsesOutline 
          onClick={handleopenAiSupport}
          style={{fontSize:"35px", color:"gray", cursor:"pointer"}}
        />
        <span style={{color:"white"}}>AI Support</span>
      </MenuBar>
      <EditorFrame>
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
          style={{
            // background:"linear-gradient(to right, black ,gray"
            backgroundColor:"black"
          }}
        />
        {openAiSupport && (
          <AiSupport>
              asdads
          </AiSupport>
        )}
      </EditorFrame>
    </Container>
  );
};

Editor.defaultProps = {
  terminalRef: { current: null },
};

export default Editor;
