import { Router } from "express";
import {
  getChatById,
  getChats,
  release,
  takeOver,
} from "../controllers/chatController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);
router.get("/", getChats);
router.get("/:id", getChatById);
router.post("/:id/takeover", takeOver);
router.post("/:id/release", release);

export default router;
