import React, { useState, useEffect } from "react";
import {
  FaFolder,
  FaFile,
  FaPython,
  FaJs,
  FaHtml5,
  FaCss3,
} from "react-icons/fa";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { FolderIcon, FileIcon, ChevronRight, ChevronDown } from 'lucide-react';
import styled from "styled-components";
import VirtualEnvironmentSelector from "./VirtualEnvironmentSelector";

// 스타일 컴포넌트 정의
const Container = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  margin-bottom: 1rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const FileTreeContainer = styled.div`
  height: 50%;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 0.5rem;
  margin-bottom: 1rem;
`;

const FileContentSection = styled.div`
  height: 50%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
`;

const StyledTextarea = styled.textarea`
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
`;

const CommitContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const CommitInput = styled.input`
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
`;

const CommitButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;

  &:hover {
    background-color: #2563eb;
  }
`;

const FileListContainer = styled.div`
  height: 100%;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 0.5rem;
  margin-top: 1rem;
  max-height: 10rem;
`;

const FileItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem;
  cursor: pointer;

  &:hover {
    background-color: #f3f4f6;
  }
`;

const TreeItem = ({ item, depth = 0, onSelect, selectedRepo, headers }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState([]);
  const isDirectory = item.type === 'dir';
  
  const handleToggle = async (e) => {
    e.stopPropagation();
    if (isDirectory) {
      if (!isOpen && children.length === 0) {
        try {
          const response = await axios.get('http://localhost:8000/users/api/repo-contents', {
            params: { repo_name: selectedRepo, path: item.path },
            headers
          });
          // 폴더가 먼저 오도록 정렬
          const sortedFiles = response.data
            .map(file => ({
              name: file.name,
              path: file.path,
              type: file.type
            }))
            .sort((a, b) => {
              // 둘 다 디렉토리거나 둘 다 파일이면 이름순
              if ((a.type === 'dir' && b.type === 'dir') || 
                  (a.type === 'file' && b.type === 'file')) {
                return a.name.localeCompare(b.name);
              }
              // 디렉토리가 먼저 오도록
              return a.type === 'dir' ? -1 : 1;
            });
          setChildren(sortedFiles);
        } catch (error) {
          console.error('Error fetching directory contents:', error);
        }
      }
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="w-full">
      <div
        className="flex items-center py-1 px-2 hover:bg-gray-100 cursor-pointer"
        style={{ paddingLeft: `${depth * 20}px` }}
        onClick={() => onSelect(item)}
      >
        <span className="mr-1" onClick={handleToggle}>
          {isDirectory && (
            isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          )}
        </span>
        {isDirectory ? (
          <FolderIcon className="w-4 h-4 text-yellow-500 mr-2" />
        ) : (
          <FileIcon className="w-4 h-4 text-gray-500 mr-2" />
        )}
        <span className="text-sm">{item.name}</span>
      </div>
      
      {isDirectory && isOpen && children.length > 0 && (
        <div className="ml-2">
          {children.map((child, index) => (
            <TreeItem
              key={`${child.path}-${index}`}
              item={child}
              depth={depth + 1}
              onSelect={onSelect}
              selectedRepo={selectedRepo}
              headers={headers}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileExplorer = ({ onFileSelect, onFileContentChange }) => {
  const [currentPath, setCurrentPath] = useState("");
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [selectedFile, setSelectedFile] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const navigate = useNavigate();

  const headers = {
    'Authorization': `Bearer ${token}`
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('github_token');
    if (storedToken) {
      setToken(storedToken);
    } else {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    if (token) {
      fetchUserRepos();
    }
  }, [token]);

  const fetchUserRepos = async () => {
    try {
      const response = await axios.get('http://localhost:8000/users/api/user-repos', { headers });
      setRepos(response.data);
    } catch (error) {
      console.error('Error fetching user repos:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('github_token');
        navigate('/');
      }
    }
  };

  const handleRepoSelect = async (repo) => {
    setSelectedRepo(repo);
    try {
      const response = await axios.get('http://localhost:8000/users/api/repo-contents', {
        params: { repo_name: repo, path: '' },
        headers
      });
      setFiles(response.data.map(file => ({
        name: file.name,
        path: file.path,
        type: file.type
      })));
    } catch (error) {
      console.error('Error fetching repo contents:', error);
    }
  };

// FileExplorer.jsx의 handleFileSelect 함수 수정
const handleFileSelect = async (file) => {
  if (file.type === 'file') {
    setSelectedFile(file.path);
    try {
      const response = await axios.get('http://localhost:8000/users/api/file-content', {
        params: {
          repo_name: selectedRepo,
          file_path: file.path
        },
        headers
      });
      setFileContent(response.data.content);
      // 부모 컴포넌트로 파일 내용 전달
      onFileContentChange(response.data.content);
    } catch (error) {
      console.error('Error fetching file content:', error);
    }
  }
};

  const handleUpdateFile = async () => {
    if (!commitMessage) {
      alert('커밋 메시지를 입력해주세요.');
      return;
    }
    try {
      await axios.post('http://localhost:8000/api/update-file', {
        repo_name: selectedRepo,
        file_path: selectedFile,
        content: fileContent,
        commit_message: commitMessage
      }, { headers });
      alert('File updated successfully');
      setCommitMessage('');
    } catch (error) {
      console.error('Error updating file:', error);
      alert('Failed to update file');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('github_token');
    navigate('/');
  };

  useEffect(() => {
    const initializeFileExplorer = async () => {
      try {
        const initialPath = await window.electronAPI.getInitialPath();
        setCurrentPath(initialPath);
        await loadDirectory(initialPath);
      } catch (error) {
        console.error("Error initializing file explorer:", error);
        setError("Failed to initialize file explorer");
        setCurrentPath("/");
      }
    };
    initializeFileExplorer();
  }, []);

  const loadDirectory = async (path) => {
    try {
      setError(null);
      const directoryContents = await window.electronAPI.readDirectory(path);
      const sortedContents = directoryContents.sort((a, b) => {
        if (a.isDirectory === b.isDirectory) {
          return a.name.localeCompare(b.name);
        }
        return a.isDirectory ? -1 : 1;
      });
      setFiles(sortedContents);
    } catch (error) {
      console.error("Error loading directory:", error);
      setError("Failed to load directory");
    }
  };

  const handleItemClick = async (item) => {
    if (item.isDirectory) {
      const newPath = `${currentPath}/${item.name}`.replace(/\/+/g, "/");
      setCurrentPath(newPath);
      await loadDirectory(newPath);
    } else {
      onFileSelect(`${currentPath}/${item.name}`.replace(/\/+/g, "/"));
    }
  };

  const handleParentDirectoryClick = async () => {
    if (currentPath === "/") return;
    if (currentPath === "/") return;
    const parentPath = await window.electronAPI.getParentPath(currentPath);
    setCurrentPath(parentPath);
    await loadDirectory(parentPath);
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();
    switch (extension) {
      case "py":
        return <FaPython className="text-blue-500" />;
      case "js":
        return <FaJs className="text-yellow-500" />;
      case "html":
        return <FaHtml5 className="text-orange-500" />;
      case "css":
        return <FaCss3 className="text-blue-400" />;
      default:
        return <FaFile className="text-gray-400" />;
    }
  };

  const handleLogin = () => {
    const scope = 'repo'; // GitHub 저장소에 대한 전체 접근 권한 요청
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${import.meta.env.VITE_APP_GITHUB_CLIENT_ID}&redirect_uri=http://localhost:5173/callback&scope=${scope}`;
  };

  return (
    <Container>
      <Header>
        <h3>File Explorer</h3>
        {error && <div>{error}</div>}
        <div className="text-sm mb-2 break-all">{currentPath}</div>
      </Header>

      <ButtonGroup>
        <button onClick={handleParentDirectoryClick}>Up to Parent</button>
        <button onClick={handleLogin}>GitHub로 로그인</button>
        <select onChange={(e) => handleRepoSelect(e.target.value)}>
          <option value="">레포지토리 선택</option>
          {repos.map(repo => (
            <option key={repo} value={repo}>{repo}</option>
          ))}
        </select>
      </ButtonGroup>

      <FileTreeContainer>
        {files.map((item, index) => (
          <TreeItem
            key={`${item.path}-${index}`}
            item={item}
            onSelect={handleFileSelect}
            selectedRepo={selectedRepo}
            headers={headers}
          />
        ))}
        <VirtualEnvironmentSelector />
      </FileTreeContainer>

      {selectedFile && (
        <FileContentSection>
          <StyledTextarea
            value={fileContent}
            onChange={(e) => setFileContent(e.target.value)}
          />
          <CommitContainer>
            <CommitInput
              type="text"
              placeholder="커밋 메시지"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
            />
            <CommitButton onClick={handleUpdateFile}>
              변경 사항 커밋
            </CommitButton>
          </CommitContainer>
        </FileContentSection>
      )}

      <FileListContainer>
        {files.map((file, index) => (
          <FileItem
            key={index}
            onClick={() => handleItemClick(file)}
          >
            {file.isDirectory ? (
              <FaFolder className="text-yellow-400" />
            ) : (
              getFileIcon(file.name)
            )}
            <span>{file.name}</span>
          </FileItem>
        ))}
      </FileListContainer>
    </Container>
  );
};

export default FileExplorer;
