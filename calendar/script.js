// Main Configuration
const CONFIG = {
    devices: {
        iphone_17_pro_max: { width: 1320, height: 2868, name: "iPhone 17 Pro Max", scale: 1 },
        iphone_17_pro: { width: 1206, height: 2622, name: "iPhone 17 Pro", scale: 1 },
        iphone_17: { width: 1179, height: 2556, name: "iPhone 17", scale: 1 },
        iphone_17_air: { width: 1170, height: 2532, name: "iPhone 17 Air", scale: 1 },
        iphone_16_pro_max: { width: 1320, height: 2868, name: "iPhone 16 Pro Max", scale: 1 },
        iphone_16_pro: { width: 1206, height: 2622, name: "iPhone 16 Pro", scale: 1 },
        iphone_16_plus: { width: 1290, height: 2796, name: "iPhone 16 Plus", scale: 1 },
        iphone_16: { width: 1179, height: 2556, name: "iPhone 16", scale: 1 },
        iphone_16e: { width: 1179, height: 2556, name: "iPhone 16e", scale: 1 },
        iphone_15_pro_max: { width: 1290, height: 2796, name: "iPhone 15 Pro Max", scale: 1 },
        iphone_15_pro: { width: 1179, height: 2556, name: "iPhone 15 Pro", scale: 1 },
        iphone_15_plus: { width: 1290, height: 2796, name: "iPhone 15 Plus", scale: 1 },
        iphone_15: { width: 1179, height: 2556, name: "iPhone 15", scale: 1 },
        iphone_14_pro_max: { width: 1290, height: 2796, name: "iPhone 14 Pro Max", scale: 1 },
        iphone_14_pro: { width: 1179, height: 2556, name: "iPhone 14 Pro", scale: 1 },
        iphone_14_plus: { width: 1284, height: 2778, name: "iPhone 14 Plus", scale: 1 },
        iphone_14: { width: 1170, height: 2532, name: "iPhone 14", scale: 1 },
        iphone_13_pro_max: { width: 1284, height: 2778, name: "iPhone 13 Pro Max", scale: 1 },
        iphone_13_pro: { width: 1170, height: 2532, name: "iPhone 13 Pro", scale: 1 },
        iphone_13: { width: 1170, height: 2532, name: "iPhone 13", scale: 1 },
        iphone_13_mini: { width: 1080, height: 2340, name: "iPhone 13 Mini", scale: 1 },
        iphone_12_pro_max: { width: 1284, height: 2778, name: "iPhone 12 Pro Max", scale: 1 },
        iphone_12_pro: { width: 1170, height: 2532, name: "iPhone 12 Pro", scale: 1 },
        iphone_12: { width: 1170, height: 2532, name: "iPhone 12", scale: 1 },
        iphone_12_mini: { width: 1080, height: 2340, name: "iPhone 12 Mini", scale: 1 },
        iphone_11_pro_max: { width: 1242, height: 2688, name: "iPhone 11 Pro Max", scale: 1 },
        iphone_11_pro: { width: 1125, height: 2436, name: "iPhone 11 Pro", scale: 1 },
        iphone_11: { width: 828, height: 1792, name: "iPhone 11", scale: 1 },
        iphone_xs_max: { width: 1242, height: 2688, name: "iPhone XS Max", scale: 1 },
        iphone_xr: { width: 828, height: 1792, name: "iPhone XR", scale: 1 },
        iphone_xs: { width: 1125, height: 2436, name: "iPhone XS", scale: 1 },
        iphone_x: { width: 1125, height: 2436, name: "iPhone X", scale: 1 },
        iphone_8_plus: { width: 1242, height: 2208, name: "iPhone 8 Plus", scale: 1 },
        iphone_7_plus: { width: 1242, height: 2208, name: "iPhone 7 Plus", scale: 1 },
        iphone_6s_plus: { width: 1242, height: 2208, name: "iPhone 6s Plus", scale: 1 },
        iphone_6_plus: { width: 1242, height: 2208, name: "iPhone 6 Plus", scale: 1 },
        iphone_8: { width: 750, height: 1334, name: "iPhone 8", scale: 1 },
        iphone_7: { width: 750, height: 1334, name: "iPhone 7", scale: 1 },
        iphone_6s: { width: 750, height: 1334, name: "iPhone 6s", scale: 1 },
        iphone_6: { width: 750, height: 1334, name: "iPhone 6", scale: 1 },
        iphone_se_3: { width: 750, height: 1334, name: "iPhone SE 3", scale: 1 },
        iphone_se_2: { width: 750, height: 1334, name: "iPhone SE 2", scale: 1 },
        iphone_se_1: { width: 640, height: 1136, name: "iPhone SE 1", scale: 1 }
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

const STATE = {
    device: 'iphone_16_pro_max',
    style: 'dots',
    calendarSize: 'standard',
    viewMode: 'year',
    theme: 'graphite_orange',
    weekends: 'weekends_only',
    footer: 'days_left_percent_left',
    customText: '',
    lang: 'ru',
    timezone: '3',
    year: new Date().getFullYear(),
    weekStart: 'monday', // monday, sunday
    events: [] // Array of day numbers (e.g. [5, 12, 20])
};

const TRANSLATIONS = {
    ru: {
        hero_title: "Календарь — твой год под контролем.",
        hero_subtitle: "Обои-календарь, которые обновляются автоматически, показывают твой прогресс и мотивируют каждый день.",
        btn_generate: "Сгенерировать ссылку",
        btn_how_to: "Как настроить на iPhone",
        card_title_settings: "1 · Настройки",
        card_subtitle_preview: "Мгновенный просмотр",
        label_model: "Модель iPhone",
        label_style: "Стиль",
        label_size: "Размер календаря",
        opt_standard: "Стандартный",
        opt_large: "Большой",
        opt_large_no_top: "Большой без верхних виджетов",
        opt_large_no_bottom: "Большой без нижних виджетов",
        label_weekend: "Выходные",
        opt_weekends_only: "Только выходные",
        opt_prod_calendar: "Производственный календарь",
        opt_no_weekend: "Не отмечать",
        label_theme: "Тема",
        label_view_mode: "Режим",
        btn_year: "Год",
        btn_month: "Месяц",
        btn_week: "Неделя",
        label_language: "Язык / Language",
        label_timezone: "Часовой пояс",
        label_footer: "Надпись внизу",
        opt_days_percent: "Осталось дней + % осталось",
        opt_days_percent_done: "Осталось дней + % прошло",
        opt_days_only: "Осталось дней",
        opt_quote: "Мотивирующая цитата",
        opt_custom: "Свой текст",
        opt_none: "Ничего",
        label_custom_text: "Ваш текст",
        placeholder_custom_text: "Напишите что-то вдохновляющее...",
        label_preview_theme: "Выберите цвет темы",
        btn_copy: "Скопировать ссылку",
        btn_download: "Скачать / Открыть PNG",
        btn_open_shortcuts: "Открыть “Команды”",
        card_title_howto: "2 · Как настроить на iPhone",
        card_subtitle_time: "5–7 минут",
        step1: "Открой <b>Команды</b> → <b>Автоматизация</b> → <b>Новая автоматизация</b> → <b>Время суток</b> → выбери <b>06:00</b> → <b>Ежедневно</b> → включи <b>Запускать немедленно</b>.",
        step2: "Нажми <b>Создать новую быструю команду</b> и добавь действия: <b>«Получить содержимое URL»</b> → затем <b>«Установить фото как обои»</b>.",
        step3: "Вставь ссылку выше в <b>«Получить содержимое URL»</b>. В <b>«Установить фото как обои»</b> выбери <b>Экран блокировки</b>.",
        step4: "В <b>«Установить фото как обои»</b> нажмите стрелку (>) и <b>выключите</b>: «Показать предпросмотр» и «Обрезать до объекта».",
        step5: "Готово! Обои будут обновляться каждое утро.",
        card_title_author: "Автор",
        author_subtitle: "Улучшенная версия",
        author_note: "Этот генератор работает локально и поддерживает кастомный текст.",
        preview_title: "Предпросмотр",
        preview_subtitle: "Обновляется в реальном времени",
        preview_note: "Картинка генерируется браузером мгновенно.",

        // Canvas
        monthNames: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
        monthNamesShort: ['Янв', 'Фев', 'Март', 'Апр', 'Май', 'Июнь', 'Июль', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
        dayNames: ['В', 'П', 'В', 'С', 'Ч', 'П', 'С'],
        dayNamesWeek: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
        footer: {
            days_left_percent_left: (d, p) => `Осталось ${d} дн. • ${p}% года`,
            days_left: (d) => `Осталось ${d} дней`,
            quote: "Не считай дни, делай так, чтобы дни считались.",
            days_left_percent_done: (d, p) => `Осталось ${d} дн. • ${p}% прошло`,
        },
        label_week_start: "Начало недели",
        opt_mon: "Пн",
        opt_sun: "Вс",
    },
    en: {
        hero_title: "Calendar — Your year under control.",
        hero_subtitle: "Wallpaper calendars that update automatically, show your progress, and motivate you every day.",
        btn_generate: "Generate Link",
        btn_how_to: "Setup on iPhone",
        card_title_settings: "1 · Settings",
        card_subtitle_preview: "Instant Preview",
        label_model: "iPhone Model",
        label_style: "Style",
        label_size: "Calendar Size",
        opt_standard: "Standard",
        opt_large: "Large",
        opt_large_no_top: "Large (No Top Widgets)",
        opt_large_no_bottom: "Large (No Bottom Widgets)",
        label_weekend: "Weekends",
        opt_weekends_only: "Weekends Only",
        opt_prod_calendar: "Production Calendar",
        opt_no_weekend: "No Highlight",
        label_theme: "Theme",
        label_view_mode: "Mode",
        btn_year: "Year",
        btn_month: "Month",
        btn_week: "Week",
        label_language: "Language",
        label_timezone: "Timezone",
        label_footer: "Footer Text",
        opt_days_percent: "Days Left + % Left",
        opt_days_percent_done: "Days Left + % Passed",
        opt_days_only: "Days Left Only",
        opt_quote: "Motivational Quote",
        opt_custom: "Custom Text",
        opt_none: "None",
        label_custom_text: "Your Text",
        placeholder_custom_text: "Type something inspiring...",
        label_preview_theme: "Select Theme Color",
        btn_copy: "Copy Link",
        btn_download: "Download / Open PNG",
        btn_open_shortcuts: "Open “Shortcuts”",
        card_title_howto: "2 · How to Setup on iPhone",
        card_subtitle_time: "5–7 minutes",
        step1: "Open <b>Shortcuts</b> → <b>Automation</b> → <b>New Automation</b> → <b>Time of Day</b> → select <b>06:00</b> → <b>Daily</b> → enable <b>Run Immediately</b>.",
        step2: "Tap <b>New Blank Automation</b> and add actions: <b>“Get Contents of URL”</b> → then <b>“Set Wallpaper”</b>.",
        step3: "Paste the link above into <b>“Get Contents of URL”</b>. In <b>“Set Wallpaper”</b> select <b>Lock Screen</b>.",
        step4: "In <b>“Set Wallpaper”</b> tap the arrow (>) and <b>disable</b>: “Show Preview” and “Crop to Subject”.",
        step5: "Done! Your wallpaper will update every morning.",
        card_title_author: "Author",
        author_subtitle: "Enhanced Version",
        author_note: "This generator works locally and supports custom text.",
        preview_title: "Preview",
        preview_subtitle: "Updates in Real-time",
        preview_note: "Image is generated instantly in the browser.",

        // Canvas
        monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        dayNames: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
        dayNamesWeek: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
        footer: {
            days_left_percent_left: (d, p) => `${d} days left • ${p}% remaining`,
            days_left: (d) => `${d} days left`,
            quote: "Don't count the days, make the days count.",
            days_left_percent_done: (d, p) => `${d} days left • ${p}% done`,
        },
        label_week_start: "Week Start",
        opt_mon: "Mon",
        opt_sun: "Sun",
    },
    nl: {
        hero_title: "Kalender — Jouw jaar onder controle.",
        hero_subtitle: "Kalender-achtergronden die automatisch worden bijgewerkt, je voortgang tonen en je elke dag motiveren.",
        btn_generate: "Link genereren",
        btn_how_to: "Instellen op iPhone",
        card_title_settings: "1 · Instellingen",
        card_subtitle_preview: "Direct voorbeeld",
        label_model: "iPhone Model",
        label_style: "Stijl",
        label_size: "Kalendergrootte",
        opt_standard: "Standaard",
        opt_large: "Groot",
        opt_large_no_top: "Groot zonder widgets boven",
        opt_large_no_bottom: "Groot zonder widgets onder",
        label_weekend: "Weekend",
        opt_weekends_only: "Alleen weekend",
        opt_prod_calendar: "Kalenderdagen",
        opt_no_weekend: "Niet markeren",
        label_theme: "Thema",
        label_view_mode: "Weergave",
        btn_year: "Jaar",
        btn_month: "Maand",
        btn_week: "Week",
        label_language: "Taal / Language",
        label_timezone: "Tijdzone",
        label_footer: "Tekst onderaan",
        opt_days_percent: "Dagen over + % over",
        opt_days_percent_done: "Dagen over + % voorbij",
        opt_days_only: "Dagen over",
        opt_quote: "Motiverende quote",
        opt_custom: "Eigen tekst",
        opt_none: "Niets",
        label_custom_text: "Jouw tekst",
        placeholder_custom_text: "Schrijf iets inspirerends...",
        label_preview_theme: "Kies themakleur",
        btn_copy: "Link kopiëren",
        btn_download: "Download / Open PNG",
        btn_open_shortcuts: "Open “Opdrachten”",
        card_title_howto: "2 · Instellen op iPhone",
        card_subtitle_time: "5–7 minuten",
        step1: "Open <b>Opdrachten</b> → <b>Automatisering</b> → <b>Nieuwe automatisering</b> → <b>Tijdstip</b> → kies <b>06:00</b> → <b>Dagelijks</b> → zet <b>Onmiddellijk uitvoeren</b> aan.",
        step2: "Tik op <b>Nieuwe taak</b> en voeg acties toe: <b>«Inhoud van URL ophalen»</b> → daarna <b>«Stel achtergrond in»</b>.",
        step3: "Plak de link hierboven in <b>«Inhoud van URL ophalen»</b>. Bij <b>«Stel achtergrond in»</b> kies je <b>Vergrendelscherm</b>.",
        step4: "Bij <b>«Stel achtergrond in»</b> tik op het pijltje (>) en <b>zet uit</b>: «Toon voorbeeld» en «Bijsnijden».",
        step5: "Klaar! De achtergrond wordt elke ochtend bijgewerkt.",
        card_title_author: "Auteur",
        author_subtitle: "Verbeterde versie",
        author_note: "Deze generator werkt lokaal en ondersteunt eigen tekst.",
        preview_title: "Voorbeeld",
        preview_subtitle: "Wordt in real-time bijgewerkt",
        preview_note: "Afbeelding wordt direct in de browser gegenereerd.",

        // Canvas
        monthNames: ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'],
        monthNamesShort: ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'],
        dayNames: ['Z', 'M', 'D', 'W', 'D', 'V', 'Z'],
        dayNamesWeek: ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'],
        footer: {
            days_left_percent_left: (d, p) => `Nog ${d} dagen • ${p}% over`,
            days_left: (d) => `Nog ${d} dagen`,
            quote: "Tel de dagen niet, laat de dagen tellen.",
            days_left_percent_done: (d, p) => `Nog ${d} dagen • ${p}% voorbij`,
        },
        label_week_start: "Start week",
        opt_mon: "Ma",
        opt_sun: "Zo",
    }
};

// DOM Elements
const canvas = document.getElementById('wallpaper-canvas');
const ctx = canvas.getContext('2d');

// Wrapper inputs (from user's HTML)
const inputModel = document.getElementById('model');
const inputStyle = document.getElementById('style');
const inputViewMode = document.getElementById('viewMode'); // New
const inputTheme = document.getElementById('theme');
const inputWeekend = document.getElementById('weekendMode');
const inputFooter = document.getElementById('footer');

// Output elements
const previewImg = document.getElementById('previewImg');
const openPng = document.getElementById('openPng');

// Init
function init() {
    loadStateFromUrl();
    updatePageText(); // NEW: Check lang and update HTML
    setupEventListeners();
    render();
}

function updatePageText() {
    const lang = STATE.lang || 'ru';
    const t = TRANSLATIONS[lang];

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            el.innerHTML = t[key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key]) {
            el.placeholder = t[key];
        }
    });

    // Update lang buttons state
    document.querySelectorAll('#langControl .segmented-btn').forEach(btn => {
        if (btn.dataset.value === lang) btn.classList.add('active');
        else btn.classList.remove('active');
    });
}

