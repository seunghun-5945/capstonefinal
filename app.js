"use strict";

const express = require("express");
const cors = require("cors");
const homeLogic = require("./routes/home/index");
const signin = require("./controllers/signin");
const signup = require("./controllers/signup");

const app = express();
const port = 8000;

app.use(cors());
app.use(express.json()); // JSON 파싱 미들웨어 추가
app.use("/", homeLogic);
app.use("/", signin); 
app.use("/", signup);

app.listen(port, ()=> {
  console.log(port,"접속 성공 서버 가동");
});
