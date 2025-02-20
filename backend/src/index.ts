import express from "express";
import { createClient, RedisClientType } from "redis";
import httpRouter from "./http-routes/routes";
import { WebSocketServer } from "ws";
import { UserManager } from "./ws/state-management";
import { handleChat, handleJoin, handleLeave } from "./ws/chat-functions";

const app = express();
app.use(express.json());

const client = createClient({});
client.on("error", (err) => console.log("Redis Client Error", err));

const wss = new WebSocketServer({ port: 8080 });
const userManager = new UserManager();

app.use("/api/v1", httpRouter);

const onStartServer = async () => {
  try {
    await client.connect();
    console.log("Redis Client Connected");
    app.listen(8000, () => {
      console.log("Server is running on port 8000");
    });
  } catch (error) {
    console.error("Failed to connect to Redis", error);
  }
};

onStartServer();

wss.on("connection", (ws, req) => {
  try {
    const url = req.url;

    if (!url) return;

    const queryparams = new URLSearchParams(url.split("?")[1]);
    const token = queryparams.get("token") || "";
    const userId = userManager.checkAuthenticatedUser(token);

    console.log("userId", userId);
    console.log("WebSocket Connected");
    if (!userId) {
      ws.close();
      return;
    }
    userManager.addUser(userId, ws);
    console.log("User ID", userId);
    ws.on("message", (message: string) => {
      const data = JSON.parse(message);
      if (data.type === "join-room") {
        console.log("userId", userId);
        handleJoin(data, userId, ws, userManager);
      } else if (data.type === "chat") {
        console.log("userId", userId);
        handleChat(data, userId, ws, userManager, client as RedisClientType);
      } else if (data.type === "leave-room") {
        handleLeave(data, userId, ws, userManager);
      } else {
        console.log("Unknown message type");
      }
    });
  } catch (error) {
    console.log("Internal Server Error", error);
  }
});