function loadStateFromUrl() {
    const params = new URLSearchParams(window.location.search);

    // Check if params exist, if so, update STATE and DOM
    if (params.has('model')) {
        STATE.device = params.get('model');
        const el = document.getElementById('model');
        if (el) el.value = STATE.device;
    }
    if (params.has('style')) {
        STATE.style = params.get('style');
        const el = document.getElementById('style');
        if (el) el.value = STATE.style;
    }
    if (params.has('view_mode')) {
        STATE.viewMode = params.get('view_mode');
        const btns = document.querySelectorAll('#viewModeControl .segmented-btn');
        btns.forEach(b => {
            if (b.dataset.value === STATE.viewMode) b.classList.add('active');
            else b.classList.remove('active');
        });
    }
    if (params.has('calendar_size')) {
        STATE.calendarSize = params.get('calendar_size');
        const el = document.getElementById('calendarSize');
        if (el) el.value = STATE.calendarSize;
    }
    if (params.has('theme')) {
        STATE.theme = params.get('theme');
        const el = document.getElementById('theme');
        if (el) el.value = STATE.theme;
    }
    if (params.has('weekend_mode')) {
        STATE.weekendMode = params.get('weekend_mode');
        const el = document.getElementById('weekendMode');
        if (el) el.value = STATE.weekendMode;
    }
    if (params.has('week_start')) {
        STATE.weekStart = params.get('week_start');
        // Update both segmented control and hidden input if needed (we rely on data-value for UI)
        const btns = document.querySelectorAll('#weekStartControl .segmented-btn');
        btns.forEach(b => {
            if (b.dataset.value === STATE.weekStart) b.classList.add('active');
            else b.classList.remove('active');
        });
        const el = document.getElementById('weekStart');
        if (el) el.value = STATE.weekStart;
    }
    if (params.has('lang')) {
        STATE.lang = params.get('lang');
        const el = document.getElementById('lang');
        if (el) el.value = STATE.lang;
    } else {
        // Simple auto-detect if no param
        // const browserLang = navigator.language.slice(0, 2);
        // if (TRANSLATIONS[browserLang]) STATE.lang = browserLang;
    }
    if (params.has('timezone')) {
        STATE.timezone = params.get('timezone');
        // Removed timezone input
    }
    if (params.has('footer')) {
        STATE.footer = params.get('footer');
        const el = document.getElementById('footer');
        if (el) el.value = STATE.footer;

        // Handle custom text if passed (non-standard param, but good for our custom feature)
        if (STATE.footer === 'custom' && params.has('custom_text')) {
            STATE.customText = decodeURIComponent(params.get('custom_text'));
            const textEl = document.getElementById('customText');
            if (textEl) textEl.value = STATE.customText;
        }
    }

    // Parse Events (Format: "5,12,25")
    if (params.has('events')) {
        STATE.events = params.get('events').split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    }
}

