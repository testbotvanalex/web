import { Router } from "express";
import { getClients } from "../controllers/clientController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);
router.get("/", getClients);

export default router;
