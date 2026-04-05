import path from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import "./db/index.js";
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPublic = path.resolve(__dirname, "../../frontend/public");

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.static(frontendPublic));

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/chats/:id/messages", messageRoutes);
app.use("/webhook", webhookRoutes);

app.use((req, res, next) => {
  if (req.path.startsWith("/api/") || req.path === "/webhook") {
    return next();
  }
  return res.sendFile(path.join(frontendPublic, "index.html"));
});

app.use(errorMiddleware);

export default app;
