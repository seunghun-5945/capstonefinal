import React, { useState, useRef } from "react";
import FileExplorer from "./components/FileExplorer";
import Editor from "./components/Editor";
import Terminal from "./components/Terminal";
import styled from "styled-components";
import { FaGithub, FaUnlock } from "react-icons/fa";
import { VscSourceControl } from "react-icons/vsc";
import { IoTerminal } from "react-icons/io5";
import { IoFolderOpenSharp } from "react-icons/io5";
import { Resizable } from "re-resizable";
import { FaRegClone } from "react-icons/fa";
import CloneRepo from "./components/CloneRepo";
import { useNavigate } from "react-router-dom";
import CommitModal from "./components/CommitModal";

const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  background-color: black;
`;

const SideMenuBar = styled.div`
  width: 5%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 35px;
  padding: 1% 0 1% 0;
  border-right: 1px solid gray;
`;

const HierarchyArea = styled.div`
  width: 100%;
  height: 100vh;
`;

const Frame = styled.div`
  width: 100%;
  height: 100vh;
  border-left: 1px solid gray;
  position: relative;  // 추가
`;

const EditorContainer = styled.div`
  width: 100%;
  height: ${props => props.terminalOpen ? 'calc(70vh)' : '100%'};
`;

const App = ({  }) => {
  const [currentFile, setCurrentFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [fileSource, setFileSource] = useState("local"); // 추가: 파일 소스 상태
  const [openTerminal, setOpenTerminal] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(""); // 추가: 선택된 레포지토리 상태
  const [openHierarchy, setOpenHierarchy] = useState('0.1%');
  const [openCloneRepo, setOpenCloneRepo] = useState(false);
  const [openCommitModal, setOpenCommitModal] = useState(false);
  const navigate = useNavigate();
  const terminalRef = useRef(null);

  const handleHierarchy = () => {
    if(openHierarchy === '0.1%') {
      setOpenHierarchy('15%');
    }
    else {
      setOpenHierarchy('0.1%');
    }
  };

  // FileExplorer에서 파일 선택 시 호출되는 핸들러
  const handleFileSelect = (filePath, source, repo) => {
    setCurrentFile(filePath);
    setFileSource(source);
    if (repo) {
      console.log("Setting repo:", repo); // 디버깅용
      setSelectedRepo(repo);
    }
  };

  const handleFileContentChange = (content) => {
    setFileContent(content);
  };

  const handleLogout = () => {
    localStorage.removeItem('github_token');
    navigate('/');
  };

  const handleLogin = () => {
    const scope = 'repo';
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${import.meta.env.VITE_APP_GITHUB_CLIENT_ID}&redirect_uri=http://localhost:5173/callback&scope=${scope}`;
    console.log("성공적으로 로그인 되었습니다");
  };

  const handleOpenCloneRepo = () => {
    setOpenCloneRepo(!openCloneRepo);
  }

  const handleOpenCommitModal = () => {
    setOpenCommitModal(!openCommitModal);
  }

  return (
    <Container>
{openCloneRepo && (
  <CloneRepo onClose={() => setOpenCloneRepo(false)} />
)}
{openCommitModal && (
  <CommitModal 
  isOpen={openCommitModal}
  onClose={() => setOpenCommitModal(false)}
  token={localStorage.getItem('github_token')}
  repoName={selectedRepo} // 이 값이 제대로 설정되어 있는지 확인 필요
  filePath={currentFile}
  content={fileContent}
  isNewFile={false}
/>
)}
      <SideMenuBar>
        <FaGithub 
          onClick={handleLogin}
          style={{cursor:"pointer", color:"white"}}
        />
        <IoFolderOpenSharp 
          onClick={handleHierarchy}
          style={{marginTop:"50px", cursor:"pointer", color:"white"}}
        />
        <VscSourceControl 
          onClick={handleOpenCommitModal}
          style={{marginTop:"50px", cursor:"pointer", color:"white"}}
        />
        <IoTerminal 
          onClick={() => setOpenTerminal(!openTerminal)}
          style={{marginTop:"50px", cursor:"pointer", color:"white"}}
        />
        <FaUnlock 
          onClick={handleLogout}
          style={{marginTop:"50px", cursor:"pointer", color:"white"}}
        />
        <FaRegClone 
          onClick={handleOpenCloneRepo}
          style={{marginTop:"50px", cursor:"pointer", color:"white"}}
        />
      </SideMenuBar>
      <Resizable
        size={{  // defaultSize를 size로 변경
          width: openHierarchy,
          height: '100%'
        }}
        minWidth="0%"
        maxWidth="40%"
        enable={{ right: openHierarchy !== '0%' }}  // 너비가 0일 때는 리사이즈 비활성화
        handleStyles={{
          right: {
            width: '5px',
            right: 0,
            cursor: 'col-resize',
            background: 'gray'
          }
        }}
        onResizeStop={(e, direction, ref, d) => {
          // 수동 리사이즈 후 너비 상태 업데이트
          const newWidth = Math.max(0, Math.min(40, (parseFloat(openHierarchy) + (d.width / window.innerWidth) * 100)));
          setOpenHierarchy(`${newWidth}%`);
        }}
      >
        <HierarchyArea style={{ display: openHierarchy === '0%' ? 'none' : 'block' }}>
          <FileExplorer 
            onFileSelect={handleFileSelect}
            onFileContentChange={handleFileContentChange} 
            setSelectedRepo={setSelectedRepo} // 추가: 레포지토리 선택 핸들러 전달
          />
        </HierarchyArea>
      </Resizable>

      <Frame>
        <EditorContainer>
          <Editor
            filePath={currentFile}
            fileSource={fileSource}
            selectedRepo={selectedRepo}
            terminalRef={terminalRef}
            initialContent={fileContent}
          />
        </EditorContainer>
        {/* <Resizable
          defaultSize={{
            width: '15%',
            height: '100%'
          }}
          minWidth="0%"
          maxWidth="40%"
          enable={{ right: true }}
          handleStyles={{
            right: {
              width: '5px',
              right: 0,
              cursor: 'col-resize',
              background: 'gray'
            }
          }}
        >
        </Resizable> */}
        {openTerminal && 
          <Resizable
          defaultSize={{
            width: '100%',
            height: '30vh'
          }}
          minHeight="10vh"
          maxHeight="90vh"
          enable={{
            top: true
          }}
          style={{
            position: 'absolute',
            bottom: 0,
            zIndex: 10
          }}
        >
        <Terminal
          onRef={(ref) => {
            terminalRef.current = ref;
          }}
        />
        </Resizable>
        }

      </Frame>
    </Container>
  );
};

export default App;