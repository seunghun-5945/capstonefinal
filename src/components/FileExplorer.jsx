import React, { useState, useEffect } from "react";
import {
  FaFolder,
  FaFolderOpen,
  FaPython,
  FaJs,
  FaHtml5,
  FaCss3,
  FaFile,
  FaMarkdown,
  FaGitAlt,
  FaCog,
  FaChevronRight,
  FaChevronDown,
  FaFileCode,
} from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import VirtualEnvironmentSelector from "./VirtualEnvironmentSelector";
import { PiArrowFatLineUpDuotone } from "react-icons/pi";
import CloneRepo from "./CloneRepo";

const Container = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-x: hidden;
`;

const Header = styled.div`
  width: 100%;
  height: 5%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3%;
  color: white;
  border-bottom: 1px solid gray;
`;

const ButtonGroup = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 5%;
  border-bottom: 1px solid gray;
`;

const FileTreeContainer = styled.div`
  width: 100%;
  height: 60%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  overflow-y: auto;
  color: white;
  margin-top: 5%;

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

const CommonItemContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-radius: 4px;
  width: 100%;
  min-width: 0;
  color: white;
  padding-left: ${(props) => (props.depth || 0) * 20}px;
  &:hover {
    background-color: rgba(243, 244, 246, 0.1);
  }
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  color: ${(props) => (props.isDirectory ? "#FFB300" : "inherit")};
  flex-shrink: 0;
  margin-right: 4px;
`;

const ChevronIcon = styled.div`
  width: 20px;
  display: flex;
  align-items: center;
  color: #a1a1aa;
  flex-shrink: 0;

  &:hover {
    color: white;
  }
`;

const FileName = styled.span`
  color: ${(props) => (props.isDirectory ? "#FFB300" : "white")};
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;

  &:hover::after {
    content: "${(props) => props.title}";
    position: absolute;
    background: #333;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    margin-top: -20px;
    z-index: 1000;
    display: ${(props) => (props.title.length > 20 ? "block" : "none")};
  }
`;

const StyledSelect = styled.select`
  width: 70%;
  height: 100%;
  display: flex;
  font-size: 0.875rem;
  color: #cccccc;
  background-color: #2d2d2d;
  border: 1px solid white;
  border-radius: 4px;
  cursor: pointer;
  appearance: none;
  position: relative;
  padding: 2px;
  transition: border-color 0.2s;

  /* 화살표 커스텀 */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23cccccc' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 40px;

  &:hover {
    border-color: #525252;
  }

  &:focus {
    outline: none;
    border-color: #0078d4;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  option {
    background-color: #2d2d2d;
    color: #cccccc;
    padding: 8px;
  }
`;

const getFileIcon = (fileName) => {
  const extension = fileName.split(".").pop().toLowerCase();
  const iconSize = 16;

  switch (extension) {
    case "py":
      return <FaPython size={iconSize} color="#3776AB" />;
    case "js":
    case "jsx":
      return <FaJs size={iconSize} color="#F7DF1E" />;
    case "html":
      return <FaHtml5 size={iconSize} color="#E34F26" />;
    case "css":
      return <FaCss3 size={iconSize} color="#1572B6" />;
    case "json":
      return <FaFileCode size={iconSize} color="#7CB342" />;
    case "md":
      return <FaMarkdown size={iconSize} color="#7CB342" />;
    case "gitignore":
      return <FaGitAlt size={iconSize} color="#F05032" />;
    case "env":
      return <FaCog size={iconSize} color="#FFB300" />;
    default:
      return <FaFile size={iconSize} color="#A1A1AA" />;
  }
};

