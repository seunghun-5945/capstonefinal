import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { TbRefresh } from "react-icons/tb";

const Container = styled.div`
  width: 100%;
  height: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  color: white;
  border-top: 1px solid white;
`;

const StyledSelect = styled.select`
  width: 80%;
  padding: 8px 12px;
  font-size: 0.875rem;
  color: #cccccc;
  background-color: #2d2d2d;
  border: 1px solid white;
  border-radius: 4px;
  cursor: pointer;
  appearance: none;
  position: relative;
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

const VirtualEnvironmentSelector = () => {
  const [environments, setEnvironments] = useState([]);
  const [activeEnv, setActiveEnv] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [platform, setPlatform] = useState(null);

  useEffect(() => {
    // 플랫폼 확인
    const detectPlatform = async () => {
      try {
        const platformInfo = await window.electronAPI.getPlatform();
        setPlatform(platformInfo);
      } catch (err) {
        console.error("Failed to detect platform:", err);
      }
    };

    detectPlatform();
    loadEnvironments();
  }, []);

  const getCondaPath = async () => {
    try {
      if (platform === "darwin") {
        // macOS
        const userHome = await window.electronAPI.getUserHome();
        const commonPaths = [
          `${userHome}/opt/anaconda3/bin/conda`,
          `${userHome}/opt/miniconda3/bin/conda`,
          `${userHome}/anaconda3/bin/conda`,
          `${userHome}/miniconda3/bin/conda`,
        ];

        for (const path of commonPaths) {
          const exists = await window.electronAPI.checkFileExists(path);
          if (exists) return path;
        }
      } else {
        // Windows
        const commonPaths = [
          "C:\\ProgramData\\Anaconda3\\Scripts\\conda.exe",
          "C:\\ProgramData\\Miniconda3\\Scripts\\conda.exe",
          "%USERPROFILE%\\Anaconda3\\Scripts\\conda.exe",
          "%USERPROFILE%\\Miniconda3\\Scripts\\conda.exe",
        ];

        for (const path of commonPaths) {
          const exists = await window.electronAPI.checkFileExists(path);
          if (exists) return path;
        }
      }
      return null;
    } catch (err) {
      console.error("Error finding conda path:", err);
      return null;
    }
  };

  const loadEnvironments = async () => {
    setLoading(true);
    setError(null);
    try {
      // Conda 환경 로드
      const condaEnvs = await window.electronAPI
        .getCondaEnvs({
          platform,
          condaPath: await getCondaPath(),
        })
        .catch((err) => {
          console.warn("Failed to load conda environments:", err);
          return [];
        });

      // venv 환경 로드
      const venvPaths =
        platform === "darwin"
          ? [
              "~/venv",
              "~/.virtualenvs",
              "~/Projects/**/venv",
              "~/Development/**/venv",
            ]
          : [
              "%USERPROFILE%\\venv",
              "%USERPROFILE%\\.virtualenvs",
              "%USERPROFILE%\\Projects\\**\\venv",
            ];

      const venvEnvs = await window.electronAPI
        .getVenvEnvs({
          platform,
          paths: venvPaths,
        })
        .catch((err) => {
          console.warn("Failed to load venv environments:", err);
          return [];
        });

      const allEnvs = [...condaEnvs, ...venvEnvs];

      if (allEnvs.length === 0) {
        setError(
          "No Python environments found. Please make sure you have Conda or venv environments set up."
        );
      }
      setEnvironments(allEnvs);
    } catch (err) {
      setError(err.message || "Failed to load Python environments");
      console.error("Error loading environments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateEnv = async (env) => {
    try {
      setError(null);
      const activationCommand =
        platform === "darwin"
          ? {
              conda: `source ${env.path}/bin/activate ${env.name}`,
              venv: `source ${env.path}/bin/activate`,
            }[env.type]
          : {
              conda: `${env.path}\\Scripts\\activate ${env.name}`,
              venv: `${env.path}\\Scripts\\activate.bat`,
            }[env.type];

      const result = await window.electronAPI.activateEnv({
        ...env,
        command: activationCommand,
        platform,
      });
      setActiveEnv(env);
      setError(`Successfully activated ${env.name} (${env.type})`);
    } catch (err) {
      setError(`Failed to activate ${env.name}: ${err.message}`);
      console.error("Environment activation error:", err);
    }
  };

  return (
    <Container>
      <h3>Python 가상환경 설정</h3>
      <div className="mb-2">
        <TbRefresh
          onClick={loadEnvironments}
          style={{ fontSize: "30px" }}
          disabled={loading}
        />
      </div>

      {loading && (
        <div className="text-sm text-gray-400">Loading environments...</div>
      )}
      {error && (
        <div
          style={{ width: "100%", textAlign: "center" }}
          className={`text-sm mb-2 ${
            error.includes("Successfully") ? "text-green-500" : "text-red-500"
          }`}
        >
          {error}
        </div>
      )}
      {environments.length > 0 ? (
        <StyledSelect
          onChange={(e) => {
            const env = environments[e.target.value];
            if (env) handleActivateEnv(env);
          }}
          value={
            activeEnv
              ? environments.findIndex((env) => env.name === activeEnv.name)
              : ""
          }
          disabled={loading}
        >
          <option value="">Select an environment</option>
          {environments.map((env, index) => (
            <option key={index} value={index}>
              {env.name} ({env.type})
            </option>
          ))}
        </StyledSelect>
      ) : (
        !loading &&
        !error && (
          <div className="text-sm text-gray-400">
            No Python environments found
          </div>
        )
      )}

      {activeEnv && (
        <div className="mt-2 text-sm text-gray-300">
          Active: {activeEnv.name} ({activeEnv.type})
        </div>
      )}
    </Container>
  );
};

export default VirtualEnvironmentSelector;
