import React, { useState } from "react";
import styled from "styled-components";
import axios from "axios";

const Container = styled.div`
  width: 50%;
  height: 50%;
  position: absolute; 
  top: 50%;
  left: 50%; 
  transform: translate(-50%, -50%); 
  background-color: white;
  z-index: 1001;
  padding: 20px; 
  border-radius: 8px;
`;

const CloneRepo = () => {
  const [repoUrl, setRepoUrl] = useState("");
  const [destination, setDestination] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:8000/users/clone-repo", {
        repo_url: repoUrl,
        destination: destination,
      });
      setMessage(`Repository cloned successfully: ${response.data.path}`);
    } catch (error) {
      setMessage(error.response ? error.response.data.detail : "Error cloning repository");
    }
  };

  return (
    <Container>
      <h1>Clone GitHub Repository</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Repository URL:</label>
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/username/repository.git"
          />
        </div>
        <div>
          <label>Destination Directory:</label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="./cloned-repo"
          />
        </div>
        <button type="submit">Clone Repository</button>
      </form>
      {message && <p>{message}</p>}
    </Container>
  );
};

export default CloneRepo;