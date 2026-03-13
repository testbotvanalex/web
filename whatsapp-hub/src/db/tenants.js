// src/db/tenants.js
import { db } from "./db.js";

const stmts = {
    getByPhone: db.prepare("SELECT * FROM tenants WHERE phone_number_id = ? AND enabled = 1"),
    getAll: db.prepare("SELECT * FROM tenants ORDER BY created_at DESC"),
    insert: db.prepare(`
    INSERT INTO tenants (phone_number_id, display_phone, bot_key, language, enabled, config)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
    update: db.prepare(`
    UPDATE tenants SET
      display_phone = COALESCE(?, display_phone),
      bot_key = COALESCE(?, bot_key),
      language = COALESCE(?, language),
      enabled = COALESCE(?, enabled),
      config = COALESCE(?, config),
      updated_at = CURRENT_TIMESTAMP
    WHERE phone_number_id = ?
  `),
    // Use INSERT OR REPLACE to update existing records cleanly
    upsert: db.prepare(`
    INSERT INTO tenants (phone_number_id, bot_key, display_phone, language, enabled, config, updated_at)
    VALUES (@phone, @botKey, @display, @lang, @enabled, @config, CURRENT_TIMESTAMP)
    ON CONFLICT(phone_number_id) DO UPDATE SET
      bot_key = excluded.bot_key,
      updated_at = excluded.updated_at
  `),
    delete: db.prepare("UPDATE tenants SET enabled = 0, updated_at = CURRENT_TIMESTAMP WHERE phone_number_id = ?"),
    hardDelete: db.prepare("DELETE FROM tenants WHERE phone_number_id = ?"),
};

// In-memory cache for fast lookups
let tenantsCache = new Map();

export function refreshCache() {
    tenantsCache.clear();
    const rows = stmts.getAll.all();
    for (const row of rows) {
        if (row.enabled) {
            tenantsCache.set(row.phone_number_id, {
                ...row,
                config: JSON.parse(row.config || "{}"),
            });
        }
    }
    console.log(`📦 Tenants cache refreshed: ${tenantsCache.size} active tenants`);
}

export function getTenant(phoneNumberId) {
    if (tenantsCache.has(phoneNumberId)) {
        return tenantsCache.get(phoneNumberId);
    }
    const row = stmts.getByPhone.get(phoneNumberId);
    if (row) {
        const tenant = { ...row, config: JSON.parse(row.config || "{}") };
        tenantsCache.set(phoneNumberId, tenant);
        return tenant;
    }
    return null;
}

export function getAllTenants() {
    return stmts.getAll.all().map(row => ({
        ...row,
        config: JSON.parse(row.config || "{}"),
    }));
}

/**
 * Auto-discovery upsert
 * @param {object} params - { phoneNumberId, botKey, name (as displayPhone), language }
 */
export function upsertTenant({ phoneNumberId, botKey, name, language }) {
    if (!phoneNumberId || !botKey) return;

    stmts.upsert.run({
        phone: phoneNumberId,
        botKey: botKey,
        display: name || null, // Optional display name
        lang: language || "en",
        enabled: 1, // Always enable on auto-discovery
        config: "{}"
    });
    refreshCache();
    console.log(`✨ Tenant Upserted: ${phoneNumberId} -> ${botKey}`);
}

export function createTenant({ phoneNumberId, displayPhone, botKey, language, enabled = 1, config = {} }) {
    stmts.insert.run(
        phoneNumberId,
        displayPhone || null,
        botKey || "defaultBot",
        language || "ru",
        enabled ? 1 : 0,
        JSON.stringify(config)
    );
    refreshCache();
    return getTenant(phoneNumberId);
}

export function updateTenant(phoneNumberId, updates) {
    stmts.update.run(
        updates.displayPhone ?? null,
        updates.botKey ?? null,
        updates.language ?? null,
        updates.enabled !== undefined ? (updates.enabled ? 1 : 0) : null,
        updates.config ? JSON.stringify(updates.config) : null,
        phoneNumberId
    );
    refreshCache();
    return getTenant(phoneNumberId);
}

export function deleteTenant(phoneNumberId, hard = false) {
    if (hard) {
        stmts.hardDelete.run(phoneNumberId);
    } else {
        stmts.delete.run(phoneNumberId);
    }
    refreshCache();
}

refreshCache();
