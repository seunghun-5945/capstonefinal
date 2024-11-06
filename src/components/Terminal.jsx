// src/components/Terminal.jsx
import React, { useEffect, useRef, useCallback } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

const TerminalComponent = ({ onRef }) => {
  const terminalRef = useRef(null);
  const termInstanceRef = useRef(null);
  const currentLineRef = useRef("");
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);

  const executeCommand = useCallback(async (command) => {
    const term = termInstanceRef.current;
    if (!term) return;

    historyRef.current.push(command);
    historyIndexRef.current = historyRef.current.length;

    try {
      // 명령어만 표시하고 결과는 IPC 이벤트를 통해 받음
      term.write("\r\n");
      await window.electronAPI.executeCommand(command);
    } catch (error) {
      // 에러만 여기서 표시
      term.writeln(`\r\nCommand failed: ${error.message}`);
    }

    term.write("\r\n$ ");
    currentLineRef.current = "";
  }, []);

  const handleTermData = useCallback(
    (data) => {
      const term = termInstanceRef.current;
      if (!term) return;

      // 화살표 키 처리
      if (data === "\x1b[A") {
        // 위 화살표
        if (historyIndexRef.current > 0) {
          historyIndexRef.current--;
          const command = historyRef.current[historyIndexRef.current];
          term.write(
            "\r$ " +
              " ".repeat(currentLineRef.current.length) +
              "\r$ " +
              command
          );
          currentLineRef.current = command;
        }
        return;
      }
      if (data === "\x1b[B") {
        // 아래 화살표
        if (historyIndexRef.current < historyRef.current.length) {
          historyIndexRef.current++;
          const command = historyRef.current[historyIndexRef.current] || "";
          term.write(
            "\r$ " +
              " ".repeat(currentLineRef.current.length) +
              "\r$ " +
              command
          );
          currentLineRef.current = command;
        }
        return;
      }

      switch (data) {
        case "\r": // Enter
          const command = currentLineRef.current.trim();
          if (command) {
            executeCommand(command);
          } else {
            term.write("\r\n$ ");
          }
          break;
        case "\u0003": // Ctrl+C
          term.write("^C");
          term.write("\r\n$ ");
          currentLineRef.current = "";
          // Ctrl+C 신호 전송
          window.electronAPI.stopCode().catch(console.error);
          break;
        case "\u007F": // Backspace
          if (currentLineRef.current.length > 0) {
            currentLineRef.current = currentLineRef.current.slice(0, -1);
            term.write("\b \b");
          }
          break;
        default:
          currentLineRef.current += data;
          term.write(data);
      }
    },
    [executeCommand]
  );

  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: 14,
      theme: {
        background: "#1e1e1e",
        foreground: "#ffffff",
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);

    termInstanceRef.current = term;

    // 터미널 출력 리스너
    const outputHandler = (text) => {
      term.write(text.replace(/\n/g, "\r\n"));
    };

    if (window.electronAPI) {
      window.electronAPI.onTerminalOutput(outputHandler);
    }

    const fitTerminal = () => {
      if (terminalRef.current) {
        fitAddon.fit();
      }
    };

    setTimeout(fitTerminal, 100);
    window.addEventListener("resize", fitTerminal);

    term.writeln("Terminal Ready");
    term.write("$ ");

    term.onData(handleTermData);

    if (onRef) {
      onRef({
        executeCommandFromExternal: (command) => {
          if (command === "\x03") {
            handleTermData("\u0003");
          } else {
            currentLineRef.current = command;
            handleTermData("\r");
          }
        },
      });
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.offTerminalOutput(outputHandler);
      }
      term.dispose();
      window.removeEventListener("resize", fitTerminal);
      if (onRef) {
        onRef(null);
      }
    };
  }, [handleTermData, onRef]);

  return <div ref={terminalRef} style={{ width: "100%", height: "100%" }} />;
};

export default TerminalComponent;
