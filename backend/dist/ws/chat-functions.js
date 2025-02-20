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
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleChat = exports.handleLeave = exports.handleJoin = void 0;
const prisma_1 = require("../prisma");
const handleJoin = (data, userId, ws, userManager) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = userManager.findUserByWS(ws);
        if (!user) {
            console.log("User not found");
            return;
        }
        const existingRoom = yield prisma_1.prisma.room.findFirst({
            where: {
                id: data.roomId,
                name: data.roomName,
            },
        });
        if (!existingRoom) {
            console.log(existingRoom);
            console.log("no such rooms exist");
            return;
        }
        userManager.addUserToRoom(userId, data.roomId, ws);
    }
    catch (error) {
        console.log(error);
    }
});
exports.handleJoin = handleJoin;
const handleLeave = (data, userId, ws, userManager) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        userManager.removeUserFromRoom(userId, data.roomId, ws);
    }
    catch (error) {
        console.log(error);
    }
});
exports.handleLeave = handleLeave;
const handleChat = (data, userId, ws, userManager, client) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = userManager.findUserByWS(ws);
        if (!user) {
            console.log("User not found");
            return;
        }
        const message = data.message;
        if (!message) {
            console.log("No message provided");
            return;
        }
        const messageData = JSON.stringify({
            message,
            userId,
            roomId: data.roomId,
        });
        const pushResult = yield client.lPush("chat", messageData);
        console.log("Push result", pushResult);
        let recipients = userManager.getUsersInRoom(data.roomId);
        recipients === null || recipients === void 0 ? void 0 : recipients.forEach((u) => {
            try {
                u.ws.send(JSON.stringify({
                    type: "chat",
                    message: message,
                    roomId: data.roomId,
                }));
            }
            catch (sendError) {
                console.error(`Error sending message to user ${u.id}:`, sendError);
            }
        });
    }
    catch (error) {
        console.log(error);
    }
});
exports.handleChat = handleChat;
