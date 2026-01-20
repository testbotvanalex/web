const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { createCanvas } = require('canvas');

const PORT = 3000;

// Configuration (must match script.js)
const CONFIG = {
    devices: {
        iphone_17_pro_max: { width: 1320, height: 2868, name: "iPhone 17 Pro Max" },
        iphone_17_pro: { width: 1206, height: 2622, name: "iPhone 17 Pro" },
        iphone_17: { width: 1179, height: 2556, name: "iPhone 17" },
        iphone_17_air: { width: 1170, height: 2532, name: "iPhone 17 Air" },
        iphone_16_pro_max: { width: 1320, height: 2868, name: "iPhone 16 Pro Max" },
        iphone_16_pro: { width: 1206, height: 2622, name: "iPhone 16 Pro" },
        iphone_16_plus: { width: 1290, height: 2796, name: "iPhone 16 Plus" },
        iphone_16: { width: 1179, height: 2556, name: "iPhone 16" },
        iphone_16e: { width: 1179, height: 2556, name: "iPhone 16e" },
        iphone_15_pro_max: { width: 1290, height: 2796, name: "iPhone 15 Pro Max" },
        iphone_15_pro: { width: 1179, height: 2556, name: "iPhone 15 Pro" },
        iphone_15_plus: { width: 1290, height: 2796, name: "iPhone 15 Plus" },
        iphone_15: { width: 1179, height: 2556, name: "iPhone 15" },
        iphone_14_pro_max: { width: 1290, height: 2796, name: "iPhone 14 Pro Max" },
        iphone_14_pro: { width: 1179, height: 2556, name: "iPhone 14 Pro" },
        iphone_14_plus: { width: 1284, height: 2778, name: "iPhone 14 Plus" },
        iphone_14: { width: 1170, height: 2532, name: "iPhone 14" },
        iphone_13_pro_max: { width: 1284, height: 2778, name: "iPhone 13 Pro Max" },
        iphone_13_pro: { width: 1170, height: 2532, name: "iPhone 13 Pro" },
        iphone_13: { width: 1170, height: 2532, name: "iPhone 13" },
        iphone_13_mini: { width: 1080, height: 2340, name: "iPhone 13 Mini" },
        iphone_12_pro_max: { width: 1284, height: 2778, name: "iPhone 12 Pro Max" },
        iphone_12_pro: { width: 1170, height: 2532, name: "iPhone 12 Pro" },
        iphone_12: { width: 1170, height: 2532, name: "iPhone 12" },
        iphone_12_mini: { width: 1080, height: 2340, name: "iPhone 12 Mini" },
        iphone_11_pro_max: { width: 1242, height: 2688, name: "iPhone 11 Pro Max" },
        iphone_11_pro: { width: 1125, height: 2436, name: "iPhone 11 Pro" },
        iphone_11: { width: 828, height: 1792, name: "iPhone 11" },
        iphone_xs_max: { width: 1242, height: 2688, name: "iPhone XS Max" },
        iphone_xr: { width: 828, height: 1792, name: "iPhone XR" },
        iphone_xs: { width: 1125, height: 2436, name: "iPhone XS" },
        iphone_x: { width: 1125, height: 2436, name: "iPhone X" },
        iphone_8_plus: { width: 1242, height: 2208, name: "iPhone 8 Plus" },
        iphone_7_plus: { width: 1242, height: 2208, name: "iPhone 7 Plus" },
        iphone_6s_plus: { width: 1242, height: 2208, name: "iPhone 6s Plus" },
        iphone_6_plus: { width: 1242, height: 2208, name: "iPhone 6 Plus" },
        iphone_8: { width: 750, height: 1334, name: "iPhone 8" },
        iphone_7: { width: 750, height: 1334, name: "iPhone 7" },
        iphone_6s: { width: 750, height: 1334, name: "iPhone 6s" },
        iphone_6: { width: 750, height: 1334, name: "iPhone 6" },
        iphone_se_3: { width: 750, height: 1334, name: "iPhone SE 3" },
        iphone_se_2: { width: 750, height: 1334, name: "iPhone SE 2" },
        iphone_se_1: { width: 640, height: 1136, name: "iPhone SE 1" }
    },
    themeColors: {
        "graphite_orange": { "bg": "#151617", "text": "#E0E0E0", "muted": "#7A7A7A", "dot": "#3F3F3F", "past": "#252627", "today": "#FF7A2F", "number": "#FFFFFF", "future": "#5F5F5F", "weekend": "#ff5c5c" },
        "graphite_orange_oled": { "bg": "#000000", "text": "#E0E0E0", "muted": "#7A7A7A", "dot": "#3F3F3F", "past": "#1A1A1A", "today": "#FF7A2F", "number": "#FFFFFF", "future": "#5F5F5F", "weekend": "#ff5c5c" },
        "midnight_blue": { "bg": "#0D1117", "text": "#C9D1D9", "muted": "#8B949E", "dot": "#21262D", "past": "#161B22", "today": "#58A6FF", "number": "#F0F6FC", "future": "#484F58", "weekend": "#ff6b6b" },
        "midnight_blue_oled": { "bg": "#000000", "text": "#C9D1D9", "muted": "#8B949E", "dot": "#161B22", "past": "#0D1117", "today": "#58A6FF", "number": "#F0F6FC", "future": "#484F58", "weekend": "#ff6b6b" },
        "forest_green": { "bg": "#0D130E", "text": "#D0E5D3", "muted": "#7A9E80", "dot": "#1E2B21", "past": "#162018", "today": "#4CAF50", "number": "#F1F8F2", "future": "#3E5743", "weekend": "#ff6b6b" },
        "forest_green_oled": { "bg": "#000000", "text": "#D0E5D3", "muted": "#7A9E80", "dot": "#1E2B21", "past": "#111A13", "today": "#4CAF50", "number": "#F1F8F2", "future": "#3E5743", "weekend": "#ff6b6b" },
        "sand_terracotta": { "bg": "#F5EFEA", "text": "#3D342B", "muted": "#968C83", "dot": "#DBCFB6", "past": "#EBE3DA", "today": "#D16035", "number": "#3D342B", "future": "#B0A69E", "weekend": "#FF3B30" },
        "sand_terracotta_oled": { "bg": "#000000", "text": "#E7DED7", "muted": "#A89F95", "dot": "#443D36", "past": "#1C1917", "today": "#D2693C", "number": "#FAF6F3", "future": "#786E65", "weekend": "#FF3B30" },
        "violet_focus": { "bg": "#14101C", "text": "#D7CFF5", "muted": "#8C84B2", "dot": "#3A3552", "past": "#1E1829", "today": "#9B7CFF", "number": "#F5F0FF", "future": "#6B6388", "weekend": "#ff6b6b" },
        "violet_focus_oled": { "bg": "#000000", "text": "#D7CFF5", "muted": "#8C84B2", "dot": "#3A3552", "past": "#1E1829", "today": "#9B7CFF", "number": "#F5F0FF", "future": "#6B6388", "weekend": "#ff6b6b" },
        "minimal_red": { "bg": "#121212", "text": "#E0E0E0", "muted": "#858585", "dot": "#2C2C2C", "past": "#1E1E1E", "today": "#FF4D4D", "number": "#FAFAFA", "future": "#555555", "weekend": "#ff4d4d" },
        "clean_white": { "bg": "#FFFFFF", "text": "#1D1D1F", "muted": "#86868B", "dot": "#E5E5E5", "past": "#F5F5F7", "today": "#007AFF", "number": "#1D1D1F", "future": "#D2D2D7", "weekend": "#FF3B30" },
        // New Light Themes
        "sky_blue": { "bg": "#F0F8FF", "text": "#1C1C1E", "muted": "#8E8E93", "dot": "#B0C4DE", "past": "#E6F3FF", "today": "#007AFF", "number": "#1C1C1E", "future": "#7CA7D6", "weekend": "#FF3B30" },
        "lavender": { "bg": "#F3E5F5", "text": "#2D0C38", "muted": "#9C27B0", "dot": "#E1BEE7", "past": "#F8F1F9", "today": "#9C27B0", "number": "#2D0C38", "future": "#CE93D8", "weekend": "#E91E63" },
        "peach": { "bg": "#FFF5EE", "text": "#4A2C2A", "muted": "#FF8A65", "dot": "#FFCCBC", "past": "#FFF0E8", "today": "#FF7043", "number": "#4A2C2A", "future": "#FFAB91", "weekend": "#D84315" }
    }
};

