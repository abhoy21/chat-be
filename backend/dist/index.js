"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const redis_1 = require("redis");
const routes_1 = __importDefault(require("./http-routes/routes"));
const ws_1 = require("ws");
const state_management_1 = require("./ws/state-management");
const chat_functions_1 = require("./ws/chat-functions");
const app = (0, express_1.default)();
app.use(express_1.default.json());
const client = (0, redis_1.createClient)({});
client.on("error", (err) => console.log("Redis Client Error", err));
const wss = new ws_1.WebSocketServer({ port: 8080 });
const userManager = new state_management_1.UserManager();
app.use("/api/v1", routes_1.default);
const onStartServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield client.connect();
        console.log("Redis Client Connected");
        app.listen(8000, () => {
            console.log("Server is running on port 8000");
        });
    }
    catch (error) {
        console.error("Failed to connect to Redis", error);
    }
});
onStartServer();
wss.on("connection", (ws, req) => {
    try {
        const url = req.url;
        if (!url)
            return;
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
        ws.on("message", (message) => {
            const data = JSON.parse(message);
            if (data.type === "join-room") {
                console.log("userId", userId);
                (0, chat_functions_1.handleJoin)(data, userId, ws, userManager);
            }
            else if (data.type === "chat") {
                console.log("userId", userId);
                (0, chat_functions_1.handleChat)(data, userId, ws, userManager, client);
            }
            else if (data.type === "leave-room") {
                (0, chat_functions_1.handleLeave)(data, userId, ws, userManager);
            }
            else {
                console.log("Unknown message type");
            }
        });
    }
    catch (error) {
        console.log("Internal Server Error", error);
    }
});
