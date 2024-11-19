import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";

const Container = styled.div`
  width: 40%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: absolute;
  bottom: 0;
  right: 0;
  background-color: #ffffff;
  z-index: 30;
  padding: 20px;
  resize: horizontal;
  overflow: auto;
  min-width: 300px;
  max-width: 80%;
  box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
  border-left: 1px solid #e0e0e0;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background-color: #f0f0f0;
    cursor: ew-resize;
  }
`;

const ChatContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background-color: #f5f5f7;
  border-radius: 12px;
  margin: 10px 0;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #d1d1d6;
    border-radius: 3px;
  }
`;

const Message = styled.div`
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 20px;
  word-wrap: break-word;
  white-space: pre-wrap;
  position: relative;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  font-size: 0.95rem;

  ${(props) =>
    props.isUser
      ? `
    align-self: flex-end;
    background-color: #007AFF;
    color: white;
    margin-left: 30%;
  `
      : `
    align-self: flex-start;
    background-color: #ffffff;
    color: #1d1d1f;
    margin-right: 30%;
    border: 1px solid #e0e0e0;
  `}
`;

const InputContainer = styled.div`
  display: flex;
  gap: 12px;
  padding: 10px;
  align-items: flex-start;
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
`;

const StyledInput = styled.textarea`
  flex: 1;
  min-height: 40px;
  max-height: 200px;
  border-radius: 8px;
  padding: 12px 16px;
  border: none;
  resize: none;
  overflow-y: auto;
  overflow-x: hidden;
  line-height: 1.5;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 0.95rem;
  background-color: #f5f5f7;
  color: #1d1d1f;

  &::placeholder {
    color: #86868b;
  }

  &:focus {
    outline: none;
    background-color: #ffffff;
    box-shadow: 0 0 0 2px #007aff40;
  }

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #d1d1d6;
    border-radius: 3px;
  }
`;

const Button = styled.button`
  padding: 10px 18px;
  border-radius: 8px;
  cursor: pointer;
  background-color: #007aff;
  color: white;
  border: none;
  font-weight: 500;
  font-size: 0.95rem;
  transition: all 0.2s ease;

  &:hover {
    background-color: #0066d9;
  }

  &:active {
    transform: scale(0.98);
  }
`;

const CodeActionButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  border: none;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &.apply {
    background-color: #34c759;
    color: white;

    &:hover {
      background-color: #2db14d;
    }
  }

  &.reject {
    background-color: #ff3b30;
    color: white;

    &:hover {
      background-color: #e0352b;
    }
  }

  &:active {
    transform: scale(0.98);
  }
`;

const CodeBlock = styled.div`
  position: relative;
  margin: 16px 0;
  background-color: #1e1e1e;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`;

const CodeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #2d2d2d;
  color: #e0e0e0;
  font-size: 0.85rem;
  border-bottom: 1px solid #3d3d3d;

  span {
    color: #888;
    font-family: "SF Mono", Consolas, monospace;
    font-size: 0.8rem;
  }
`;

const CopyButton = styled.button`
  background-color: transparent;
  border: 1px solid #4d4d4d;
  color: #888;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;

  &:hover {
    background-color: #3d3d3d;
    color: #fff;
  }

  &:active {
    transform: scale(0.98);
  }
`;

const CodeContent = styled.pre`
  margin: 0;
  padding: 16px;
  color: #d4d4d4;
  font-family: "SF Mono", Consolas, monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  overflow-x: auto;
  background-color: #1e1e1e;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #1e1e1e;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #4d4d4d;
    border-radius: 3px;

    &:hover {
      background-color: #5d5d5d;
    }
  }
