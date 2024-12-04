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

const Title = styled.h1`
  font-size: 1.8rem;
  color: #2d2d2d;
  margin-bottom: 2rem;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.9rem;
  font-weight: 500;
  color: #4a4a4a;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background-color: ${props => props.disabled ? '#f5f5f5' : 'white'};
  font-size: 0.9rem;
  color: ${props => props.disabled ? '#999' : '#2d2d2d'};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: border-color 0.2s, box-shadow 0.2s;

  &:hover {
    border-color: ${props => props.disabled ? '#e0e0e0' : '#2196f3'};
  }

  &:focus {
    outline: none;
    border-color: ${props => props.disabled ? '#e0e0e0' : '#2196f3'};
    box-shadow: ${props => props.disabled ? 'none' : '0 0 0 2px rgba(33, 150, 243, 0.1)'};
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background-color: ${props => props.disabled ? '#f5f5f5' : 'white'};
  font-size: 0.9rem;
  color: ${props => props.disabled ? '#999' : '#2d2d2d'};
  transition: border-color 0.2s, box-shadow 0.2s;

  &:hover {
    border-color: ${props => props.disabled ? '#e0e0e0' : '#2196f3'};
  }

  &:focus {
    outline: none;
    border-color: ${props => props.disabled ? '#e0e0e0' : '#2196f3'};
    box-shadow: ${props => props.disabled ? 'none' : '0 0 0 2px rgba(33, 150, 243, 0.1)'};
  }
`;

const Button = styled.button`
  width: 45%;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  background-color: #2196f3;
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #1976d2;
  }

  &:active {
    background-color: #1565c0;
  }

  &:disabled {
    background-color: #e0e0e0;
    cursor: not-allowed;
  }
`;

const BrowseButton = styled(Button)`
  background-color: white;
  border: 1px solid #e0e0e0;
  color: #2d2d2d;

  &:hover {
    background-color: #f5f5f5;
  }
`;

const DestinationDisplay = styled.div`
  margin-top: 0.5rem;
  padding: 0.75rem;
  background-color: #f5f5f5;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #4a4a4a;
  word-break: break-all;
`;

const Message = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  ${props => props.success ? `
    background-color: #e8f5e9;
    color: #2e7d32;
  ` : `
    background-color: #ffebee;
    color: #c62828;
  `}
`;

const ButtonGroup = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
`;

const CloneRepo = ({ onClose }) => {
  const [repoUrl, setRepoUrl] = useState("");
  const [destination, setDestination] = useState("");
  const [message, setMessage] = useState("");
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [token, setToken] = useState(null);
  const [inputMethod, setInputMethod] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("github_token");
    if (storedToken) {
      setToken(storedToken);
      fetchUserRepos(storedToken);
    }
  }, []);

  const fetchUserRepos = async (token) => {
    try {
      const response = await axios.get(
        "http://localhost:8000/users/api/user-repos",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setRepos(response.data);
    } catch (error) {
      console.error("Error fetching user repos:", error);
      setMessage("Failed to fetch repositories");
    }
  };

  const handleRepoSelect = (e) => {
    const repo = e.target.value;
    if (repo) {
      setSelectedRepo(repo);
      setRepoUrl(`https://github.com/${repo}.git`);
      setInputMethod("select");
    } else {
      setSelectedRepo("");
      setRepoUrl("");
      setInputMethod("");
    }
  };

  const handleManualInput = (e) => {
    const url = e.target.value;
    setRepoUrl(url);
    setSelectedRepo("");
    setInputMethod(url ? "manual" : "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!destination) {
      setMessage("클론할 위치를 선택해주세요.");
      return;
    }
    if (!repoUrl) {
      setMessage("레포지토리를 선택하거나 주소를 입력해주세요.");
      return;
    }
    
    try {
      const response = await axios.post("http://localhost:8000/users/clone-repo", {
        repo_url: repoUrl,
        destination: destination,
      });
      setMessage(`Repository cloned successfully: ${response.data.path}`);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setMessage(error.response ? error.response.data.detail : "Error cloning repository");
    }
  };

  const handleLoadLocalDirectory = async () => {
    try {
      const dirPath = await window.electronAPI.openDirectory();
      if (dirPath) {
        setDestination(dirPath);
      }
    } catch (error) {
      console.error("Error selecting directory:", error);
      setMessage("Failed to select directory");
    }
  };

  return (
    <Container>
      <Title>깃허브 저장소 클론</Title>
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>내 계정에서 저장소 선택</Label>
          <Select
            value={selectedRepo}
            onChange={handleRepoSelect}
            disabled={inputMethod === "manual"}
          >
            <option value="">레포지토리 선택</option>
            {repos.map((repo) => (
              <option key={repo} value={repo}>
                {repo}
              </option>
            ))}
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>저장소 주소 입력</Label>
          <Input
            type="text"
            value={repoUrl}
            onChange={handleManualInput}
            placeholder="https://github.com/username/repository.git"
            disabled={inputMethod === "select"}
          />
        </FormGroup>

        <FormGroup>
          <Label>클론할 위치</Label>
          <BrowseButton type="button" onClick={handleLoadLocalDirectory}>
            찾아보기...
          </BrowseButton>
          {destination && (
            <DestinationDisplay>{destination}</DestinationDisplay>
          )}
        </FormGroup>

        <ButtonGroup>
          <Button type="submit">레포지토리 클론</Button>
          <Button 
            type="button"
            onClick={onClose}
            style={{backgroundColor:"red"}}>
            닫기
          </Button>
        </ButtonGroup>

        {message && (
          <Message success={message.includes('successfully')}>
            {message}
          </Message>
        )}
      </Form>
    </Container>
  );
};

export default CloneRepo;