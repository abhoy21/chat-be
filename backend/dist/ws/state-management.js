"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserManager = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class UserManager {
    constructor() {
        this.users = [];
        this.RoomUserMap = new Map();
        if (!UserManager.instance) {
            UserManager.instance = this;
        }
        return UserManager.instance;
    }
    addUser(userId, ws) {
        return this.users.push({ id: userId, ws, room: [] });
    }
    addUserToRoom(userId, roomId, ws) {
        this.users.map((u) => u.id === userId && u.ws === ws && u.room.push(roomId));
        const user = this.users.find((u) => u.id === userId && u.ws === ws);
        if (!user) {
            console.log("User not found");
            return;
        }
        if (!this.RoomUserMap.has(roomId)) {
            this.RoomUserMap.set(roomId, []);
        }
        this.RoomUserMap.get(roomId).push(user);
    }
    removeUserFromRoom(userId, roomId, ws) {
        this.users.filter((u) => u.id !== userId && u.ws !== ws);
        this.RoomUserMap.get(roomId).filter((u) => u.id !== userId && u.ws !== ws);
    }
    getUsersInRoom(roomId) {
        return this.RoomUserMap.get(roomId);
    }
    findUserByWS(ws) {
        return this.users.find((u) => u.ws === ws);
    }
    checkAuthenticatedUser(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            if (!decoded || !decoded.userId) {
                return null;
            }
            console.log("decoded", decoded.userId);
            return decoded.userId;
        }
        catch (error) {
            return null;
        }
    }
}
exports.UserManager = UserManager;