const TRANSLATIONS = {
    ru: {
        monthNames: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
        monthNamesShort: ['Янв', 'Фев', 'Март', 'Апр', 'Май', 'Июнь', 'Июль', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
        dayNames: ['П', 'В', 'С', 'Ч', 'П', 'С', 'В'],
        dayNamesWeek: ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'],
        footer: {
            days_left_percent_left: (d, p) => `Осталось ${d} дн. • ${p}% года`,
            days_left: (d) => `Осталось ${d} дней`,
            quote: "Не считай дни, делай так, чтобы дни считались.",
            days_left_percent_done: (d, p) => `Осталось ${d} дн. • ${p}% прошло`,
        }
    },
    en: {
        monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        dayNames: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
        dayNamesWeek: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
        footer: {
            days_left_percent_left: (d, p) => `${d} days left • ${p}% remaining`,
            days_left: (d) => `${d} days left`,
            quote: "Don't count the days, make the days count.",
            days_left_percent_done: (d, p) => `${d} days left • ${p}% done`,
        }
    },
    nl: {
        monthNames: ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'],
        monthNamesShort: ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'],
        dayNames: ['Z', 'M', 'D', 'W', 'D', 'V', 'Z'],
        dayNamesWeek: ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'],
        footer: {
            days_left_percent_left: (d, p) => `Nog ${d} dagen • ${p}% over`,
            days_left: (d) => `Nog ${d} dagen`,
            quote: "Tel de dagen niet, laat de dagen tellen.",
            days_left_percent_done: (d, p) => `Nog ${d} dagen • ${p}% voorbij`,
        }
    }
};

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);

    // API Endpoint: Dynamic Wallpaper Generation
    if (parsedUrl.pathname === '/api/wallpaper') {
        try {
            const query = parsedUrl.query;
            const buffer = generateWallpaper(query);

            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Length': buffer.length
            });
            res.end(buffer);
        } catch (err) {
            console.error(err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error generating wallpaper: ' + err.message);
        }
        return;
    }

    // Static File Serving
    let filePath = '.' + parsedUrl.pathname;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

