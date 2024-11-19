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

  .ace_scrollbar-h::-webkit-scrollbar {
    height: 8px;
  }

  .ace_scrollbar-v::-webkit-scrollbar {
    width: 8px;
  }
`;

const DiffButtons = styled.div`
  position: absolute;
  display: flex;
  gap: 4px;
  padding: 4px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const DiffButton = styled.button`
  padding: 2px 8px;
  border-radius: 3px;
  border: none;
  cursor: pointer;
  font-size: 12px;

  &.accept {
    background: #34c759;
    color: white;
  }

  &.reject {
    background: #ff3b30;
    color: white;
  }
`;

const SuggestionText = styled.div`
  position: absolute;
  color: #666;
  opacity: 0.8;
  pointer-events: none;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 16px;
  white-space: pre;
  background: transparent;
  padding: 0 4px;
  z-index: 100;
`;

const getCommonPrefixLength = (str1, str2) => {
  let i = 0;
  while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
    i++;
  }
  return i;
};

const Editor = ({ filePath, terminalRef, initialContent }) => {
  const editorRef = useRef(null);
  const [editorContent, setEditorContent] = useState("");
  const [editorLanguage, setEditorLanguage] = useState("javascript");
  const [isRunning, setIsRunning] = useState(false);
  const [openAiSupport, setOpenAiSupport] = useState(true);
  const [codeMarkers, setCodeMarkers] = useState([]);
  const socketRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const [suggestion, setSuggestion] = useState("");
  const [cursorPosition, setCursorPosition] = useState({ row: 0, column: 0 });

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

  // 메시지 전송 함수
  const sendMessage = (message) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  };

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

  useEffect(() => {
    if (editorRef.current && suggestion) {
      const editor = editorRef.current.editor;
      const session = editor.getSession();
      const position = editor.getCursorPosition();

      // 기존 마커 제거
      if (session.markerIds) {
        session.markerIds.forEach((id) => session.removeMarker(id));
      }
      session.markerIds = [];

      // 새로운 마커 추가
      const marker = {
        type: "text",
        value: suggestion,
        position: position,
        inFront: true,
      };

      const markerId = session.addDynamicMarker(marker, true);
      session.markerIds = [...(session.markerIds || []), markerId];

      // Tab 키 이벤트 핸들러 업데이트
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

  const handleKeyDown = (event) => {
    if (event.key === "Tab" && suggestion) {
      event.preventDefault();

      const editor = editorRef.current.editor;
      const session = editor.getSession();
      const position = editor.getCursorPosition();
      const currentLine = session.getLine(position.row);

      let commonPrefixLength = 0;
      while (
        commonPrefixLength < currentLine.length &&
        commonPrefixLength < suggestion.length &&
        currentLine[commonPrefixLength] === suggestion[commonPrefixLength]
      ) {
        commonPrefixLength++;
      }

      const uniqueSuggestionPart = suggestion.slice(commonPrefixLength);
      session.insert(position, uniqueSuggestionPart);
      setEditorContent(session.getValue());
      setSuggestion("");
      editor.focus();
    }
  };

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
    console.log("Editor에서 받은 새 코드:", newCode);
    if (newCode && editorRef.current) {
      try {
        setEditorContent(newCode);
        editorRef.current.editor.setValue(newCode, -1);
        console.log("에디터 내용 업데이트 완료");
      } catch (error) {
        console.error("에디터 업데이트 중 오류:", error);
      }
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
          style={{ fontSize: "35px", color: "white" }}
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
          onKeyDown={handleKeyDown}
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
              top: `${cursorPosition.row * 19 + 4}px`,
              left: `${cursorPosition.column * 8 + 50}px`,
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

Editor.defaultProps = {
  terminalRef: { current: null },
};

export default Editor;
