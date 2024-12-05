import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import AceEditor from "react-ace";
import AiSupport from "./AiSupport";
import axios from "axios";
import ace from "ace-builds";

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

// 대신 언어별 모드를 사용하여 구문 분석 활성화
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/mode-css";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/mode-c_cpp";

import { IoIosSave } from "react-icons/io";
import { VscRunAll } from "react-icons/vsc";
import { TiMediaStop } from "react-icons/ti";
import { IoChatboxEllipsesOutline } from "react-icons/io5";

// ace 설정
ace.config.set("basePath", "https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.12");

// Styled Components
const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

// 에러 표시를 위한 styled component 추가
const ErrorList = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: #2d2d2d;
  color: #fff;
  max-height: 150px;
  overflow-y: auto;
  border-top: 1px solid #444;
`;

const ErrorItem = styled.div`
  padding: 8px 12px;
  border-bottom: 1px solid #444;
  display: flex;
  align-items: center;
  
  &:hover {
    background: #383838;
  }
  
  .error-type {
    color: #ff6b6b;
    margin-right: 8px;
  }
  
  .error-line {
    color: #69db7c;
    margin-right: 8px;
  }
`;

// 스타일 컴포넌트 추가
const SuggestionTooltip = styled.div`
  position: absolute;
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 8px 12px;
  border-radius: 6px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  border: 1px solid #404040;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 100;
  max-width: 400px;
  white-space: pre-wrap;
  word-break: break-all;

  &::before {
    content: '';
    position: absolute;
    top: -5px;
    left: 10px;
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-bottom: 5px solid #404040;
  }

  .shortcut {
    margin-top: 4px;
    padding-top: 4px;
    border-top: 1px solid #404040;
    font-size: 11px;
    color: #888;
  }
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
  filePath = "",
  fileSource = "local",
  selectedRepo = "",
  terminalRef = { current: null },
  initialContent = "",
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
  const [annotations, setAnnotations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const getLanguageFromExtension = (extension) => {
    const languageMap = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      py: "python",
      cpp: "c_cpp",  // C++ 파일 추가
      c: "c_cpp",    // C 파일 추가
      h: "c_cpp",    // 헤더 파일 추가
      hpp: "c_cpp",  // C++ 헤더 파일 추가
      html: "html",
      css: "css",
      json: "json",
      md: "markdown",
      txt: "text",
    };
    return languageMap[extension] || "text";
  };

  useEffect(() => {
    // 파일 경로가 있으면 확장자로 언어 설정
    if (filePath) {
      const extension = filePath.split(".").pop().toLowerCase();
      const language = getLanguageFromExtension(extension);
      setEditorLanguage(language);
    } else {
      // 기본값으로 javascript 설정
      setEditorLanguage("javascript");
    }
  }, [filePath]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      // 에디터 프레임 기준의 상대 위치 계산
      const editorRect = editorRef.current?.editor?.container.getBoundingClientRect();
      if (editorRect) {
        setMousePosition({
          x: e.clientX - editorRect.left,
          y: e.clientY - editorRect.top
        });
      }
    };

    const editorElement = editorRef.current?.editor?.container;
    if (editorElement) {
      editorElement.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (editorElement) {
        editorElement.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  const handleEditorLoad = (editor) => {
    const session = editor.getSession();
    
    // 에러와 경고를 수집하는 이벤트 리스너
    session.on("changeAnnotation", () => {
      const newAnnotations = session.getAnnotations();
      setAnnotations(newAnnotations);
      
      // 마커 업데이트
      const newMarkers = newAnnotations.map((ann) => ({
        startRow: ann.row,
        endRow: ann.row,
        startCol: 0,
        endCol: 1000,
        className: `ace_${ann.type}`,
        type: ann.type
      }));
      setCodeMarkers(newMarkers);
    });
  };

  const loadFileContent = async (filePath) => {
    if (!filePath) return;
    setIsLoading(true);

    try {
      const extension = filePath.split(".").pop().toLowerCase();
      const language = getLanguageFromExtension(extension);
      setEditorLanguage(language);

      if (fileSource === "github" && selectedRepo) {
        const response = await axios.get(
          "http://localhost:8000/users/api/file-content",
          {
            params: {
              repo_name: selectedRepo,
              file_path: filePath.replace(/^\//, ""),
            },
            headers: {
              Authorization: `Bearer ${localStorage.getItem("github_token")}`,
            },
          }
        );

        const content =
          typeof response.data === "object"
            ? response.data.content || JSON.stringify(response.data, null, 2)
            : String(response.data);
        setEditorContent(content);
      } else {
        try {
          const content = await window.electronAPI.readFile(filePath);
          setEditorContent(String(content));
        } catch (err) {
          console.error(`Local file read error: ${err.message}`);
          setEditorContent("");
        }
      }
    } catch (error) {
      console.error("File loading error:", error);
      setEditorContent("");
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
        // "제안할 코드:" 라인과 모든 언어 식별자 라인을 제거
        const cleanedText = suggestionText
          .replace(/코드 변경 감지:.*\n/g, "") // "코드 변경 감지" 라인 제거
          .replace(/제안할 코드:.*\n/g, "") // "제안할 코드:" 라인 제거
          .replace(/^\w+\n/gm, "") // 언어 식별자 라인 제거 (예: python, javascript 등)
          .trim();
        console.log("코드 제안 받음:", cleanedText);
        setSuggestion(cleanedText);
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

      // 현재 라인에서 커서 위치까지만의 텍스트를 가져옴
      const currentLine = session
        .getLine(position.row)
        .substring(0, position.column);

      sendMessage({
        code: newContent,
        line: currentLine, // 커서 위치까지만의 텍스트를 전송
        position: position,
        type: "suggestion",
      });
    }
  }, 500);
};

 // useEffect 내의 제안 처리 로직 수정
useEffect(() => {
  if (editorRef.current && suggestion) {
    const editor = editorRef.current.editor;
    const session = editor.getSession();
    const position = editor.getCursorPosition();
    
    // 현재 라인 정보 가져오기
    const currentLine = session.getLine(position.row);
    
    // 제안 수락 명령어 (Tab)
    editor.commands.addCommand({
      name: "acceptSuggestion",
      bindKey: { win: "Tab", mac: "Tab" },
      exec: function(editor) {
        if (suggestion) {
          // 현재 라인의 시작과 끝 위치
          const startPos = { row: position.row, column: 0 };
          const endPos = { row: position.row, column: currentLine.length };
          
          // 현재 라인을 제안된 코드로 교체
          const range = new ace.Range(startPos.row, startPos.column, endPos.row, endPos.column);
          session.replace(range, suggestion);
          
          // 커서를 라인 끝으로 이동
          editor.moveCursorTo(position.row, suggestion.length);
          
          setSuggestion("");
        }
        return true;
      }
    });

    // 제안 취소 명령어 (ESC)
    editor.commands.addCommand({
      name: "cancelSuggestion",
      bindKey: { win: "Esc", mac: "Esc" },
      exec: function() {
        setSuggestion("");
        return true;
      }
    });
  }
}, [suggestion]);


  // 파일 저장 및 실행 관련 함수들
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

  const handleCodeApply = (newCode, changes) => {
    if (!newCode || !editorRef.current) return;

    const editor = editorRef.current.editor;
    const session = editor.getSession();
    const doc = session.getDocument();

    // 현재 에디터의 내용이 비어있는지 확인
    const currentContent = editor.getValue().trim();

    // 빈 파일이거나 코드가 없는 경우 새 코드를 전체 삽입
    if (!currentContent) {
      try {
        // 새 코드 삽입
        editor.setValue(newCode, -1); // -1은 커서를 처음으로 이동
        setEditorContent(newCode);
        console.log("새 코드가 빈 파일에 적용되었습니다.");
        return;
      } catch (error) {
        console.error("새 코드 적용 중 오류:", error);
        return;
      }
    }

    // 기존 코드가 있는 경우의 처리 로직
    const parseStyledComponents = (code) => {
      const components = {};
      const regex = /const\s+(\w+)\s*=\s*styled\.[^`]*`([^`]*)`/g;
      let match;

      while ((match = regex.exec(code)) !== null) {
        const [_, componentName, styles] = match;
        components[componentName] = styles
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line && line.includes(":"));
      }

      return components;
    };

    // 현재 코드와 새 코드의 스타일 컴포넌트 파싱
    const currentComponents = parseStyledComponents(editor.getValue());
    const newComponents = parseStyledComponents(newCode);

    // 스타일 컴포넌트 위치 찾기
    const findComponentPosition = (componentName) => {
      const lines = doc.getAllLines();
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith(`const ${componentName} = styled.`)) {
          let endLine = i;
          while (endLine < lines.length && !lines[endLine].includes("`;")) {
            endLine++;
          }
          return { start: i, end: endLine };
        }
      }
      return null;
    };

    // 변경사항 적용
    const applyChanges = (componentName, currentStyles, newStyles) => {
      const position = findComponentPosition(componentName);
      if (!position) return;

      const currentStyleSet = new Set(currentStyles);
      const newStyleSet = new Set(newStyles);

      // 추가/수정될 스타일 찾기
      const stylesToAdd = newStyles.filter((style) => {
        const styleProp = style.split(":")[0].trim();
        const existingStyle = [...currentStyleSet].find((current) =>
          current.startsWith(styleProp + ":")
        );
        return !existingStyle || existingStyle !== style;
      });

      if (stylesToAdd.length > 0) {
        // 마지막 속성 앞에 새로운 스타일 추가
        const insertPosition = position.end - 1;
        const newContent =
          stylesToAdd.map((style) => `  ${style}`).join("\n") + "\n";

        session.insert({ row: insertPosition, column: 0 }, newContent);

        console.log(`${componentName} 컴포넌트 업데이트됨:`, stylesToAdd);
      }
    };

    try {
      // 모든 컴포넌트의 변경사항 처리
      Object.keys(newComponents).forEach((componentName) => {
        if (currentComponents[componentName]) {
          applyChanges(
            componentName,
            currentComponents[componentName],
            newComponents[componentName]
          );
        }
      });

      // 에디터 상태 업데이트
      setEditorContent(editor.getValue());
    } catch (error) {
      console.error("코드 적용 중 오류:", error);
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
          onLoad={handleEditorLoad}
          width="100%"
          height={annotations.length > 0 ? "calc(100% - 150px)" : "100%"}
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
            useWorker: true, // Worker 활성화
          }}
          style={{
            backgroundColor: "black",
          }}
          markers={codeMarkers}
          editorProps={{
            $blockScrolling: Infinity,
          }}
        />
                {annotations.length > 0 && (
          <ErrorList>
            {annotations.map((ann, index) => (
              <ErrorItem key={index} onClick={() => {
                editorRef.current.editor.gotoLine(ann.row + 1, ann.column);
              }}>
                <span className="error-type">{ann.type.toUpperCase()}</span>
                <span className="error-line">Line {ann.row + 1}:</span>
                <span>{ann.text}</span>
              </ErrorItem>
            ))}
          </ErrorList>
        )}
        {suggestion && (
          <SuggestionTooltip
            style={{
              position: 'absolute',
              top: `${mousePosition.y}px`,
              left: `${mousePosition.x + 20}px`, // 커서와 약간의 간격
              transform: 'translate(0, -50%)', // 말풍선을 수직 중앙 정렬
            }}
          >
    <div>{suggestion}</div>
    <div className="shortcut">
      Press Tab to replace line • Esc to cancel
    </div>
  </SuggestionTooltip>
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
