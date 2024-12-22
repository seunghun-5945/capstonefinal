import React, { useState, useEffect } from "react";
import styled from "styled-components";
import axios from "axios";

const Container = styled.div`
  width: 50%;
  height: 75%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  z-index: 1001;
  padding: 20px;
  border-radius: 8px;
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #eaeaea;
`;

const Title = styled.h2`
  margin: 0;
  color: #333;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  &:hover {
    color: #333;
  }
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  &:focus {
    outline: none;
    border-color: #0366d6;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  height: 100px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-size: 14px;
  &:focus {
    outline: none;
    border-color: #0366d6;
  }
`;

const CommitButton = styled.button`
  padding: 8px 16px;
  background-color: #2ea44f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  margin-top: auto;
  &:hover {
    background-color: #2c974b;
  }
  &:disabled {
    background-color: #94d3a2;
    cursor: not-allowed;
  }
`;

const FileInfo = styled.div`
  padding: 8px 12px;
  background-color: #f6f8fa;
  border-radius: 4px;
  font-size: 14px;
  color: #666;
`;

const CommitModal = ({
  isOpen,
  onClose,
  token,
  repoName,
  filePath,
  content,
  isNewFile = false,
  editorContent = "", // 새로운 prop 추가
}) => {
  console.log("Received props:", { repoName, filePath }); // 디버깅용
  const [commitMessage, setCommitMessage] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentContent, setCurrentContent] = useState("");

  useEffect(() => {
    if (editorContent) {
      setCurrentContent(editorContent);
    }
  }, [editorContent]);

  if (!isOpen) return null;

  const handleCommit = async () => {
    if (!commitMessage) {
      alert("커밋 메시지를 입력하세요.");
      return;
    }
  
    if (!token || !repoName || !filePath) {
      alert("필수 정보가 누락되었습니다:\n" + 
            `토큰: ${token ? "있음" : "없음"}\n` +
            `레포지토리: ${repoName || "없음"}\n` +
            `파일 경로: ${filePath || "없음"}`);
      return;
    }
  
    setIsLoading(true);
    try {
      const endpoint = isNewFile
        ? "http://localhost:8000/users/api/create-file"
        : "http://localhost:8000/users/api/update-file";
  
      const requestBody = {
        token,
        repo_name: repoName,
        file_path: filePath.replace(/^\//, ''), // 앞쪽 슬래시 제거
        content: currentContent || "",
        branch: "main",
        commit_message: commitMessage,
        description: description || "", // 상세 설명 추가
        committer: {
          name: "GitHub Actions",
          email: "actions@github.com"
        }
      };
  
      console.log('Sending request:', {
        ...requestBody,
        token: '***', // 토큰 가리기
      });
  
      const response = await axios.post(endpoint, requestBody, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200 || response.status === 201) {
        alert("커밋이 완료되었습니다.");
        setCommitMessage("");
        setDescription("");
        onClose();
      }
    } catch (error) {
      console.error("Error committing changes:", error);
      if (error.response) {
        const errorDetail = error.response.data?.detail || error.response.data;
        console.error("Error details:", {
          status: error.response.status,
          data: errorDetail,
          headers: error.response.headers
        });
        alert(`커밋 중 오류가 발생했습니다:\n${JSON.stringify(errorDetail, null, 2)}`);
      } else {
        alert("커밋 중 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Overlay onClick={onClose} />
      <Container>
        <Header>
          <Title>변경 사항 커밋</Title>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </Header>
        <Content>
          <FileInfo>
            <strong>Repository:</strong> {repoName}<br />
            <strong>File:</strong> {filePath}
          </FileInfo>
          <Input
            placeholder="커밋 메시지를 입력하세요"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
          />
          <TextArea
            placeholder="상세 설명 (선택사항)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <CommitButton
            onClick={handleCommit}
            disabled={isLoading || !commitMessage}
          >
            {isLoading ? "커밋 중..." : "커밋하기"}
          </CommitButton>
        </Content>
      </Container>
    </>
  );
};

export default CommitModal;