function generateWallpaper(params) {
    const deviceKey = params.model || 'iphone_16_pro_max';
    const device = CONFIG.devices[deviceKey] || CONFIG.devices['iphone_16_pro_max'];

    const themeKey = params.theme || 'graphite_orange';
    const theme = CONFIG.themeColors[themeKey] || CONFIG.themeColors['graphite_orange'];

    const calendarSize = params.calendar_size || 'standard';
    const style = params.style || 'dots';
    const footer = params.footer || 'days_left_percent_left';
    const customText = params.custom_text || '';

    // Lang logic
    let lang = params.lang || 'ru';
    if (!TRANSLATIONS[lang]) lang = 'ru'; // Fallback

    const viewMode = params.view_mode || 'year';
    const weekendMode = params.weekend_mode || 'weekends_only';
    const weekStart = params.week_start || 'monday'; // Added weekStart parameter

    // Parse raw events: "5,12,20-meeting" -> [5, 12, 20]
    const eventsRaw = params.events || '';
    const events = eventsRaw.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));

    // Create Canvas
    const canvas = createCanvas(device.width, device.height);
    const ctx = canvas.getContext('2d');

    // Fill Background
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, device.width, device.height);

    // Layout Logic
    let startY = device.height * 0.18;
    let availableHeight = device.height * 0.64;

    if (calendarSize === 'large') {
        startY = device.height * 0.12;
        availableHeight = device.height * 0.75;
    } else if (calendarSize === 'large_no_top') {
        startY = device.height * 0.08;
        availableHeight = device.height * 0.80;
    } else if (calendarSize === 'large_no_bottom') {
        startY = device.height * 0.15;
        availableHeight = device.height * 0.78;
    }

    const paddingX = device.width * 0.06;
    const contentWidth = device.width - (paddingX * 2);

    const year = new Date().getFullYear();

    // Render based on View Mode
    if (viewMode === 'month') {
        drawMonthView(ctx, paddingX, startY, contentWidth, availableHeight, theme, year, lang, style, footer, customText, device, events, weekendMode, weekStart);
    } else if (viewMode === 'week') {
        drawWeekView(ctx, paddingX, startY, contentWidth, availableHeight, theme, year, lang, style, footer, customText, device, events, weekendMode, weekStart);
    } else {
        drawYearView(ctx, paddingX, startY, contentWidth, availableHeight, theme, year, style, footer, customText, lang, device, events, weekendMode, weekStart);
    }

    return canvas.toBuffer('image/png');
}

