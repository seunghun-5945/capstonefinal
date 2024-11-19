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
  import { PiArrowFatLineUpDuotone } from "react-icons/pi";

  const Container = styled.div`
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-x: hidden;
  `;

  const Header = styled.div`
    width: 100%:
    height: 10%;
    padding: 3%;
    color: white;
    border-bottom: 1px solid gray;
  `;

  const ButtonGroup = styled.div`
    width: 100%;
    height: 5%;
    display: flex;
    align-items: center;
    justify-content: space-around;
    border-bottom: 1px solid gray;
  `;

  const FileTreeContainer = styled.div`
    width: 100%;  
    height: 50%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    overflow-y: auto;
    color: white;
    margin-top: 5%;

      /* 스크롤바 스타일링 */
    &::-webkit-scrollbar {
      width: 8px;
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: #4a4a4a;
      border-radius: 4px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }
  `;

  const FileContentSection = styled.div`
    width: 100%;
    height: 50%;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    color: white;
  `;

  const StyledTextarea = styled.textarea`
    width: 100%;
    height: 100%;
    overflow-y: auto;
    padding: 0.5rem;
  `;

  const CommitContainer = styled.div`
    display: flex;
    flex-direction: column;
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
    width: 100%;
    height: 100%;
    overflow-y: auto;
    border-top: 1px solid gray;
    margin-top: 1rem;
    max-height: 10rem;

    /* 스크롤바 스타일링 */
    &::-webkit-scrollbar {
      width: 8px;
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: #4a4a4a;
      border-radius: 4px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }
  `;

  const FileItem = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem;
    cursor: pointer;
    color: white;

    &:hover {
      background-color: #f3f4f6;
    }
  `;

  const TreeItem = ({ item, depth = 0, onSelect, selectedRepo, headers }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [children, setChildren] = useState([]);
    const isDirectory = item.type === 'dir';
  
    const getFileIcon = (fileName) => {
      const extension = fileName.split(".").pop().toLowerCase();
      switch (extension) {
        case "py":
          return <FaPython size={16} color="#3776AB" />;
        case "js":
        case "jsx":
          return <FaJs size={16} color="#F7DF1E" />;
        case "html":
          return <FaHtml5 size={16} color="#E34F26" />;
        case "css":
          return <FaCss3 size={16} color="#1572B6" />;
        case "json":
          return <FileIcon size={16} color="#8F8F8F" />;
        case "md":
          return <FileIcon size={16} color="#7CB342" />;
        case "gitignore":
          return <FileIcon size={16} color="#F05032" />;
        case "env":
          return <FileIcon size={16} color="#FFB300" />;
        default:
          return <FileIcon size={16} color="#A1A1AA" />;
      }
    };
    
    const handleToggle = async (e) => {
      e.stopPropagation();
      if (isDirectory) {
        if (!isOpen && children.length === 0) {
          try {
            const response = await axios.get('http://localhost:8000/users/api/repo-contents', {
              params: { repo_name: selectedRepo, path: item.path },
              headers
            });
            const sortedFiles = response.data
              .map(file => ({
                name: file.name,
                path: file.path,
                type: file.type
              }))
              .sort((a, b) => {
                if ((a.type === 'dir' && b.type === 'dir') || 
                    (a.type === 'file' && b.type === 'file')) {
                  return a.name.localeCompare(b.name);
                }
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
  
    const ItemContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    padding-left: ${depth * 20}px;  // padding-left를 style 속성 대신 여기서 처리
    cursor: pointer;
    transition: background-color 0.2s;
    border-radius: 4px;
    width: 100%;
    min-width: 0;
    
    &:hover {
      background-color: lightgray;
    }
  `;
  
    const IconWrapper = styled.div`
      display: flex;
      align-items: center;
      color: ${isDirectory ? '#FFB300' : 'inherit'};
      flex-shrink: 0; // 아이콘은 항상 고정 크기 유지
    `;
  
    const ChevronIcon = styled.div`
      width: 20px;
      display: flex;
      align-items: center;
      color: #A1A1AA;
      flex-shrink: 0; // 화살표도 고정 크기 유지
      
      &:hover {
        color: white;
      }
    `;
  
    const FileName = styled.span`
      color: ${isDirectory ? '#FFB300' : 'white'};
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      min-width: 0; // 이것이 텍스트 자르기에 중요
      
      // 툴팁 스타일
      &:hover::after {
        content: "${props => props.title}";
        position: absolute;
        background: #333;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        margin-top: -20px;
        z-index: 1000;
        display: ${props => props.title.length > 20 ? 'block' : 'none'};
      }
    `;
  
    return (
      <div style={{ width: '100%' }}>  {/* 이 div를 추가하여 전체 너비 확보 */}
        <ItemContainer onClick={() => onSelect(item)}>
          <ChevronIcon onClick={handleToggle}>
            {isDirectory && (
              isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
            )}
          </ChevronIcon>
          <IconWrapper>
            {isDirectory ? (
              <FolderIcon size={16} />
            ) : (
              getFileIcon(item.name)
            )}
          </IconWrapper>
          <FileName title={item.name}>
            {item.name}
          </FileName>
        </ItemContainer>
        
        {isDirectory && isOpen && children.length > 0 && (
          <div style={{ width: '100%' }}>  {/* 자식 요소들도 전체 너비 확보 */}
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

    const handleLocalFileLoad = async () => {
      try {
        const file = await window.electronAPI.openFile(); // Electron IPC 호출
        if (file) {
          const { filePath, fileContent } = file;
          setSelectedFile(filePath);
          setFileContent(fileContent);
          onFileContentChange(fileContent); // 부모 컴포넌트에 파일 내용 전달
        }
      } catch (error) {
        console.error("Error loading file:", error);
        alert("Failed to load file.");
      }
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

    return (
      <Container>
        <Header>
          <h3>파일 탐색기</h3>
          {error && <div>{error}</div>}
          <div>{currentPath}</div>
        </Header>

        <ButtonGroup>
          <PiArrowFatLineUpDuotone 
            onClick={handleParentDirectoryClick} 
            style={{color:"white", cursor:"pointer", fontSize:"25px"}}
          />
          {token && (
            <select onChange={(e) => handleRepoSelect(e.target.value)}>
            <option value="">레포지토리 선택</option>
            {repos.map(repo => (
              <option key={repo} value={repo}>{repo}</option>
            ))}
            </select>
          )}

        </ButtonGroup>
        <ButtonGroup>
          <button 
            onClick={handleLocalFileLoad}
            style={{width:"100%"}}>로컬 파일 불러오기</button>
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
        </FileTreeContainer>

        {/* {selectedFile && (
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
        )} */}

        <FileListContainer>
          {files.map((file, index) => (
            <FileItem
              key={index}
              onClick={() => handleItemClick(file)}
            >
              {file.isDirectory ? (
                <FaFolder/>
              ) : (
                getFileIcon(file.name)
              )}
              <span>{file.name}</span>
            </FileItem>
          ))}
        </FileListContainer>
        <VirtualEnvironmentSelector />
      </Container>
    );
  };

  export default FileExplorer;