const TreeItem = ({
  item,
  depth = 0,
  onSelect,
  fileSource,
  selectedRepo,
  headers,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState([]);
  const isDirectory =
    fileSource === "github" ? item.type === "dir" : item.isDirectory;

  // 전체 아이템 클릭 시 처리하는 함수
  const handleClick = async (e) => {
    e.stopPropagation();
    if (isDirectory) {
      // 디렉토리인 경우 토글 처리
      if (!isOpen && children.length === 0) {
        if (fileSource === "github") {
          try {
            const response = await axios.get(
              "http://localhost:8000/users/api/repo-contents",
              {
                params: { repo_name: selectedRepo, path: item.path },
                headers,
              }
            );
            const sortedFiles = response.data
              .map((file) => ({
                name: file.name,
                path: file.path,
                type: file.type,
                isDirectory: file.type === "dir",
              }))
              .sort((a, b) => {
                if (a.isDirectory === b.isDirectory) {
                  return a.name.localeCompare(b.name);
                }
                return a.isDirectory ? -1 : 1;
              });
            setChildren(sortedFiles);
          } catch (error) {
            console.error("Error fetching directory contents:", error);
          }
        } else {
          try {
            const directoryContents = await window.electronAPI.readDirectory(
              item.path
            );
            const sortedContents = directoryContents
              .map((file) => ({
                ...file,
                path: `${item.path}/${file.name}`.replace(/\/+/g, "/"),
              }))
              .sort((a, b) => {
                if (a.isDirectory === b.isDirectory) {
                  return a.name.localeCompare(b.name);
                }
                return a.isDirectory ? -1 : 1;
              });
            setChildren(sortedContents);
          } catch (error) {
            console.error("Error loading local directory contents:", error);
          }
        }
      }
      setIsOpen(!isOpen);
    } else {
      // 파일인 경우 선택 처리
      onSelect(item);
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <CommonItemContainer depth={depth} onClick={handleClick}>
        <ChevronIcon onClick={handleClick}>
          {isDirectory &&
            (isOpen ? (
              <FaChevronDown size={16} />
            ) : (
              <FaChevronRight size={16} />
            ))}
        </ChevronIcon>
        <IconWrapper isDirectory={isDirectory}>
          {isDirectory ? (
            isOpen ? (
              <FaFolderOpen size={16} color="#FFB300" />
            ) : (
              <FaFolder size={16} color="#FFB300" />
            )
          ) : (
            getFileIcon(item.name)
          )}
        </IconWrapper>
        <FileName title={item.name} isDirectory={isDirectory}>
          {item.name}
        </FileName>
      </CommonItemContainer>

      {isDirectory && isOpen && children.length > 0 && (
        <div style={{ width: "100%" }}>
          {children.map((child, index) => (
            <TreeItem
              key={`${child.path}-${index}`}
              item={child}
              depth={depth + 1}
              onSelect={onSelect}
              fileSource={fileSource}
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
  const [selectedRepo, setSelectedRepo] = useState("");
  const [selectedFile, setSelectedFile] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [fileSource, setFileSource] = useState("local");
  const [isEditing, setIsEditing] = useState(false);
  const [showCommitDialog, setShowCommitDialog] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");
  const [currentEditingFile, setCurrentEditingFile] = useState(null);
  const navigate = useNavigate();

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("github_token");
    if (storedToken) {
      setToken(storedToken);
    }
  }, [navigate]);

  useEffect(() => {
    if (token) {
      fetchUserRepos();
    }
  }, [token]);

  useEffect(() => {
    // 컴포넌트 마운트 시 로컬 파일트리 초기화
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

  const fetchUserRepos = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/users/api/user-repos",
        { headers }
      );
      setRepos(response.data);
    } catch (error) {
      console.error("Error fetching user repos:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("github_token");
        navigate("/#/");
      }
    }
  };

  const loadDirectory = async (path) => {
    try {
      setError(null);
      const directoryContents = await window.electronAPI.readDirectory(path);
      const sortedContents = directoryContents
        .map((file) => ({
          ...file,
          path: `${path}/${file.name}`.replace(/\/+/g, "/"),
        }))
        .sort((a, b) => {
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

  const handleLoadLocalDirectory = async () => {
    try {
      const dirPath = await window.electronAPI.openDirectory();
      if (dirPath) {
        setFileSource("local");
        setCurrentPath(dirPath);
        await loadDirectory(dirPath);
      }
    } catch (error) {
      console.error("Error loading local directory:", error);
      setError("Failed to load local directory");
    }
  };

  const handleRepoSelect = async (repo) => {
    if (!repo) {
      // 레포 선택이 해제되면 로컬 파일트리로 돌아감
      setFileSource("local");
      const initialPath = await window.electronAPI.getInitialPath();
      setCurrentPath(initialPath);
      await loadDirectory(initialPath);
      return;
    }

    setSelectedRepo(repo);
    setFileSource("github");

    try {
      const response = await axios.get(
        "http://localhost:8000/users/api/repo-contents",
        {
          params: { repo_name: repo, path: "" },
          headers,
        }
      );
      setFiles(
        response.data.map((file) => ({
          name: file.name,
          path: file.path,
          type: file.type,
          isDirectory: file.type === "dir",
        }))
      );
    } catch (error) {
      console.error("Error fetching repo contents:", error);
    }
  };

  const handleFileSelect = async (file) => {
    try {
      if (fileSource === "github" && file.type === "file") {
        const fileExtension = file.name.split(".").pop().toLowerCase();

        // JavaScript나 Python 파일만 처리
        if (fileExtension === "js" || fileExtension === "py") {
          const response = await axios.get(
            "http://localhost:8000/users/api/file-content",
            {
              params: {
                token: localStorage.getItem("github_token"),
                repo_name: selectedRepo,
                file_path: file.path,
              },
            }
          );

          const content = response.data.content;
          onFileSelect(file.path);
          onFileContentChange(content); // Editor 컴포넌트로 파일 내용 전달
        } else {
          alert("JavaScript 또는 Python 파일만 선택할 수 있습니다.");
        }
      } else if (fileSource === "local" && !file.isDirectory) {
        const filePath =
          file.path || `${currentPath}/${file.name}`.replace(/\/+/g, "/");
        const content = await window.electronAPI.readFile(filePath);
        onFileSelect(filePath);
        onFileContentChange(content);
      }
    } catch (error) {
      console.error("Error selecting file:", error);
      setError(`Failed to select file: ${error.message}`);
    }
  };

  const handleParentDirectoryClick = async () => {
    if (fileSource === "local") {
      if (currentPath === "/") return;
      const parentPath = await window.electronAPI.getParentPath(currentPath);
      setCurrentPath(parentPath);
      await loadDirectory(parentPath);
    } else {
      const currentPathParts = currentPath.split("/").filter(Boolean);
      currentPathParts.pop();
      const parentPath = currentPathParts.join("/");

      try {
        const response = await axios.get(
          "http://localhost:8000/users/api/repo-contents",
          {
            params: { repo_name: selectedRepo, path: parentPath },
            headers,
          }
        );
        setFiles(
          response.data.map((file) => ({
            name: file.name,
            path: file.path,
            type: file.type,
            isDirectory: file.type === "dir",
          }))
        );
        setCurrentPath(parentPath);
      } catch (error) {
        console.error("Error fetching parent directory:", error);
      }
    }
  };

  const handleUpdateFile = async () => {
    if (!commitMessage) {
      alert("커밋 메시지를 입력해주세요.");
      return;
    }
    try {
      await axios.post(
        "http://localhost:8000/users/api/update-file",
        {
          token: token,
          repo_name: selectedRepo,
          file_path: selectedFile,
          content: fileContent,
          branch: "string",
          commit_message: commitMessage,
        },
        { headers }
      );
      alert("File updated successfully");
      setCommitMessage("");
    } catch (error) {
      console.error("Error updating file:", error);
      alert("Failed to update file");
    }
  };

  return (
    <Container>
      <Header>
        <h3>파일 탐색기 - {fileSource === "local" ? "로컬" : "GitHub"}</h3>
        {error && <div>{error}</div>}
      </Header>
      <ButtonGroup>
        <PiArrowFatLineUpDuotone
          onClick={handleParentDirectoryClick}
          style={{ color: "white", cursor: "pointer", fontSize: "25px" }}
        />
        {token && (
          <StyledSelect onChange={(e) => handleRepoSelect(e.target.value)}>
            <option value="">select repo</option>
            {repos.map((repo) => (
              <option key={repo} value={repo}>
                {repo}
              </option>
            ))}
          </StyledSelect>
        )}
      </ButtonGroup>
      <button
        onClick={handleLoadLocalDirectory}
        style={{
          width: "80%",
          marginTop: "10px",
          padding: "5px 10px",
          backgroundColor: "transparent",
          border: "1px solid white",
          color: "white",
          cursor: "pointer",
          borderRadius: "4px",
        }}
      >
        로컬 폴더 열기
      </button>
      <FileTreeContainer>
        {files.map((item, index) => (
          <TreeItem
            key={`${item.path || item.name}-${index}`}
            item={item}
            onSelect={handleFileSelect}
            fileSource={fileSource}
            selectedRepo={selectedRepo}
            headers={headers}
            currentPath={currentPath} // currentPath prop 추가
          />
        ))}

        {selectedFile && (
          <div className="space-y-4">
            <textarea
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
            />
            <input
              type="text"
              placeholder="커밋 메시지"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <button onClick={handleUpdateFile}>변경 사항 커밋</button>
          </div>
        )}
      </FileTreeContainer>
      <CloneRepo />
      <VirtualEnvironmentSelector />
    </Container>
  );
};

export default FileExplorer;
