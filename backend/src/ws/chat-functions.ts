import { WebSocket } from "ws";
import { UserManager } from "./state-management";
import { prisma } from "../prisma";
import { RedisClientType } from "redis";

interface DataProps {
  type: string;
  message?: string;
  roomId: string;
  roomName: string;
}

export const handleJoin = async (
  data: DataProps,
  userId: string,
  ws: WebSocket,
  userManager: UserManager
) => {
  try {
    const user = userManager.findUserByWS(ws);
    if (!user) {
      console.log("User not found");
      return;
    }

    const existingRoom = await prisma.room.findFirst({
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
  } catch (error) {
    console.log(error);
  }
};

export const handleLeave = async (
  data: DataProps,
  userId: string,
  ws: WebSocket,
  userManager: UserManager
) => {
  try {
    userManager.removeUserFromRoom(userId, data.roomId, ws);
  } catch (error) {
    console.log(error);
  }
};

export const handleChat = async (
  data: DataProps,
  userId: string,
  ws: WebSocket,
  userManager: UserManager,
  client: RedisClientType
) => {
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

    const pushResult = await client.lPush("chat", messageData);
    console.log("Push result", pushResult);
    let recipients = userManager.getUsersInRoom(data.roomId);

    recipients?.forEach((u) => {
      try {
        u.ws.send(
          JSON.stringify({
            type: "chat",
            message: message,
            roomId: data.roomId,
          })
        );
      } catch (sendError) {
        console.error(`Error sending message to user ${u.id}:`, sendError);
      }
    });
  } catch (error) {
    console.log(error);
  }
};
