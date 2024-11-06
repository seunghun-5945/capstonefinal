import React, { useState, useEffect } from "react";

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
    <div className="p-4 border-b border-gray-200">
      <h3 className="text-lg font-medium mb-2">Python Environments</h3>
      <div className="mb-2">
        <button
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          onClick={loadEnvironments}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh Environments"}
        </button>
      </div>

      {loading && (
        <div className="text-sm text-gray-400">Loading environments...</div>
      )}

      {error && (
        <div
          className={`text-sm mb-2 ${
            error.includes("Successfully") ? "text-green-500" : "text-red-500"
          }`}
        >
          {error}
        </div>
      )}

      {environments.length > 0 ? (
        <select
          className="w-full p-2 border rounded bg-gray-700 text-white"
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
        </select>
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
    </div>
  );
};

export default VirtualEnvironmentSelector;