function drawYearView(ctx, x, y, width, totalHeight, colors, year, style, footer, customText, lang, device, events, weekendMode) {
    const cols = 3;
    const rows = 4;
    const gapX = width * 0.06;
    const monthWidth = (width - (gapX * (cols - 1))) / cols;
    const monthHeight = monthWidth * 1.35;
    let gapY = (totalHeight - (rows * monthHeight)) / (rows - 1);
    if (gapY < 20) gapY = 20;

    for (let m = 0; m < 12; m++) {
        const row = Math.floor(m / cols);
        const col = m % cols;
        const mx = x + col * (monthWidth + gapX);
        const my = y + row * (monthHeight + gapY);
        drawMonth(ctx, mx, my, monthWidth, m, year, colors, style, false, lang, events, weekendMode, weekStart);
    }

    drawFooter(ctx, width, colors, year, footer, customText, lang, device);
}

function drawMonthView(ctx, x, y, width, totalHeight, colors, year, lang, style, footer, customText, device, events, weekendMode) {
    const today = new Date();
    const currentMonth = today.getMonth();
    const monthBlockHeight = width * 1.0;
    const centerY = y + (totalHeight / 2) - (monthBlockHeight / 2);

    // Month Title
    const t = TRANSLATIONS[lang];
    const title = t.monthNames[currentMonth];

    ctx.fillStyle = colors.text;
    ctx.font = `bold ${width * 0.15}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(title, x + width / 2, centerY - (width * 0.1));

    drawMonth(ctx, x, centerY, width, currentMonth, year, colors, style, true, lang, events, weekendMode, weekStart);

    // Year
    ctx.fillStyle = colors.muted;
    ctx.font = `500 ${width * 0.08}px sans-serif`;
    ctx.fillText(year, x + width / 2, centerY + monthBlockHeight + (width * 0.15));

    drawFooter(ctx, width, colors, year, footer, customText, lang, device);
}

function drawWeekView(ctx, x, y, width, totalHeight, colors, year, lang, style, footer, customText, device, events, weekendMode) {
    const today = new Date();
    const currentDay = today.getDay();
    // Week Start Logic
    let dist = 0;
    if (weekStart === 'monday') {
        dist = (currentDay + 6) % 7;
    } else {
        dist = currentDay;
    }

    const monday = new Date(today);
    monday.setDate(today.getDate() - dist);

    const itemHeight = width * 0.25;
    const totalListHeight = itemHeight * 7;
    const startListY = y + (totalHeight / 2) - (totalListHeight / 2);

    const t = TRANSLATIONS[lang];
    const dayNames = t.dayNamesWeek;
    const monthNamesShort = t.monthNamesShort;

    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);

        const isToday = (d.getDate() === today.getDate() && d.getMonth() === today.getMonth());
        const isPast = (d < today && !isToday);
        const rowY = startListY + (i * itemHeight);

        let color = isToday ? colors.today : (isPast ? colors.past : colors.future);

        if (isToday) {
            ctx.fillStyle = color;
            const h = itemHeight * 0.8;
            drawRoundedRect(ctx, x, rowY, width, h, h / 2);
            ctx.fill();
            color = colors.bg;
        } else {
            ctx.fillStyle = colors.dot;
            ctx.fillRect(x, rowY + itemHeight - 2, width, 1);
        }

        // Day Name
        const isMuted = isPast && !isToday;
        ctx.fillStyle = isMuted ? colors.muted : colors.text;
        ctx.font = `bold ${itemHeight * 0.25}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textAlign = 'center';
        // Use localized day names for Week View
        // Rotate if Sunday start
        let dayNameList = TRANSLATIONS[lang].dayNamesWeek;
        if (weekStart === 'sunday') {
            dayNameList = [dayNameList[6], ...dayNameList.slice(0, 6)];
        }
        const dayName = dayNameList[i];
        ctx.fillText(dayName, x + (itemHeight * 0.5), rowY + (itemHeight * 0.4));

        // Day Number
        ctx.fillStyle = isToday ? colors.bg : colors.text;
        ctx.font = `bold ${itemHeight * 0.45}px sans-serif`;
        ctx.textAlign = 'right';
        ctx.fillText(d.getDate(), x + width - (itemHeight * 0.5), rowY + (itemHeight * 0.4));

        // Month Text
        ctx.font = `500 ${itemHeight * 0.2}px sans-serif`;
        ctx.fillText(monthNamesShort[d.getMonth()], x + width - (itemHeight * 0.5) - (width * 0.15), rowY + (itemHeight * 0.4));

        // Event Dot in Week View
        if (events.includes(d.getDate())) {
            // Only if month matches? events array is simple integers, assuming current month/context.
            // But 'events' param is generic integers. For logic simplicity, we assume day number applies to current month or visible days.
            // If we really want to be correct we need full dates. But keeping simple for now.
            // Logic: If event is "20", and today is 20th, show it.
            // For week view, we show it if the day matches.

            // Simplification: if events has d.getDate(), we show dot.
            const dotX = x + width - (itemHeight * 0.5) - (width * 0.3); // Position left of date
            const dotY = rowY + (itemHeight * 0.4);
            const r = itemHeight * 0.08;

            ctx.beginPath();
            ctx.arc(dotX, dotY, r, 0, Math.PI * 2);
            ctx.fillStyle = isToday ? colors.bg : colors.today;
            ctx.fill();
        }
    }

    drawFooter(ctx, width, colors, year, footer, customText, lang, device);
}

