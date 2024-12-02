const { contextBridge, ipcRenderer } = require("electron");

// 모든 IPC 이벤트 리스너를 한 곳에서 관리
contextBridge.exposeInMainWorld("electronAPI", {
  // 파일 시스템 관련 API
  openFile: () => ipcRenderer.invoke("dialog:openFile"),
  openDirectory: () => ipcRenderer.invoke("dialog:openDirectory"),
  readFile: (path) => ipcRenderer.invoke("read-file", path),
  writeFile: (path, content) => ipcRenderer.invoke("write-file", path, content),
  getInitialPath: () => ipcRenderer.invoke("get-initial-path"),
  readDirectory: (path) => ipcRenderer.invoke("read-directory", path),
  getParentPath: (path) => ipcRenderer.invoke("get-parent-path", path),
  getHomePath: () => ipcRenderer.invoke("get-home-path"),

  // 환경 관련 API
  getCondaEnvs: () => ipcRenderer.invoke("get-conda-envs"),
  getVenvEnvs: () => ipcRenderer.invoke("get-venv-envs"),
  activateEnv: (env) => ipcRenderer.invoke("activate-env", env),
  getActivePythonEnv: () => ipcRenderer.invoke("get-active-python-env"),

  // 코드 실행 관련 API
  executeCommand: (command) => ipcRenderer.invoke("execute-command", command),
  executeTerminalCommand: (command) =>
    ipcRenderer.invoke("execute-terminal-command", command),
  runCode: (code, language) => ipcRenderer.invoke("run-code", code, language),
  stopCode: () => ipcRenderer.invoke("stop-code"),

  // 플랫폼 관련 API
  getPlatform: () => process.platform,

  // 파일 존재 확인 API
  checkFileExists: async (path) => {
    try {
      await require("fs").promises.access(path);
      return true;
    } catch {
      return false;
    }
  },

  // 이벤트 리스너 관련 API
  onTerminalOutput: (callback) =>
    ipcRenderer.on("terminal-output", (_event, value) => callback(value)),
  offTerminalOutput: (callback) =>
    ipcRenderer.removeListener("terminal-output", callback),
  onEnvironmentChanged: (callback) =>
    ipcRenderer.on("environment-changed", (_event, value) => callback(value)),
  offEnvironmentChanged: (callback) =>
    ipcRenderer.removeListener("environment-changed", callback),
});
