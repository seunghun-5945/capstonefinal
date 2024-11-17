import React, { useState } from "react";
import styled from "styled-components";

const Container = styled.div`
  width: 40%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-around;
  flex-direction: column;
  position: absolute;
  bottom: 0;
  right: 0;
  background-color: white;
  z-index: 30;
  padding: 20px;
`;

const OutputArea = styled.div`
  width: 80%;
  height: 40%;
  border: 1px solid black;
  overflow-y: auto;
  padding: 10px;
  white-space: pre-wrap;
  font-family: monospace;
`;

const CodeEditor = styled.textarea`
  width: 80%;
  height: 150px;
  margin: 10px 0;
  padding: 10px;
  font-family: monospace;
`;

const StyledInput = styled.input`
  width: 80%;
  height: 40px;
  border-radius: 20px;
  padding: 0 15px;
  margin: 10px 0;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 5px;
  cursor: pointer;
  background-color: #0066cc;
  color: white;
  border: none;

  &:hover {
    background-color: #0052a3;
  }
`;

const InputValuesArea = styled.div`
  width: 80%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 10px 0;
`;

const InputValueField = styled.input`
  width: 100%;
  height: 30px;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const AiSupport = () => {
  const [code, setCode] = useState("");
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");

  const askCopilot = async () => {
    if (!code.trim() || !question.trim()) {
      setResponse("코드와 질문을 모두 입력해주세요.");
      return;
    }
    try {
      const result = await fetch("http://localhost:8000/api/gpt-4o-mini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          code,
          question,
          type: "simple",
        }),
      });

      if (!result.ok) {
        throw new Error(`HTTP error! status: ${result.status}`);
      }

      const data = await result.json();
      setResponse(`질문: ${question}\n\n답변:\n${data.answer}`);
    } catch (error) {
      console.error("Error details:", error);
      setResponse(`오류: ${error.message}`);
    }
  };

  const getDetailedExplanation = async () => {
    if (!code.trim()) {
      setResponse("코드를 입력해주세요.");
      return;
    }
    try {
      const result = await fetch("http://localhost:8000/api/gpt-4o-mini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          code: code.trim(),
          question: "",
          type: "detailed",
        }),
      });

      if (!result.ok) {
        throw new Error(`HTTP error! status: ${result.status}`);
      }

      const data = await result.json();
      setResponse(data.answer);
    } catch (error) {
      console.error("Error details:", error);
      setResponse(`설명 오류: ${error.message}`);
    }
  };

  const getCodeSuggestion = async () => {
    if (!code.trim()) {
      setResponse("코드를 입력해주세요.");
      return;
    }
    try {
      const result = await fetch("http://localhost:8000/api/gpt-4o-mini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          code: code.trim(),
          question: "",
          type: "optimize",
        }),
      });

      if (!result.ok) {
        throw new Error(`HTTP error! status: ${result.status}`);
      }

      const data = await result.json();
      setResponse("코드 최적화 제안:\n\n" + data.answer);
    } catch (error) {
      console.error("Error details:", error);
      setResponse(`코드 제안 오류: ${error.message}`);
    }
  };

  return (
    <Container>
      <h1>AI 응답</h1>

      <CodeEditor
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="코드를 입력하세요..."
      />

      <StyledInput
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="질문을 입력하세요..."
      />

      <ButtonGroup>
        <Button onClick={askCopilot}>Ask Copilot</Button>
        <Button onClick={getDetailedExplanation}>설명 추가</Button>
        <Button onClick={getCodeSuggestion}>코드 제안</Button>
      </ButtonGroup>

      <OutputArea>{response}</OutputArea>
    </Container>
  );
};

export default AiSupport;
