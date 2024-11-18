import React, { useState } from "react";
import styled from "styled-components";

const Container = styled.div`
  width: 40%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: absolute;
  bottom: 0;
  right: 0;
  background-color: white;
  z-index: 30;
  padding: 20px;
  resize: horizontal;
  overflow: auto;
  min-width: 300px;
  max-width: 80%;

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
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Message = styled.div`
  max-width: 70%;
  padding: 10px 15px;
  border-radius: 15px;
  word-wrap: break-word;
  white-space: pre-wrap;
  position: relative;
  overflow-x: hidden;

  pre {
    background-color: #f5f5f5;
    padding: 10px;
    border-radius: 5px;
    overflow-x: hidden;
    white-space: pre-wrap;
    word-break: break-all;
  }

  code {
    font-family: "Consolas", monospace;
    background-color: #f5f5f5;
    padding: 2px 4px;
    border-radius: 3px;
  }

  ${(props) =>
    props.isUser
      ? `
    align-self: flex-end;
    background-color: #0066cc;
    color: white;
  `
      : `
    align-self: flex-start;
    background-color: #f0f0f0;
    color: black;
  `}
`;

const InputContainer = styled.div`
  display: flex;
  gap: 10px;
  padding: 10px;
  align-items: flex-start;
`;

const StyledInput = styled.textarea`
  flex: 1;
  min-height: 40px;
  max-height: 200px;
  border-radius: 0px;
  padding: 10px 15px;
  border: 1px solid #ccc;
  resize: none;
  overflow-y: auto;
  overflow-x: hidden;
  line-height: 1.5;
  font-family: inherit;
  word-wrap: break-word;
  height: ${(props) => {
    const lineHeight = 24;
    const lines = props.value.split("\n").length;
    const calculatedHeight = Math.min(lines * lineHeight + 20, 200);
    return Math.max(40, calculatedHeight) + "px";
  }};

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #888;
    border-radius: 4px;
  }
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 5px;
  cursor: pointer;
  background-color: #0066cc;
  color: white;
  border: none;
  position: sticky;
  top: 0;

  &:hover {
    background-color: #0052a3;
  }
`;

const CodeActionButtons = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
`;

const ActionButton = styled.button`
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
  border: none;
  font-size: 12px;

  &.apply {
    background-color: #4caf50;
    color: white;

    &:hover {
      background-color: #45a049;
    }
  }

  &.reject {
    background-color: #f44336;
    color: white;

    &:hover {
      background-color: #da190b;
    }
  }
`;

const AiSupport = ({ onCodeApply }) => {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);

  const extractCodeFromMessage = (messageText) => {
    const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)```/;
    const match = messageText.match(codeBlockRegex);
    return match ? match[1].trim() : null;
  };

  const handleCodeApplication = (messageText, isApplying) => {
    if (isApplying) {
      const code = extractCodeFromMessage(messageText);
      if (code && onCodeApply) {
        onCodeApply(code);
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
          question: newQuestion,
          type: "simple",
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

      <ChatContainer>
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