function setupEventListeners() {
    const inputLang = document.getElementById('lang');
    const inputSize = document.getElementById('calendarSize');
    // Removed timezone input
    const inputCustomText = document.getElementById('customText');

    // View Mode Buttons (only within #viewModeControl if we had one, but currently we rely on data-value)
    // Actually, we should check parent or context. 
    // Let's assume View Mode buttons are just the ones that are NOT lang buttons.
    // Better: Add IDs to the containers in HTML (I'll do that next or infer).
    // Current HTML shows langControl has id="langControl".

    // View Mode Buttons (filter out lang buttons)
    const viewBtns = document.querySelectorAll('.segmented-btn:not(#langControl .segmented-btn)');
    viewBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            viewBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            STATE.viewMode = e.target.dataset.value;
            updateStateAndRender();
        });
    });

    // Week Start Buttons (NEW)
    // We need to find them. Let's assume they are the ones NOT in langControl and NOT viewModeControl (if it existed)
    // Better strategy: Add ID to the container in HTML or find by data-value
    // I added <div class="segmented-control"> around them in HTML, but no ID.
    // Let's rely on data-value properties 'monday' and 'sunday' which are unique for this control.
    const weekStartBtns = document.querySelectorAll('.segmented-btn[data-value="monday"], .segmented-btn[data-value="sunday"]');
    weekStartBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            weekStartBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            STATE.weekStart = e.target.dataset.value;
            updateStateAndRender();
        });
    });

    // Language Buttons
    const langBtns = document.querySelectorAll('#langControl .segmented-btn');
    langBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active state
            langBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            // Update State
            STATE.lang = e.target.dataset.value;

            // Sync with hidden select if needed
            const select = document.getElementById('lang');
            if (select) select.value = STATE.lang;

            // Trigger updates
            updatePageText();
            render();
        });
    });

    [inputModel, inputStyle, inputSize, inputTheme, inputWeekend, inputFooter, inputLang, inputCustomText].forEach(el => {
        if (el) el.addEventListener('change', updateStateAndRender);
        if (el === inputCustomText) el.addEventListener('input', updateStateAndRender); // Live update for text
    });
}

