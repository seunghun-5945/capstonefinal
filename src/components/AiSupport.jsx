import React from "react";
import { useState } from "react";
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
`;

const OutputArea = styled.div`
  width: 80%;
  height: 40%;
  border: 1px solid black;
`;

const StyledInput = styled.input`
  width: 80%;
  height: 20%;
  border-radius: 20px;
  display: flex;
  align-items: flex-start;
`;

const AiSupport = () => {
  const [request, setRequest] = useState("");
  const [suggest, setSuggest] = useState("");

  const sendRequest = () => {
    console.log(request);
  };

  const suggestCode = () => {
    console.log("코드 제안");
  };

  return (
    <Container>
      <h1>임시 AI 응답</h1>
      <OutputArea />
      <StyledInput
        onChange={(e) => setRequest(e.target.value)}
        placeholder="텍스트 입력"
      />
      <button onClick={sendRequest}>임시 전송 버튼</button>

      <button onClick={suggestCode}>코드제안</button>
    </Container>
  );
};

export default AiSupport;
