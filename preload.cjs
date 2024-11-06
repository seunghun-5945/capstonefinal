// preload.cjs
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getInitialPath: () => ipcRenderer.invoke("get-initial-path"),
  readDirectory: (path) => ipcRenderer.invoke("read-directory", path),
  getParentPath: (path) => ipcRenderer.invoke("get-parent-path", path),
  readFile: (path) => ipcRenderer.invoke("read-file", path),
  writeFile: (path, content) => ipcRenderer.invoke("write-file", path, content),
  executeCommand: (command) => ipcRenderer.invoke("execute-command", command), // 이 부분이 필요합니다
  runCode: (code, language) => ipcRenderer.invoke("run-code", code, language),
  stopCode: () => ipcRenderer.invoke("stop-code"),
  getCondaEnvs: () => ipcRenderer.invoke("get-conda-envs"),
  getVenvEnvs: () => ipcRenderer.invoke("get-venv-envs"),
  activateEnv: (env) => ipcRenderer.invoke("activate-env", env),
  getActivePythonEnv: () => ipcRenderer.invoke("get-active-python-env"),
  stopCode: () => ipcRenderer.invoke("stop-code"),
  onTerminalOutput: (callback) => {
    return ipcRenderer.on("terminal-output", (_event, value) =>
      callback(value)
    );
  },
  offTerminalOutput: (callback) => {
    return ipcRenderer.removeListener("terminal-output", callback);
  },
});
