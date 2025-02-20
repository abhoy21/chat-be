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
exports.default = startWorker;
const redis_1 = require("redis");
const prisma_1 = require("./prisma");
const client = (0, redis_1.createClient)({});
function startWorker() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.connect();
            console.log("Worker connected to Redis.");
            while (true) {
                try {
                    const messages = yield client.brPop("chat", 0);
                    if (messages === null || messages === void 0 ? void 0 : messages.element) {
                        console.log("Received message:", messages.element);
                        yield pushMessagesToDB(messages.element);
                    }
                }
                catch (error) {
                    console.error("Error processing message:", error);
                    yield new Promise((resolve) => setTimeout(resolve, 1000));
                }
            }
        }
        catch (error) {
            console.error("Failed to connect to Redis", error);
            throw error;
        }
    });
}
function pushMessagesToDB(messages) {
    return __awaiter(this, void 0, void 0, function* () {
        const { roomId, message, userId } = JSON.parse(messages);
        console.log("Pushing to DB");
        yield prisma_1.prisma.chat.create({
            data: {
                message,
                userId,
                roomId,
            },
        });
    });
}
startWorker();