function updateStateAndRender() {
    STATE.device = inputModel.value;
    STATE.style = inputStyle.value;
    // STATE.viewMode is handled by click listeners directly
    STATE.calendarSize = document.getElementById('calendarSize').value;
    STATE.theme = inputTheme.value;
    STATE.weekendMode = inputWeekend.value;
    STATE.footer = inputFooter.value;
    // STATE.lang is handled by language button click listeners, only sync from select if it was changed
    const langSelect = document.getElementById('lang');
    if (langSelect && document.activeElement === langSelect) {
        STATE.lang = langSelect.value;
    }
    // timezone removed from DOM, keep state or default
    // STATE.timezone = document.getElementById('timezone').value; 
    STATE.customText = document.getElementById('customText').value;

    // Toggle custom input visibility
    const customInputDiv = document.getElementById('customFooterInput');
    if (STATE.footer === 'custom') {
        customInputDiv.style.display = 'block';
    } else {
        customInputDiv.style.display = 'none';
    }

    // Dynamic UI Theming (Update site accent colors to match calendar)
    const activeTheme = CONFIG.themeColors[STATE.theme];
    if (activeTheme) {
        document.documentElement.style.setProperty('--accent', activeTheme.today);
        // Make accent2 slightly different or same
        document.documentElement.style.setProperty('--accent2', activeTheme.text);

        // Optional: Update global background gradient slightly?
        // document.documentElement.style.setProperty('--bg-gradient-color', activeTheme.today + '33'); // 20% opacity
    }

    render();
}