function drawMonth(ctx, x, y, w, monthIndex, year, colors, style, showHeaders, lang, events, weekendMode, weekStart) {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    let jsDay = new Date(year, monthIndex, 1).getDay();
    // Default JS: 0=Sun, 1=Mon

    let startOffset;
    if (weekStart === 'monday') {
        // Mon=0, Sun=6
        startOffset = (jsDay === 0 ? 6 : jsDay - 1);
    } else {
        // Sun=0, Mon=1 (Standard JS)
        startOffset = jsDay;
    }

    if (!showHeaders) { // Year view style title
        ctx.fillStyle = colors.text;
        ctx.font = `bold ${w * 0.16}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText((monthIndex + 1).toString().padStart(2, '0'), x, y);
    }

    const cellSize = w / 7;
    let gridY = y + (w * 0.25);

    if (showHeaders) {
        gridY = y + (w * 0.1);
        const t = TRANSLATIONS[lang];
        let dayLetters = [...t.dayNames]; // Clone
        if (weekStart === 'sunday') {
            dayLetters = [dayLetters[6], ...dayLetters.slice(0, 6)];
        }
        ctx.font = `600 ${cellSize * 0.35}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let i = 0; i < 7; i++) {
            const dx = x + (i * cellSize) + (cellSize / 2);
            const dy = y - (cellSize * 0.2);
            if (i >= 5) ctx.fillStyle = colors.weekend || colors.today;
            else ctx.fillStyle = colors.muted;
            ctx.fillText(dayLetters[i], dx, dy);
        }
    }

    const today = new Date();
    const isCurrentYear = today.getFullYear() === year;

    for (let d = 1; d <= daysInMonth; d++) {
        const slot = startOffset + d - 1;
        const r = Math.floor(slot / 7);
        const c = slot % 7;
        const isWeekend = (c === 5 || c === 6);
        const dx = x + (c * cellSize) + (cellSize / 2);
        const dy = gridY + (r * cellSize) + (cellSize / 2);

        let color = colors.future;
        if (isCurrentYear) {
            if (monthIndex < today.getMonth()) {
                color = colors.past;
            } else if (monthIndex === today.getMonth()) {
                if (d < today.getDate()) color = colors.past;
                else if (d === today.getDate()) color = colors.today;
                else color = colors.future;
            } else {
                color = colors.future;
            }
        }

        // Weekend Highlighting Logic
        if (weekendMode === 'weekends_only' && isWeekend && color !== colors.today) {
            if (color === colors.future) {
                color = colors.text; // Brighter for future weekends
            }
        }

        if (style === 'dots') {
            const size = cellSize * 0.22;
            ctx.beginPath();
            ctx.arc(dx, dy, size, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        } else if (style === 'squares') {
            const s = cellSize * 0.35;
            ctx.fillStyle = color;
            ctx.fillRect(dx - s / 2, dy - s / 2, s, s);
        } else if (style === 'bars') {
            const wBar = cellSize * 0.8;
            const hBar = cellSize * 0.15;
            ctx.fillStyle = color;
            ctx.fillRect(dx - wBar / 2, dy - hBar / 2, wBar, hBar);
        } else if (style === 'rings') {
            const r = cellSize * 0.18;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(dx, dy, r, 0, Math.PI * 2);
            ctx.stroke();
            if (color === colors.today) {
                ctx.fillStyle = color;
                ctx.fill();
            }
        } else if (style === 'numbers') {
            ctx.fillStyle = color;
            if (isWeekend && weekendMode === 'weekends_only' && color !== colors.today && color !== colors.past) {
                ctx.fillStyle = colors.weekend || colors.today;
            }
            ctx.font = `500 ${cellSize * 0.45}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(d, dx, dy);
        }

        // Event Dots in Month/Year View
        // Logic: if events array contains today's date number, draw a dot
        // We only check against 'd' (day of month).
        // NOTE: This means if you pass '5', it highlights the 5th of EVERY month in Year view.
        // To be precise for Year View, we really need full date parsing.
        // BUT, for the "Shortcut" use case which is "Daily Wallpaper", users usually care about highlighting today/this week/month.
        // If ViewMode is Month/Week, ambiguity is low.
        // If ViewMode is Year, highlighting 5th of *every* month is probably not what they want, but acceptable for MVP if we assume events are for "this month".
        // Better logic: Only optionally highlight if event matches.
        // Let's assume events are valid for the currently viewed period.

        // For Year view: we probably shouldn't show events unless we have month data.
        // Let's enable it for now, as it might be used for "Always highlight paydays (15th, 30th)" type logic too.

        if (events.includes(d)) {
            const dotSize = cellSize * 0.06;
            const dotY = dy + (cellSize * 0.35);
            ctx.beginPath();
            ctx.arc(dx, dotY, dotSize, 0, Math.PI * 2);

            if (color === colors.today && style !== 'numbers') {
                ctx.fillStyle = colors.bg;
            } else {
                ctx.fillStyle = colors.today;
            }
            ctx.fill();
        }
    }
}

function drawFooter(ctx, width, colors, year, footerMode, customText, lang, device) {
    if (footerMode === 'none') return;

    ctx.font = `500 ${device.width * 0.03}px sans-serif`;
    ctx.fillStyle = colors.muted;
    ctx.textAlign = 'center';

    let text = "";
    const today = new Date();
    const endOfYear = new Date(year, 11, 31);
    const diffTime = Math.abs(endOfYear - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const percentLeft = Math.floor((diffDays / 365) * 100);
    const percentDone = 100 - percentLeft; // Simple approx

    const t = TRANSLATIONS[lang];

    if (footerMode === 'days_left_percent_left') {
        text = t.footer.days_left_percent_left(diffDays, percentLeft);
    } else if (footerMode === 'days_left') {
        text = t.footer.days_left(diffDays);
    } else if (footerMode === 'days_left_percent_done') {
        text = t.footer.days_left_percent_done(diffDays, percentDone);
    } else if (footerMode === 'quote') {
        text = t.footer.quote;
    } else if (footerMode === 'custom') {
        text = customText || "";
    }

    if (text) {
        ctx.fillText(text, device.width / 2, device.height - (device.height * 0.13));
    }
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}/`);
    });
}

module.exports = { generateWallpaper };
