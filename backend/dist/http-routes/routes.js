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
const bcrypt_1 = require("bcrypt");
const express_1 = require("express");
const prisma_1 = require("../prisma");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const middleware_1 = require("../http-middleware/middleware");
const helper_1 = require("./helper");
const router = (0, express_1.Router)();
router.get("/", (req, res) => {
    res.send("Hello World!");
});
router.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, name, password } = req.body;
        if (!email || !name || !password) {
            res.status(400).send("Missing required fields");
            return;
        }
        const hashedPassword = yield (0, bcrypt_1.hash)(password, Number(process.env.SALT_ROUNDS));
        const response = yield prisma_1.prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
            },
        });
        if (!response) {
            res.status(500).send("Failed to create user");
        }
        res.status(200).send("User created successfully");
    }
    catch (error) {
        console.log("Internal Server Error", error);
        res.status(500).send("Internal Server Error");
    }
}));
router.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).send("Missing required fields");
            return;
        }
        const user = yield prisma_1.prisma.user.findUnique({
            where: {
                email: email,
            },
        });
        if (!user) {
            res.status(404).send("User not found");
            return;
        }
        const isValidPassword = yield (0, bcrypt_1.compare)(password, user.password);
        if (!isValidPassword) {
            res.status(401).send("Invalid Password");
            return;
        }
        const { accessToken, refreshToken } = yield (0, helper_1.generateAccessTokenWithRefreshToken)(user.id);
        yield prisma_1.prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                refreshToken,
            },
        });
        res.status(200).json({
            accessToken,
            refreshToken,
        });
    }
    catch (error) {
        console.log("Internal Server Error", error);
        res.status(500).send("Internal Server Error");
    }
}));
router.post("/logout", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).send("Unauthorized");
            return;
        }
        const user = yield prisma_1.prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                refreshToken: "",
            },
        });
        res.status(200).json({ message: "Logged out successfully", user });
    }
    catch (error) {
        console.log("Internal Server Error", error);
        res.status(500).send("Internal Server Error");
    }
}));
router.post("/refresh-token", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        const oldRefreshToken = authHeader === null || authHeader === void 0 ? void 0 : authHeader.split(" ")[1];
        if (!oldRefreshToken) {
            res.status(400).send("Missing required fields");
            return;
        }
        const refreshTokenPayload = jsonwebtoken_1.default.verify(oldRefreshToken, process.env.JWT_SECRET);
        if (!refreshTokenPayload.userId) {
            res.status(401).send("Unauthorized");
            return;
        }
        const user = yield prisma_1.prisma.user.findUnique({
            where: {
                id: refreshTokenPayload.userId,
            },
        });
        if (!user) {
            res.status(401).send("No user found");
            return;
        }
        if (oldRefreshToken !== user.refreshToken) {
            res.status(401).send("Refresh Token Expired!");
            return;
        }
        const { accessToken, refreshToken } = yield (0, helper_1.generateAccessTokenWithRefreshToken)(user.id);
        const updatedUser = yield prisma_1.prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                refreshToken,
            },
        });
        res.status(200).json({
            accessToken,
            refreshToken,
        });
    }
    catch (error) {
        console.log("Internal Server Error", error);
        res.status(500).send("Internal Server Error");
    }
}));
router.post("/create-room", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).send("Unauthorized");
            return;
        }
        const name = req.body.name;
        const existingRoom = yield prisma_1.prisma.room.findFirst({
            where: {
                name,
            },
        });
        if (existingRoom) {
            res.status(400).json({ message: "Room already exists", existingRoom });
            return;
        }
        const room = yield prisma_1.prisma.room.create({
            data: {
                name,
                adminId: userId,
            },
        });
        res.status(200).json({ message: "Room created successfully", room });
    }
    catch (error) {
        console.log("Internal Server Error", error);
        res.status(500).send("Internal Server Error");
    }
}));
exports.default = router;
