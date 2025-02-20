import { createClient } from "redis";
import { prisma } from "./prisma";

const client = createClient({});

export default async function startWorker() {
  try {
    await client.connect();
    console.log("Worker connected to Redis.");
    while (true) {
      try {
        const messages = await client.brPop("chat", 0);
        if (messages?.element) {
          console.log("Received message:", messages.element);
          await pushMessagesToDB(messages.element);
        }
      } catch (error) {
        console.error("Error processing message:", error);

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  } catch (error) {
    console.error("Failed to connect to Redis", error);
    throw error;
  }
}

async function pushMessagesToDB(messages: string) {
  const { roomId, message, userId } = JSON.parse(messages);
  console.log("Pushing to DB");
  await prisma.chat.create({
    data: {
      message,
      userId,
      roomId,
    },
  });
}

startWorker();
