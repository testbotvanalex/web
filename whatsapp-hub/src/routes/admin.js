// src/routes/admin.js
import express from "express";
import { getAllTenants, getTenant, createTenant, updateTenant, deleteTenant, refreshCache } from "../db/tenants.js";

const router = express.Router();

/**
 * Simple auth middleware
 */
function authMiddleware(req, res, next) {
    const secret = req.headers["x-admin-secret"] || req.query.secret;

    if (secret !== process.env.ADMIN_SECRET) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    next();
}

router.use(authMiddleware);

/**
 * GET /admin/tenants - List all tenants
 */
router.get("/tenants", (req, res) => {
    try {
        const tenants = getAllTenants();
        res.json({ tenants });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * GET /admin/tenants/:phoneId - Get single tenant
 */
router.get("/tenants/:phoneId", (req, res) => {
    try {
        const tenant = getTenant(req.params.phoneId);
        if (!tenant) {
            return res.status(404).json({ error: "Tenant not found" });
        }
        res.json({ tenant });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * POST /admin/tenants - Create new tenant
 * Body: { phoneNumberId, displayPhone, botKey, language, config }
 */
router.post("/tenants", (req, res) => {
    try {
        const { phoneNumberId, displayPhone, botKey, language, config } = req.body;

        if (!phoneNumberId) {
            return res.status(400).json({ error: "phoneNumberId is required" });
        }

        const tenant = createTenant({
            phoneNumberId,
            displayPhone,
            botKey,
            language,
            config,
        });

        res.status(201).json({ tenant });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * PATCH /admin/tenants/:phoneId - Update tenant
 * Body: { displayPhone?, botKey?, language?, enabled?, config? }
 */
router.patch("/tenants/:phoneId", (req, res) => {
    try {
        const existing = getTenant(req.params.phoneId);
        if (!existing) {
            return res.status(404).json({ error: "Tenant not found" });
        }

        const tenant = updateTenant(req.params.phoneId, req.body);
        res.json({ tenant });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * DELETE /admin/tenants/:phoneId - Disable tenant
 * Query: ?hard=true for permanent delete
 */
router.delete("/tenants/:phoneId", (req, res) => {
    try {
        const hard = req.query.hard === "true";
        deleteTenant(req.params.phoneId, hard);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * POST /admin/refresh - Refresh tenant cache
 */
router.post("/refresh", (req, res) => {
    try {
        refreshCache();
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
