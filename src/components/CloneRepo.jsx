import React, { useState, useEffect } from "react";
import styled from "styled-components";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 20px;
  font-size: 24px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const Label = styled.label`
  font-size: 14px;
  color: #333;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #0066cc;
  }

  &:disabled {
    background-color: #f5f5f5;
  }
`;

const StyledSelect = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
  cursor: pointer;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #0066cc;
  }

  option {
    padding: 8px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const Button = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  ${props => props.$primary ? `
    background-color: #0066cc;
    color: white;
    &:hover {
      background-color: #0052a3;
    }
  ` : `
    background-color: #f0f0f0;
    color: #333;
    &:hover {
      background-color: #e0e0e0;
    }
  `}

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const Message = styled.div`
  padding: 10px;
  border-radius: 4px;
  font-size: 14px;
  margin-top: 10px;
  
  ${props => props.$type === 'error' ? `
    background-color: #ffebee;
    color: #c62828;
    border: 1px solid #ffcdd2;
  ` : props.$type === 'success' ? `
    background-color: #e8f5e9;
    color: #2e7d32;
    border: 1px solid #c8e6c9;
  ` : ''}
`;

const LoadingSpinner = styled.div`
  border: 2px solid #f3f3f3;
  border-top: 2px solid #0066cc;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
  margin-right: 8px;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const CloneRepo = ({ onClose }) => {
  const [repoUrl, setRepoUrl] = useState("");
  const [destination, setDestination] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [token, setToken] = useState(null);
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem("github_token");
    if (storedToken) {
      setToken(storedToken);
    }
    // 초기 destination 설정
    const initDestination = async () => {
      try {
        const defaultPath = await window.electronAPI.getInitialPath();
        setDestination(defaultPath);
      } catch (error) {
        console.error("Failed to get initial path:", error);
      }
    };
    initDestination();
  }, []);

  useEffect(() => {
    if (token) {
      fetchUserRepos();
    }
  }, [token]);

  const fetchUserRepos = async () => {
    setIsLoading(true);
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
      console.error("Error fetching repositories:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("github_token");
        navigate("/#/");
      }
      setMessage({
        text: "Failed to fetch repositories. Please check your connection.",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepoSelect = (repoFullName) => {
    if (repoFullName) {
      setRepoUrl(`https://github.com/${repoFullName}.git`);
      setSelectedRepo(repoFullName);
    } else {
      setRepoUrl("");
      setSelectedRepo("");
    }
  };

  const handleBrowse = async () => {
    try {
      const selectedPath = await window.electronAPI.openDirectory();
      if (selectedPath) {
        setDestination(selectedPath);
      }
    } catch (error) {
      setMessage({
        text: "Failed to select directory",
        type: "error"
      });
    }
  };

  const validateInputs = () => {
    if (!repoUrl.trim()) {
      setMessage({
        text: "Please enter a repository URL or select a repository",
        type: "error"
      });
      return false;
    }
    if (!destination.trim()) {
      setMessage({
        text: "Please select a destination directory",
        type: "error"
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setIsLoading(true);
    try {
      const repoName = repoUrl.split('/').pop().replace('.git', '');
      const fullPath = `${destination}/${repoName}`;

      const response = await axios.post(
        "http://localhost:8000/users/clone-repo",
        {
          repo_url: repoUrl,
          destination: fullPath,
          token: token
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessage({
        text: `Successfully cloned repository to: ${response.data.path}`,
        type: "success"
      });

      // 성공 후 3초 뒤에 창 닫기
      setTimeout(() => {
        if (onClose) onClose();
      }, 3000);

    } catch (error) {
      console.error("Error cloning repository:", error);
      setMessage({
        text: error.response?.data?.detail || "Failed to clone repository",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <Title>Clone GitHub Repository</Title>
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>Select Repository:</Label>
          <StyledSelect
            value={selectedRepo}
            onChange={(e) => handleRepoSelect(e.target.value)}
            disabled={isLoading}
          >
            <option value="">Select a repository or enter URL manually</option>
            {repos.map((repo) => (
              <option key={repo} value={repo}>
                {repo}
              </option>
            ))}
          </StyledSelect>
        </FormGroup>

        <FormGroup>
          <Label>Repository URL:</Label>
          <Input
            type="text"
            value={repoUrl}
            onChange={(e) => {
              setRepoUrl(e.target.value);
              setSelectedRepo("");
            }}
            placeholder="https://github.com/username/repository.git"
            disabled={isLoading}
          />
        </FormGroup>

        <FormGroup>
          <Label>Destination Directory:</Label>
          <ButtonGroup>
            <Input
              type="text"
              value={destination}
              readOnly
              placeholder="Select destination directory"
            />
            <Button
              type="button"
              onClick={handleBrowse}
              disabled={isLoading}
            >
              Browse
            </Button>
          </ButtonGroup>
        </FormGroup>

        <ButtonGroup>
          <Button
            type="submit"
            $primary
            disabled={isLoading}
          >
            {isLoading && <LoadingSpinner />}
            Clone Repository
          </Button>
          <Button
            type="button"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </ButtonGroup>
      </Form>

      {message.text && (
        <Message $type={message.type}>
          {message.text}
        </Message>
      )}
    </Container>
  );
};

export default CloneRepo;