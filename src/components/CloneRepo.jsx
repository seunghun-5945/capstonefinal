import React, { useState } from "react";
import axios from "axios";

const CloneRepo = () => {
  const [repoUrl, setRepoUrl] = useState("");
  const [destination, setDestination] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:8000/clone-repo", {
        repo_url: repoUrl,
        destination: destination,
      });
      setMessage(`Repository cloned successfully: ${response.data.path}`);
    } catch (error) {
      setMessage(error.response ? error.response.data.detail : "Error cloning repository");
    }
  };

  return (
    <div>
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
    </div>
  );
};

export default CloneRepo;