function render() {
    // Sync UI Colors with Selected Theme
    const activeTheme = CONFIG.themeColors[STATE.theme];
    if (activeTheme) {
        document.documentElement.style.setProperty('--accent', activeTheme.today);
        document.documentElement.style.setProperty('--accent2', activeTheme.future);
    }

    // 1. Render Main Wallpaper
    renderWallpaper();

    // 2. Render Mini Preview (Removed)
    // renderMiniPreview();
}

function renderWallpaper() {
    const device = CONFIG.devices[STATE.device] || CONFIG.devices['iphone_16_pro_max'];
    const theme = CONFIG.themeColors[STATE.theme];

    // Set Canvas Size
    canvas.width = device.width;
    canvas.height = device.height;

    // Fill Background
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 4. Calendar Layout/Size Logic
    // Adjusted for new "Premium" layout (glass widgets at top/bottom)
    let startY = device.height * 0.18;
    let availableHeight = device.height * 0.64;

    if (STATE.calendarSize === 'large') {
        startY = device.height * 0.12;
        availableHeight = device.height * 0.75;
    } else if (STATE.calendarSize === 'large_no_top') {
        startY = device.height * 0.08;
        availableHeight = device.height * 0.80;
    } else if (STATE.calendarSize === 'large_no_bottom') {
        startY = device.height * 0.15;
        availableHeight = device.height * 0.78;
    }

    // Common padding
    const paddingX = device.width * 0.06;
    const contentWidth = device.width - (paddingX * 2);

    // Dispatch based on View Mode
    if (STATE.viewMode === 'month') {
        drawMonthView(paddingX, startY, contentWidth, availableHeight, theme);
    } else if (STATE.viewMode === 'week') {
        drawWeekView(paddingX, startY, contentWidth, availableHeight, theme);
    } else {
        // Default: Year view
        drawCalendar(paddingX, startY, contentWidth, availableHeight, theme);
    }

    // 5. Update URL Box (Replication of original site logic)
    updateUrlBox();

    // Update Image Preview
    const dataUrl = canvas.toDataURL('image/png');
    previewImg.src = dataUrl;
    previewImg.style.display = 'block'; // Ensure it's visible
    openPng.href = dataUrl;
}

function updateUrlBox() {
    // This URL must point to where YOU host the server-side script (wallpaper.php)
    // For now, I'll put a placeholder or your localhost if you run a local server
    const host = window.location.origin;
    const baseUrl = `${host}/api/wallpaper`;

    const timezone = STATE.timezone || "3";

    const params = new URLSearchParams({
        model: STATE.device,
        style: STATE.style,
        view_mode: STATE.viewMode, // New param
        calendar_size: STATE.calendarSize,
        weekend_mode: STATE.weekendMode,
        theme: STATE.theme,
        lang: STATE.lang,
        week_start: STATE.weekStart,
        timezone: timezone,
        footer: STATE.footer,
        custom_text: STATE.customText,
        events: (STATE.events || []).join(',')
    });

    const fullUrl = `${baseUrl}?${params.toString()}`;
    const urlBox = document.getElementById('urlBox');

    // Make text clickable and cleaner
    if (urlBox) {
        urlBox.innerHTML = `<a href="${fullUrl}" target="_blank" style="color:var(--accent); text-decoration:none; border-bottom:1px solid rgba(124,92,255,.3); word-break:break-all;">${fullUrl.replace(/\+/g, '%20')}</a>`;
    }

    // Update Shortcuts link (assuming it points to a specific shortcut that takes this URL)
    // For now, we just link to a generic setup or the same URL if user wants to test
    const shortcutsBtn = document.getElementById('openShortcuts');
    if (shortcutsBtn) {
        // Original site links to an iCloud shortcut, let's use a placeholder or the real one if known.
        // Using a generic one for now or the same logic.
        shortcutsBtn.href = "https://www.icloud.com/shortcuts/e9e6f3a3d53e4604a80693a206135800";
    }
}

