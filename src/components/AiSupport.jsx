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

  pre {
    background-color: #ffffff;
    padding: 12px;
    border-radius: 8px;
    white-space: pre-wrap;
    word-break: break-all;
    border: 1px solid #e0e0e0;
    margin: 8px 0;
  }

  code {
    font-family: "SF Mono", Consolas, monospace;
    background-color: #f5f5f7;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.9em;
  }

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
      console.log("적용할 코드:", code);
      if (code && onCodeApply) {
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

          onCodeApply(code);
          console.log("코드 적용 완료");
        } catch (error) {
          console.error("코드 적용 중 오류:", error);
        }
      } else {
        console.log("유효한 코드를 찾을 수 없습니다.");
      }
    }
  };

  const askCopilot = async () => {
    if (!question.trim()) return;

    const newQuestion = question.trim();
    setMessages((prev) => [...prev, { text: newQuestion, isUser: true }]);
    setQuestion("");

    try {
      const result = await fetch("http://localhost:8000/api/gpt-4o-mini", {
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
          chat_history: messages,
        }),
      });

      if (!result.ok) {
        throw new Error(`HTTP error! status: ${result.status}`);
      }

      const data = await result.json();
      setMessages((prev) => [...prev, { text: data.answer, isUser: false }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
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
    const isOptimizedCode = !message.isUser && message.text.includes("```");

    return (
      <Message key={index} isUser={message.isUser}>
        {message.text}
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
