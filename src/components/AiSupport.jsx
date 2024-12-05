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
  background-color: #18181b;
  color: #f1f1f1;
  resize: horizontal;
  overflow: auto;
  min-width: 300px;
  max-width: 80%;
  border-left: 1px solid #27272a;
  z-index: 1000;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #27272a;
`;

const Title = styled.h1`
  font-size: 1.125rem;
  font-weight: 500;
  margin: 0;
`;

const ChatContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: #18181b;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #3f3f46;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-track {
    background-color: #18181b;
  }
`;

const MessageWrapper = styled.div`
  display: flex;
  justify-content: ${(props) => (props.isUser ? "flex-end" : "flex-start")};
  margin-bottom: 16px;
`;

const Message = styled.div`
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 8px;
  word-wrap: break-word;
  white-space: pre-wrap;
  font-size: 0.875rem;
  background-color: ${(props) => (props.isUser ? "#2563eb" : "#27272a")};
  color: ${(props) => (props.isUser ? "#ffffff" : "#f1f1f1")};
  border: ${(props) => (props.isUser ? "none" : "1px solid #3f3f46")};

  pre {
    background-color: #27272a;
    padding: 12px;
    border-radius: 6px;
    border: 1px solid #3f3f46;
    margin: 8px 0;
    font-family: "Consolas", "Monaco", monospace;
    font-size: 0.875rem;
  }

  code {
    font-family: "Consolas", "Monaco", monospace;
    background-color: #27272a;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.875rem;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
`;

const Button = styled.button`
  padding: ${(props) => (props.small ? "6px 12px" : "8px 16px")};
  border-radius: 6px;
  font-size: ${(props) => (props.small ? "0.75rem" : "0.875rem")};
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
  color: white;

  ${(props) => {
    if (props.apply)
      return `
      background-color: #059669;
      &:hover { background-color: #047857; }
    `;
    if (props.reject)
      return `
      background-color: #dc2626;
      &:hover { background-color: #b91c1c; }
    `;
    return `
      background-color: #2563eb;
      &:hover { background-color: #1d4ed8; }
    `;
  }}

  &:active {
    transform: scale(0.98);
  }
`;

const InputContainer = styled.div`
  padding: 16px;
  border-top: 1px solid #27272a;
`;

const InputWrapper = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
`;

const StyledTextarea = styled.textarea`
  flex: 1;
  min-height: 40px;
  max-height: 200px;
  padding: 12px;
  border-radius: 6px;
  background-color: #27272a;
  border: 1px solid #3f3f46;
  color: #f1f1f1;
  font-size: 0.875rem;
  resize: none;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  &::placeholder {
    color: #71717a;
  }

  &:focus {
    outline: none;
    border-color: #2563eb;
  }

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #3f3f46;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-track {
    background-color: #27272a;
  }
`;

const AiSupport = ({ onCodeApply, currentCode }) => {
  // localStorage에서 메시지 불러오기
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem("aiSupportMessages");
    return savedMessages ? JSON.parse(savedMessages) : [];
  });

  const [question, setQuestion] = useState("");
  const chatContainerRef = useRef(null);

  // 메시지가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    localStorage.setItem("aiSupportMessages", JSON.stringify(messages));
  }, [messages]);

  // 채팅창 스크롤
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // 컴포넌트가 언마운트될 때 메시지 저장
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem("aiSupportMessages", JSON.stringify(messages));
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      localStorage.setItem("aiSupportMessages", JSON.stringify(messages));
    };
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

    return matchingBlock ? matchingBlock.code : codeBlocks[0].code;
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

          if (!response.ok) throw new Error("코드 분석 실패");
          const data = await response.json();

          // changes 객체와 함께 코드 전달
          onCodeApply(code, data.changes);
        } catch (error) {
          console.error("코드 적용 중 오류:", error);
        }
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
          code: currentCode,
          current_code: currentCode,
          question: newQuestion,
          type: "simple",
          chat_history: messages,
        }),
      });

      if (!result.ok) throw new Error(`HTTP error! status: ${result.status}`);
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
    // 로컬 스토리지에서도 메시지 삭제
    localStorage.removeItem("aiSupportMessages");
    setMessages([]);
    setQuestion("");
  };

  const MessageComponent = ({ message }) => {
    const isOptimizedCode = !message.isUser && message.text.includes("```");

    return (
      <MessageWrapper isUser={message.isUser}>
        <Message isUser={message.isUser}>
          {message.text}
          {isOptimizedCode && (
            <ActionButtons>
              <Button
                small
                apply
                onClick={() => handleCodeApplication(message.text, true)}
              >
                코드 적용하기
              </Button>
              <Button
                small
                reject
                onClick={() => handleCodeApplication(message.text, false)}
              >
                거절하기
              </Button>
            </ActionButtons>
          )}
        </Message>
      </MessageWrapper>
    );
  };

  return (
    <Container>
      <Header>
        <Title>AI 응답</Title>
        <Button onClick={handleRefresh}>새 대화 시작하기</Button>
      </Header>

      <ChatContainer ref={chatContainerRef}>
        {messages.map((message, index) => (
          <MessageComponent key={index} message={message} />
        ))}
      </ChatContainer>

      <InputContainer>
        <InputWrapper>
          <StyledTextarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="질문을 입력하세요..."
          />
          <Button onClick={askCopilot}>전송</Button>
        </InputWrapper>
      </InputContainer>
    </Container>
  );
};

export default AiSupport;
