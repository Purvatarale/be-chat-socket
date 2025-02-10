const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectToDB } = require("./database");
const staticRouter = require("./routes/static.routes");
const userRouter = require("./routes/user.routes");
const conversationRouter = require("./routes/conversation.routes");
const validateVouchTokens = require("./middleware");
const {chatwootListener} = require("./controller/conversation.controller")
const http = require("http");
const wsService = require("./socket/socket.service");

const app = express();


app.use(express.json());
app.use(cors({
  origin:"*"
}));
connectToDB();

app.get("/chatapp", (req, res) => {
  res.status(200).json({ message: "Welcome to the API" });
});

app.use("/chatapp/api/v1", validateVouchTokens, staticRouter);
app.use("/chatapp/api/v1/conversations", validateVouchTokens, conversationRouter);
app.use("/chatapp/api/v1", validateVouchTokens, userRouter); 
app.post("/chatapp/api/v1/webhook/listener", chatwootListener);

const server = http.createServer(app);

wsService.initialize(server);

app.use("/*", (req, res) => {
  res.status(404).json({ message: "Not Found" });
});

server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});