// New View Drawers
function drawMonthView(x, y, width, totalHeight, colors) {
    // Draw Current Month BIG
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = STATE.year;

    // Use about 60-70% of width for a clean look, or full width?
    // Full width looks premium.

    // Center vertically
    // Height of one month block ~ width * 1.2
    const monthBlockHeight = width * 1.0;
    const centerY = y + (totalHeight / 2) - (monthBlockHeight / 2);

    const monthNames = TRANSLATIONS[STATE.lang].monthNames;

    // Title: "Month Year"
    ctx.fillStyle = colors.text;
    ctx.font = `bold ${width * 0.1}px 'SF Pro Display', sans-serif`;
    ctx.textAlign = 'center';

    // Capitalize month if needed (mostly for RU/NL it is standard)
    // Capitalize month if needed (mostly for RU/NL it is standard)
    const monthStr = monthNames[currentMonth];

    ctx.font = `bold ${width * 0.15}px 'SF Pro Display', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(monthStr, x + width / 2, centerY - (width * 0.1));

    // Pass showHeaders=true for the detailed Month view
    drawMonth(x, centerY, width, currentMonth, currentYear, colors, true);

    // Add Year small below
    ctx.fillStyle = colors.muted;
    ctx.font = `500 ${width * 0.08}px 'SF Pro Display', sans-serif`;
    ctx.fillText(currentYear, x + width / 2, centerY + monthBlockHeight + (width * 0.15));

    drawFooter(width, colors);
}

function drawWeekView(x, y, width, totalHeight, colors) {
    // Draw Current Week
    const today = new Date();
    const currentDay = today.getDay(); // 0 (Sun) - 6 (Sat)

    // Calculate start of week
    // If weekStart is 'monday':
    //   Mon (1) -> dist 0
    //   Sun (0) -> dist 6
    //   Tue (2) -> dist 1
    // Formula: (day + 6) % 7
    // If weekStart is 'sunday':
    //   Sun (0) -> dist 0
    //   Mon (1) -> dist 1
    // Formula: day

    let dist = 0;
    if (STATE.weekStart === 'monday') {
        dist = (currentDay + 6) % 7;
    } else {
        dist = currentDay;
    }

    const monday = new Date(today); // actually "startDate"
    // We'll call it startDate instead of monday
    monday.setDate(today.getDate() - dist);

    // Vertical center
    const itemHeight = width * 0.25;
    const totalListHeight = itemHeight * 7;
    const startListY = y + (totalHeight / 2) - (totalListHeight / 2);

    const dayNames = TRANSLATIONS[STATE.lang].dayNamesWeek;

    const monthNamesShort = TRANSLATIONS[STATE.lang].monthNamesShort;

    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);

        const isToday = (d.getDate() === today.getDate() && d.getMonth() === today.getMonth());
        const isPast = (d < today && !isToday);

        const rowY = startListY + (i * itemHeight);

        let color = isToday ? colors.today : (isPast ? colors.past : colors.future);
        let bgColor = colors.bg;

        // Highlight logic
        if (isToday) {
            // Draw highlight pill/bar
            ctx.fillStyle = color;
            // Rounded rect
            const h = itemHeight * 0.8;
            drawRoundedRect(ctx, x, rowY, width, h, h / 2);
            ctx.fill();

            color = colors.bg; // Text becomes bg color
            bgColor = colors.today;
        } else {
            // Maybe a subtle line?
            ctx.fillStyle = colors.dot;
            ctx.fillRect(x, rowY + itemHeight - 2, width, 1);
        }



        // Day Name
        const isMuted = isPast && !isToday;
        ctx.fillStyle = isMuted ? colors.muted : colors.text;
        ctx.font = `bold ${itemHeight * 0.25}px 'SF Pro Display', sans-serif`;
        ctx.textAlign = 'center';
        // Use localized day names for Week View
        // Rotate array if needed? No, standard array is Mon-Sun
        // If 'sunday' -> we need Sun-Sat order.
        let dayNameList = TRANSLATIONS[STATE.lang].dayNamesWeek; // [Mon, Tue, ..., Sun]

        if (STATE.weekStart === 'sunday') {
            // Shift last (Sun) to first
            dayNameList = [dayNameList[6], ...dayNameList.slice(0, 6)];
        }

        const dayName = dayNameList[i];
        ctx.fillText(dayName, x + (itemHeight * 0.5), rowY + (itemHeight * 0.4));


        // Day Number
        ctx.fillStyle = isToday ? colors.bg : colors.text;
        ctx.font = `bold ${itemHeight * 0.45}px 'SF Pro Display', sans-serif`;
        ctx.textAlign = 'right';
        ctx.fillText(d.getDate(), x + width - (itemHeight * 0.5), rowY + (itemHeight * 0.4));

        // Month Text (small next to number)
        ctx.font = `500 ${itemHeight * 0.2}px 'SF Pro Display', sans-serif`;
        ctx.fillText(monthNamesShort[d.getMonth()], x + width - (itemHeight * 0.5) - (width * 0.15), rowY + (itemHeight * 0.4));

        // Event Dot (Sync Feature) - Week View
        if (STATE.events && STATE.events.includes(d.getDate())) {
            const dotX = x + width - (itemHeight * 0.5) - (width * 0.3); // Position left of date
            const dotY = rowY + (itemHeight * 0.4);
            const r = itemHeight * 0.08;

            ctx.beginPath();
            ctx.arc(dotX, dotY, r, 0, Math.PI * 2);
            // Contrast logic
            ctx.fillStyle = isToday ? colors.bg : colors.today;
            ctx.fill();
        }
    }

    drawFooter(width, colors);
}

// Copy Link Logic (keep existed)
document.getElementById('copyLinkBtn')?.addEventListener('click', () => {
    // Get URL from the anchor tag href or text content
    const urlLink = document.querySelector('#urlBox a');
    const urlText = urlLink ? urlLink.href : document.getElementById('urlBox')?.textContent;

    if (urlText) {
        navigator.clipboard.writeText(urlText).then(() => {
            const btn = document.getElementById('copyLinkBtn');
            const originalText = btn.textContent;
            btn.textContent = "Скопировано!";
            setTimeout(() => btn.textContent = originalText, 2000);
        });
    }
});

function drawCalendar(x, y, width, totalHeight, colors) {
    const currentYear = STATE.year;

    // Grid Calculation
    const cols = 3;
    const rows = 4;

    // Spacing
    const gapX = width * 0.06;
    const monthWidth = (width - (gapX * (cols - 1))) / cols;

    // Determine dynamic gapY to fit height
    // totalHeight = (rows * monthHeight) + ((rows - 1) * gapY)
    // Assume monthAspectRatio ~ 1.35
    const monthHeight = monthWidth * 1.35;
    let gapY = (totalHeight - (rows * monthHeight)) / (rows - 1);

    // If gap is too small or negative (calendar too big), clamp it or let it expand
    if (gapY < 20) gapY = 20;

    for (let m = 0; m < 12; m++) {
        const row = Math.floor(m / cols);
        const col = m % cols;
        const mx = x + col * (monthWidth + gapX);
        const my = y + row * (monthHeight + gapY);

        drawMonth(mx, my, monthWidth, m, currentYear, colors);
    }

    // Footer Logic
    drawFooter(width, colors);
}

function drawMonth(x, y, w, monthIndex, year, colors, showHeaders = false) {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    let jsDay = new Date(year, monthIndex, 1).getDay();
    let jsDay = new Date(year, monthIndex, 1).getDay();
    // Default JS: 0=Sun, 1=Mon

    let startOffset;
    if (STATE.weekStart === 'monday') {
        // Mon=0, Sun=6
        startOffset = (jsDay === 0 ? 6 : jsDay - 1);
    } else {
        // Sun=0, Mon=1 (Standard JS)
        startOffset = jsDay;
    }

    // Month Title
    if (!showHeaders) { // Only draw number title if headers are NOT shown (Year view style)
        ctx.fillStyle = colors.text;
        ctx.font = `bold ${w * 0.16}px 'SF Pro Display', 'Inter', sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText((monthIndex + 1).toString().padStart(2, '0'), x, y);
    }

    // Grid config
    const cellSize = w / 7;
    let gridY = y + (w * 0.25);

    if (showHeaders) {
        // Draw Weekday Letters
        gridY = y + (w * 0.1); // Shift up/down logic
        gridY = y + (w * 0.1); // Shift up/down logic
        // FIX: Use translated day names instead of hardcoded RU/EN check
        let dayLetters = [...TRANSLATIONS[STATE.lang].dayNames]; // Clone

        if (STATE.weekStart === 'sunday') {
            // Shift last (Sun) to first
            dayLetters = [dayLetters[6], ...dayLetters.slice(0, 6)];
        }

        ctx.font = `600 ${cellSize * 0.35}px 'SF Pro Display', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let i = 0; i < 7; i++) {
            const dx = x + (i * cellSize) + (cellSize / 2);
            const dy = y - (cellSize * 0.2); // Position above grid

            // Weekend highlight in header
            if (i >= 5) ctx.fillStyle = colors.weekend; // Red/Orange for weekend headers?
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
        const isWeekend = (c === 5 || c === 6); // Sat or Sun (Mon-started 0-6)

        const dx = x + (c * cellSize) + (cellSize / 2);
        const dy = gridY + (r * cellSize) + (cellSize / 2);

        // -- COLOR LOGIC --
        let color = colors.future;

        // Base state
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

        // Weekend Override (if not today/past, or keep past/today status?)
        // If it's a future weekend or past weekend, visually distinguish?
        // User wants "weekend moet andere kleur".
        // Let's make weekends SLIGHTLY different opacity or color if not 'today'.
        if (STATE.weekendMode === 'weekends_only' && isWeekend && color !== colors.today) {
            // If dot style, maybe colors.text (brighter)?
            // If past, keep past. 
            // If future, make it distinct.
            if (color === colors.future) {
                color = colors.text; // Highlight future weekends
            }
        }

        // Draw Style
        if (STATE.style === 'dots') {
            const size = cellSize * 0.22;
            ctx.beginPath();
            ctx.arc(dx, dy, size, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        }
        else if (STATE.style === 'squares') {
            const s = cellSize * 0.35;
            ctx.fillStyle = color;
            ctx.fillRect(dx - s / 2, dy - s / 2, s, s);
        }
        else if (STATE.style === 'bars') {
            const wBar = cellSize * 0.8;
            const hBar = cellSize * 0.15;
            ctx.fillStyle = color;
            ctx.fillRect(dx - wBar / 2, dy - hBar / 2, wBar, hBar);
        }
        else if (STATE.style === 'rings') {
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
        }
        else if (STATE.style === 'numbers') {
            ctx.fillStyle = color;

            // Weekend Highlight for Numbers Style
            if (isWeekend && STATE.weekendMode === 'weekends_only' && color !== colors.today && color !== colors.past) {
                // Make weekend numbers use the accent color (like standard calendars)
                ctx.fillStyle = colors.weekend;
            }

            ctx.font = `500 ${cellSize * 0.45}px 'SF Mono', monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(d, dx, dy);
        }

        // Event Dot (Sync Feature)
        if (STATE.events && STATE.events.includes(d)) {
            const dotSize = cellSize * 0.06;
            const dotY = dy + (cellSize * 0.35);

            ctx.beginPath();
            ctx.arc(dx, dotY, dotSize, 0, Math.PI * 2);

            // Contrast logic: if day is fully colored (Today in Dot style), make dot 'bg' color
            // If day is just a number, make dot 'Accent' color.
            if (color === colors.today && STATE.style !== 'numbers') {
                ctx.fillStyle = colors.bg;
            } else {
                // Stand out
                ctx.fillStyle = colors.today;
            }
            ctx.fill();
        }
    }
}


