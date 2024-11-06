const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs").promises;
const { exec, spawn } = require("child_process");
const os = require("os");

let mainWindow;
let currentEnv = null;
let childProcess = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  win.loadURL("http://localhost:5173");
  win.webContents.openDevTools();
  mainWindow = win;
}

function broadcastEnvironmentChange(env) {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send("environment-changed", env);
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// 크로스 플랫폼 경로 헬퍼 함수
const getPythonExecutablePath = (envPath, isCondaEnv = false) => {
  const isWindows = process.platform === "win32";
  if (isCondaEnv) return "python"; // conda run을 사용할 것이므로 직접 python 실행 경로는 불필요

  return isWindows
    ? path.join(envPath, "Scripts", "python.exe")
    : path.join(envPath, "bin", "python");
};

const getActivatePath = (envPath) => {
  const isWindows = process.platform === "win32";
  return isWindows
    ? path.join(envPath, "Scripts", "activate.bat")
    : path.join(envPath, "bin", "activate");
};

// 프로세스 종료 함수
const killProcess = async () => {
  if (!childProcess) return false;

  return new Promise((resolve) => {
    const isWindows = process.platform === "win32";

    if (isWindows) {
      exec(`taskkill /pid ${childProcess.pid} /T /F`, (error) => {
        if (error) {
          console.error("Failed to kill process:", error);
        }
        childProcess = null;
        resolve(true);
      });
    } else {
      try {
        process.kill(-childProcess.pid); // 프로세스 그룹 전체 종료
      } catch (error) {
        console.error("Failed to kill process group:", error);
        childProcess.kill("SIGTERM");
      }
      childProcess.on("exit", () => {
        childProcess = null;
        resolve(true);
      });
    }

    setTimeout(() => {
      if (childProcess) {
        try {
          childProcess.kill("SIGKILL");
        } catch (error) {
          console.error("Failed to force kill process:", error);
        }
        childProcess = null;
        resolve(true);
      }
    }, 5000);
  });
};

// IPC 핸들러들
ipcMain.handle("get-initial-path", () => {
  return process.cwd();
});

ipcMain.handle("read-directory", async (event, path) => {
  const files = await fs.readdir(path, { withFileTypes: true });
  return files.map((file) => ({
    name: file.name,
    isDirectory: file.isDirectory(),
  }));
});

ipcMain.handle("get-parent-path", (event, currentPath) => {
  return path.dirname(currentPath);
});

ipcMain.handle("read-file", async (event, filePath) => {
  return await fs.readFile(filePath, "utf-8");
});

ipcMain.handle("write-file", async (event, filePath, content) => {
  await fs.writeFile(filePath, content, "utf-8");
  return true;
});

ipcMain.handle("get-home-path", () => {
  return os.homedir();
});

ipcMain.handle("get-conda-envs", async () => {
  try {
    const { stdout } = await new Promise((resolve, reject) => {
      exec("conda env list", (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve({ stdout, stderr });
      });
    });

    return stdout
      .split("\n")
      .slice(2)
      .filter((line) => line.trim())
      .map((line) => {
        const [name, path] = line.trim().split(/\s+/);
        return { name, path, type: "conda" };
      })
      .filter((env) => env.name && env.path);
  } catch (error) {
    console.error("Failed to get conda environments:", error);
    return [];
  }
});

ipcMain.handle("run-code", async (event, code, language) => {
  if (childProcess) {
    await killProcess();
  }

  if (language === "python") {
    const tmpFilePath = path.join(os.tmpdir(), `temp_${Date.now()}.py`);

    try {
      await fs.writeFile(tmpFilePath, code, "utf8");

      const isWindows = process.platform === "win32";
      let spawnOptions = {
        shell: true,
        env: { ...process.env },
        detached: !isWindows, // Unix 시스템에서는 프로세스 그룹 생성
      };

      let command;
      let args;

      if (currentEnv) {
        if (currentEnv.type === "conda") {
          command = isWindows ? "conda" : "conda";
          args = ["run", "-n", currentEnv.name, "python", tmpFilePath];
        } else {
          if (isWindows) {
            command = getPythonExecutablePath(currentEnv.path);
            args = [tmpFilePath];
          } else {
            command = "bash";
            args = [
              "-c",
              `source "${getActivatePath(
                currentEnv.path
              )}" && python "${tmpFilePath}"`,
            ];
          }
        }
      } else {
        command = "python";
        args = [tmpFilePath];
      }

      return new Promise((resolve, reject) => {
        let output = "";
        let error = "";

        childProcess = spawn(command, args, spawnOptions);

        if (!isWindows) {
          childProcess.unref(); // Unix 시스템에서 부모 프로세스와 분리
        }

        childProcess.stdout.on("data", (data) => {
          output += data.toString();
        });

        childProcess.stderr.on("data", (data) => {
          error += data.toString();
        });

        childProcess.on("close", (code) => {
          childProcess = null;
          try {
            fs.unlink(tmpFilePath);
          } catch (err) {
            console.error("Failed to delete temp file:", err);
          }

          if (code === 0) {
            resolve(output);
          } else {
            reject(new Error(error || "Unknown error occurred"));
          }
        });

        childProcess.on("error", (err) => {
          childProcess = null;
          try {
            fs.unlink(tmpFilePath);
          } catch (unlinkErr) {
            console.error("Failed to delete temp file:", unlinkErr);
          }
          reject(new Error(`Failed to start Python process: ${err.message}`));
        });
      });
    } finally {
      try {
        await fs.unlink(tmpFilePath);
      } catch (error) {
        console.error("Failed to delete temp file:", error);
      }
    }
  } else {
    return `Unsupported language: ${language}`;
  }
});

ipcMain.handle("get-venv-envs", async () => {
  const searchPaths = [os.homedir(), process.cwd()];
  const venvs = [];

  for (const searchPath of searchPaths) {
    try {
      const items = await fs.readdir(searchPath, { withFileTypes: true });

      for (const item of items) {
        if (item.isDirectory()) {
          const envPath = path.join(searchPath, item.name);
          const activatePath = getActivatePath(envPath);

          try {
            await fs.access(activatePath);
            venvs.push({
              name: item.name,
              path: envPath,
              type: "venv",
            });
          } catch {
            continue;
          }
        }
      }
    } catch (error) {
      console.error(`Error searching in ${searchPath}:`, error);
    }
  }

  return venvs;
});

ipcMain.handle("activate-env", async (event, env) => {
  try {
    const isWindows = process.platform === "win32";

    if (env.type === "conda") {
      const command = `conda run -n ${env.name} python --version`;
      await new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) reject(error);
          else resolve(stdout);
        });
      });
    } else {
      const pythonPath = getPythonExecutablePath(env.path);
      await new Promise((resolve, reject) => {
        exec(`"${pythonPath}" --version`, (error, stdout, stderr) => {
          if (error) reject(error);
          else resolve(stdout);
        });
      });
    }

    currentEnv = env;
    broadcastEnvironmentChange(env);

    return {
      success: true,
      message: `Activated ${env.name}`,
    };
  } catch (error) {
    currentEnv = null;
    throw error;
  }
});

