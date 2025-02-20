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
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authMiddleware(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                res.status(401).send("Unauthorized");
                return;
            }
            const token = authHeader.split(" ")[1];
            console.log("token", token);
            jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                if (err) {
                    res.status(401).send("Unauthorized");
                    return;
                }
                const decodedUserId = decoded;
                req.userId = decodedUserId.userId;
                next();
            });
        }
        catch (error) {
            console.log("Internal Middleware Error", error);
        }
    });
}
