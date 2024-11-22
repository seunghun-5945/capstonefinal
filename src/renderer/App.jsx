import React, { useState, useRef } from "react";
import FileExplorer from "../components/FileExplorer";
import Editor from "../components/Editor";
import Terminal from "../components/Terminal";
import styled from "styled-components";
import { FaGithub, FaUnlock } from "react-icons/fa";
import { VscSourceControl } from "react-icons/vsc";
import { IoTerminal } from "react-icons/io5";
import { IoFolderOpenSharp } from "react-icons/io5";
import { Resizable } from "re-resizable";

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
  position: relative; // 추가
`;

const EditorContainer = styled.div`
  width: 100%;
  height: ${(props) => (props.terminalOpen ? "calc(70vh)" : "100%")};
`;

const App = ({}) => {
  const [currentFile, setCurrentFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [openTerminal, setOpenTerminal] = useState(false);
  const terminalRef = useRef(null);

  const handleFileSelect = (filePath) => {
    setCurrentFile(filePath);
  };

  const handleFileContentChange = (content) => {
    setFileContent(content);
  };

  const handleLogout = () => {
    localStorage.removeItem("github_token");
    navigate("/#/");
  };

  const handleLogin = () => {
    const scope = "repo";
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${
      import.meta.env.VITE_APP_GITHUB_CLIENT_ID
    }&redirect_uri=http://localhost:5173/callback&scope=${scope}`;
  };

  return (
    <Container>
      <SideMenuBar>
        <FaGithub
          onClick={handleLogin}
          style={{ cursor: "pointer", color: "white" }}
        />
        <IoFolderOpenSharp
          style={{ marginTop: "50px", cursor: "pointer", color: "white" }}
        />
        <VscSourceControl
          style={{ marginTop: "50px", cursor: "pointer", color: "white" }}
        />
        <IoTerminal
          onClick={() => setOpenTerminal(!openTerminal)}
          style={{ marginTop: "50px", cursor: "pointer", color: "white" }}
        />
        <FaUnlock
          onClick={handleLogout}
          style={{ marginTop: "50px", cursor: "pointer", color: "white" }}
        />
      </SideMenuBar>
      <Resizable
        defaultSize={{
          width: "15%",
          height: "100%",
        }}
        minWidth="0%"
        maxWidth="40%"
        enable={{ right: true }}
        handleStyles={{
          right: {
            width: "5px",
            right: 0,
            cursor: "col-resize",
            background: "gray",
          },
        }}
      >
        <HierarchyArea>
          <FileExplorer
            onFileSelect={handleFileSelect}
            onFileContentChange={handleFileContentChange}
          />
        </HierarchyArea>
      </Resizable>

      <Frame>
        <EditorContainer>
          <Editor
            filePath={currentFile}
            terminalRef={terminalRef}
            initialContent={fileContent}
          />
        </EditorContainer>
        <Resizable
          defaultSize={{
            width: "15%",
            height: "100%",
          }}
          minWidth="0%"
          maxWidth="40%"
          enable={{ right: true }}
          handleStyles={{
            right: {
              width: "5px",
              right: 0,
              cursor: "col-resize",
              background: "gray",
            },
          }}
        ></Resizable>
        {openTerminal && (
          <Resizable
            defaultSize={{
              width: "100%",
              height: "30vh",
            }}
            minHeight="10vh"
            maxHeight="90vh"
            enable={{
              top: true,
            }}
            style={{
              position: "absolute",
              bottom: 0,
              zIndex: 10,
            }}
          >
            <Terminal
              onRef={(ref) => {
                terminalRef.current = ref;
              }}
            />
          </Resizable>
        )}
      </Frame>
    </Container>
  );
};

export default App;
