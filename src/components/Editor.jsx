import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import AceEditor from "react-ace";
import AiSupport from "./AiSupport";
import axios from "axios";
import ace from 'ace-builds';

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

// Snippets import
import "ace-builds/src-noconflict/snippets/javascript";
import "ace-builds/src-noconflict/snippets/python";
import "ace-builds/src-noconflict/snippets/html";
import "ace-builds/src-noconflict/snippets/css";
import "ace-builds/src-noconflict/snippets/json";
import "ace-builds/src-noconflict/snippets/markdown";

import { IoIosSave } from "react-icons/io";
import { VscRunAll } from "react-icons/vsc";
import { TiMediaStop } from "react-icons/ti";
import { IoChatboxEllipsesOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

// ace 설정
ace.config.set('basePath', 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.12');

// Styled Components
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

  .ace_scrollbar-h::-webkit-scrollbar {
    height: 8px;
  }

  .ace_scrollbar-v::-webkit-scrollbar {
    width: 8px;
  }
`;

const SuggestionText = styled.div`
  width: 95%;
  height: 64%;
  position: absolute;
  color: white;
  opacity: 0.5;
  pointer-events: none;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 14px;
  white-space: pre;
  z-index: 1;
  padding: 2px 12px;
  border-radius: 2px;
  overflow: visible;
`;

// 유틸리티 함수
const getCommonPrefixLength = (str1, str2) => {
  let i = 0;
  while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
    i++;
  }
  return i;
};

const Editor = ({  
    filePath = '', 
    fileSource = 'local',
    selectedRepo = '',
    terminalRef = { current: null },
    initialContent = ''  
  }) => {
  const editorRef = useRef(null);
  const [editorContent, setEditorContent] = useState("");
  const [editorLanguage, setEditorLanguage] = useState("javascript");
  const [isRunning, setIsRunning] = useState(false);
  const [openAiSupport, setOpenAiSupport] = useState(true);
  const [codeMarkers, setCodeMarkers] = useState([]);
  const [syntaxErrors, setSyntaxErrors] = useState([]);
  const socketRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const [suggestion, setSuggestion] = useState("");
  const [cursorPosition, setCursorPosition] = useState({ row: 0, column: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const getLanguageFromExtension = (extension) => {
    const languageMap = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      py: "python",
      html: "html",
      css: "css",
      json: "json",
      md: "markdown",
      txt: "text",
    };
    return languageMap[extension] || "text";
  };

  const loadFileContent = async (filePath) => {
    if (!filePath) return;
    setIsLoading(true);

    try {
      const extension = filePath.split('.').pop().toLowerCase();
      const language = getLanguageFromExtension(extension);
      setEditorLanguage(language);

      if (fileSource === 'github' && selectedRepo) {
        const response = await axios.get(
          "http://localhost:8000/users/api/file-content",
          {
            params: {
              repo_name: selectedRepo,
              file_path: filePath.replace(/^\//, '')
            },
            headers: {
              Authorization: `Bearer ${localStorage.getItem('github_token')}`
            }
          }
        );

        const content = typeof response.data === 'object' 
          ? response.data.content || JSON.stringify(response.data, null, 2)
          : String(response.data);
        setEditorContent(content);
      } else {
        try {
          const content = await window.electronAPI.readFile(filePath);
          setEditorContent(String(content));
        } catch (err) {
          console.error(`Local file read error: ${err.message}`);
          setEditorContent('');
        }
      }
    } catch (error) {
      console.error("File loading error:", error);
      setEditorContent('');
    } finally {
      setIsLoading(false);
    }
  };

  // 초기화 및 파일 로딩
  useEffect(() => {
    const initializeEditor = async () => {
      if (initialContent) {
        setEditorContent(initialContent);
      } else if (filePath) {
        try {
          await loadFileContent(filePath);
        } catch (error) {
          console.error("Failed to load file:", error);
        }
      }
    };

    initializeEditor();
  }, [filePath, initialContent, fileSource, selectedRepo]);
  // WebSocket 연결 설정
  useEffect(() => {
    console.log("웹소켓 연결 시도...");
    socketRef.current = new WebSocket("ws://localhost:8000/socket/ws");

    socketRef.current.onopen = () => {
      console.log("웹소켓 연결 성공!");
    };

    socketRef.current.onmessage = (event) => {
      try {
        const suggestionText = event.data;
        console.log("코드 제안 받음:", suggestionText);
        setSuggestion(suggestionText);
      } catch (error) {
        console.error("메시지 파싱 에러:", error);
      }
    };

    socketRef.current.onerror = (error) => {
      console.error("웹소켓 에러:", error);
    };

    socketRef.current.onclose = () => {
      console.log("웹소켓 연결 종료");
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // 키보드 단축키 핸들러
  useEffect(() => {
    const handleKeyDown = async (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (filePath) {
          try {
            const content = editorRef.current.editor.getValue();
            await window.electronAPI.writeFile(filePath, content);
            console.log("File saved successfully");
          } catch (error) {
            console.error("Error saving file:", error);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filePath]);

  // 코드 변경 핸들러
  const handleCodeChange = (newContent) => {
    setEditorContent(newContent);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (editorRef.current) {
        const editor = editorRef.current.editor;
        const position = editor.getCursorPosition();
        const session = editor.getSession();
        const currentLine = session.getLine(position.row);

        sendMessage({
          code: newContent,
          line: currentLine,
          position: position,
        });
      }
    }, 500);
  };

  // 제안 처리
  useEffect(() => {
    if (editorRef.current && suggestion) {
      const editor = editorRef.current.editor;
      const session = editor.getSession();
      const position = editor.getCursorPosition();

      if (session.markerIds) {
        session.markerIds.forEach((id) => session.removeMarker(id));
      }
      session.markerIds = [];

      const marker = {
        type: "text",
        value: suggestion,
        position: position,
        inFront: true,
      };

      const markerId = session.addDynamicMarker(marker, true);
      session.markerIds = [...(session.markerIds || []), markerId];

      editor.commands.addCommand({
        name: "acceptSuggestion",
        bindKey: { win: "Tab", mac: "Tab" },
        exec: function (editor) {
          if (suggestion) {
            const pos = editor.getCursorPosition();
            const currentLine = session.getLine(pos.row);
            const commonPrefixLength = getCommonPrefixLength(
              currentLine,
              suggestion
            );
            const uniqueSuggestionPart = suggestion.slice(commonPrefixLength);
            session.insert(pos, uniqueSuggestionPart);
            setSuggestion("");
          }
        },
      });
    }
  }, [suggestion]);
  // 파일 저장 및 실행 관련 함수들
  const handleSave = async () => {
    if (filePath && editorRef.current) {
      try {
        navigate('/Dashboard');
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

  const handleopenAiSupport = () => {
    setOpenAiSupport(!openAiSupport);
  };

  const handleCodeApply = (newCode) => {
    if (newCode && editorRef.current) {
      try {
        setEditorContent(newCode);
        editorRef.current.editor.setValue(newCode, -1);
      } catch (error) {
        console.error("에디터 업데이트 중 오류:", error);
      }
    }
  };

  // 메시지 전송 함수
  const sendMessage = (message) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  };

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
          style={{ fontSize: "35px", color: "white", cursor: "pointer" }}
        />
        {filePath && (
          <>
            {!isRunning ? (
              <VscRunAll
                onClick={handleRunCode}
                style={{ fontSize: "35px", color: "green", cursor: "pointer" }}
              />
            ) : (
              <TiMediaStop
                onClick={handleStopCode}
                style={{ fontSize: "35px", color: "red", cursor: "pointer" }}
              />
            )}
          </>
        )}
        {filePath && <span style={{ color: "white" }}>{filePath}</span>}
        <IoChatboxEllipsesOutline
          onClick={handleopenAiSupport}
          style={{ fontSize: "35px", color: "gray", cursor: "pointer" }}
        />
        <span style={{ color: "white" }}>AI Support</span>
      </MenuBar>
      <EditorFrame>
        <AceEditor
          ref={editorRef}
          mode={editorLanguage}
          theme="monokai"
          name="editor"
          value={editorContent}
          onChange={handleCodeChange}
          onCursorChange={(selection) => {
            setCursorPosition(selection.cursor);
          }}
          width="100%"
          height="100%"
          fontSize={14}
          showPrintMargin={false}
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
            backgroundColor: "black",
          }}
          markers={codeMarkers}
          editorProps={{
            $blockScrolling: Infinity,
          }}
        />
        {suggestion && (
          <SuggestionText
            style={{
              top: `${(cursorPosition.row + 1) * 19}px`,
              left: "40px",
              width: openAiSupport ? "50%" : "100%",
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
            }}
          >
            {suggestion}
          </SuggestionText>
        )}
        {openAiSupport && (
          <AiSupport
            onCodeApply={handleCodeApply}
            currentCode={editorContent}
          />
        )}
      </EditorFrame>
    </Container>
  );
};

export default Editor;