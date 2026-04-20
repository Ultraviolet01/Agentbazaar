"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "at_super-secret-key";
const authMiddleware = (req, res, next) => {
    // Check cookies first, then Authorization header
    let token = req.cookies?.accessToken;
    if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        }
    }
    if (!token) {
        return res.status(401).json({
            error: "Access denied. No token provided.",
            code: "NO_TOKEN"
        });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, ACCESS_TOKEN_SECRET);
        req.userId = decoded.userId;
        next();
    }
    catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                error: "Session expired",
                code: "TOKEN_EXPIRED"
            });
        }
        res.status(401).json({ error: "Invalid session", code: "INVALID_TOKEN" });
    }
};
exports.authMiddleware = authMiddleware;
