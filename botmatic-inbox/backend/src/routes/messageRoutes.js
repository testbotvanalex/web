import { Router } from "express";
import {
  getChatMessages,
  postChatMessage,
} from "../controllers/messageController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.get("/", getChatMessages);
router.post("/", postChatMessage);

export default router;