ipcMain.handle("stop-code", async () => {
  try {
    const killed = await killProcess();
    return { success: killed };
  } catch (error) {
    console.error("Error stopping process:", error);
    throw error;
  }
});

ipcMain.handle("execute-command", async (event, command) => {
  if (childProcess) {
    await killProcess();
  }

  const isWindows = process.platform === "win32";
  let finalCommand = command;
  let spawnOptions = {
    shell: true,
    env: { ...process.env },
    detached: !isWindows,
  };

  if (currentEnv) {
    if (currentEnv.type === "conda") {
      finalCommand = `conda run -n ${currentEnv.name} ${command}`;
    } else {
      if (isWindows) {
        const pythonPath = getPythonExecutablePath(currentEnv.path);
        finalCommand = command.replace("python", `"${pythonPath}"`);
      } else {
        finalCommand = `source "${getActivatePath(
          currentEnv.path
        )}" && ${command}`;
      }
    }
  }

  return new Promise((resolve, reject) => {
    childProcess = spawn(finalCommand, [], spawnOptions);

    if (!isWindows) {
      childProcess.unref();
    }

    childProcess.stdout.on("data", (data) => {
      const text = data.toString();
      if (mainWindow) {
        mainWindow.webContents.send("terminal-output", text);
      }
    });

    childProcess.stderr.on("data", (data) => {
      const text = data.toString();
      if (mainWindow) {
        mainWindow.webContents.send("terminal-output", text);
      }
    });

    childProcess.on("error", (err) => {
      const errorText = `Process error: ${err.message}\n`;
      if (mainWindow) {
        mainWindow.webContents.send("terminal-output", errorText);
      }
      reject(new Error(errorText));
    });

    childProcess.on("close", (code) => {
      const exitText = code !== 0 ? `\nProcess exited with code ${code}\n` : "";
      if (exitText && mainWindow) {
        mainWindow.webContents.send("terminal-output", exitText);
      }

      childProcess = null;
      resolve({ success: code === 0 });
    });
  });
});

ipcMain.handle("execute-terminal-command", async (event, command) => {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === "win32";
    let shellCommand = command;

    if (currentEnv) {
      if (currentEnv.type === "conda") {
        shellCommand = `conda run -n ${currentEnv.name} ${command}`;
      } else {
        const pythonPath = getPythonExecutablePath(currentEnv.path);
        if (command.startsWith("python ")) {
          shellCommand = `"${pythonPath}" ${command.slice(7)}`;
        }
      }
    }

    const spawnOptions = {
      shell: true,
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
    };

    const proc = spawn(
      isWindows ? "cmd.exe" : "bash",
      isWindows ? ["/c", shellCommand] : ["-c", shellCommand],
      spawnOptions
    );

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(stderr || "Command failed"));
      }
    });

    proc.on("error", (err) => {
      reject(err);
    });
  });
});
