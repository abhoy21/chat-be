import { WebSocket } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";

interface User {
  id: string;
  ws: WebSocket;
  room: string[];
}

export class UserManager {
  private static instance: UserManager;
  private users: User[] = [];
  private RoomUserMap: Map<string, User[]> = new Map();

  constructor() {
    if (!UserManager.instance) {
      UserManager.instance = this;
    }
    return UserManager.instance;
  }

  addUser(userId: string, ws: WebSocket) {
    return this.users.push({ id: userId, ws, room: [] });
  }

  addUserToRoom(userId: string, roomId: string, ws: WebSocket) {
    this.users.map(
      (u) => u.id === userId && u.ws === ws && u.room.push(roomId)
    );
    const user = this.users.find((u) => u.id === userId && u.ws === ws);
    if (!user) {
      console.log("User not found");
      return;
    }

    if (!this.RoomUserMap.has(roomId)) {
      this.RoomUserMap.set(roomId, []);
    }
    this.RoomUserMap.get(roomId)!.push(user);
  }

  removeUserFromRoom(userId: string, roomId: string, ws: WebSocket) {
    this.users.filter((u) => u.id !== userId && u.ws !== ws);
    this.RoomUserMap.get(roomId)!.filter((u) => u.id !== userId && u.ws !== ws);
  }

  getUsersInRoom(roomId: string) {
    return this.RoomUserMap.get(roomId);
  }

  findUserByWS(ws: WebSocket) {
    return this.users.find((u) => u.ws === ws);
  }

  checkAuthenticatedUser(token: string): string | null {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

      if (!decoded || !decoded.userId) {
        return null;
      }
      console.log("decoded", decoded.userId);
      return decoded.userId;
    } catch (error) {
      return null;
    }
  }
}
