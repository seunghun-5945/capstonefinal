import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { OpenAI } from "openai";
import cors from "cors";

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // Vite 기본 개발 서버 포트
    methods: ["GET", "POST"],
  },
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

io.on("connection", (socket) => {
  console.log("클라이언트가 연결되었습니다.");

  socket.on("codeChange", async (data) => {
    try {
      console.log("코드 변경 감지:", data);

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "코드 자동 완성 도우미입니다. 사용자의 코드를 분석하여 적절한 언어로 코드를 제안합니다.\n" +
              "코드 제안 시 다음 규칙을 따르세요:\n" +
              "1. 실행 가능한 코드만 제시\n" +
              "2. 설명이 필요한 경우 해당 언어의 주석 형식으로 표시\n" +
              "3. 마크다운 표시는 제외\n" +
              "4. 코드와 관련된 설명은 모두 주석으로 처리\n" +
              "5. 현재 작성 중인 라인의 다음 부분만 제안",
          },
          {
            role: "user",
            content: `전체 코드 컨텍스트:
${data.code}

현재 라인:
${data.line}

현재 커서 위치:
${JSON.stringify(data.position)}

다음에 올 코드를 제안해주세요.`,
          },
        ],
        max_tokens: 150,
        temperature: 0.3,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      let suggestion = completion.choices[0].message.content.trim();

      // 마크다운 코드 블록 표시 제거
      suggestion = suggestion
        .replace(/```[\s\S]*?\n([\s\S]*?)```/g, "$1")
        .trim();

      // 언어 지정자 제거 (예: python, javascript 등)
      suggestion = suggestion
        .replace(/^(python|javascript|js|jsx|tsx|ts)$/gm, "")
        .trim();

      console.log("제안할 코드:", suggestion);
      socket.emit("codeSuggestion", suggestion);
    } catch (error) {
      console.error("OpenAI API 에러:", error);
      console.error("에러 세부 정보:", error.response?.data || error.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("클라이언트가 연결을 종료했습니다.");
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`서버가 ${PORT}번 포트에서 ���행중입니다`);
});