`;

const AiSupport = ({ onCodeApply, currentCode }) => {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const extractCodeFromMessage = (messageText) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const matches = [...messageText.matchAll(codeBlockRegex)];

    if (matches.length === 0) {
      console.log("코드 블록을 찾을 수 없습니다.");
      return null;
    }

    const codeBlocks = matches.map((match) => ({
      language: match[1] || "text",
      code: match[2].trim(),
    }));

    console.log("찾은 코드 블록들:", codeBlocks);

    const editorLanguage =
      currentCode.includes("def ") || currentCode.includes("import ")
        ? "python"
        : "javascript";
    const matchingBlock = codeBlocks.find(
      (block) =>
        block.language.toLowerCase() === editorLanguage ||
        (editorLanguage === "javascript" &&
          block.language.toLowerCase() === "js") ||
        (editorLanguage === "python" && block.language.toLowerCase() === "py")
    );

    if (matchingBlock) {
      console.log("적용할 코드 블록:", matchingBlock);
      return matchingBlock.code;
    }

    console.log(
      "언어 일치하는 코드 블록이 없어 첫 번째 블록 사용:",
      codeBlocks[0]
    );
    return codeBlocks[0].code;
  };

  const handleCodeApplication = async (messageText, isApplying) => {
    if (isApplying) {
      const code = extractCodeFromMessage(messageText);
      if (code) {
        try {
          const response = await fetch(
            "http://localhost:8000/api/analyze-code-changes",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                original_code: currentCode,
                new_code: code,
              }),
            }
          );

          if (!response.ok) {
            throw new Error("코드 분석 실패");
          }

          const changes = await response.json();
          onCodeApply(code, changes.changes);
        } catch (error) {
          console.error("코드 적용 중 오류:", error);
        }
      }
    }
  };

  const askCopilot = async () => {
    if (!question.trim()) return;

    const newQuestion = question.trim();
    const newUserMessage = { text: newQuestion, isUser: true };

    // 사용자 메시지 추가
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setQuestion("");

    try {
      // 이전 대화에서 사용된 프로그래밍 언어 파악
      const codeLanguages = messages
        .filter((msg) => !msg.isUser && msg.text.includes("```"))
        .map((msg) => {
          const match = msg.text.match(/```(\w+)/);
          return match ? match[1] : null;
        })
        .filter(Boolean);

      const currentLanguage =
        codeLanguages.length > 0
          ? codeLanguages[codeLanguages.length - 1]
          : null;

      const response = await fetch("http://localhost:8000/api/gpt-4o-mini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          code: "",
          current_code: currentCode,
          question: newQuestion,
          type: "simple",
          chat_history: [...messages, newUserMessage].map((msg) => ({
            text: msg.text,
            isUser: msg.isUser,
            language: currentLanguage,
          })),
          current_language: currentLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: data.answer, isUser: false },
      ]);
    } catch (error) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: `오류: ${error.message}`, isUser: false },
      ]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askCopilot();
    }
  };

  const handleRefresh = () => {
    setMessages([]);
    setQuestion("");
  };

  const MessageComponent = ({ message, index }) => {
    const [copyStatus, setCopyStatus] = useState("");

    const copyToClipboard = async (code) => {
      try {
        await navigator.clipboard.writeText(code);
        setCopyStatus("복사됨");
        setTimeout(() => setCopyStatus(""), 2000);
      } catch (err) {
        console.error("복사 실패:", err);
        setCopyStatus("실패");
      }
    };

    const renderContent = (text) => {
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = codeBlockRegex.exec(text)) !== null) {
        // 코드 블록 이전의 텍스트 추가
        if (match.index > lastIndex) {
          parts.push(text.substring(lastIndex, match.index));
        }

        const language = match[1] || "text";
        const code = match[2].trim();

        // 코드 블록 컴포넌트 추가
        parts.push(
          <CodeBlock key={match.index}>
            <CodeHeader>
              <span>{language}</span>
              <CopyButton onClick={() => copyToClipboard(code)}>
                복사
              </CopyButton>
            </CodeHeader>
            <CodeContent>{code}</CodeContent>
          </CodeBlock>
        );

        lastIndex = match.index + match[0].length;
      }

      // 남은 텍스트 추가
      if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
      }

      return parts;
    };

    const isOptimizedCode = !message.isUser && message.text.includes("```");

    return (
      <Message isUser={message.isUser}>
        {renderContent(message.text)}
        {isOptimizedCode && (
          <CodeActionButtons>
            <ActionButton
              className="apply"
              onClick={() => handleCodeApplication(message.text, true)}
            >
              코드 적용하기
            </ActionButton>
            <ActionButton
              className="reject"
              onClick={() => handleCodeApplication(message.text, false)}
            >
              거절하기
            </ActionButton>
          </CodeActionButtons>
        )}
      </Message>
    );
  };

  return (
    <Container>
      <h1>AI 응답</h1>
      <Button onClick={handleRefresh} style={{ alignSelf: "flex-end" }}>
        새로고침
      </Button>

      <ChatContainer ref={chatContainerRef}>
        {messages.map((message, index) => (
          <MessageComponent key={index} message={message} index={index} />
        ))}
      </ChatContainer>

      <InputContainer>
        <StyledInput
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="질문을 입력하세요..."
        />
        <Button onClick={askCopilot}>전송</Button>
      </InputContainer>
    </Container>
  );
};

export default AiSupport;
