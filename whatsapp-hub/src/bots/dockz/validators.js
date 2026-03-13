export function isNonEmptyText(v) {
    return String(v || "").trim().length > 0;
}

export function normalizeOptional(v) {
    const s = String(v || "").trim();
    return s.length ? s : "";
}

export function isValidIIN(iin) {
    const s = String(iin || "").trim();
    return /^\d{12}$/.test(s);
}

// Alias
export const isIinValid = isValidIIN;

export function isValidEmail(email) {
    const s = String(email || "").trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export function isValidDate(dateStr) {
    const s = String(dateStr || "").trim();
    // Formats: DD.MM.YYYY or YYYY-MM-DD
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(s)) return true;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return true;
    return false;
}

export function isValidPhone(phone) {
    // Allow +7, 8, 7 starting, digits, spaces, dashes.
    // Must have at least 10 digits.
    const s = String(phone || "").trim();
    const clean = s.replace(/\D/g, "");
    if (clean.length < 10) return false;
    // Optional: ban insane length
    if (clean.length > 15) return false;
    return true;
}