function drawFooter(width, colors) {
    if (STATE.footer === 'none') return;

    ctx.font = `500 ${canvas.width * 0.03}px 'SF Pro Display', sans-serif`;
    ctx.fillStyle = colors.muted;
    ctx.textAlign = 'center';

    let text = "";
    const today = new Date();
    const endOfYear = new Date(STATE.year, 11, 31);
    const diffTime = Math.abs(endOfYear - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const percentLeft = Math.floor((diffDays / 365) * 100);
    const percentDone = 100 - percentLeft; // Simple approx

    const lang = STATE.lang || 'ru';
    // Fallback to 'ru' if translation missing (safeguard)
    const t = TRANSLATIONS[lang] || TRANSLATIONS['ru'];

    if (STATE.footer === 'days_left_percent_left') {
        text = t.footer.days_left_percent_left(diffDays, percentLeft);
    } else if (STATE.footer === 'days_left') {
        text = t.footer.days_left(diffDays);
    } else if (STATE.footer === 'days_left_percent_done') {
        text = t.footer.days_left_percent_done(diffDays, percentDone);
    } else if (STATE.footer === 'quote') {
        text = t.footer.quote;
    } else if (STATE.footer === 'custom') {
        text = STATE.customText || "";
    }

    if (text) {
        ctx.fillText(text, canvas.width / 2, canvas.height - (canvas.height * 0.13));
    }
}

// Theme Picker Logic (formerly Mini Preview)
function renderMiniPreview() {
    if (!stylePreview) return;
    const ctxPv = stylePreview.getContext('2d');

    // Use the panel background color or transparent
    const w = stylePreview.width;
    const h = stylePreview.height;
    ctxPv.clearRect(0, 0, w, h);

    // Draw background (optional, matching previous style)
    // Using active theme bg for context, or just neutral? 
    // Let's use neutral dark to let colors pop, or transparent.
    // Making it transparent looks better on the page background.
    // ctxPv.fillStyle = 'rgba(0,0,0,0.2)';
    // ctxPv.fillRect(0,0,w,h);

    const themes = Object.keys(CONFIG.themeColors);
    const count = themes.length;

    // Layout
    const padding = 20;
    const availableWidth = w - (padding * 2);
    const textHeight = 20; // reserved for label if needed (not using now)
    const centerY = h / 2;

    // precise spacing
    const dotSize = 14;
    // gap between centers
    // if width is 360, 20 pad, 320 avail. 12 items. 
    // 320 / 12 = 26px per item.
    const step = availableWidth / (count);
    const startX = padding + (step / 2);

    // Save layout for click handler
    stylePreview.dataset.step = step;
    stylePreview.dataset.startX = startX;
    stylePreview.dataset.dotSize = dotSize;
    stylePreview.dataset.themes = JSON.stringify(themes);

    themes.forEach((key, i) => {
        const theme = CONFIG.themeColors[key];
        const cx = startX + (i * step);
        const cy = centerY;
        const isActive = (STATE.theme === key);

        // Selection indicator (Active Ring)
        if (isActive) {
            ctxPv.beginPath();
            ctxPv.arc(cx, cy, dotSize + 5, 0, Math.PI * 2);
            ctxPv.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctxPv.fill();

            ctxPv.beginPath();
            ctxPv.arc(cx, cy, dotSize + 2, 0, Math.PI * 2);
            ctxPv.strokeStyle = theme.text; // Use text color for contrast ring
            ctxPv.lineWidth = 1.5;
            ctxPv.stroke();
        }

        // The Dot itself
        ctxPv.beginPath();
        ctxPv.arc(cx, cy, dotSize, 0, Math.PI * 2);

        // Gradient fill for fanciness? Or flat.
        // Let's do simple flat 'today' color which usually represents the theme accent.
        ctxPv.fillStyle = theme.today;

        // Special case for 'minimal_red' or monochrome themes where 'today' might be similar to others?
        // Actually 'today' is usually the accent (orange, blue, green, etc).
        ctxPv.fill();

        // Inner detail to show bg contrast? 
        // Let's add a small dot of the 'bg' color inside to show contrast.
        ctxPv.beginPath();
        ctxPv.arc(cx, cy, dotSize * 0.4, 0, Math.PI * 2);
        ctxPv.fillStyle = theme.bg;
        ctxPv.fill();
    });
}

function setupMiniPreviewInteractions() {
    const cvs = document.getElementById('stylePreview');
    if (!cvs) return;

    cvs.style.cursor = 'pointer';

    cvs.addEventListener('click', (e) => {
        const rect = cvs.getBoundingClientRect();
        const clickX = e.clientX - rect.left;

        const themes = JSON.parse(cvs.dataset.themes || "[]");
        const step = parseFloat(cvs.dataset.step || 1);
        const startX = parseFloat(cvs.dataset.startX || 0);

        // Calculate index
        // x = startX + i*step
        // i = (x - (startX - step/2)) / step ??
        // Actually boundaries are startX + i*step +/- step/2
        // Simplest: i = floor( (clickX - padding) / step )
        // Assuming clickX relative to padding...

        // Let's use simple distance check for robustness
        let closestIndex = -1;
        let minDist = 999;

        themes.forEach((t, i) => {
            const cx = startX + (i * step);
            const dist = Math.abs(clickX - cx);
            if (dist < minDist) {
                minDist = dist;
                closestIndex = i;
            }
        });

        if (minDist < step * 0.8 && closestIndex !== -1) {
            const hoverTheme = themes[closestIndex];

            // If satisfied, trigger preview
            if (STATE.theme !== hoverTheme) {
                if (!savedTheme) savedTheme = STATE.theme; // Save original
                STATE.theme = hoverTheme; // Temp switch
                render(); // Re-render everything with new colors

                // Optional: Update Dropdown visually? No, keep it as "Selected" value.
            }
        } else {
            // Hovering nothing? Restore if we have a saved state
            if (savedTheme) {
                STATE.theme = savedTheme;
                savedTheme = null;
                render();
            }
        }
    });

    cvs.addEventListener('mouseleave', () => {
        if (savedTheme) {
            STATE.theme = savedTheme;
            savedTheme = null;
            render();
        }
    });
}

// Helper for rounded rect (if needed later)
function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

// Start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
