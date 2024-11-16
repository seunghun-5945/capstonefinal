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

  const suggestCode = async () => {
    if (!code.trim()) {
      setResponse("코드를 입력해주세요.");
      return;
    }
    try {
      const result = await fetch("http://localhost:8000/api/suggest-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        mode: "cors",
        body: JSON.stringify({ code }),
      });

      if (!result.ok) {
        throw new Error(`HTTP error! status: ${result.status}`);
      }

      const data = await result.json();
      setResponse(`코드 제안:\n${data.suggestion}`);
    } catch (error) {
      console.error("Error details:", error);
      setResponse(`제안 오류: ${error.message}`);
    }
  };

  const askCopilot = async () => {
    if (!question.trim()) {
      setResponse("질문을 입력해주세요.");
      return;
    }
    try {
      const result = await fetch("http://localhost:8000/api/ask-copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        mode: "cors",
        body: JSON.stringify({ question }),
      });

      if (!result.ok) {
        throw new Error(`HTTP error! status: ${result.status}`);
      }

      const data = await result.json();
      setResponse(`Copilot 응답:\n${data.answer}`);
    } catch (error) {
      console.error("Error details:", error);
      setResponse(`응답 오류: ${error.message}`);
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
        placeholder="코드에 대해 질문하기"
      />

      <ButtonGroup>
        <Button onClick={suggestCode}>코드 제안</Button>
        <Button onClick={askCopilot}>Ask Copilot</Button>
      </ButtonGroup>

      <OutputArea>{response}</OutputArea>
    </Container>
  );
};

export default AiSupport;
