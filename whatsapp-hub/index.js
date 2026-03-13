const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const cron = require('node-cron');
require('dotenv').config();
const { sendWhatsAppPayload } = require('./simTransport');

const path = require('path');
const app = express();
const calendarModule = require('./calendar');
const { WA_SOFIA_CATALOG, WA_SOFIA_CATEGORY_META, WA_SOFIA_LIST_TITLE_OVERRIDES } = require('./sofia-data');

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    console.log(`Request: ${req.method} ${req.path}`);
    next();
});
app.use(express.static(path.join(__dirname, 'public')));

const { Telegraf, Markup, session, Scenes } = require('telegraf');
const TelegrafI18n = require('telegraf-i18n');
const Calendar = require('telegraf-calendar-telegram');

const { PORT, WA_PHONE_NUMBER_ID, CLOUD_API_ACCESS_TOKEN, WEBHOOK_VERIFY_TOKEN, TELEGRAM_BOT_TOKEN, STRIPE_SECRET_KEY } = process.env;
const TELEGRAM_ENABLED = process.env.ENABLE_TELEGRAM_BOT !== '0';
const CRON_ENABLED = process.env.ENABLE_LOCAL_CRON !== '0';

function scheduleCron(expression, task) {
    if (!CRON_ENABLED) return null;
    return cron.schedule(expression, task);
}

const Stripe = require("stripe");
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;
// --- PostgreSQL DB Layer ---
const db = require('./db');
const getAppointments = () => db.getAppointments();
const saveAppointments = (arr) => db.saveAppointments(arr);
const getHolidays = () => db.getHolidays();
const saveHolidays = (h) => db.saveHolidays(h);
const getBarberBlocks = () => db.getBarberBlocks();
const saveBarberBlocks = (b) => db.saveBarberBlocks(b);
const isBarberBlocked = (barberId, dateString) => db.isBarberBlocked(barberId, dateString);

// Helper: Get current date in Belgian timezone (Europe/Brussels)
function getLocalDate(date) {
    const d = date || new Date();
    return d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Brussels' }); // returns YYYY-MM-DD
}

// --- Telegram Bot Setup ---
const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

// i18n Configuration
const i18n = new TelegrafI18n({
    directory: path.resolve(__dirname, 'locales'),
    defaultLanguage: 'nl',
    sessionName: 'session',
    useSession: true,
    templateData: {
        pluralize: TelegrafI18n.pluralize,
        uppercase: (value) => value.toUpperCase()
    }
});


// --- Salon Business Hours Configuration ---
// 0=Sunday, 1=Monday, 2=Tuesday, ... 6=Saturday
const CLOSED_DAYS = [0, 1]; // Sunday & Monday
const SALON_OPEN = 9;  // 09:00
const SALON_CLOSE = 18; // 18:00 (last slot at 17:00)

// Staff per category
const STAFF = {
    male: [
        { id: 'diri', name: 'Diri' },
        { id: 'yasin', name: 'Yasin' },
    ],
    female: [
        { id: 'madina', name: 'Madina' },
        { id: 'galina', name: 'Galina' },
    ],
};

// 15-minute cleanup buffer between bookings
const BUFFER_MINUTES = 15;

// Helper: Build a Google Calendar "Add Event" URL
function buildGoogleCalendarUrl(title, dateStr, timeStr, durationMin, location) {
    // dateStr = 'YYYY-MM-DD', timeStr = 'HH:MM'
    const start = dateStr.replace(/-/g, '') + 'T' + timeStr.replace(':', '') + '00';
    const endDate = new Date(`${dateStr}T${timeStr}:00`);
    endDate.setMinutes(endDate.getMinutes() + (durationMin || 30));
    const endH = String(endDate.getHours()).padStart(2, '0');
    const endM = String(endDate.getMinutes()).padStart(2, '0');
    const end = dateStr.replace(/-/g, '') + 'T' + endH + endM + '00';
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: title,
        dates: `${start}/${end}`,
        location: location || 'Alfons Pieterslaan 78, 8400 Oostende',
        details: 'Hairstylist Diri - Uw haar is onze passie! \u2702\ufe0f',
        ctz: 'Europe/Brussels'
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Helper: Generate ICS content
function generateICS(title, description, location, start, end) {
    const format = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Hairdresser Bot//NL',
        'BEGIN:VEVENT',
        `UID:${Date.now()}@hairdresser`,
        `DTSTAMP:${format(new Date())}`,
        `DTSTART:${format(start)}`,
        `DTEND:${format(end)}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${location}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');
}

// Service durations in minutes
const SERVICE_DURATIONS = {
    // Male services
    'Haarsnit zonder wassen': 30,
    'Haarsnit met wassen': 30,
    'Alleen tondeuse': 30,
    'Baard trimmen': 15,
    'Baard modelleren': 30,
    'Haarsnit + Baard': 45,
    'Haarsnit + Kleuren Baard': 45,
    'Modder Masker': 15,
    'Verwenpakket met oorkaars': 75,
    // Female services
    'Wassen, Knippen & Brushen': 60,
    'Alleen Brushen': 45,
    'Kleur + Snit + Brushen': 120,
    'Kleur Pakket Kort': 75,
    'Kleur Pakket Halflang': 75,
    'Kleur Pakket Lang': 90,
    'Modder Masker Dames': 15,
    'Diepe Conditioner': 15,
};
const DEFAULT_DURATION = 60;

// Service prices (minimum / starting price in EUR)
const SERVICE_PRICES = {
    // Male
    'Haarsnit zonder wassen': 25, 'Haarsnit met wassen': 30,
    'Alleen tondeuse': 20, 'Baard trimmen': 15,
    'Baard modelleren': 25, 'Haarsnit + Baard': 40,
    'Haarsnit + Kleuren Baard': 50, 'Modder Masker': 20,
    'Verwenpakket met oorkaars': 70,
    // Female
    'Wassen, Knippen & Brushen': 35, 'Alleen Brushen': 30,
    'Kleur + Snit + Brushen': 90, 'Kleur Pakket Kort': 115,
    'Kleur Pakket Halflang': 120, 'Kleur Pakket Lang': 130,
    'Modder Masker Dames': 20, 'Diepe Conditioner': 15,
};

// Helper: Check if a date falls on a closed day OR is a holiday
const isClosedDay = async (dateString) => {
    const date = new Date(dateString + 'T12:00:00');
    if (CLOSED_DAYS.includes(date.getDay())) return true;
    const holidays = await getHolidays();
    return holidays.includes(dateString);
};

// Helper: Generate 60-minute time slots based on business hours
const generateTimeSlots = () => {
    const slots = [];
    for (let h = SALON_OPEN; h < SALON_CLOSE; h++) {
        slots.push(`${String(h).padStart(2, '0')}:00`);
    }
    return slots;
};

// Helper: Convert "HH:MM" to minutes since midnight
const timeToMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

// Helper: Get available slots for a date + barber (or 'any' for first-available)
// barber = specific barber id, or 'any' to check if ANY barber in the category is free
const getAvailableSlots = async (dateString, category, newDuration = DEFAULT_DURATION, barber = 'any') => {
    const allSlots = generateTimeSlots();
    const appointments = await getAppointments();
    const closingTime = SALON_CLOSE * 60;
    const staffList = STAFF[category] || [];

    const sameCategoryBookings = appointments.filter(
        a => a.date === dateString && a.category === category && a.status !== 'cancelled'
    );

    // Pre-fetch blocked barbers for this date
    const blockedBarbers = new Set();
    for (const staff of staffList) {
        if (await isBarberBlocked(staff.id, dateString)) blockedBarbers.add(staff.id);
    }

    return allSlots.filter(slotTime => {
        const slotStart = timeToMinutes(slotTime);
        const slotEnd = slotStart + newDuration + BUFFER_MINUTES;

        if (slotStart + newDuration > closingTime) return false;

        if (barber === 'any') {
            return staffList.some(staff => {
                if (blockedBarbers.has(staff.id)) return false;
                const staffBookings = sameCategoryBookings.filter(a => a.barber === staff.id);
                return !staffBookings.some(booking => {
                    const bookingStart = timeToMinutes(booking.time);
                    const duration = booking.duration || DEFAULT_DURATION;
                    const bookingEnd = bookingStart + duration + BUFFER_MINUTES;
                    return slotStart < bookingEnd && slotEnd > bookingStart;
                });
            });
        } else {
            if (blockedBarbers.has(barber)) return false;
            const barberBookings = sameCategoryBookings.filter(a => a.barber === barber);
            return !barberBookings.some(booking => {
                const bookingStart = timeToMinutes(booking.time);
                const duration = booking.duration || DEFAULT_DURATION;
                const bookingEnd = bookingStart + duration + BUFFER_MINUTES;
                return slotStart < bookingEnd && slotEnd > bookingStart;
            });
        }
    });
};

// Helper: Find the first available barber for a specific slot
const findAvailableBarber = async (dateString, category, slotTime, duration) => {
    const appointments = await getAppointments();
    const staffList = STAFF[category] || [];
    const sameCategoryBookings = appointments.filter(
        a => a.date === dateString && a.category === category && a.status !== 'cancelled'
    );
    const slotStart = timeToMinutes(slotTime);
    const slotEnd = slotStart + duration + BUFFER_MINUTES;

    for (const staff of staffList) {
        if (await isBarberBlocked(staff.id, dateString)) continue;
        const staffBookings = sameCategoryBookings.filter(a => a.barber === staff.id);
        const isBusy = staffBookings.some(booking => {
            const bookingStart = timeToMinutes(booking.time);
            const bDur = booking.duration || DEFAULT_DURATION;
            const bookingEnd = bookingStart + bDur + BUFFER_MINUTES;
            return slotStart < bookingEnd && slotEnd > bookingStart;
        });
        if (!isBusy) return staff;
    }
    return null;
};

// --- Cancel button helper (appended to every keyboard) ---
const cancelRow = (ctx) => [Markup.button.callback(ctx.i18n.t('wizard.btn_cancel'), 'cancel_session')];

// --- Calendar helper: creates a fresh Calendar with minDate = today ---
const createCalendar = () => {
    return new Calendar(bot, {
        startDate: new Date(),
        minDate: new Date(),
        dateFormat: 'YYYY-MM-DD'
    });
};

// --- Shared: handle a selected date (validations + show time slots) ---
async function handleDateSelection(ctx, selectedDate) {
    // *** PAST DATE CHECK ***
    const today = getLocalDate();
    if (selectedDate < today) {
        await ctx.reply(ctx.i18n.t('wizard.past_date'), Markup.inlineKeyboard([
            [Markup.button.callback(ctx.i18n.t('wizard.btn_today'), 'date_today')],
            [Markup.button.callback(ctx.i18n.t('wizard.btn_tomorrow'), 'date_tomorrow')],
            [Markup.button.callback(ctx.i18n.t('wizard.btn_pick_date'), 'date_pick')],
            cancelRow(ctx)
        ]));
        return;
    }

    ctx.wizard.state.booking.date = selectedDate;

    // *** CLOSED DAY CHECK ***
    if (await isClosedDay(selectedDate)) {
        await ctx.reply(ctx.i18n.t('wizard.closed_day'), Markup.inlineKeyboard([
            [Markup.button.callback(ctx.i18n.t('wizard.btn_today'), 'date_today')],
            [Markup.button.callback(ctx.i18n.t('wizard.btn_tomorrow'), 'date_tomorrow')],
            [Markup.button.callback(ctx.i18n.t('wizard.btn_pick_date'), 'date_pick')],
            cancelRow(ctx)
        ]));
        return;
    }

    // *** AVAILABILITY CHECK (barber-aware with duration + buffer) ***
    const category = ctx.wizard.state.booking.category;
    const newDuration = ctx.wizard.state.booking.duration || DEFAULT_DURATION;
    const barber = ctx.wizard.state.booking.barber || 'any';
    const available = await getAvailableSlots(selectedDate, category, newDuration, barber);

    if (available.length === 0) {
        await ctx.reply(ctx.i18n.t('wizard.none_available'), Markup.inlineKeyboard([
            [Markup.button.callback(ctx.i18n.t('wizard.btn_today'), 'date_today')],
            [Markup.button.callback(ctx.i18n.t('wizard.btn_tomorrow'), 'date_tomorrow')],
            [Markup.button.callback(ctx.i18n.t('wizard.btn_pick_date'), 'date_pick')],
            cancelRow(ctx)
        ]));
        return;
    }

    // Show Time Slots (rows of 3)
    const buttons = [];
    let row = [];
    available.forEach((t, i) => {
        row.push(Markup.button.callback(t, `time_${t}`));
        if (row.length === 3 || i === available.length - 1) {
            buttons.push(row);
            row = [];
        }
    });
    buttons.push([Markup.button.callback(ctx.i18n.t('back_to_calendar'), 'retry_date')]);
    buttons.push(cancelRow(ctx));

    await ctx.reply(ctx.i18n.t('wizard.time_prompt', { date: selectedDate }), Markup.inlineKeyboard(buttons));
    return ctx.wizard.next();
}

// --- Booking Wizard Scene (Receptionist Flow) ---
const bookingWizard = new Scenes.WizardScene(
    'booking_wizard',
    // Step 1: Select Service
    async (ctx) => {
        ctx.wizard.state.booking = {};
        await ctx.reply(ctx.i18n.t('wizard.service_prompt'), Markup.inlineKeyboard([
            [Markup.button.callback(ctx.i18n.t('services.male'), 'service_male')],
            [Markup.button.callback(ctx.i18n.t('services.female'), 'service_female')],
            cancelRow(ctx)
        ]));
        return ctx.wizard.next();
    },
    // Step 2: Handle Service & Select Date (or show female sub-menu)
    async (ctx) => {
        if (!ctx.callbackQuery) return;

        const data = ctx.callbackQuery.data;
        if (data === 'cancel_session') {
            await ctx.answerCbQuery();
            await ctx.reply('❌ Boeking geannuleerd. Wat kan ik voor u doen?');
            await ctx.scene.leave();
            return showMainMenu(ctx);
        }

        // --- Male: show category menu (4 categories) ---
        if (data === 'service_male') {
            ctx.wizard.state.booking.category = 'male';
            await ctx.answerCbQuery();
            await ctx.reply(ctx.i18n.t('wizard.male_menu_prompt'), Markup.inlineKeyboard([
                [Markup.button.callback(ctx.i18n.t('wizard.mcat.cut'), 'mcat_cut')],
                [Markup.button.callback(ctx.i18n.t('wizard.mcat.beard'), 'mcat_beard')],
                [Markup.button.callback(ctx.i18n.t('wizard.mcat.combos'), 'mcat_combos')],
                [Markup.button.callback(ctx.i18n.t('wizard.mcat.extras'), 'mcat_extras')],
                cancelRow(ctx)
            ]));
            return; // Stay in Step 2 — wait for category selection
        }

        // --- Male category → show sub-services ---
        if (data === 'mcat_cut') {
            await ctx.answerCbQuery();
            await ctx.reply(ctx.i18n.t('wizard.male_sub_prompt'), Markup.inlineKeyboard([
                [Markup.button.callback(ctx.i18n.t('wizard.msvc.cut_no_wash'), 'msvc_cut_no_wash')],
                [Markup.button.callback(ctx.i18n.t('wizard.msvc.cut_with_wash'), 'msvc_cut_with_wash')],
                [Markup.button.callback(ctx.i18n.t('wizard.msvc.clipper'), 'msvc_clipper')],
                [Markup.button.callback(ctx.i18n.t('wizard.btn_back'), 'msvc_back_to_cats')],
                cancelRow(ctx)
            ]));
            return;
        }
        if (data === 'mcat_beard') {
            await ctx.answerCbQuery();
            await ctx.reply(ctx.i18n.t('wizard.male_sub_prompt'), Markup.inlineKeyboard([
                [Markup.button.callback(ctx.i18n.t('wizard.msvc.beard_trim'), 'msvc_beard_trim')],
                [Markup.button.callback(ctx.i18n.t('wizard.msvc.beard_model'), 'msvc_beard_model')],
                [Markup.button.callback(ctx.i18n.t('wizard.btn_back'), 'msvc_back_to_cats')],
                cancelRow(ctx)
            ]));
            return;
        }
        if (data === 'mcat_combos') {
            await ctx.answerCbQuery();
            await ctx.reply(ctx.i18n.t('wizard.male_sub_prompt'), Markup.inlineKeyboard([
                [Markup.button.callback(ctx.i18n.t('wizard.msvc.cut_beard'), 'msvc_cut_beard')],
                [Markup.button.callback(ctx.i18n.t('wizard.msvc.cut_color_beard'), 'msvc_cut_color_beard')],
                [Markup.button.callback(ctx.i18n.t('wizard.btn_back'), 'msvc_back_to_cats')],
                cancelRow(ctx)
            ]));
            return;
        }
        if (data === 'mcat_extras') {
            await ctx.answerCbQuery();
            await ctx.reply(ctx.i18n.t('wizard.male_sub_prompt'), Markup.inlineKeyboard([
                [Markup.button.callback(ctx.i18n.t('wizard.msvc.mud_mask'), 'msvc_mud_mask')],
                [Markup.button.callback(ctx.i18n.t('wizard.msvc.pamper'), 'msvc_pamper')],
                [Markup.button.callback(ctx.i18n.t('wizard.btn_back'), 'msvc_back_to_cats')],
                cancelRow(ctx)
            ]));
            return;
        }

        // --- Male: back to category menu ---
        if (data === 'msvc_back_to_cats') {
            await ctx.answerCbQuery();
            await ctx.reply(ctx.i18n.t('wizard.male_menu_prompt'), Markup.inlineKeyboard([
                [Markup.button.callback(ctx.i18n.t('wizard.mcat.cut'), 'mcat_cut')],
                [Markup.button.callback(ctx.i18n.t('wizard.mcat.beard'), 'mcat_beard')],
                [Markup.button.callback(ctx.i18n.t('wizard.mcat.combos'), 'mcat_combos')],
                [Markup.button.callback(ctx.i18n.t('wizard.mcat.extras'), 'mcat_extras')],
                cancelRow(ctx)
            ]));
            return;
        }

        // --- Female: show category menu (3 categories) ---
        if (data === 'service_female') {
            ctx.wizard.state.booking.category = 'female';
            await ctx.answerCbQuery();
            await ctx.reply(ctx.i18n.t('wizard.female_menu_prompt'), Markup.inlineKeyboard([
                [Markup.button.callback(ctx.i18n.t('wizard.fcat.styling'), 'fcat_styling')],
                [Markup.button.callback(ctx.i18n.t('wizard.fcat.color'), 'fcat_color')],
                [Markup.button.callback(ctx.i18n.t('wizard.fcat.care'), 'fcat_care')],
                cancelRow(ctx)
            ]));
            return; // Stay in Step 2 — wait for category selection
        }

        // --- Female category → show sub-services ---
        if (data === 'fcat_styling') {
            await ctx.answerCbQuery();
            await ctx.reply(ctx.i18n.t('wizard.female_sub_prompt'), Markup.inlineKeyboard([
                [Markup.button.callback(ctx.i18n.t('wizard.fsvc.cut_brush'), 'fsvc_cut_brush')],
                [Markup.button.callback(ctx.i18n.t('wizard.fsvc.brush_only'), 'fsvc_brush_only')],
                [Markup.button.callback(ctx.i18n.t('wizard.btn_back'), 'fsvc_back_to_cats')],
                cancelRow(ctx)
            ]));
            return;
        }
        if (data === 'fcat_color') {
            await ctx.answerCbQuery();
            await ctx.reply(ctx.i18n.t('wizard.female_sub_prompt'), Markup.inlineKeyboard([
                [Markup.button.callback(ctx.i18n.t('wizard.fsvc.color_cut_brush'), 'fsvc_color_cut_brush')],
                [Markup.button.callback(ctx.i18n.t('wizard.fsvc.color_short'), 'fsvc_color_short')],
                [Markup.button.callback(ctx.i18n.t('wizard.fsvc.color_medium'), 'fsvc_color_medium')],
                [Markup.button.callback(ctx.i18n.t('wizard.fsvc.color_long'), 'fsvc_color_long')],
                [Markup.button.callback(ctx.i18n.t('wizard.btn_back'), 'fsvc_back_to_cats')],
                cancelRow(ctx)
            ]));
            return;
        }
        if (data === 'fcat_care') {
            await ctx.answerCbQuery();
            await ctx.reply(ctx.i18n.t('wizard.female_sub_prompt'), Markup.inlineKeyboard([
                [Markup.button.callback(ctx.i18n.t('wizard.fsvc.mud_mask'), 'fsvc_mud_mask')],
                [Markup.button.callback(ctx.i18n.t('wizard.fsvc.deep_conditioner'), 'fsvc_deep_conditioner')],
                [Markup.button.callback(ctx.i18n.t('wizard.btn_back'), 'fsvc_back_to_cats')],
                cancelRow(ctx)
            ]));
            return;
        }

        // --- Female: back to category menu ---
        if (data === 'fsvc_back_to_cats') {
            await ctx.answerCbQuery();
            await ctx.reply(ctx.i18n.t('wizard.female_menu_prompt'), Markup.inlineKeyboard([
                [Markup.button.callback(ctx.i18n.t('wizard.fcat.styling'), 'fcat_styling')],
                [Markup.button.callback(ctx.i18n.t('wizard.fcat.color'), 'fcat_color')],
                [Markup.button.callback(ctx.i18n.t('wizard.fcat.care'), 'fcat_care')],
                cancelRow(ctx)
            ]));
            return;
        }

        // --- Handle male sub-service selection ---
        const msvcMap = {
            'msvc_cut_no_wash': 'Haarsnit zonder wassen',
            'msvc_cut_with_wash': 'Haarsnit met wassen',
            'msvc_clipper': 'Alleen tondeuse',
            'msvc_beard_trim': 'Baard trimmen',
            'msvc_beard_model': 'Baard modelleren',
            'msvc_cut_beard': 'Haarsnit + Baard',
            'msvc_cut_color_beard': 'Haarsnit + Kleuren Baard',
            'msvc_mud_mask': 'Modder Masker',
            'msvc_pamper': 'Verwenpakket met oorkaars',
        };

        // --- Handle female sub-service selection (single-select) ---
        const fsvcMap = {
            'fsvc_cut_brush': 'Wassen, Knippen & Brushen',
            'fsvc_brush_only': 'Alleen Brushen',
            'fsvc_color_cut_brush': 'Kleur + Snit + Brushen',
            'fsvc_color_short': 'Kleur Pakket Kort',
            'fsvc_color_medium': 'Kleur Pakket Halflang',
            'fsvc_color_long': 'Kleur Pakket Lang',
            'fsvc_mud_mask': 'Modder Masker Dames',
            'fsvc_deep_conditioner': 'Diepe Conditioner',
        };

        // --- Male: single-select → show barber selection ---
        if (msvcMap[data]) {
            const serviceName = msvcMap[data];
            ctx.wizard.state.booking.service = serviceName;
            ctx.wizard.state.booking.category = 'male';
            const duration = SERVICE_DURATIONS[serviceName] || DEFAULT_DURATION;
            ctx.wizard.state.booking.duration = duration;
            await ctx.answerCbQuery();

            await ctx.reply(ctx.i18n.t('wizard.service_chosen', { service: serviceName, duration }), { parse_mode: 'HTML' });

            // Show barber selection for male
            await ctx.reply(ctx.i18n.t('wizard.barber_prompt'), Markup.inlineKeyboard([
                [Markup.button.callback(ctx.i18n.t('wizard.barber.diri'), 'barber_diri')],
                [Markup.button.callback(ctx.i18n.t('wizard.barber.yasin'), 'barber_yasin')],
                [Markup.button.callback(ctx.i18n.t('wizard.barber.any'), 'barber_any')],
                cancelRow(ctx)
            ]));
            return; // Stay in Step 2 — wait for barber selection
        }

        // --- Female: single-select → show barber selection ---
        if (fsvcMap[data]) {
            const serviceName = fsvcMap[data];
            ctx.wizard.state.booking.service = serviceName;
            ctx.wizard.state.booking.category = 'female';
            const duration = SERVICE_DURATIONS[serviceName] || DEFAULT_DURATION;
            ctx.wizard.state.booking.duration = duration;
            await ctx.answerCbQuery();

            await ctx.reply(ctx.i18n.t('wizard.service_chosen', { service: serviceName, duration }), { parse_mode: 'HTML' });

            // Show barber selection for female
            await ctx.reply(ctx.i18n.t('wizard.barber_prompt'), Markup.inlineKeyboard([
                [Markup.button.callback(ctx.i18n.t('wizard.barber.madina'), 'barber_madina')],
                [Markup.button.callback(ctx.i18n.t('wizard.barber.galina'), 'barber_galina')],
                [Markup.button.callback(ctx.i18n.t('wizard.barber.any'), 'barber_any')],
                cancelRow(ctx)
            ]));
            return; // Stay in Step 2 — wait for barber selection
        }

        // --- Barber selection → proceed to date picker ---
        const barberMap = {
            'barber_diri': { id: 'diri', name: 'Diri' },
            'barber_yasin': { id: 'yasin', name: 'Yasin' },
            'barber_madina': { id: 'madina', name: 'Madina' },
            'barber_galina': { id: 'galina', name: 'Galina' },
            'barber_any': { id: 'any', name: 'Eerst beschikbare' },
        };
        if (barberMap[data]) {
            const barber = barberMap[data];
            ctx.wizard.state.booking.barber = barber.id;
            ctx.wizard.state.booking.barberName = barber.name;
            await ctx.answerCbQuery();

            const { service, duration } = ctx.wizard.state.booking;
            await ctx.reply(ctx.i18n.t('wizard.service_chosen_barber', { service, barber: barber.name, duration }), { parse_mode: 'HTML' });

            await ctx.reply(ctx.i18n.t('wizard.date_prompt'), Markup.inlineKeyboard([
                [Markup.button.callback(ctx.i18n.t('wizard.btn_today'), 'date_today')],
                [Markup.button.callback(ctx.i18n.t('wizard.btn_tomorrow'), 'date_tomorrow')],
                [Markup.button.callback(ctx.i18n.t('wizard.btn_pick_date'), 'date_pick')],
                cancelRow(ctx)
            ]));
            return ctx.wizard.next();
        }
    },
    // Step 3: Handle Date & Select Time
    async (ctx) => {
        if (!ctx.callbackQuery) return;

        const data = ctx.callbackQuery.data;
        if (data === 'cancel_session') {
            await ctx.answerCbQuery();
            await ctx.reply('❌ Boeking geannuleerd. Wat kan ik voor u doen?');
            await ctx.scene.leave();
            return showMainMenu(ctx);
        }
        let selectedDate = null;
        const now = new Date();

        if (data === 'date_today') {
            selectedDate = getLocalDate(now);
        } else if (data === 'date_tomorrow') {
            const tmrw = new Date(now);
            tmrw.setDate(tmrw.getDate() + 1);
            selectedDate = getLocalDate(tmrw);

        } else if (data === 'date_pick') {
            // Show inline calendar
            const cal = createCalendar();
            await ctx.answerCbQuery();
            await ctx.reply(ctx.i18n.t('wizard.date_prompt'), cal.getCalendar());
            return; // Stay — user will click a date or navigate

        } else if (data.startsWith('calendar-telegram-date-')) {
            // User selected a date from the calendar
            selectedDate = data.replace('calendar-telegram-date-', '');

        } else if (/^calendar-telegram-(prev|next)-/.test(data)) {
            // Calendar month navigation — re-render calendar for the target month
            const direction = data.includes('-prev-') ? -1 : 1;
            const dateString = data.replace(/^calendar-telegram-(prev|next)-/, '');
            const navDate = new Date(dateString);
            navDate.setMonth(navDate.getMonth() + direction);

            const cal = createCalendar();
            const prevText = ctx.callbackQuery.message.text;
            const calMarkup = cal.getCalendar(navDate);

            await ctx.answerCbQuery();
            await ctx.editMessageText(prevText, calMarkup);
            return; // Stay — updated calendar is now shown

        } else if (data.startsWith('calendar-telegram-ignore')) {
            // Ignore buttons (empty day cells, header, etc.)
            await ctx.answerCbQuery();
            return;

        } else {
            return;
        }

        if (selectedDate) {
            await ctx.answerCbQuery();
            return await handleDateSelection(ctx, selectedDate);
        }
    },
    // Step 4: Handle Time & Confirmation
    async (ctx) => {
        if (!ctx.callbackQuery) return;

        const data = ctx.callbackQuery.data;
        if (data === 'cancel_session') {
            await ctx.answerCbQuery();
            await ctx.reply('❌ Boeking geannuleerd. Wat kan ik voor u doen?');
            await ctx.scene.leave();
            return showMainMenu(ctx);
        }

        if (data === 'retry_date') {
            await ctx.answerCbQuery();
            await ctx.reply(ctx.i18n.t('wizard.date_prompt'), Markup.inlineKeyboard([
                [Markup.button.callback(ctx.i18n.t('wizard.btn_today'), 'date_today')],
                [Markup.button.callback(ctx.i18n.t('wizard.btn_tomorrow'), 'date_tomorrow')],
                [Markup.button.callback(ctx.i18n.t('wizard.btn_pick_date'), 'date_pick')],
                cancelRow(ctx)
            ]));
            return ctx.wizard.selectStep(2);
        }

        if (data.startsWith('time_')) {
            const time = data.replace('time_', '');

            // Double-check availability in real-time (barber + duration aware)
            const { date, category: cat, barber: bId } = ctx.wizard.state.booking;
            const dur = ctx.wizard.state.booking.duration || DEFAULT_DURATION;
            const stillAvailable = await getAvailableSlots(date, cat, dur, bId || 'any');
            if (!stillAvailable.includes(time)) {
                await ctx.answerCbQuery(`❌ ${time} is al bezet!`);
                return;
            }

            // For 'any' barber: auto-assign first available barber for this slot
            if (!bId || bId === 'any') {
                const assignedStaff = await findAvailableBarber(date, cat, time, dur);
                if (assignedStaff) {
                    ctx.wizard.state.booking.barber = assignedStaff.id;
                    ctx.wizard.state.booking.barberName = assignedStaff.name;
                }
            }

            ctx.wizard.state.booking.time = time;
            const { service, barberName } = ctx.wizard.state.booking;
            const name = ctx.from.first_name || 'Valued Customer';
            ctx.wizard.state.booking.name = name;

            await ctx.answerCbQuery();
            await ctx.reply(ctx.i18n.t('wizard.confirm_prompt', { name, service, barber: barberName || '?', date, time }), {
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback(ctx.i18n.t('wizard.btn_yes'), 'confirm_yes')],
                    [Markup.button.callback(ctx.i18n.t('wizard.btn_no'), 'confirm_no')]
                ])
            });
            return ctx.wizard.next();
        }
    },
    // Step 5: Final Action
    async (ctx) => {
        if (!ctx.callbackQuery) return;
        const data = ctx.callbackQuery.data;

        if (data === 'confirm_yes') {
            const { service, date, time, name, category, selectedServices, barber: barberId, barberName: bName } = ctx.wizard.state.booking;
            const duration = ctx.wizard.state.booking.duration || SERVICE_DURATIONS[service] || DEFAULT_DURATION;
            const appointments = await getAppointments();
            appointments.push({
                id: Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
                date, time, category, duration,
                barber: barberId || 'any',
                barberName: bName || '?',
                services: selectedServices || [service],
                details: `${name} (${service})`,
                telegramUserId: ctx.from.id,
                locale: ctx.i18n.locale() || 'nl',
                status: 'pending',
                system: 'telegram',
                timestamp: new Date().toISOString()
            });
            await saveAppointments(appointments);

            // --- Notify Admin of new booking ---
            const apptId = appointments[appointments.length - 1].id;
            const ADMIN_NOTIFY_ID = Number(process.env.ADMIN_TELEGRAM_ID) || 0;
            if (ADMIN_NOTIFY_ID) {
                const svcList = (selectedServices || [service]).join(', ');
                const adminMsg = `📩 <b>Nieuwe Aanvraag!</b>\n\n` +
                    `👤 ${name}\n` +
                    `✂️ ${svcList}\n` +
                    `💈 ${bName || '?'}\n` +
                    `📅 ${date} om ${time}\n` +
                    `⏱️ ${duration} min\n` +
                    `🏷️ ${category === 'male' ? 'Heren' : 'Dames'}`;
                try {
                    await ctx.telegram.sendMessage(ADMIN_NOTIFY_ID, adminMsg, {
                        parse_mode: 'HTML',
                        ...Markup.inlineKeyboard([
                            [
                                Markup.button.callback('✅ Bevestigen', `adm_approve_${apptId}`),
                                Markup.button.callback('❌ Afwijzen', `adm_reject_${apptId}`)
                            ]
                        ])
                    });
                } catch (e) { /* admin unreachable */ }
            }

            await ctx.answerCbQuery();
            await ctx.reply(ctx.i18n.t('wizard.success', { name }), { parse_mode: 'HTML' });

            // Send "Add to Calendar" button
            const svcName = (selectedServices || [service]).join(' + ');
            const calUrl = buildGoogleCalendarUrl(
                `✂️ ${svcName} - Hairstylist Diri`,
                date, time, duration
            );
            await ctx.reply(ctx.i18n.t('calendar_btn'), {
                ...Markup.inlineKeyboard([
                    [Markup.button.url(ctx.i18n.t('calendar_btn'), calUrl)],
                    [Markup.button.callback(ctx.i18n.t('ics_btn'), `download_ics_${apptId}`)]
                ])
            });

            return ctx.scene.leave();
        } else if (data === 'confirm_no') {
            await ctx.answerCbQuery();
            await ctx.reply(ctx.i18n.t('wizard.cancelled'));
            return ctx.scene.leave();
        }
    }
);

// SETUP STAGE
const stage = new Scenes.Stage([bookingWizard]);
bot.use(session());
bot.use(i18n.middleware());
bot.use(stage.middleware());

// Global error handler — prevents crashes from stale/expired callback queries
bot.catch((err, ctx) => {
    const desc = err?.response?.description || err.message || '';
    if (desc.includes('query is too old') || desc.includes('message is not modified')) {
        // Silently ignore stale queries and no-change edits
        return;
    }
    console.error('Bot error:', desc);
});

// --- Global Cancel Handler (works from ANYWHERE) ---
bot.action('cancel_session', async (ctx) => {
    await ctx.answerCbQuery();
    try { await ctx.deleteMessage(); } catch (e) { /* ignore */ }
    if (ctx.scene) {
        try { await ctx.scene.leave(); } catch (e) { /* not in a scene */ }
    }
    ctx.reply(ctx.i18n.t('reset') + '\n\n✂️ Kies uw taal / Choose your language:', Markup.inlineKeyboard([
        [Markup.button.callback('🇳🇱 Nederlands', 'nederlands')],
        [Markup.button.callback('🇺🇸 English', 'english')],
        [Markup.button.callback('🇷🇺 Русский', 'russian')],
        [Markup.button.callback('🇫🇷 Français', 'french')]
    ]));
});

// /reset command (same as cancel_session)
bot.command('reset', async (ctx) => {
    if (ctx.scene) {
        try { await ctx.scene.leave(); } catch (e) { /* not in a scene */ }
    }
    ctx.reply(ctx.i18n.t('reset') + '\n\n✂️ Kies uw taal / Choose your language:', Markup.inlineKeyboard([
        [Markup.button.callback('🇳🇱 Nederlands', 'nederlands')],
        [Markup.button.callback('🇺🇸 English', 'english')],
        [Markup.button.callback('🇷🇺 Русский', 'russian')],
        [Markup.button.callback('🇫🇷 Français', 'french')]
    ]));
});

// /clear — Delete recent bot messages to clean up the chat
bot.command('clear', async (ctx) => {
    const chatId = ctx.chat.id;
    const msgId = ctx.message.message_id;
    let deleted = 0;

    // Try to delete the last 50 messages (bot can only delete messages < 48h old)
    for (let i = msgId; i > msgId - 50 && i > 0; i--) {
        try {
            await ctx.telegram.deleteMessage(chatId, i);
            deleted++;
        } catch (e) {
            // Can't delete — message is too old, from another user, or already deleted
        }
    }

    // Send a fresh start message
    await ctx.reply(`🧹 ${deleted} berichten opgeruimd!\n\n✂️ Kies uw taal / Choose your language:`, Markup.inlineKeyboard([
        [Markup.button.callback('🇳🇱 Nederlands', 'nederlands')],
        [Markup.button.callback('🇺🇸 English', 'english')],
        [Markup.button.callback('🇷🇺 Русский', 'russian')],
        [Markup.button.callback('🇫🇷 Français', 'french')]
    ]));
});

// --- Private Admin Dashboard (Pro) ---
const ADMIN_ID = Number(process.env.ADMIN_TELEGRAM_ID) || 0;

// Staff IDs file (tracks which staff have been welcomed)
const STAFF_IDS_FILE = 'staff_ids.json';
if (!fs.existsSync(STAFF_IDS_FILE)) {
    fs.writeFileSync(STAFF_IDS_FILE, JSON.stringify({}), 'utf8');
}
const getStaffIds = () => { try { return JSON.parse(fs.readFileSync(STAFF_IDS_FILE, 'utf8')); } catch (e) { return {}; } };
const saveStaffIds = (s) => fs.writeFileSync(STAFF_IDS_FILE, JSON.stringify(s, null, 2), 'utf8');

// Helper: Is this user an admin or staff member?
const isAdmin = (userId) => userId === ADMIN_ID;

// Status emoji map
const STATUS_EMOJI = { pending: '🟡', confirmed: '🟢', completed: '✅', cancelled: '❌' };

// Helper: Capacity meter as visual bar
function capacityBar(used, total, width = 10) {
    const filled = Math.round((used / Math.max(total, 1)) * width);
    const empty = width - filled;
    const pct = Math.round((used / Math.max(total, 1)) * 100);
    return '█'.repeat(filled) + '░'.repeat(empty) + ` ${pct}%`;
}

// Helper: Calculate revenue for a list of appointments
function calcRevenue(appts) {
    let total = 0;
    appts.forEach(a => {
        if (a.services && Array.isArray(a.services)) {
            a.services.forEach(s => { total += SERVICE_PRICES[s] || 0; });
        }
    });
    return total;
}

// Helper: Render dashboard text for a given date
async function renderAdminDashboard(dateString) {
    const appointments = await getAppointments();
    const dayAppts = appointments.filter(a => a.date === dateString && a.status !== 'cancelled');

    const dateObj = new Date(dateString + 'T12:00:00');
    const dayNames = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
    const dayName = dayNames[dateObj.getDay()];
    const closedToday = await isClosedDay(dateString);
    const holidays = await getHolidays();
    const isHoliday = holidays.includes(dateString);

    let text = `📊 <b>Admin Dashboard</b>\n`;
    text += `📅 <b>${dayName} ${dateString}</b>`;
    if (closedToday) text += `  🚫 <i>${isHoliday ? 'Vakantiedag' : 'Gesloten'}</i>`;
    text += `\n`;

    if (dayAppts.length === 0) {
        text += `\n📭 Geen afspraken.\n`;
    } else {
        const male = dayAppts.filter(a => a.category === 'male').sort((a, b) => a.time.localeCompare(b.time));
        const female = dayAppts.filter(a => a.category === 'female').sort((a, b) => a.time.localeCompare(b.time));

        const renderAppt = (a) => {
            const statusIcon = STATUS_EMOJI[a.status] || '🟡';
            const services = a.services ? a.services.join(', ') : a.details;
            const name = a.details ? a.details.split('(')[0].trim() : '?';
            return `  ${statusIcon} <b>${a.time}</b> — ${name}\n     ${services} (${a.duration || DEFAULT_DURATION}min)\n`;
        };

        if (male.length > 0) {
            text += `\n🧔 <b>Heren (${male.length})</b>\n`;
            male.forEach(a => { text += renderAppt(a); });
        }
        if (female.length > 0) {
            text += `\n👩 <b>Dames (${female.length})</b>\n`;
            female.forEach(a => { text += renderAppt(a); });
        }

        const dayRevenue = calcRevenue(dayAppts);
        text += `\n💰 <b>Omzet vandaag: vanaf € ${dayRevenue}</b>`;
    }

    // Capacity meter
    const totalSlots = (SALON_CLOSE - SALON_OPEN);
    const maleBooked = dayAppts.filter(a => a.category === 'male').length;
    const femaleBooked = dayAppts.filter(a => a.category === 'female').length;
    const maleCap = totalSlots * (STAFF.male ? STAFF.male.length : 1);
    const femaleCap = totalSlots * (STAFF.female ? STAFF.female.length : 1);

    text += `\n\n📊 <b>Capaciteit:</b>`;
    text += `\n🧔 Heren:  ${capacityBar(maleBooked, maleCap)} (${maleBooked}/${maleCap})`;
    text += `\n👩 Dames: ${capacityBar(femaleBooked, femaleCap)} (${femaleBooked}/${femaleCap})`;

    text += `\n\n🟡 In afwachting  🟢 Bevestigd  ✅ Voltooid`;

    return text;
}

// Helper: Build admin keyboard with per-appointment action buttons
async function buildAdminKeyboard(dateString) {
    const appointments = await getAppointments();
    const dayAppts = appointments.filter(a => a.date === dateString && a.status !== 'cancelled');
    dayAppts.sort((a, b) => a.time.localeCompare(b.time));

    const buttons = [];

    dayAppts.forEach(a => {
        if (!a.id) return;
        const name = a.details ? a.details.split('(')[0].trim() : '?';
        const label = `${a.time} ${name}`;
        const row = [];
        if (a.status === 'pending') {
            row.push(Markup.button.callback(`✅ ${label}`, `adm_confirm_${a.id}`));
        }
        if (a.status === 'confirmed') {
            row.push(Markup.button.callback(`✔️ ${label}`, `adm_complete_${a.id}`));
        }
        if (a.status !== 'completed') {
            row.push(Markup.button.callback(`❌`, `adm_cancel_${a.id}`));
        }
        if (a.telegramUserId) {
            row.push(Markup.button.url(`💬`, `tg://user?id=${a.telegramUserId}`));
        }
        if (row.length > 0) buttons.push(row);
    });

    // Navigation
    buttons.push([
        Markup.button.callback('⬅️ Gisteren', `admin_prev_${dateString}`),
        Markup.button.callback('➡️ Morgen', `admin_next_${dateString}`)
    ]);
    buttons.push([
        Markup.button.callback('📈 Stats', `admin_stats`),
        Markup.button.callback('🔄 Vernieuwen', `admin_refresh_${dateString}`)
    ]);

    return Markup.inlineKeyboard(buttons);
}

// /admin command
bot.command('admin', async (ctx) => {
    if (ADMIN_ID && ctx.from.id !== ADMIN_ID) {
        return ctx.reply('🔒 Toegang geweigerd.');
    }
    const today = getLocalDate();
    const text = await renderAdminDashboard(today);
    const keyboard = await buildAdminKeyboard(today);
    await ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
});

// Admin navigation: prev / next / refresh
bot.action(/^admin_(prev|next|refresh)_(.+)$/, async (ctx) => {
    if (ADMIN_ID && ctx.from.id !== ADMIN_ID) return ctx.answerCbQuery('🔒');
    const action = ctx.match[1];
    const currentDate = ctx.match[2];
    let targetDate;
    if (action === 'refresh') {
        targetDate = currentDate;
    } else {
        const d = new Date(currentDate + 'T12:00:00');
        d.setDate(d.getDate() + (action === 'prev' ? -1 : 1));
        targetDate = d.toISOString().split('T')[0];
    }
    const text = await renderAdminDashboard(targetDate);
    const keyboard = await buildAdminKeyboard(targetDate);
    try { await ctx.answerCbQuery(); } catch (e) { }
    try { await ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }); } catch (e) { }
});

// Admin: Confirm appointment
bot.action(/^adm_confirm_(.+)$/, async (ctx) => {
    if (ADMIN_ID && ctx.from.id !== ADMIN_ID) return ctx.answerCbQuery('🔒');
    const apptId = ctx.match[1];
    const appointments = await getAppointments();
    const appt = appointments.find(a => a.id === apptId);
    if (!appt) return ctx.answerCbQuery('Niet gevonden.');
    appt.status = 'confirmed';
    await saveAppointments(appointments);
    if (appt.telegramUserId) {
        try { await ctx.telegram.sendMessage(appt.telegramUserId, `✅ Je afspraak op <b>${appt.date}</b> om <b>${appt.time}</b> is bevestigd! Tot dan! 💈`, { parse_mode: 'HTML' }); } catch (e) { }
    }
    const text = await renderAdminDashboard(appt.date);
    const keyboard = await buildAdminKeyboard(appt.date);
    try { await ctx.answerCbQuery('✅ Bevestigd!'); } catch (e) { }
    try { await ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }); } catch (e) { }
});

// Admin: Complete appointment
bot.action(/^adm_complete_(.+)$/, async (ctx) => {
    if (ADMIN_ID && ctx.from.id !== ADMIN_ID) return ctx.answerCbQuery('🔒');
    const apptId = ctx.match[1];
    const appointments = await getAppointments();
    const appt = appointments.find(a => a.id === apptId);
    if (!appt) return ctx.answerCbQuery('Niet gevonden.');
    appt.status = 'completed';
    await saveAppointments(appointments);
    const text = await renderAdminDashboard(appt.date);
    const keyboard = await buildAdminKeyboard(appt.date);
    try { await ctx.answerCbQuery('✅ Voltooid!'); } catch (e) { }
    try { await ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }); } catch (e) { }
});

// Admin: Cancel appointment
bot.action(/^adm_cancel_(.+)$/, async (ctx) => {
    if (ADMIN_ID && ctx.from.id !== ADMIN_ID) return ctx.answerCbQuery('🔒');
    const apptId = ctx.match[1];
    const appointments = await getAppointments();
    const appt = appointments.find(a => a.id === apptId);
    if (!appt) return ctx.answerCbQuery('Niet gevonden.');
    appt.status = 'cancelled';
    await saveAppointments(appointments);
    if (appt.telegramUserId) {
        try { await ctx.telegram.sendMessage(appt.telegramUserId, `❌ Je afspraak op <b>${appt.date}</b> om <b>${appt.time}</b> is helaas geannuleerd. Neem contact op voor een nieuwe afspraak.`, { parse_mode: 'HTML' }); } catch (e) { }
    }
    const text = await renderAdminDashboard(appt.date);
    const keyboard = await buildAdminKeyboard(appt.date);
    try { await ctx.answerCbQuery('❌ Geannuleerd!'); } catch (e) { }
    try { await ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard }); } catch (e) { }
});

// Admin: Approve from notification (inline buttons on booking notification)
bot.action(/^adm_approve_(.+)$/, async (ctx) => {
    if (ADMIN_ID && ctx.from.id !== ADMIN_ID) return ctx.answerCbQuery('🔒');
    const apptId = ctx.match[1];
    const appointments = await getAppointments();
    const appt = appointments.find(a => a.id === apptId);
    if (!appt) return ctx.answerCbQuery('Niet gevonden.');
    if (appt.status === 'confirmed') return ctx.answerCbQuery('Al bevestigd.');
    appt.status = 'confirmed';
    await saveAppointments(appointments);
    // Notify customer
    if (appt.telegramUserId) {
        const svc = appt.services ? appt.services.join(', ') : '';
        try {
            await ctx.telegram.sendMessage(appt.telegramUserId,
                `✅ <b>Afspraak Bevestigd!</b>\n\n` +
                `Je afspraak op <b>${appt.date}</b> om <b>${appt.time}</b> is bevestigd!\n` +
                `✂️ ${svc}\n\n` +
                `📍 <b>Locatie:</b>\nAlfons Pieterslaan 78, 8400 Oostende\n\nTot dan! 💈`,
                {
                    parse_mode: 'HTML',
                    ...Markup.inlineKeyboard([
                        [Markup.button.url(ctx.i18n.t('map_google'), 'https://www.google.com/maps/search/?api=1&query=Hairstylist+Diri+Alfons+Pieterslaan+78+8400+Oostende')],
                        [Markup.button.url(ctx.i18n.t('map_apple'), 'http://maps.apple.com/?address=Alfons+Pieterslaan+78,8400,Oostende')]
                    ])
                }
            );
        } catch (e) { }
    }
    // Replace notification with "handled"
    const name = appt.details ? appt.details.split('(')[0].trim() : '?';
    try { await ctx.answerCbQuery('✅ Bevestigd!'); } catch (e) { }
    try {
        await ctx.editMessageText(
            `✅ <b>Bevestigd</b> — ${name}\n✂️ ${appt.services ? appt.services.join(', ') : ''}\n📅 ${appt.date} om ${appt.time}`,
            { parse_mode: 'HTML' }
        );
    } catch (e) { }
});

// Admin: Reject from notification
bot.action(/^adm_reject_(.+)$/, async (ctx) => {
    if (ADMIN_ID && ctx.from.id !== ADMIN_ID) return ctx.answerCbQuery('🔒');
    const apptId = ctx.match[1];
    const appointments = await getAppointments();
    const appt = appointments.find(a => a.id === apptId);
    if (!appt) return ctx.answerCbQuery('Niet gevonden.');
    if (appt.status === 'cancelled') return ctx.answerCbQuery('Al afgewezen.');
    appt.status = 'cancelled';
    await saveAppointments(appointments);
    // Notify customer to pick another time
    if (appt.telegramUserId) {
        try {
            await ctx.telegram.sendMessage(appt.telegramUserId,
                `😔 <b>Helaas!</b>\n\nJe aanvraag voor <b>${appt.date}</b> om <b>${appt.time}</b> komt niet uit.\nKies a.u.b. een ander moment via /start 📅`,
                { parse_mode: 'HTML' }
            );
        } catch (e) { }
    }
    // Replace notification with "rejected"
    const name = appt.details ? appt.details.split('(')[0].trim() : '?';
    try { await ctx.answerCbQuery('❌ Afgewezen!'); } catch (e) { }
    try {
        await ctx.editMessageText(
            `❌ <b>Afgewezen</b> — ${name}\n✂️ ${appt.services ? appt.services.join(', ') : ''}\n📅 ${appt.date} om ${appt.time}`,
            { parse_mode: 'HTML' }
        );
    } catch (e) { }
});

// Admin: Stats overview
bot.action('admin_stats', async (ctx) => {
    if (ADMIN_ID && ctx.from.id !== ADMIN_ID) return ctx.answerCbQuery('🔒');
    const allAppts = await getAppointments();
    const appointments = allAppts.filter(a => a.status !== 'cancelled' && (a.whatsappUserId === from || a.phone === from));
    const today = new Date();
    const todayStr = getLocalDate(today);
    const dayOfWeek = today.getDay() || 7;
    const weekStart = new Date(today); weekStart.setDate(today.getDate() - dayOfWeek + 1);
    const weekStartStr = getLocalDate(weekStart);
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
    const weekEndStr = getLocalDate(weekEnd);
    const monthStr = todayStr.substring(0, 7);

    const todayAppts = appointments.filter(a => a.date === todayStr);
    const weekAppts = appointments.filter(a => a.date >= weekStartStr && a.date <= weekEndStr);
    const monthAppts = appointments.filter(a => a.date && a.date.startsWith(monthStr));

    const todayRev = calcRevenue(todayAppts);
    const weekRev = calcRevenue(weekAppts);
    const monthRev = calcRevenue(monthAppts);

    // Most popular services
    const svcCount = {};
    appointments.forEach(a => {
        if (a.services && Array.isArray(a.services)) {
            a.services.forEach(s => { svcCount[s] = (svcCount[s] || 0) + 1; });
        }
    });
    const sorted = Object.entries(svcCount).sort((a, b) => b[1] - a[1]);
    let popularText = '';
    sorted.slice(0, 5).forEach(([name, count], i) => {
        const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
        popularText += `  ${medals[i]} ${name} (${count}x)\n`;
    });

    let text = `📈 <b>Statistieken</b>\n\n`;
    text += `💰 <b>Omzet:</b>\n`;
    text += `  Vandaag: € ${todayRev}\n`;
    text += `  Deze week: € ${weekRev}\n`;
    text += `  Deze maand: € ${monthRev}\n\n`;
    text += `🏆 <b>Populairste diensten:</b>\n`;
    text += popularText || '  Nog geen data.\n';
    text += `\n📋 Totaal boekingen: ${appointments.length} (${todayAppts.length} vandaag)`;

    try { await ctx.answerCbQuery(); } catch (e) { }
    try {
        await ctx.editMessageText(text, {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('⬅️ Terug naar Dashboard', `admin_refresh_${todayStr}`)]
            ])
        });
    } catch (e) { }
});

// /broadcast — Send message to all registered customers
bot.command('broadcast', async (ctx) => {
    if (ADMIN_ID && ctx.from.id !== ADMIN_ID) return ctx.reply('🔒 Toegang geweigerd.');
    const message = ctx.message.text.replace('/broadcast', '').trim();
    if (!message) {
        return ctx.reply('📢 Gebruik: /broadcast <jouw bericht>\n\nVoorbeeld:\n/broadcast Morgen 50% korting op baardbehandelingen! 🎉');
    }
    const appointments = await getAppointments();
    const userIds = [...new Set(appointments.filter(a => a.telegramUserId).map(a => a.telegramUserId))];
    if (userIds.length === 0) return ctx.reply('📭 Nog geen klanten om te bereiken.');
    let sent = 0, failed = 0;
    for (const userId of userIds) {
        try {
            await ctx.telegram.sendMessage(userId, `📢 <b>Bericht van Hairstylist Diri's:</b>\n\n${message}`, { parse_mode: 'HTML' });
            sent++;
        } catch (e) { failed++; }
    }
    await ctx.reply(`📢 Broadcast verzonden!\n✅ Afgeleverd: ${sent}\n❌ Mislukt: ${failed}\n📋 Totaal: ${userIds.length}`);
});

// /holiday — Block or unblock a date
bot.command('holiday', async (ctx) => {
    if (ADMIN_ID && ctx.from.id !== ADMIN_ID) return ctx.reply('🔒 Toegang geweigerd.');
    const dateStr = ctx.message.text.replace('/holiday', '').trim();
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const holidays = await getHolidays();
        let text = '🏖️ <b>Vakantiemodus</b>\n\nGebruik: /holiday JJJJ-MM-DD\n\n';
        if (holidays.length > 0) {
            text += '<b>Geblokkeerde dagen:</b>\n';
            holidays.sort().forEach(d => { text += `  🚫 ${d}\n`; });
            text += '\nStuur dezelfde datum opnieuw om te deblokkeren.';
        } else {
            text += 'Geen geblokkeerde dagen.';
        }
        return ctx.reply(text, { parse_mode: 'HTML' });
    }
    const holidays = await getHolidays();
    const idx = holidays.indexOf(dateStr);
    if (idx >= 0) {
        holidays.splice(idx, 1);
        await saveHolidays(holidays);
        await ctx.reply(`✅ ${dateStr} is weer open voor boekingen!`);
    } else {
        holidays.push(dateStr);
        await saveHolidays(holidays);
        await ctx.reply(`🚫 ${dateStr} is nu geblokkeerd. Klanten kunnen deze dag niet meer boeken.`);
    }
});

// --- /mybookings — View & cancel your own appointments ---
bot.command(['mybookings', 'overzicht', 'mijnafspraken'], async (ctx) => {
    const userId = ctx.from.id;
    const appointments = await getAppointments();
    const today = getLocalDate();
    const upcoming = appointments.filter(a =>
        a.telegramUserId === userId &&
        a.status !== 'cancelled' &&
        a.date >= today
    ).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

    if (upcoming.length === 0) {
        return ctx.reply(ctx.i18n.t('mybookings.empty'));
    }

    let text = ctx.i18n.t('mybookings.title') + '\n\n';
    const buttons = [];
    const now = new Date();

    for (const appt of upcoming) {
        const svc = (appt.services || [appt.details]).join(', ');
        text += ctx.i18n.t('mybookings.row', {
            service: svc,
            barber: appt.barberName || '?',
            date: appt.date,
            time: appt.time
        }) + '\n\n';

        // 24-hour rule check
        const apptDateTime = new Date(appt.date + 'T' + appt.time + ':00');
        // Use Europe/Brussels timezone for accurate comparison
        const brusselsNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Brussels' }));
        const hoursUntil = (apptDateTime - brusselsNow) / (1000 * 60 * 60);

        if (hoursUntil >= 24) {
            buttons.push([Markup.button.callback(
                `${ctx.i18n.t('mybookings.cancel_btn')} ${appt.date} ${appt.time}`,
                `client_cancel_${appt.id}`
            )]);
        } else {
            text += `⚠️ <i>${appt.date} ${appt.time} — ` + ctx.i18n.t('mybookings.cancel_too_late').split('\n')[0] + `</i>\n\n`;
        }
    }

    await ctx.reply(text, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard(buttons)
    });
});

// Handle client self-cancel
bot.action(/^client_cancel_(.+)$/, async (ctx) => {
    const apptId = ctx.match[1];
    const appointments = await getAppointments();
    const appt = appointments.find(a => a.id === apptId);

    if (!appt || appt.status === 'cancelled') {
        await ctx.answerCbQuery('Not found');
        return;
    }

    // Double-check 24-hour rule
    const now = new Date();
    const apptDateTime = new Date(appt.date + 'T' + appt.time + ':00');
    const brusselsNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Brussels' }));
    const hoursUntil = (apptDateTime - brusselsNow) / (1000 * 60 * 60);

    if (hoursUntil < 24) {
        await ctx.answerCbQuery();
        return ctx.reply(ctx.i18n.t('mybookings.cancel_too_late'), { parse_mode: 'HTML' });
    }

    appt.status = 'cancelled';
    await saveAppointments(appointments);
    await ctx.answerCbQuery();
    await ctx.reply(ctx.i18n.t('mybookings.cancel_confirm'));

    // Notify admin
    const ADMIN_NOTIFY_ID = Number(process.env.ADMIN_TELEGRAM_ID) || 0;
    if (ADMIN_NOTIFY_ID) {
        const svc = (appt.services || [appt.details]).join(', ');
        const adminMsg = ctx.i18n.t('mybookings.admin_cancel_notify', {
            name: appt.details ? appt.details.split(' (')[0] : '?',
            service: svc,
            barber: appt.barberName || '?',
            date: appt.date,
            time: appt.time
        });
        try {
            await ctx.telegram.sendMessage(ADMIN_NOTIFY_ID, adminMsg, { parse_mode: 'HTML' });
        } catch (e) { /* admin unreachable */ }
    }
});

// --- /block — Admin: block a barber on a specific date ---
bot.command('block', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    const args = (ctx.message.text || '').split(/\s+/).slice(1);
    if (args.length < 2) {
        return ctx.reply(ctx.i18n.t('block.usage'), { parse_mode: 'HTML' });
    }
    const barberName = args[0];
    const dateStr = args[1];

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return ctx.reply(ctx.i18n.t('block.usage'), { parse_mode: 'HTML' });
    }

    // Find barber by name (case-insensitive)
    const allStaff = [...(STAFF.male || []), ...(STAFF.female || [])];
    const staff = allStaff.find(s => s.name.toLowerCase() === barberName.toLowerCase());
    if (!staff) {
        return ctx.reply(`❌ Onbekende kapper: "${barberName}". Bekende namen: ${allStaff.map(s => s.name).join(', ')}`);
    }

    const blocks = await getBarberBlocks();
    // Check if already blocked
    if (blocks.some(b => b.barber === staff.id && b.date === dateStr)) {
        return ctx.reply(`⚠️ ${staff.name} is al geblokkeerd op ${dateStr}.`);
    }

    blocks.push({ barber: staff.id, barberName: staff.name, date: dateStr, timestamp: new Date().toISOString() });
    await saveBarberBlocks(blocks);
    await ctx.reply(ctx.i18n.t('block.success', { barber: staff.name, date: dateStr }), { parse_mode: 'HTML' });
});

// --- /unblock — Admin: remove a barber block ---
bot.command('unblock', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    const args = (ctx.message.text || '').split(/\s+/).slice(1);
    if (args.length < 2) {
        return ctx.reply('Gebruik: /unblock Naam JJJJ-MM-DD');
    }
    const barberName = args[0];
    const dateStr = args[1];

    const allStaff = [...(STAFF.male || []), ...(STAFF.female || [])];
    const staff = allStaff.find(s => s.name.toLowerCase() === barberName.toLowerCase());
    if (!staff) {
        return ctx.reply(`❌ Onbekende kapper: "${barberName}".`);
    }

    const blocks = await getBarberBlocks();
    const idx = blocks.findIndex(b => b.barber === staff.id && b.date === dateStr);
    if (idx < 0) {
        return ctx.reply(ctx.i18n.t('block.not_found'), { parse_mode: 'HTML' });
    }

    blocks.splice(idx, 1);
    await saveBarberBlocks(blocks);
    await ctx.reply(ctx.i18n.t('block.removed', { barber: staff.name, date: dateStr }), { parse_mode: 'HTML' });
});

// --- /blocks — Admin: list all active blocks ---
bot.command('blocks', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    const blocks = await getBarberBlocks();
    const today = getLocalDate();
    const active = blocks.filter(b => b.date >= today).sort((a, b) => a.date.localeCompare(b.date));

    if (active.length === 0) {
        return ctx.reply(ctx.i18n.t('block.list_empty'), { parse_mode: 'HTML' });
    }

    let text = ctx.i18n.t('block.list_title') + '\n\n';
    for (const b of active) {
        text += `🚫 <b>${b.barberName || b.barber}</b> — ${b.date}\n`;
    }
    await ctx.reply(text, { parse_mode: 'HTML' });
});

// --- Helper Functions ---

// Helper: Show Main Menu with onboarding guide
const showMainMenu = async (ctx, firstTime = false) => {
    await ctx.reply(ctx.i18n.t('greeting', { name: ctx.from.first_name || 'there' }), Markup.keyboard([
        [ctx.i18n.t('main_menu.services'), ctx.i18n.t('main_menu.book')],
        [ctx.i18n.t('main_menu.info')]
    ]).resize());

    // Send onboarding guide on first language selection
    if (firstTime) {
        await ctx.reply(ctx.i18n.t('onboarding'), { parse_mode: 'HTML' });
    }

    // Admin welcome for staff — send once per staff member
    const userId = ctx.from.id;
    if (isAdmin(userId)) {
        const staffIds = getStaffIds();
        const userIdStr = String(userId);
        if (!staffIds[userIdStr]) {
            staffIds[userIdStr] = { name: ctx.from.first_name, welcomed: new Date().toISOString() };
            saveStaffIds(staffIds);
            await ctx.reply(ctx.i18n.t('admin_welcome', { name: ctx.from.first_name || 'Admin' }), { parse_mode: 'HTML' });
        }
    }
};

// Telegram: /start - Language Selection
bot.start((ctx) => {
    ctx.reply('✂️ Welkom bij Hairstylist Diri! Uw haar is onze passie.\n\nKies uw taal om te beginnen / Choose your language:', Markup.inlineKeyboard([
        [Markup.button.callback('🇳🇱 Nederlands', 'nederlands')],
        [Markup.button.callback('🇺🇸 English', 'english')],
        [Markup.button.callback('🇷🇺 Русский', 'russian')],
        [Markup.button.callback('🇫🇷 Français', 'french')]
    ]));
});

// Language Actions
bot.action('english', async (ctx) => {
    ctx.i18n.locale('en');
    try { await ctx.answerCbQuery(); } catch (e) { }
    showMainMenu(ctx, true);
});

bot.action('nederlands', async (ctx) => {
    ctx.i18n.locale('nl');
    try { await ctx.answerCbQuery(); } catch (e) { }
    showMainMenu(ctx, true);
});

bot.action('russian', async (ctx) => {
    ctx.i18n.locale('ru');
    try { await ctx.answerCbQuery(); } catch (e) { }
    showMainMenu(ctx, true);
});

bot.action('french', async (ctx) => {
    ctx.i18n.locale('fr');
    try { await ctx.answerCbQuery(); } catch (e) { }
    showMainMenu(ctx, true);
});

// --- /help — Intelligent role-based help ---
bot.command('help', async (ctx) => {
    if (isAdmin(ctx.from.id)) {
        // Show admin cheat sheet + customer help
        await ctx.reply(ctx.i18n.t('help.admin'), { parse_mode: 'HTML' });
        await ctx.reply(ctx.i18n.t('help.customer'), { parse_mode: 'HTML' });
    } else {
        await ctx.reply(ctx.i18n.t('help.customer'), { parse_mode: 'HTML' });
    }
});

// --- /stats — Quick admin statistics ---
bot.command('stats', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    const appointments = await getAppointments();
    const today = getLocalDate();
    const todayAppts = appointments.filter(a => a.date === today && a.status !== 'cancelled');
    const confirmed = todayAppts.filter(a => a.status === 'confirmed').length;
    const pending = todayAppts.filter(a => a.status === 'pending').length;
    const completed = todayAppts.filter(a => a.status === 'completed').length;
    const total = appointments.filter(a => a.status !== 'cancelled').length;

    const maleToday = todayAppts.filter(a => a.category === 'male').length;
    const femaleToday = todayAppts.filter(a => a.category === 'female').length;

    let text = `📈 <b>Statistieken — ${today}</b>\n\n`;
    text += `📅 <b>Vandaag:</b> ${todayAppts.length} afspraken\n`;
    text += `  🟡 In afwachting: ${pending}\n`;
    text += `  🟢 Bevestigd: ${confirmed}\n`;
    text += `  ✅ Voltooid: ${completed}\n\n`;
    text += `🧔 Heren: ${maleToday} | 👩 Dames: ${femaleToday}\n\n`;
    text += `📊 <b>Totaal alle afspraken:</b> ${total}`;

    await ctx.reply(text, { parse_mode: 'HTML' });
});

// Telegram: Services (with cancel button)
bot.hears(['✂️ Services', '✂️ Diensten', '✂️ Услуги', '/services', '/diensten'], (ctx) => {
    ctx.reply(ctx.i18n.t('services.prompt'), Markup.inlineKeyboard([
        [Markup.button.callback(ctx.i18n.t('services.male'), 'btn_male')],
        [Markup.button.callback(ctx.i18n.t('services.female'), 'btn_female')],
        cancelRow(ctx)
    ]));
});

bot.action('btn_male', (ctx) => {
    const text = ctx.i18n.t('services.male_menu_title') + '\n\n' + ctx.i18n.t('services.male_menu_items');
    ctx.editMessageText(text, {
        parse_mode: 'HTML', ...Markup.inlineKeyboard([
            [Markup.button.callback(ctx.i18n.t('services.back'), 'btn_back_services')],
            cancelRow(ctx)
        ])
    });
    ctx.answerCbQuery();
});

bot.action('btn_female', (ctx) => {
    const text = ctx.i18n.t('services.female_menu_title') + '\n\n' + ctx.i18n.t('services.female_menu_items');
    ctx.editMessageText(text, {
        parse_mode: 'HTML', ...Markup.inlineKeyboard([
            [Markup.button.callback(ctx.i18n.t('services.back'), 'btn_back_services')],
            cancelRow(ctx)
        ])
    });
    ctx.answerCbQuery();
});

bot.action('btn_back_services', (ctx) => {
    ctx.editMessageText(ctx.i18n.t('services.prompt'), Markup.inlineKeyboard([
        [Markup.button.callback(ctx.i18n.t('services.male'), 'btn_male')],
        [Markup.button.callback(ctx.i18n.t('services.female'), 'btn_female')],
        cancelRow(ctx)
    ]));
    ctx.answerCbQuery();
});

// Telegram: Info
bot.hears(['/info', '📍 Info', '📍 Инфо', '📍 Infos', 'info'], (ctx) => {
    ctx.reply(ctx.i18n.t('info'), {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
            [Markup.button.url(ctx.i18n.t('map_google'), 'https://www.google.com/maps/search/?api=1&query=Hairstylist+Diri+Alfons+Pieterslaan+78+8400+Oostende')],
            [Markup.button.url(ctx.i18n.t('map_apple'), 'http://maps.apple.com/?address=Alfons+Pieterslaan+78,8400,Oostende')],
            [Markup.button.url('📘 Facebook', 'https://www.facebook.com/profile.php?id=100063505424489')],
            [Markup.button.url('📸 Instagram', 'https://www.instagram.com/hairstylist_diris')]
        ])
    });
});

// Telegram: Book -> Enter Wizard
bot.hears(['/book', '📅 Book', '📅 Boeken', '📅 Записаться', '📅 Réserver'], (ctx) => {
    ctx.scene.enter('booking_wizard');
});

// --- Keyword Safety Net ---
// Maps keywords in ALL languages to safety_net locale keys
const SAFETY_NET_KEYWORDS = {
    payment: [
        'betaling', 'betalen', 'pay', 'payment', 'kaart', 'card', 'cash', 'contant', 'pin',
        'оплата', 'платить', 'карта', 'наличные',
        'paiement', 'payer', 'carte', 'espèces'
    ],
    late: [
        'te laat', 'vertraging', 'later', 'late', 'delay', 'running late',
        'опаздываю', 'опоздание', 'позже',
        'en retard', 'retard'
    ],
    cancel: [
        'annuleren', 'annulering', 'cancel', 'cancellation', 'afzeggen',
        'отменить', 'отмена', 'отказ',
        'annuler', 'annulation'
    ],
    location: [
        'locatie', 'adres', 'waar', 'location', 'address', 'where', 'route', 'parkeren', 'parking',
        'адрес', 'где', 'парковка', 'местоположение',
        'adresse', 'où', 'stationnement'
    ],
    wifi: [
        'wifi', 'wi-fi', 'internet', 'wachtwoord', 'password',
        'вай-фай', 'вайфай', 'интернет', 'пароль',
        'mot de passe'
    ],
    products: [
        'producten', 'product', 'merk', 'merken', 'shampoo', 'products', 'brands', 'brand',
        'продукция', 'продукты', 'бренд', 'шампунь',
        'produits', 'marque', 'marques', 'shampooing'
    ],
    kids: [
        'kinderen', 'kind', 'kids', 'kid', 'children', 'child', 'baby',
        'дети', 'ребёнок', 'ребенок', 'детский',
        'enfants', 'enfant', 'bébé'
    ]
};

// Telegram: Handle Text Messages — Keyword detection + smart fallback
bot.on('text', (ctx) => {
    const msg = ctx.message.text;

    // Skip known keyboard button texts
    const known = [
        '🇺🇸 English', '🇳🇱 Nederlands', '🇷🇺 Русский', '🇫🇷 Français',
        '✂️ Services', '✂️ Diensten', '✂️ Услуги',
        '📅 Book', '📅 Boeken', '📅 Записаться', '📅 Réserver',
        '📍 Info', '📍 Инфо', '📍 Infos'
    ];
    if (known.includes(msg)) return;

    // Keyword matching — check each topic
    const lower = msg.toLowerCase();
    for (const [topic, keywords] of Object.entries(SAFETY_NET_KEYWORDS)) {
        if (keywords.some(kw => lower.includes(kw))) {
            return ctx.reply(ctx.i18n.t(`safety_net.${topic}`), { parse_mode: 'HTML' });
        }
    }

    // No keyword match → show fallback with action buttons
    ctx.reply(ctx.i18n.t('fallback'), {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
            [Markup.button.callback(ctx.i18n.t('fallback_menu_btn'), 'fallback_main_menu')],
            [Markup.button.url(ctx.i18n.t('fallback_call_btn'), 'tel:+32489672161')]
        ])
    });
});

// Handle fallback menu button — return to main menu
bot.action('fallback_main_menu', async (ctx) => {
    await ctx.answerCbQuery();
    showMainMenu(ctx);
});

// Handle ICS Download
bot.action(/^download_ics_(.+)$/, async (ctx) => {
    const apptId = ctx.match[1];
    const appointments = await getAppointments();
    const appt = appointments.find(a => a.id === apptId);

    if (!appt) return ctx.answerCbQuery('Afspraak niet gevonden / Appointment not found');

    const svcName = (appt.services || [appt.details]).join(' + ');
    const title = `✂️ ${svcName} - Hairstylist Diri`;
    const description = `Afspraak bij Hairstylist Diri\nKapper: ${appt.barberName || '?'}\nDiensten: ${svcName}`;
    const location = 'Alfons Pieterslaan 78, 8400 Oostende';

    // Parse date/time
    const start = new Date(`${appt.date}T${appt.time}:00`);
    const end = new Date(start.getTime() + (appt.duration || 60) * 60000);

    const icsContent = generateICS(title, description, location, start, end);

    await ctx.answerCbQuery();
    await ctx.replyWithDocument({
        source: Buffer.from(icsContent),
        filename: 'appointment.ics'
    }, { caption: '📅 Voeg toe aan je agenda / Add to your calendar' });
});

// Handle non-text input (photos, stickers, voice, documents, etc.)
bot.on(['photo', 'sticker', 'voice', 'video', 'document', 'animation', 'video_note', 'audio', 'contact', 'location'], (ctx) => {
    ctx.reply(ctx.i18n.t('fallback'), {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
            [Markup.button.callback(ctx.i18n.t('fallback_menu_btn'), 'fallback_main_menu')],
            [Markup.button.url(ctx.i18n.t('fallback_call_btn'), 'tel:+32489672161')]
        ])
    });
});

// Launch Telegram Bot
if (TELEGRAM_ENABLED) {
    bot.launch().then(() => {
        console.log('Telegram bot started');
    }).catch(err => {
        console.error('Failed to launch Telegram bot:', err);
    });

    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
} else {
    console.log('Telegram bot disabled for local simulator mode');
}

// --- Express App (Existing WhatsApp & Web Logic) ---

// Webhook for verification
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});

const WA_SESSIONS = new Map();
const WA_USER_PREFS = new Map();
const WA_USER_PROFILE = new Map();
const WA_FUNNEL_FILE = 'wa_funnel_stats.json';
const WA_REVIEW_LINK = process.env.WA_REVIEW_LINK || 'https://g.page/r/YOUR_GOOGLE_REVIEW_LINK/review';

if (!fs.existsSync(WA_FUNNEL_FILE)) {
    fs.writeFileSync(WA_FUNNEL_FILE, JSON.stringify({ updatedAt: null, events: {} }, null, 2), 'utf8');
}
const WA_SERVICE_MENU = {
    male: [
        'Haarsnit zonder wassen',
        'Haarsnit met wassen',
        'Alleen tondeuse',
        'Baard trimmen',
        'Baard modelleren',
        'Haarsnit + Baard',
        'Haarsnit + Kleuren Baard',
        'Modder Masker',
        'Verwenpakket met oorkaars'
    ],
    female: [
        'Wassen, Knippen & Brushen',
        'Alleen Brushen',
        'Kleur + Snit + Brushen',
        'Kleur Pakket Kort',
        'Kleur Pakket Halflang',
        'Kleur Pakket Lang',
        'Modder Masker Dames',
        'Diepe Conditioner'
    ]
};

const WA_SALON_NAME = 'Kapsalon Diri Oostende';
const WA_VALUE_TEXT = '24/7 boeken, direct tijdslot, geen wachtrij aan de telefoon.';
const WA_INFO_TEXT = '📍 Alfons Pieterslaan 78, 8400 Oostende\n⏰ Di-Za: 09:00 - 18:00 | Zo-Ma: Gesloten\n💳 Kaart, cash en Apple Pay';
const WA_MAIN_MENU_TEXT = `Welkom bij ${WA_SALON_NAME} ✂️\nSnel boeken in 1 minuut.\n${WA_VALUE_TEXT}\n\nKies hieronder wat je wilt doen.`;
const WA_RESUME_ID = 'wa_resume';
const DEFAULT_BOOKING_BASE_URL = process.env.WA_BOOKING_BASE_URL
    || (process.env.TRANSPORT_MODE === 'sim'
        ? 'http://localhost:4010/go'
        : 'https://arrestofnet.asia/go');
const FLOW_MESSAGE_VERSION = process.env.WA_FLOW_MESSAGE_VERSION || '3';
const FLOW_GRAPH_VERSION = process.env.WA_FLOW_GRAPH_VERSION || 'v23.0';
const FLOW_RUNTIME_FILE = path.join(__dirname, 'flows', 'runtime-flow-ids.json');
const SOFIA_FLOW_NAME = process.env.WA_FLOW_NAME_SOFIA || 'sofia_native_booking';

// Sofia Data is now loaded via ./sofia-data.js

const WA_TOP_SERVICES_TEXT = 'Populair: Heren snit, Haarsnit + Baard, Wassen/Knippen/Brushen.';

const WA_TOP_SERVICE_IDS = {
    top1: 'Haarsnit zonder wassen',
    top2: 'Haarsnit + Baard',
    top3: 'Wassen, Knippen & Brushen'
};

const WA_PROFILE = {
    KAPSALON: 'kapsalon',
    SOFIA: 'sofia',
    GARAGE: 'garage',
    ADVOCATE: 'advocaat'
};

const WA_FIXED_PROFILE = (() => {
    const normalized = String(process.env.WA_FIXED_PROFILE || '').trim().toLowerCase();
    if (!normalized) return null;
    if ([WA_PROFILE.KAPSALON, 'kap', 'kappers', 'kappers-bot'].includes(normalized)) return WA_PROFILE.KAPSALON;
    if ([WA_PROFILE.SOFIA, 'beauty', 'beauty-demo', 'salon'].includes(normalized)) return WA_PROFILE.SOFIA;
    if ([WA_PROFILE.GARAGE, 'garage-demo', 'dealer'].includes(normalized)) return WA_PROFILE.GARAGE;
    if ([WA_PROFILE.ADVOCATE, 'advocaat-demo', 'advocaten-demo', 'law', 'law-demo', 'advocaat'].includes(normalized)) return WA_PROFILE.ADVOCATE;
    return null;
})();

const WA_PROFILE_LOCKED = Boolean(WA_FIXED_PROFILE);
const WA_DEFAULT_LOCALE = String(
    process.env.WA_FIXED_LOCALE || 'nl'
).trim().toLowerCase() || 'nl';
const WA_LOCALE_LOCKED = Boolean(process.env.WA_FIXED_LOCALE);

const GARAGE_INVALID_OPTION_TEXT = 'Kies aub één van de opties hierboven 🙂';

const GARAGE_INTENT_OPTIONS = [
    { id: 'garage_intent_rk_stock', title: '🏪 RK voorraad bekijken' },
    { id: 'garage_intent_rk_tradein', title: '🔁 RK inruil aanvraag' },
    { id: 'garage_intent_buy', title: '🚗 Auto kopen' },
    { id: 'garage_intent_tradein', title: '🔁 Inruilen' },
    { id: 'garage_intent_testdrive', title: '📅 Proefrit' },
    { id: 'garage_intent_finance', title: '💳 Financiering' }
];

const RK_MOTORS_STOCK_URL = 'https://rkmotors.be/winkel/';
const RK_MOTORS_CONTACT_URL = 'https://rkmotors.be/contact/';

const GARAGE_BUDGET_OPTIONS = [
    { id: 'garage_budget_low', title: 'Tot €10.000' },
    { id: 'garage_budget_mid', title: '€10.000 - €20.000' },
    { id: 'garage_budget_high', title: '€20.000+' }
];

const GARAGE_PRIORITY_OPTIONS = [
    { id: 'garage_priority_low_km', title: 'Lage km-stand' },
    { id: 'garage_priority_auto', title: 'Automaat' },
    { id: 'garage_priority_economy', title: 'Zuinig / hybride' },
    { id: 'garage_priority_family', title: 'Gezinsauto' },
    { id: 'garage_priority_comfort', title: 'Comfort / premium' }
];

const GARAGE_TRADEIN_OPTIONS = [
    { id: 'garage_tradein_yes', title: 'Ja, ik wil inruilen' },
    { id: 'garage_tradein_no', title: 'Nee, geen inruil' },
    { id: 'garage_tradein_later', title: 'Later beslissen' }
];

const GARAGE_NEXT_STEP_OPTIONS = [
    { id: 'garage_next_call', title: 'Belafspraak (10 min)' },
    { id: 'garage_next_video', title: 'Video rondleiding' },
    { id: 'garage_next_testdrive', title: 'Proefrit inplannen' }
];

const GARAGE_DAY_OPTIONS = [
    { id: 'garage_day_morgen', title: 'Morgen' },
    { id: 'garage_day_donderdag', title: 'Donderdag' },
    { id: 'garage_day_vrijdag', title: 'Vrijdag' }
];

const GARAGE_TIME_OPTIONS = [
    { id: 'garage_time_09_00', title: '09:00' },
    { id: 'garage_time_13_30', title: '13:30' },
    { id: 'garage_time_16_00', title: '16:00' }
];

const LAW_PRACTICE_AREAS = [
    { id: 'law_area_employment', title: 'Werk & ontslag', description: 'Loon, contract, ontslag' },
    { id: 'law_area_debt', title: 'Schulden', description: 'Incasso, regeling, beslag' },
    { id: 'law_area_contract', title: 'Contracten', description: 'Leveranciers, B2B, conflict' },
    { id: 'law_area_family', title: 'Familie', description: 'Scheiding, omgang, alimentatie' }
];

const LAW_URGENCY_OPTIONS = [
    { id: 'law_urgency_today', title: '🚨 Vandaag' },
    { id: 'law_urgency_week', title: '📅 Deze week' },
    { id: 'law_urgency_normal', title: '🙂 Niet dringend' }
];

const LAW_CONTACT_OPTIONS = [
    { id: 'law_pref_whatsapp', title: '💬 WhatsApp' },
    { id: 'law_pref_call', title: '📞 Bellen' },
    { id: 'law_pref_email', title: '✉️ E-mail' }
];

const LAW_EDIT_OPTIONS = [
    { id: 'law_edit_area', title: '⚖️ Zaaktype' },
    { id: 'law_edit_urgency', title: '🚨 Urgentie' },
    { id: 'law_edit_contact', title: '📞 Contact' },
    { id: 'law_edit_summary', title: '📝 Samenvatting' }
];

const GARAGE_SUPPORT_BUTTONS = [
    { id: 'garage_urgent', title: '🚨 Spoed' },
    { id: 'garage_call_manager', title: '📞 Bel manager' },
    { id: 'garage_back_menu', title: 'Terug naar menu' }
];

const getUpsellOption = (category, baseService) => {
    if (category === 'male') {
        return { service: 'Modder Masker', duration: SERVICE_DURATIONS['Modder Masker'] || 15, price: SERVICE_PRICES['Modder Masker'] || 20 };
    }
    const primary = baseService === 'Diepe Conditioner' ? 'Modder Masker Dames' : 'Diepe Conditioner';
    return { service: primary, duration: SERVICE_DURATIONS[primary] || 15, price: SERVICE_PRICES[primary] || 15 };
};

const getBookingBasePrice = (booking) => {
    const services = booking.selectedServices && booking.selectedServices.length ? booking.selectedServices : [booking.service];
    return services.reduce((sum, service) => sum + (SERVICE_PRICES[service] || 0), 0);
};

const buildBarberButtons = (category, locale = 'nl') => {
    const staffList = STAFF[category] || [];
    const anyLabel = locale === 'fr'
        ? '✨ Peu importe'
        : '✨ Maakt niet uit';
    return [
        { id: `barber_${staffList[0]?.id || 'any'}`, title: `👤 ${staffList[0]?.name || 'Any'}` },
        { id: `barber_${staffList[1]?.id || 'any'}`, title: `👤 ${staffList[1]?.name || 'Any'}` },
        { id: 'barber_any', title: anyLabel }
    ];
};

const parseDateInput = (text) => {
    const cleaned = (text || '').trim().toLowerCase();
    const today = new Date();
    if (cleaned === 'today') return getLocalDate(today);
    if (cleaned === 'tomorrow') {
        const t = new Date(today);
        t.setDate(today.getDate() + 1);
        return getLocalDate(t);
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(cleaned)) {
        const [dd, mm, yyyy] = cleaned.split('.');
        return `${yyyy}-${mm}-${dd}`;
    }
    return null;
};

const loadFlowRuntimeState = () => {
    try {
        if (!fs.existsSync(FLOW_RUNTIME_FILE)) {
            return { wabaId: '', flowIds: {} };
        }
        const parsed = JSON.parse(fs.readFileSync(FLOW_RUNTIME_FILE, 'utf8'));
        return {
            wabaId: String(parsed?.wabaId || ''),
            flowIds: parsed?.flowIds && typeof parsed.flowIds === 'object' ? parsed.flowIds : {}
        };
    } catch (error) {
        console.error('Failed to load flow runtime state:', error.message);
        return { wabaId: '', flowIds: {} };
    }
};

const FLOW_RUNTIME_STATE = loadFlowRuntimeState();

const saveFlowRuntimeState = () => {
    try {
        fs.mkdirSync(path.dirname(FLOW_RUNTIME_FILE), { recursive: true });
        fs.writeFileSync(FLOW_RUNTIME_FILE, JSON.stringify(FLOW_RUNTIME_STATE, null, 2), 'utf8');
    } catch (error) {
        console.error('Failed to save flow runtime state:', error.message);
    }
};

const getRuntimeFlowKey = (profile = WA_PROFILE.KAPSALON) => {
    if (profile === WA_PROFILE.SOFIA) return 'sofia';
    if (profile === WA_PROFILE.GARAGE) return 'garage';
    if (profile === WA_PROFILE.ADVOCATE) return 'advocaat';
    return 'kapsalon';
};

const getRuntimeFlowId = (profile = WA_PROFILE.KAPSALON) => String(FLOW_RUNTIME_STATE.flowIds?.[getRuntimeFlowKey(profile)] || '');

const setRuntimeFlowId = (profile, flowId) => {
    const normalized = String(flowId || '').trim();
    if (!normalized) return;
    const runtimeKey = getRuntimeFlowKey(profile);
    FLOW_RUNTIME_STATE.flowIds[runtimeKey] = normalized;
    if (profile === WA_PROFILE.SOFIA) process.env.WA_FLOW_ID_SOFIA = normalized;
    if (profile === WA_PROFILE.GARAGE) process.env.WA_FLOW_ID_GARAGE = normalized;
    if (profile === WA_PROFILE.ADVOCATE) process.env.WA_FLOW_ID_ADVOCATE = normalized;
    if (profile === WA_PROFILE.KAPSALON) process.env.WA_FLOW_ID_KAPPERS = normalized;
    saveFlowRuntimeState();
};

const rememberRuntimeWabaId = (wabaId) => {
    const normalized = String(wabaId || '').trim();
    if (!normalized || FLOW_RUNTIME_STATE.wabaId === normalized) return;
    FLOW_RUNTIME_STATE.wabaId = normalized;
    saveFlowRuntimeState();
};

const getRuntimeWabaId = () => String(process.env.WA_WABA_ID || FLOW_RUNTIME_STATE.wabaId || '').trim();

const flattenSofiaCatalog = () => Object.values(WA_SOFIA_CATALOG || {})
    .flat()
    .filter(Boolean);

const SOFIA_FLOW_TITLE_NL = {
    'Limpieza Facial Básica': 'Basis gezichtsreiniging',
    'Limpieza Facial Profunda con extracción': 'Diepe gezichtsreiniging',
    'Limpieza Facial Profunda + Peeling químico superficial': 'Reiniging + peeling',
    'Carboxiterapia no invasiva': 'Carboxytherapie',
    'Dermapen + Peeling enzimático': 'Dermapen enzymatisch',
    'Dermapen + Peeling químico superficial + activos': 'Dermapen chemisch',
    'Exosomas Simildiet + Dermapen': 'Exosomen + Dermapen',
    'DNA de salmón (PDRN) + Dermapen': 'PDRN + Dermapen',
    'Peeling químico superficial (mandélico + DMAE o ferúlico)': 'Chemische peeling',
    'BioAgePeel (INFINI)': 'BioAgePeel INFINI',
    'Sculpt + Radiofrecuencia corporal': 'Sculpt + radiofrequentie',
    'Mesovac + EMS (Mesoterapia virtual corporal)': 'Mesovac + EMS',
    'Presoterapia': 'Pressotherapie',
    'Presoterapia + envoltura + infrarrojos': 'Pressotherapie + IR',
    'Sculpt + Presoterapia': 'Sculpt + pressotherapie',
    'Criolipólisis': 'Cryolipolyse',
    'Depilacion laser de diodo': 'Laserontharing',
    'HIFU estetico (rostro y cuello)': 'HIFU esthetisch'
};

const buildSofiaFlowServiceOptions = () => {
    const seen = new Set();
    const preferred = flattenSofiaCatalog()
        .slice(0, 6)
        .filter((service) => {
            const key = String(service?.name || '').trim();
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
        });

    return preferred.map((service, index) => {
        const rawTitle = SOFIA_FLOW_TITLE_NL[service.name] || WA_SOFIA_LIST_TITLE_OVERRIDES[service.name] || service.name;
        const title = String(rawTitle).slice(0, 28);
        return {
            id: `svc_${index + 1}`,
            title,
            service
        };
    });
};

const SOFIA_FLOW_SERVICE_OPTIONS = buildSofiaFlowServiceOptions();
const SOFIA_FLOW_SERVICE_MAP = new Map(
    SOFIA_FLOW_SERVICE_OPTIONS.map((option) => [option.id, option.service])
);

const SOFIA_FLOW_DAY_OPTIONS = [
    { id: 'today', title: 'Vandaag' },
    { id: 'tomorrow', title: 'Morgen' },
    { id: 'day_after', title: 'Overmorgen' }
];

const SOFIA_FLOW_TIME_OPTIONS = [
    { id: '10_00', title: '10:00' },
    { id: '13_30', title: '13:30' },
    { id: '16_00', title: '16:00' }
];

const resolveRelativeDate = (offsetDays) => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return getLocalDate(date);
};

const resolveSofiaFlowDate = (dayId) => {
    if (dayId === 'today') return resolveRelativeDate(0);
    if (dayId === 'tomorrow') return resolveRelativeDate(1);
    if (dayId === 'day_after') return resolveRelativeDate(2);
    return '';
};

const resolveSofiaFlowTime = (timeId) => {
    const option = SOFIA_FLOW_TIME_OPTIONS.find((item) => item.id === timeId);
    return option ? option.title : '';
};

const buildSofiaNativeFlowJson = () => ({
    version: '7.3',
    screens: [
        {
            id: 'SOFIA_BOOKING_START',
            title: 'Reserveren',
            terminal: true,
            data: {},
            layout: {
                type: 'SingleColumnLayout',
                children: [
                    {
                        type: 'Form',
                        name: 'booking_form',
                        children: [
                            { type: 'TextHeading', text: 'Reserveren bij Sofia' },
                            { type: 'TextCaption', text: 'Kies behandeling, dag en uur op één scherm.' },
                            {
                                type: 'RadioButtonsGroup',
                                label: 'Behandeling',
                                required: true,
                                name: 'service',
                                'data-source': SOFIA_FLOW_SERVICE_OPTIONS.map((option) => ({
                                    id: option.id,
                                    title: option.title
                                }))
                            },
                            {
                                type: 'RadioButtonsGroup',
                                label: 'Dag',
                                required: true,
                                name: 'day',
                                'data-source': SOFIA_FLOW_DAY_OPTIONS
                            },
                            {
                                type: 'RadioButtonsGroup',
                                label: 'Uur',
                                required: true,
                                name: 'time',
                                'data-source': SOFIA_FLOW_TIME_OPTIONS
                            },
                            {
                                type: 'Footer',
                                label: 'Reservar',
                                'on-click-action': {
                                    name: 'complete',
                                    payload: {
                                        flow: 'sofia_booking',
                                        service: '${booking_form.service}',
                                        day: '${booking_form.day}',
                                        time: '${booking_form.time}'
                                    }
                                }
                            }
                        ]
                    }
                ]
            }
        }
    ]
});

const parseIncomingFlowReply = (incomingMessage) => {
    const reply = incomingMessage?.interactive?.nfm_reply;
    if (!reply) return null;
    let payload = reply.response_json;
    if (typeof payload === 'string') {
        try {
            payload = JSON.parse(payload);
        } catch (error) {
            payload = {};
        }
    }
    if (!payload || typeof payload !== 'object') payload = {};
    return {
        type: 'flow_reply',
        data: payload
    };
};

const parseIncomingWaText = (incomingMessage) => {
    const flowReply = parseIncomingFlowReply(incomingMessage);
    if (flowReply) return flowReply;
    if (incomingMessage?.interactive?.button_reply) return incomingMessage.interactive.button_reply.id || incomingMessage.interactive.button_reply.title || '';
    if (incomingMessage?.interactive?.list_reply) return incomingMessage.interactive.list_reply.id || incomingMessage.interactive.list_reply.title || '';
    if (incomingMessage?.button?.payload) return incomingMessage.button.payload;
    if (incomingMessage?.button?.text) return incomingMessage.button.text;
    if (incomingMessage?.text?.body) return incomingMessage.text.body;
    return '';
};

const buildServiceInfoText = (service, from = '') => {
    const locale = getWaLocale(from);
    const duration = SERVICE_DURATIONS[service] || DEFAULT_DURATION;
    const price = SERVICE_PRICES[service];
    const priceText = Number.isFinite(price) ? `€${price}` : (locale === 'fr' ? 'sur demande' : 'op aanvraag');
    if (locale === 'fr') {
        return [
            `Soin: ${service}`,
            `Durée: ${duration} min`,
            `Prix à partir de: ${priceText}`,
            '',
            'Souhaitez-vous réserver ce soin ?'
        ].join('\n');
    }
    return [
        `Behandeling: ${service}`,
        `Duur: ${duration} min`,
        `Prijs vanaf: ${priceText}`,
        '',
        'Wil je deze behandeling boeken?'
    ].join('\n');
};

const buildServiceRows = (category, prefix = 'svcinfo', locale = 'nl') => {
    const services = WA_SERVICE_MENU[category] || [];
    return services.slice(0, 10).map((service, idx) => ({
        id: `${prefix}_${category}_${idx + 1}`,
        title: service,
        description: `${SERVICE_DURATIONS[service] || DEFAULT_DURATION} min · €${SERVICE_PRICES[service] || (locale === 'fr' ? 'sur demande' : 'op aanvraag')}`
    }));
};

const buildServicesText = (category) => {
    const services = WA_SERVICE_MENU[category] || [];
    return services.map((service, idx) => {
        const duration = SERVICE_DURATIONS[service] || DEFAULT_DURATION;
        const price = SERVICE_PRICES[service];
        const priceText = Number.isFinite(price) ? `€${price}` : 'price on request';
        return `${idx + 1}. ${service} (${duration}m, ${priceText})`;
    }).join('\n');
};

const SOFIA_CATEGORY_META_LOCALIZED = {
    rostro: {
        nl: { title: '✨ Gelaat', desc: 'Gelaatsverzorging en peelings' },
        fr: { title: '✨ Visage', desc: 'Soins du visage et peelings' }
    },
    corporales: {
        nl: { title: '💪 Lichaam', desc: 'Remodellage en drainage' },
        fr: { title: '💪 Corps', desc: 'Remodelage et drainage' }
    },
    aparatologia: {
        nl: { title: '🔬 Apparatuur', desc: 'Laser en HIFU esthetiek' },
        fr: { title: '🔬 Technologie', desc: 'Laser et HIFU esthétique' }
    }
};

const SOFIA_NAME_NL = {
    'Limpieza Facial con hidratación profunda': 'Gezichtsreiniging met diepe hydratatie',
    'Limpieza Facial Básica': 'Basis gezichtsreiniging',
    'Limpieza Facial Profunda con extracción': 'Diepe gezichtsreiniging met extractie',
    'Limpieza Facial Profunda + Peeling químico superficial': 'Diepe reiniging + zachte chemische peeling',
    'Carboxiterapia no invasiva': 'Niet-invasieve carboxytherapie',
    'Dermapen + Peeling enzimático': 'Dermapen + enzymatische peeling',
    'Dermapen + Peeling químico superficial + activos': 'Dermapen + chemische peeling + actieve stoffen',
    'Exosomas Simildiet + Dermapen': 'Exosomen Simildiet + Dermapen',
    'DNA de salmón (PDRN) + Dermapen': 'Zalm-DNA (PDRN) + Dermapen',
    'Peeling químico superficial (mandélico + DMAE o ferúlico)': 'Oppervlakkige chemische peeling',
    'BioAgePeel (INFINI)': 'BioAgePeel (INFINI)',
    'Sculpt + Radiofrecuencia corporal': 'Sculpt + radiofrequentie lichaam',
    'Mesovac + EMS (Mesoterapia virtual corporal)': 'Mesovac + EMS (virtuele mesotherapie)',
    'Presoterapia': 'Pressotherapie',
    'Presoterapia + envoltura + infrarrojos': 'Pressotherapie + body wrap + infrarood',
    'Sculpt + Presoterapia': 'Sculpt + pressotherapie',
    'Criolipólisis': 'Cryolipolyse',
    'Depilacion laser de diodo': 'Diode laserontharing',
    'Depilación láser de diodo': 'Diode laserontharing',
    'HIFU estetico (rostro y cuello)': 'HIFU esthetisch (gelaat en hals)',
    'HIFU estético (rostro y cuello)': 'HIFU esthetisch (gelaat en hals)'
};

const SOFIA_NAME_FR = {
    'Limpieza Facial con hidratación profunda': 'Nettoyage visage avec hydratation profonde',
    'Limpieza Facial Básica': 'Nettoyage visage de base',
    'Limpieza Facial Profunda con extracción': 'Nettoyage profond avec extraction',
    'Limpieza Facial Profunda + Peeling químico superficial': 'Nettoyage profond + peeling doux',
    'Carboxiterapia no invasiva': 'Carboxythérapie non invasive',
    'Dermapen + Peeling enzimático': 'Dermapen + peeling enzymatique',
    'Dermapen + Peeling químico superficial + activos': 'Dermapen + peeling chimique + actifs',
    'Exosomas Simildiet + Dermapen': 'Exosomes Simildiet + Dermapen',
    'DNA de salmón (PDRN) + Dermapen': 'ADN de saumon (PDRN) + Dermapen',
    'Peeling químico superficial (mandélico + DMAE o ferúlico)': 'Peeling chimique superficiel',
    'BioAgePeel (INFINI)': 'BioAgePeel (INFINI)',
    'Sculpt + Radiofrecuencia corporal': 'Sculpt + radiofréquence corps',
    'Mesovac + EMS (Mesoterapia virtual corporal)': 'Mesovac + EMS (mésothérapie virtuelle)',
    'Presoterapia': 'Pressothérapie',
    'Presoterapia + envoltura + infrarrojos': 'Pressothérapie + enveloppement + infrarouge',
    'Sculpt + Presoterapia': 'Sculpt + pressothérapie',
    'Criolipólisis': 'Cryolipolyse',
    'Depilacion laser de diodo': 'Épilation laser diode',
    'Depilación láser de diodo': 'Épilation laser diode',
    'HIFU estetico (rostro y cuello)': 'HIFU esthétique (visage et cou)',
    'HIFU estético (rostro y cuello)': 'HIFU esthétique (visage et cou)'
};

const normalizeSofiaName = (text = '') => String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const SOFIA_NAME_NL_NORMALIZED = Object.fromEntries(
    Object.entries(SOFIA_NAME_NL).map(([key, value]) => [normalizeSofiaName(key), value])
);
const SOFIA_NAME_FR_NORMALIZED = Object.fromEntries(
    Object.entries(SOFIA_NAME_FR).map(([key, value]) => [normalizeSofiaName(key), value])
);

const getSofiaLocalizedName = (service, locale = 'nl') => {
    const source = String(service?.name || '').trim();
    const normalized = normalizeSofiaName(source);
    if (locale === 'fr') {
        return SOFIA_NAME_FR[source] || SOFIA_NAME_FR_NORMALIZED[normalized] || 'Soin esthétique';
    }
    return SOFIA_NAME_NL[source] || SOFIA_NAME_NL_NORMALIZED[normalized] || 'Schoonheidsbehandeling';
};

const getSofiaLocalizedDesc = (service, locale = 'nl') => {
    if (locale === 'fr') return 'Soin personnalisé selon votre peau et vos objectifs.';
    return 'Behandeling op maat volgens je huidtype en doel.';
};

const buildSofiaCategoriesRows = (locale = 'nl') => {
    return Object.entries(WA_SOFIA_CATEGORY_META).map(([key]) => {
        const local = (SOFIA_CATEGORY_META_LOCALIZED[key] && SOFIA_CATEGORY_META_LOCALIZED[key][locale === 'fr' ? 'fr' : 'nl']) || { title: key, desc: '' };
        return {
            id: `sofia_cat_${key}`,
            title: local.title,
            description: local.desc
        };
    });
};

const stripLeadingEmoji = (text = '') => String(text)
    .replace(/^[^A-Za-z0-9А-Яа-яЁёÁÉÍÓÚáéíóúÑñÜü]+/g, '')
    .trim();

const shortenWaListTitle = (text = '', max = 24) => {
    const cleaned = stripLeadingEmoji(text);
    if (cleaned.length <= max) return cleaned;
    const chunk = cleaned.slice(0, max);
    const lastSpace = chunk.lastIndexOf(' ');
    return (lastSpace > 10 ? chunk.slice(0, lastSpace) : chunk).trim();
};

const buildSofiaServiceRows = (categoryKey, locale = 'nl') => {
    const services = WA_SOFIA_CATALOG[categoryKey] || [];
    return services.slice(0, 10).map((service, idx) => ({
        id: `sofia_svc_v2_${categoryKey}_${idx + 1}`,
        title: shortenWaListTitle(getSofiaLocalizedName(service, locale)),
        description: `${service.price} € · ${service.duration} min`
    }));
};

const getSofiaServiceByMessageId = (id) => {
    const match = String(id || '').match(/^sofia_svc_v2_([^_]+)_(\d+)$/);
    if (!match) return null;
    const category = match[1];
    const index = Number.parseInt(match[2], 10) - 1;
    const service = (WA_SOFIA_CATALOG[category] || [])[index];
    if (!service) return null;
    return { category, service };
};

const isLegacySofiaServiceId = (id) => /^sofia_svc_(?!v2_)([^_]+)_(\d+)$/.test(String(id || ''));

const getSofiaServiceByText = (text) => {
    const value = String(text || '').trim().toLowerCase();
    if (!value) return null;
    for (const [category, items] of Object.entries(WA_SOFIA_CATALOG)) {
        const service = (items || []).find((s) => {
            const nl = getSofiaLocalizedName(s, 'nl').toLowerCase();
            const fr = getSofiaLocalizedName(s, 'fr').toLowerCase();
            const raw = String(s.name || '').toLowerCase();
            return value === nl || value === fr || value === raw;
        });
        if (service) return { category, service };
    }
    return null;
};

const buildSofiaServiceCard = (service, locale = 'nl') => [
    getSofiaLocalizedName(service, locale),
    '',
    `${locale === 'fr' ? 'Prix' : 'Prijs'}: ${service.price} €`,
    `${locale === 'fr' ? 'Durée' : 'Duur'}: ${service.duration} min`,
    '',
    `${locale === 'fr' ? 'Description' : 'Beschrijving'}:`,
    getSofiaLocalizedDesc(service, locale),
    '',
    locale === 'fr' ? 'Soin 100% personnalisé.' : 'Behandeling 100% gepersonaliseerd.'
].join('\n');

const buildMyBookingsText = async (from) => {
    const locale = getWaLocale(from);
    const allAppts = await getAppointments();
    const appointments = allAppts.filter(a => a.status !== 'cancelled' && (a.whatsappUserId === from || a.phone === from));
    if (!appointments.length) {
        if (locale === 'fr') return 'Vous n’avez pas encore de rendez-vous actifs.';
        return 'Je hebt geen actieve afspraken.';
    }
    if (locale === 'fr') {
        return [
            'Vos rendez-vous :',
            ...appointments.slice(0, 10).map((a, idx) => `${idx + 1}. ${a.date} ${a.time} - ${a.service || a.details || 'Soin'} (${a.barberName || a.barber || 'équipe'})`)
        ].join('\n');
    }
    return [
        'Jouw afspraken:',
        ...appointments.slice(0, 10).map((a, idx) => `${idx + 1}. ${a.date} ${a.time} - ${a.service || a.details || 'Behandeling'} (${a.barberName || a.barber || 'any'})`)
    ].join('\n');
};

const buildMyBookingsTextSofia = async (from) => {
    const locale = getWaLocale(from);
    const allAppts = await getAppointments();
    const appointments = allAppts.filter(a => a.status !== 'cancelled' && (a.whatsappUserId === from || a.phone === from));
    if (!appointments.length) return locale === 'fr' ? 'Vous n’avez pas encore de rendez-vous actifs.' : 'Je hebt nog geen actieve afspraken.';
    if (locale === 'fr') {
        return [
            'Vos rendez-vous actifs :',
            ...appointments.slice(0, 10).map((a, idx) => `${idx + 1}. ${a.date} ${a.time} · ${a.service || 'Soin'} · ${a.barberName || 'Sofia'}`)
        ].join('\n');
    }
    return [
        'Jouw actieve afspraken:',
        ...appointments.slice(0, 10).map((a, idx) => `${idx + 1}. ${a.date} ${a.time} · ${a.service || 'Behandeling'} · ${a.barberName || 'Sofia'}`)
    ].join('\n');
};

const waText = (body) => ({ type: 'text', body });
const waButtons = (body, buttons) => ({ type: 'buttons', body, buttons });
const waList = (body, sections, buttonText = 'Kies') => ({ type: 'list', body, sections, buttonText });
const waFlow = ({ body, cta, flowId, header = '', footer = '', screen = 'BOOKING_START', data = {}, mode = 'navigate', profile = '' }) => ({
    type: 'flow',
    body,
    cta,
    flowId,
    header,
    footer,
    screen,
    data,
    mode,
    profile,
});

const getConfiguredFlowIdForProfile = (profile = WA_PROFILE.KAPSALON) => {
    if (profile === WA_PROFILE.SOFIA) {
        if (shouldPreferWebCalendar(profile)) {
            return '';
        }
        return process.env.WA_FLOW_ID_SOFIA || process.env.WA_FLOW_ID_BEAUTY || getRuntimeFlowId(profile) || '';
    }
    if (profile === WA_PROFILE.GARAGE) {
        return process.env.WA_FLOW_ID_GARAGE || getRuntimeFlowId(profile) || '';
    }
    if (profile === WA_PROFILE.ADVOCATE) {
        return process.env.WA_FLOW_ID_ADVOCATE || process.env.WA_FLOW_ID_ADVOCATEN || getRuntimeFlowId(profile) || '';
    }
    return process.env.WA_FLOW_ID_KAPPERS || process.env.WA_FLOW_ID_KAPSALON || getRuntimeFlowId(profile) || '';
};

const buildFlowToken = (from = '', profile = WA_PROFILE.KAPSALON) => {
    const safeProfile = String(profile || 'flow').replace(/[^a-z0-9_-]/gi, '').slice(0, 12) || 'flow';
    const safeFrom = String(from || 'guest').replace(/[^a-z0-9_-]/gi, '').slice(-12) || 'guest';
    return `${safeProfile}_${safeFrom}_${Date.now()}`.slice(0, 64);
};

const getCalendarProfileIdForWaProfile = (profile) => {
    if (profile === WA_PROFILE.SOFIA) return 'beauty-demo';
    if (profile === WA_PROFILE.GARAGE) return 'garage-demo';
    if (profile === WA_PROFILE.ADVOCATE) return 'advocaten-demo';
    return 'kappers-bot';
};

const getCalendarAliasForWaProfile = (profile) => {
    if (profile === WA_PROFILE.SOFIA) return 'sofia';
    if (profile === WA_PROFILE.GARAGE) return 'garage';
    if (profile === WA_PROFILE.ADVOCATE) return 'advocaat';
    return 'kappers';
};

const buildCalendarUrl = ({ from = '', profile = WA_PROFILE.KAPSALON } = {}) => {
    const base = String(DEFAULT_BOOKING_BASE_URL).replace(/\/+$/, '');
    const alias = getCalendarAliasForWaProfile(profile);
    const path = from
        ? `${base}/${encodeURIComponent(alias)}/${encodeURIComponent(from)}`
        : `${base}/${encodeURIComponent(alias)}`;
    return path;
};

const shouldPreferWebCalendar = (profile = WA_PROFILE.KAPSALON) => {
    if (profile === WA_PROFILE.SOFIA) {
        return process.env.WA_SOFIA_CALENDAR_MODE !== 'flow';
    }

    return false;
};

const buildBookingFlowResponse = (from, profile = WA_PROFILE.KAPSALON, hasActiveSession = false) => {
    if (shouldPreferWebCalendar(profile)) {
        return null;
    }

    const flowId = getConfiguredFlowIdForProfile(profile);
    if (!flowId) {
        return null;
    }

    const locale = getWaLocale(from);
    const calendarProfileId = getCalendarProfileIdForWaProfile(profile);
    const cta = profile === WA_PROFILE.SOFIA
        ? (locale === 'fr' ? 'Ouvrir' : 'Openen')
        : profile === WA_PROFILE.GARAGE
            ? 'Plan proefrit'
            : profile === WA_PROFILE.ADVOCATE
                ? 'Open intake'
                : (locale === 'fr' ? 'Réserver' : 'Boek nu');
    const body = profile === WA_PROFILE.SOFIA
        ? (locale === 'fr'
            ? 'Choisissez le jour et l’heure directement dans WhatsApp.'
            : 'Kies dag en uur direct in WhatsApp.')
        : profile === WA_PROFILE.GARAGE
            ? 'Er opent een native WhatsApp flow om testdrive, call of showroombezoek te plannen.'
            : profile === WA_PROFILE.ADVOCATE
                ? 'Er opent een native WhatsApp flow voor intake, urgentie en consultplanning.'
                : (locale === 'fr'
                    ? 'Un flow WhatsApp natif va s’ouvrir pour choisir le jour et l’heure.'
                    : 'Er opent een native WhatsApp flow om dag en tijd te kiezen.');
    const footer = hasActiveSession
        ? (locale === 'fr'
            ? 'Votre progression actuelle dans le chat reste sauvegardée.'
            : 'Je huidige chatscenario blijft bewaard.')
        : '';

    return waFlow({
        body,
        cta,
        flowId,
        footer,
        screen: profile === WA_PROFILE.SOFIA ? 'SOFIA_BOOKING_START' : 'BOOKING_START',
        data: {
            customer_phone: String(from || ''),
            locale,
            profile: calendarProfileId,
            source: 'whatsapp-hub',
            resume: hasActiveSession ? '1' : '0',
        },
        profile,
    });
};

let sofiaFlowBootstrapPromise = null;

const fetchGraphJson = async (url, options = {}) => {
    const response = await fetch(url, options);
    const text = await response.text();
    let data = null;
    try {
        data = text ? JSON.parse(text) : {};
    } catch (error) {
        data = { raw: text };
    }
    if (!response.ok) {
        const message = data?.error?.message || `Graph API request failed (${response.status})`;
        const wrapped = new Error(message);
        wrapped.response = data;
        throw wrapped;
    }
    return data;
};

const findExistingFlowByName = async (wabaId, flowName) => {
    const data = await fetchGraphJson(`https://graph.facebook.com/${FLOW_GRAPH_VERSION}/${wabaId}/flows`, {
        headers: {
            Authorization: `Bearer ${CLOUD_API_ACCESS_TOKEN}`,
        },
    });
    return (data?.data || []).find((flow) => String(flow?.name || '') === String(flowName));
};

const createAndPublishSofiaFlow = async (wabaId) => {
    const existing = await findExistingFlowByName(wabaId, SOFIA_FLOW_NAME).catch(() => null);
    if (existing?.id && String(existing.status || '').toUpperCase() === 'PUBLISHED' && !(existing.validation_errors || []).length) {
        return String(existing.id);
    }
    let flowId = String(existing?.id || '');
    if (!flowId) {
        const createBody = new URLSearchParams({
            name: SOFIA_FLOW_NAME,
            categories: '["APPOINTMENT_BOOKING"]'
        });

        const created = await fetchGraphJson(`https://graph.facebook.com/${FLOW_GRAPH_VERSION}/${wabaId}/flows`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${CLOUD_API_ACCESS_TOKEN}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: createBody.toString(),
        });

        flowId = String(created?.id || '');
        if (!flowId) {
            throw new Error('Flow creation returned no id');
        }
    }

    const form = new FormData();
    form.set('name', 'flow.json');
    form.set('asset_type', 'FLOW_JSON');
    form.set('file', new Blob([JSON.stringify(buildSofiaNativeFlowJson(), null, 2)], { type: 'application/json' }), 'flow.json');

    const uploaded = await fetchGraphJson(`https://graph.facebook.com/${FLOW_GRAPH_VERSION}/${flowId}/assets`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${CLOUD_API_ACCESS_TOKEN}`,
        },
        body: form,
    });

    if (Array.isArray(uploaded?.validation_errors) && uploaded.validation_errors.length) {
        throw new Error(`Flow JSON validation failed: ${uploaded.validation_errors[0]?.message || 'unknown error'}`);
    }

    await fetchGraphJson(`https://graph.facebook.com/${FLOW_GRAPH_VERSION}/${flowId}/publish`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${CLOUD_API_ACCESS_TOKEN}`,
        },
    });

    return flowId;
};

const ensureSofiaFlowId = async () => {
    const existing = getConfiguredFlowIdForProfile(WA_PROFILE.SOFIA);
    if (existing) {
        return existing;
    }

    const wabaId = getRuntimeWabaId();
    if (!wabaId || !CLOUD_API_ACCESS_TOKEN) {
        return '';
    }

    if (!sofiaFlowBootstrapPromise) {
        sofiaFlowBootstrapPromise = createAndPublishSofiaFlow(wabaId)
            .then((flowId) => {
                setRuntimeFlowId(WA_PROFILE.SOFIA, flowId);
                return flowId;
            })
            .catch((error) => {
                console.error('Failed to bootstrap Sofia native flow:', error.response || error.message);
                return '';
            })
            .finally(() => {
                sofiaFlowBootstrapPromise = null;
            });
    }

    return sofiaFlowBootstrapPromise;
};

const buildCalendarCtaResponse = async (from, profile = WA_PROFILE.KAPSALON, hasActiveSession = false) => {
    if (profile === WA_PROFILE.SOFIA && !shouldPreferWebCalendar(profile) && !getConfiguredFlowIdForProfile(profile)) {
        await ensureSofiaFlowId();
    }

    const flowResponse = buildBookingFlowResponse(from, profile, hasActiveSession);
    if (flowResponse) {
        return flowResponse;
    }

    const locale = getWaLocale(from);
    const body = profile === WA_PROFILE.SOFIA
        ? (locale === 'fr'
            ? 'Ouvrez le calendrier ici :'
            : 'Open de kalender hier:')
        : profile === WA_PROFILE.ADVOCATE
            ? 'Open de consult planner en kies direct een intake- of consultslot.'
            : profile === WA_PROFILE.GARAGE
                ? 'Open de visual planner en kies meteen een testdrive, call of showroom-slot.'
                : (locale === 'fr'
                    ? 'Ouvrez le calendrier visuel et choisissez jour et heure sans saisie manuelle.'
                    : 'Open de visuele kalender en kies dag en tijd zonder handmatig typen.');
    const note = profile === WA_PROFILE.SOFIA
        ? ''
        : hasActiveSession
        ? (locale === 'fr'
            ? '\n\nVotre flow WhatsApp en cours reste sauvegardé.'
            : '\n\nJe huidige WhatsApp-flow blijft bewaard.')
        : '';
    const url = buildCalendarUrl({ from, profile });
    return waText(profile === WA_PROFILE.SOFIA ? `${body}\n${url}` : `${body}${note}\n\n${locale === 'fr' ? 'Ouvrir calendrier:' : 'Open kalender:'}\n${url}`);
};

const buildGarageIntentPrompt = (showInvalid = false) => {
    const intro = 'Goeiemorgen 👋\nIk ben je auto-assistent.\nWaarmee kan ik je helpen?';
    const body = showInvalid ? `${GARAGE_INVALID_OPTION_TEXT}\n\n${intro}` : intro;
    return waList(body, [{
        title: 'Auto dealer demo',
        rows: [
            ...GARAGE_INTENT_OPTIONS.map((option) => ({
                id: option.id,
                title: option.title,
                description: ' '
            })),
            { id: 'wa_calendar', title: '📅 Open calendar', description: 'Visual test-drive planner' }
        ]
    }], 'Kies');
};

const buildGarageBudgetPrompt = (showInvalid = false, intro = '') => {
    const question = 'Wat is je budget?';
    const withIntro = intro ? `${intro}\n\n${question}` : question;
    const body = showInvalid ? `${GARAGE_INVALID_OPTION_TEXT}\n\n${withIntro}` : withIntro;
    return waButtons(body, GARAGE_BUDGET_OPTIONS.map((option) => ({ id: option.id, title: option.title })));
};

const buildGaragePriorityPrompt = (showInvalid = false) => {
    const question = 'Wat is voor jou het belangrijkste?';
    const body = showInvalid ? `${GARAGE_INVALID_OPTION_TEXT}\n\n${question}` : question;
    return waList(body, [{
        title: 'Prioriteit',
        rows: GARAGE_PRIORITY_OPTIONS.map((option) => ({
            id: option.id,
            title: option.title,
            description: ' '
        }))
    }], 'Kies');
};

const buildGarageTradeInPrompt = (showInvalid = false) => {
    const question = 'Heb je een auto om in te ruilen?';
    const body = showInvalid ? `${GARAGE_INVALID_OPTION_TEXT}\n\n${question}` : question;
    return waButtons(body, GARAGE_TRADEIN_OPTIONS.map((option) => ({ id: option.id, title: option.title })));
};

const buildGarageNextStepPrompt = (showInvalid = false) => {
    const question = 'Wat is de beste volgende stap voor jou?';
    const body = showInvalid ? `${GARAGE_INVALID_OPTION_TEXT}\n\n${question}` : question;
    return waButtons(body, GARAGE_NEXT_STEP_OPTIONS.map((option) => ({ id: option.id, title: option.title })));
};

const buildGarageDayPrompt = (showInvalid = false) => {
    const question = 'Welke dag past je?';
    const body = showInvalid ? `${GARAGE_INVALID_OPTION_TEXT}\n\n${question}` : question;
    return waButtons(body, GARAGE_DAY_OPTIONS.map((option) => ({ id: option.id, title: option.title })));
};

const buildGarageTimePrompt = (showInvalid = false) => {
    const question = 'Kies een tijdstip.';
    const body = showInvalid ? `${GARAGE_INVALID_OPTION_TEXT}\n\n${question}` : question;
    return waButtons(body, GARAGE_TIME_OPTIONS.map((option) => ({ id: option.id, title: option.title })));
};

const buildGarageInputPrompt = (question) =>
    waButtons(question, GARAGE_SUPPORT_BUTTONS.map((option) => ({ id: option.id, title: option.title })));

const buildGarageReviewPrompt = (garage = {}, showInvalid = false) => {
    const rkSourceLabel = garage.rkSource === 'stock'
        ? 'RK voorraad'
        : (garage.rkSource === 'tradein' ? 'RK inruil' : '-');
    const summary = [
        'Controleer je aanvraag:',
        `• Bron: ${rkSourceLabel}`,
        `• Doel: ${garage.intent || '-'}`,
        `• Budget: ${garage.budget || '-'}`,
        `• Zoekopdracht: ${garage.carNeed || '-'}`,
        `• Prioriteit: ${garage.priority || '-'}`,
        `• Inruil: ${garage.tradeIn || '-'}`,
        `• Volgende stap: ${garage.nextStep || '-'}`,
        `• Dag/Tijd: ${(garage.day || '-') + ' om ' + (garage.time || '-')}`,
        `• Contact: ${garage.namePhone || '-'}`
    ].join('\n');
    const body = showInvalid ? `${GARAGE_INVALID_OPTION_TEXT}\n\n${summary}` : summary;
    return waList(body, [{
        title: 'Bevestigen of wijzigen',
        rows: [
            { id: 'garage_review_confirm', title: '✅ Bevestigen', description: 'Lead opslaan' },
            { id: 'garage_edit_intent', title: '✏️ Doel', description: 'Wijzig doel' },
            { id: 'garage_edit_budget', title: '✏️ Budget', description: 'Wijzig budget' },
            { id: 'garage_edit_car_need', title: '✏️ Auto', description: 'Wijzig zoekopdracht' },
            { id: 'garage_edit_priority', title: '✏️ Prioriteit', description: 'Wijzig prioriteit' },
            { id: 'garage_edit_tradein', title: '✏️ Inruil', description: 'Wijzig inruil' },
            { id: 'garage_edit_next', title: '✏️ Volgende stap', description: 'Wijzig afspraaktype' },
            { id: 'garage_edit_schedule', title: '✏️ Dag/Tijd', description: 'Wijzig planning' },
            { id: 'garage_edit_contact', title: '✏️ Contact', description: 'Wijzig contact' },
            { id: 'garage_back_menu', title: '↩️ Terug naar menu', description: 'Naar hub' }
        ]
    }], 'Controleer');
};

const pickGarageOption = (incoming, options, aliases = {}) => {
    const normalized = String(incoming || '').trim().toLowerCase();
    if (!normalized) return null;
    const byId = options.find((option) => option.id === normalized);
    if (byId) return byId.title;
    const byTitle = options.find((option) => option.title.toLowerCase() === normalized);
    if (byTitle) return byTitle.title;
    if (aliases[normalized]) return aliases[normalized];
    return null;
};

const getGarageLeadSnapshot = (session, from = '') => {
    const current = session?.garage || {};
    const saved = session?.garageLead || {};
    return {
        rkSource: current.rkSource || saved.rkSource || '',
        intent: current.intent || saved.intent || '',
        budget: current.budget || saved.budget || '',
        carNeed: current.carNeed || saved.carNeed || '',
        priority: current.priority || saved.priority || '',
        tradeIn: current.tradeIn || saved.tradeIn || '',
        nextStep: current.nextStep || saved.nextStep || '',
        day: current.day || saved.day || '',
        time: current.time || saved.time || '',
        namePhone: current.namePhone || saved.namePhone || from || ''
    };
};

const buildGaragePromptForStep = (step, session, showInvalid = false) => {
    if (step === 'garage_intent') return buildGarageIntentPrompt(showInvalid);
    if (step === 'garage_budget') return buildGarageBudgetPrompt(showInvalid);
    if (step === 'garage_car_need') return buildGarageInputPrompt('Welke auto zoek je? (merk/model of type)');
    if (step === 'garage_priority') return buildGaragePriorityPrompt(showInvalid);
    if (step === 'garage_tradein') return buildGarageTradeInPrompt(showInvalid);
    if (step === 'garage_next_step') return buildGarageNextStepPrompt(showInvalid);
    if (step === 'garage_day') return buildGarageDayPrompt(showInvalid);
    if (step === 'garage_time') return buildGarageTimePrompt(showInvalid);
    if (step === 'garage_contact') return buildGarageInputPrompt('Bevestig je naam en telefoonnummer aub.');
    if (step === 'garage_review') return buildGarageReviewPrompt(session?.garage || session?.garageLead || {}, showInvalid);
    if (step === 'garage_done') {
        const lead = session?.garageLead || {};
        return waButtons(
            `✅ Afspraak bevestigd\n${lead.day || '-'} om ${lead.time || '-'}\nWe nemen contact op via ${lead.nextStep || 'de gekozen optie'}.\nTot snel!`,
            [{ id: 'garage_back_menu', title: 'Terug naar menu' }]
        );
    }
    return buildGarageIntentPrompt(showInvalid);
};

const getLawAreaLabel = (areaId = '') =>
    LAW_PRACTICE_AREAS.find((item) => item.id === areaId)?.title || areaId || '-';

const buildLawMainMenu = () =>
    waList(
        'Welkom bij Advocaat demo.\nIk kan een intakeflow tonen voor lead capture en consultaanvragen.',
        [{
            title: 'Advocaat demo',
            rows: [
                { id: 'law_intake', title: '⚖️ Intake starten', description: 'Start de juridische intake' },
                { id: 'law_practice', title: '📂 Rechtsgebieden', description: 'Welke zaken je kunt tonen' },
                { id: 'law_price', title: '💶 Werkwijze', description: 'Hoe pricing en intake werkt' },
                { id: 'law_contact', title: '📞 Contact', description: 'Lead capture en callback' },
                { id: 'wa_calendar', title: '📅 Open calendar', description: 'Visual consult picker' }
            ]
        }],
        'Open'
    );

const buildLawPracticeAreasResponse = () =>
    waList(
        'Onze demo rechtsgebieden:',
        [{
            title: 'Zaaktypes',
            rows: LAW_PRACTICE_AREAS
        }],
        'Zaaktypes'
    );

const buildLawPriceText = () => [
    'Demo werkwijze:',
    '• gratis eerste intake',
    '• vaste prijs voor document review',
    '• consult op afspraak',
    '• daarna voorstel op maat'
].join('\n');

const buildLawContactText = () => [
    'Contact demo:',
    '• antwoord via WhatsApp of telefoon',
    '• intake op werkdagen',
    '• geschikt voor spoed en lead capture'
].join('\n');

const buildLawPromptForStep = (session, showInvalid = false) => {
    const data = session?.law || {};
    const invalidLine = showInvalid ? 'Kies een optie uit het menu hierboven.\n\n' : '';

    if (session?.step === 'law_practice_area') {
        return waList(
            `${invalidLine}Welk type zaak wil je bespreken?`,
            [{
                title: 'Zaaktype',
                rows: LAW_PRACTICE_AREAS
            }],
            'Zaaktype'
        );
    }

    if (session?.step === 'law_urgency') {
        return waButtons(
            `${invalidLine}Gekozen: ${getLawAreaLabel(data.practiceArea)}.\nHoe dringend is het?`,
            LAW_URGENCY_OPTIONS
        );
    }

    if (session?.step === 'law_contact_pref') {
        return waButtons(
            `${invalidLine}Hoe wil je dat een jurist contact opneemt?`,
            LAW_CONTACT_OPTIONS
        );
    }

    if (session?.step === 'law_name_phone') {
        return waButtons(
            'Stuur je naam en telefoonnummer in één bericht.',
            [
                { id: 'law_contact', title: '📞 Contact' },
                { id: 'wa_cancel', title: '🏠 Menu' }
            ]
        );
    }

    if (session?.step === 'law_case_summary') {
        return waButtons(
            'Beschrijf je situatie kort in één bericht. Wat is er gebeurd?',
            [
                { id: 'law_contact', title: '📞 Contact' },
                { id: 'wa_cancel', title: '🏠 Menu' }
            ]
        );
    }

    if (session?.step === 'law_confirm_edit') {
        return waList(
            'Wat wil je aanpassen?',
            [{
                title: 'Wijzigen',
                rows: LAW_EDIT_OPTIONS
            }],
            'Wijzigen'
        );
    }

    if (session?.step === 'law_confirm') {
        return waButtons(
            [
                'Controleer je intake:',
                `• Rechtsgebied: ${getLawAreaLabel(data.practiceArea)}`,
                `• Urgentie: ${data.urgency || '-'}`,
                `• Voorkeur: ${data.contactPreference || '-'}`,
                `• Contact: ${data.namePhone || '-'}`,
                `• Samenvatting: ${data.caseSummary || '-'}`
            ].join('\n'),
            [
                { id: 'law_confirm_yes', title: '✅ Versturen' },
                { id: 'law_confirm_edit', title: '✏️ Aanpassen' },
                { id: 'wa_cancel', title: '🏠 Menu' }
            ]
        );
    }

    if (session?.step === 'law_done') {
        return waButtons(
            '✅ Intake opgeslagen.\nIn deze demo zou nu een jurist-notificatie, CRM lead en afspraakflow starten.',
            [
                { id: 'law_intake', title: '⚖️ Nieuwe intake' },
                { id: 'law_contact', title: '📞 Contact' },
                { id: 'law_price', title: '💶 Werkwijze' }
            ]
        );
    }

    return buildLawMainMenu();
};

const buildResumeButtonsForProfile = (from, profile = WA_PROFILE.KAPSALON) => {
    const locale = getWaLocale(from);

    if (profile === WA_PROFILE.SOFIA) {
        return [
            { id: WA_RESUME_ID, title: locale === 'fr' ? '↩️ Continuer' : '↩️ Verder' },
            { id: 'wa_cancel', title: '🏠 Menu' }
        ];
    }

    return [
        { id: WA_RESUME_ID, title: locale === 'fr' ? '↩️ Continuer' : '↩️ Verder' },
        { id: 'wa_cancel', title: '🏠 Menu' }
    ];
};

const buildResumeDetourResponse = (from, body, profile = WA_PROFILE.KAPSALON) => {
    const locale = getWaLocale(from);
    const notice = profile === WA_PROFILE.SOFIA
        ? (locale === 'fr'
            ? 'Votre réservation en cours est conservée. Vous pouvez continuer à la même étape.'
            : 'Je lopende boeking blijft bewaard. Je kunt meteen verdergaan.')
        : (locale === 'fr'
            ? 'Votre réservation en cours est conservée. Vous pouvez continuer.'
            : 'Je lopende boeking blijft bewaard. Je kunt meteen verdergaan.');

    return waButtons(`${body}\n\n${notice}`, buildResumeButtonsForProfile(from, profile));
};

const buildKapsalonServicesSummaryText = (from) => {
    const locale = getWaLocale(from);

    if (locale === 'fr') {
        return [
            'Catégories de services :',
            '• Soins populaires',
            '• Soins hommes',
            '• Soins femmes',
            '',
            'Votre réservation en cours reste sauvegardée.'
        ].join('\n');
    }

    return [
        'Diensten-categorieën:',
        '• Populaire behandelingen',
        '• Heren',
        '• Dames',
        '',
        'Je huidige boeking blijft bewaard.'
    ].join('\n');
};

const buildSofiaServicesSummaryText = (locale = 'nl') => {
    const rows = buildSofiaCategoriesRows(locale).map((row) => `• ${row.title} — ${row.description}`);
    return [
        locale === 'fr' ? 'Services et tarifs :' : 'Behandelingen en prijzen:',
        ...rows,
        '',
        locale === 'fr'
            ? 'Votre réservation en cours reste sauvegardée.'
            : 'Je huidige boeking blijft bewaard.'
    ].join('\n');
};

const buildSofiaPromptForStep = async (from, session) => {
    const waLocale = getWaLocale(from);
    const S = (nlText, frText) => (waLocale === 'fr' ? frText : nlText);
    const booking = session?.booking || {};
    const step = session?.step || 'sofia_category';

    if (step === 'sofia_category') {
        return waList(
            S('Om te reserveren, kies eerst een categorie:', 'Pour réserver, choisissez d’abord une catégorie :'),
            [{ title: S('Categorieën', 'Catégories'), rows: buildSofiaCategoriesRows(waLocale) }],
            S('Categorieën', 'Catégories')
        );
    }

    if (step === 'sofia_service') {
        if (!booking.categoryKey) {
            return waList(
                S('Kies eerst een categorie:', 'Choisissez d’abord une catégorie :'),
                [{ title: S('Categorieën', 'Catégories'), rows: buildSofiaCategoriesRows(waLocale) }],
                S('Categorieën', 'Catégories')
            );
        }

        const rows = buildSofiaServiceRows(booking.categoryKey, waLocale);
        const meta = SOFIA_CATEGORY_META_LOCALIZED[booking.categoryKey];
        if (!rows.length || !meta || !meta.nl || !meta.fr) {
            return waList(
                S('Kies eerst een categorie:', 'Choisissez d’abord une catégorie :'),
                [{ title: S('Categorieën', 'Catégories'), rows: buildSofiaCategoriesRows(waLocale) }],
                S('Categorieën', 'Catégories')
            );
        }

        const title = waLocale === 'fr' ? meta.fr.title : meta.nl.title;

        return waList(
            `${title}\n${S('Kies een behandeling:', 'Choisissez un soin :')}`,
            [{ title, rows }],
            S('Diensten', 'Services')
        );
    }

    if (step === 'date') {
        return waButtons(S('Kies een datum:', 'Choisissez une date :'), [
            { id: 'date_today', title: S('📅 Vandaag', '📅 Aujourd’hui') },
            { id: 'date_tomorrow', title: S('📅 Morgen', '📅 Demain') },
            { id: 'date_manual', title: S('✍️ Datum typen', '✍️ Saisir une date') }
        ]);
    }

    if (step === 'time') {
        if (!booking.date) {
            return waButtons(S('Kies eerst een datum:', 'Choisissez d’abord une date :'), [
                { id: 'date_today', title: S('📅 Vandaag', '📅 Aujourd’hui') },
                { id: 'date_tomorrow', title: S('📅 Morgen', '📅 Demain') },
                { id: 'date_manual', title: S('✍️ Datum typen', '✍️ Saisir une date') }
            ]);
        }

        const slots = await getAvailableSlots(booking.date, booking.category || 'female', booking.duration, booking.barber || 'sofia');
        if (!slots.length) {
            return waButtons(S('De beschikbare uren zijn gewijzigd. Kies een andere datum:', 'Les créneaux ont changé. Choisissez une autre date :'), [
                { id: 'date_today', title: S('📅 Vandaag', '📅 Aujourd’hui') },
                { id: 'date_tomorrow', title: S('📅 Morgen', '📅 Demain') },
                { id: 'date_manual', title: S('✍️ Datum typen', '✍️ Saisir une date') }
            ]);
        }

        const rows = slots.map((slot) => ({
            id: `time_${slot}`,
            title: slot,
            description: `${booking.duration} min`
        }));
        const sections = [];
        for (let i = 0; i < rows.length; i += 10) {
            sections.push({
                title: i === 0 ? S('Uren', 'Créneaux') : `${S('Uren', 'Créneaux')} ${Math.floor(i / 10) + 1}`,
                rows: rows.slice(i, i + 10)
            });
        }

        return waList(
            S(`Beschikbare uren op ${booking.date}:`, `Créneaux disponibles le ${booking.date} :`),
            sections,
            S('Kies', 'Choisir')
        );
    }

    if (step === 'confirm') {
        if (!booking.date || !booking.time) {
            return buildSofiaPromptForStep(from, { ...session, step: booking.date ? 'time' : 'date' });
        }

        return waButtons([
            S('Bevestig je afspraak:', 'Confirmez votre rendez-vous :'),
            `${S('Behandeling', 'Soin')}: ${booking.service || '-'}`,
            `${S('Specialiste', 'Spécialiste')}: ${booking.barberName || 'Sofia'}`,
            `${S('Datum', 'Date')}: ${booking.date}`,
            `${S('Uur', 'Heure')}: ${booking.time}`,
            `${S('Prijs', 'Prix')}: ${booking.price || '-'} €`
        ].join('\n'), [
            { id: 'confirm_yes', title: S('✅ Bevestigen', '✅ Confirmer') },
            { id: 'confirm_no', title: S('❌ Annuleren', '❌ Annuler') },
            { id: 'wa_cancel', title: '🏠 Menu' }
        ]);
    }

    return buildWaMainMenu(from);
};

const buildKapsalonPromptForStep = async (from, session) => {
    const waLocale = getWaLocale(from);
    const L = (nlText, frText) => (waLocale === 'fr' ? frText : nlText);
    const booking = session?.booking || {};
    const step = session?.step || 'category';

    if (step === 'category') {
        return waButtons(L('Klaar om te boeken. Kies een categorie:', 'Prêt à réserver. Choisissez une catégorie :'), [
            { id: 'cat_male', title: L('👨 Heren', '👨 Hommes') },
            { id: 'cat_female', title: L('👩 Dames', '👩 Femmes') },
            { id: 'wa_cancel', title: L('❌ Stop', '❌ Stop') }
        ]);
    }

    if (step === 'service') {
        if (!booking.category) {
            return buildKapsalonPromptForStep(from, { ...session, step: 'category' });
        }

        const services = WA_SERVICE_MENU[booking.category] || [];
        return waList(
            booking.category === 'male'
                ? L('Kies een herenbehandeling:', 'Choisissez un soin homme :')
                : L('Kies een damesbehandeling:', 'Choisissez un soin femme :'),
            [{
                title: booking.category === 'male' ? L('Herenbehandelingen', 'Soins hommes') : L('Damesbehandelingen', 'Soins femmes'),
                rows: services.slice(0, 10).map((service, idx) => ({
                    id: `svc_${idx + 1}`,
                    title: service,
                    description: `${SERVICE_DURATIONS[service] || DEFAULT_DURATION} min`
                }))
            }],
            L('Behandelingen', 'Soins')
        );
    }

    if (step === 'upsell') {
        if (!booking.category || !booking.service) {
            return buildKapsalonPromptForStep(from, { ...session, step: booking.category ? 'service' : 'category' });
        }

        const upsell = booking.upsellOption || getUpsellOption(booking.category, booking.service);
        booking.upsellOption = upsell;

        return waButtons(
            L('Top keuze: ', 'Excellent choix : ') + booking.service + ' (' + (booking.duration || DEFAULT_DURATION) + ' min).\n'
            + L('Wil je ook ', 'Souhaitez-vous aussi ')
            + upsell.service
            + ' (+'
            + upsell.duration
            + ' min, '
            + L('vanaf', 'à partir de')
            + ' €'
            + upsell.price
            + ')?',
            [
                { id: 'upsell_yes', title: L('✅ Ja, toevoegen', '✅ Oui, ajouter') },
                { id: 'upsell_no', title: L('Nee bedankt', 'Non merci') },
                { id: 'wa_cancel', title: L('🏠 Menu', '🏠 Menu') }
            ]
        );
    }

    if (step === 'barber') {
        if (!booking.category || !booking.service) {
            return buildKapsalonPromptForStep(from, { ...session, step: booking.category ? 'service' : 'category' });
        }

        return waButtons(
            L('Gekozen: ', 'Choisi : ') + booking.service + ' (' + (booking.duration || DEFAULT_DURATION) + ' min). '
            + L('Kies een kapper:', 'Choisissez un coiffeur :'),
            buildBarberButtons(booking.category, waLocale)
        );
    }

    if (step === 'date') {
        return waButtons(L('Kies een datum:', 'Choisissez une date :'), [
            { id: 'date_today', title: L('📅 Vandaag', '📅 Aujourd’hui') },
            { id: 'date_tomorrow', title: L('📅 Morgen', '📅 Demain') },
            { id: 'date_manual', title: L('✍️ Zelf typen', '✍️ Saisir date') }
        ]);
    }

    if (step === 'time') {
        if (!booking.date) {
            return buildKapsalonPromptForStep(from, { ...session, step: 'date' });
        }

        const slots = await getAvailableSlots(booking.date, booking.category, booking.duration, booking.barber || 'any');
        if (!slots.length) {
            return waButtons(L('De beschikbaarheid is gewijzigd. Kies opnieuw een datum:', 'Les disponibilités ont changé. Choisissez une autre date :'), [
                { id: 'date_today', title: L('📅 Vandaag', '📅 Aujourd’hui') },
                { id: 'date_tomorrow', title: L('📅 Morgen', '📅 Demain') },
                { id: 'date_manual', title: L('✍️ Zelf typen', '✍️ Saisir date') }
            ]);
        }

        return waList(
            L(`Beschikbare uren op ${booking.date}:`, `Créneaux disponibles le ${booking.date} :`),
            [{
                title: L('Uren', 'Créneaux'),
                rows: slots.slice(0, 10).map((slot) => ({
                    id: `time_${slot}`,
                    title: slot,
                    description: L(`Duur ${booking.duration} min`, `Durée ${booking.duration} min`)
                }))
            }],
            L('Uren', 'Créneaux')
        );
    }

    if (step === 'confirm') {
        if (!booking.time || !booking.date) {
            return buildKapsalonPromptForStep(from, { ...session, step: booking.date ? 'time' : 'date' });
        }

        return waButtons([
            L('Bevestig je afspraak:', 'Confirmez votre rendez-vous :'),
            `${L('Behandeling', 'Soin')}: ${booking.service || '-'}`,
            `${L('Kapper', 'Coiffeur')}: ${booking.barberName || '-'}`,
            `${L('Datum', 'Date')}: ${booking.date}`,
            `${L('Tijd', 'Heure')}: ${booking.time}`,
            `${L('Prijs vanaf', 'Prix à partir de')}: €${getBookingBasePrice(booking)}`
        ].join('\n'), [
            { id: 'confirm_yes', title: L('✅ Bevestigen', '✅ Confirmer') },
            { id: 'confirm_no', title: L('❌ Annuleren', '❌ Annuler') },
            { id: 'wa_cancel', title: L('🏠 Menu', '🏠 Menu') }
        ]);
    }

    return buildWaMainMenu(from);
};

const buildResumePromptForSession = async (from, session, activeProfile = getWaProfile(from)) => {
    const profile = session?.profile || activeProfile || WA_PROFILE.KAPSALON;

    if (profile === WA_PROFILE.GARAGE) {
        return buildGaragePromptForStep(session?.step || 'garage_intent', session || { garage: {} });
    }

    if (profile === WA_PROFILE.ADVOCATE) {
        return buildLawPromptForStep(session || { profile, step: 'law_practice_area', law: {} });
    }

    if (profile === WA_PROFILE.SOFIA) {
        return buildSofiaPromptForStep(from, session || { profile, step: 'sofia_category', booking: {} });
    }

    return buildKapsalonPromptForStep(from, session || { profile, step: 'category', booking: {} });
};

const WA_UI = {
    nl: {
        menuText: WA_MAIN_MENU_TEXT,
        section: 'Hoofdmenu',
        open: 'Menu',
        langTitle: 'Taal',
        langDesc: 'NL / FR',
        bookTitle: 'Boeken',
        bookDesc: 'Plan een afspraak',
        servicesTitle: 'Diensten',
        servicesDesc: 'Bekijk behandelingen',
        staffTitle: 'Medewerker',
        staffDesc: 'Bekijk ons team',
        infoTitle: 'Info',
        infoDesc: 'Adres en openingstijden',
        why: 'Waarom via WhatsApp?',
        langSaved: 'Taal bijgewerkt. Je kunt nu verder kiezen in het menu.',
        postVisit: 'Dankjewel voor je bezoek. Wil je een review geven of meteen opnieuw boeken?'
    },
    fr: {
        menuText: 'Bienvenue chez ' + WA_SALON_NAME + ' ✂️\nRéservation rapide en 1 minute.\n24/7, créneau immédiat, sans attente téléphonique.\n\nChoisissez une option :',
        section: 'Menu principal',
        open: 'Menu',
        langTitle: 'Langue',
        langDesc: 'NL / FR',
        bookTitle: 'Réserver',
        bookDesc: 'Planifier un rendez-vous',
        servicesTitle: 'Services',
        servicesDesc: 'Voir les soins',
        staffTitle: 'Équipe',
        staffDesc: 'Voir nos collaborateurs',
        infoTitle: 'Infos',
        infoDesc: 'Adresse et horaires',
        why: 'Pourquoi via WhatsApp ?',
        langSaved: 'Langue mise à jour. Vous pouvez continuer.',
        postVisit: 'Merci pour votre visite. Voulez-vous laisser un avis ou réserver à nouveau ?'
    }
};

const getWaLocale = (from) => {
    const locale = (WA_USER_PREFS.get(from) || WA_DEFAULT_LOCALE || 'nl').toLowerCase();
    return locale === 'fr' ? 'fr' : 'nl';
};
const getWaProfile = (from) => WA_FIXED_PROFILE || WA_USER_PROFILE.get(from) || null;

const ES_TEXT_REGEX_FIXES = [
    [/\bSofia\b/g, 'Sofía'],
    [/\bAparatologia\b/gi, 'Aparatología'],
    [/\bCategoria\b/g, 'Categoría'],
    [/\bcategoria\b/g, 'categoría'],
    [/\bDescripcion\b/g, 'Descripción'],
    [/\bdescripcion\b/g, 'descripción'],
    [/\bDuracion\b/g, 'Duración'],
    [/\bduracion\b/g, 'duración'],
    [/\bHidratacion\b/g, 'Hidratación'],
    [/\bhidratacion\b/g, 'hidratación'],
    [/\bDiagnostico\b/g, 'Diagnóstico'],
    [/\bdiagnostico\b/g, 'diagnóstico'],
    [/\bExtraccion\b/g, 'Extracción'],
    [/\bextraccion\b/g, 'extracción'],
    [/\bQuimico\b/g, 'Químico'],
    [/\bquimico\b/g, 'químico'],
    [/\bEnzimatico\b/g, 'Enzimático'],
    [/\benzimatico\b/g, 'enzimático'],
    [/\bSalmon\b/g, 'Salmón'],
    [/\bsalmon\b/g, 'salmón'],
    [/\bMandelico\b/g, 'Mandélico'],
    [/\bmandelico\b/g, 'mandélico'],
    [/\bFerulico\b/g, 'Ferúlico'],
    [/\bferulico\b/g, 'ferúlico'],
    [/\bEstetico\b/g, 'Estético'],
    [/\bestetico\b/g, 'estético'],
    [/\bLaser\b/g, 'Láser'],
    [/\blaser\b/g, 'láser'],
    [/\bDepilacion\b/g, 'Depilación'],
    [/\bdepilacion\b/g, 'depilación'],
    [/\bNumero\b/g, 'Número'],
    [/\bnumero\b/g, 'número'],
    [/\bProxima\b/g, 'Próxima'],
    [/\bproxima\b/g, 'próxima'],
    [/\bAtras\b/g, 'Atrás'],
    [/\batras\b/g, 'atrás'],
    [/\bManana\b/g, 'Mañana'],
    [/\bmanana\b/g, 'mañana'],
    [/\bopcion\b/g, 'opción'],
    [/\bOpcion\b/g, 'Opción'],
    [/\bopciones\b/g, 'opciones'],
    [/\baqui\b/g, 'aquí'],
    [/\bAqui\b/g, 'Aquí'],
    [/\bseccion\b/g, 'sección'],
    [/\bSeccion\b/g, 'Sección'],
    [/\bestetica\b/g, 'estética'],
    [/\boxigenacion\b/g, 'oxigenación'],
    [/\bproduccion\b/g, 'producción'],
    [/\bcolageno\b/g, 'colágeno'],
    [/\bsegun\b/g, 'según'],
    [/\baplicacion\b/g, 'aplicación'],
    [/\bregeneracion\b/g, 'regeneración'],
    [/\bmusculos\b/g, 'músculos'],
    [/\bestimulacion\b/g, 'estimulación'],
    [/\bcirculacion\b/g, 'circulación'],
    [/\bretencion\b/g, 'retención'],
    [/\bliquidos\b/g, 'líquidos'],
    [/\bhinchazon\b/g, 'hinchazón'],
    [/\bactua\b/g, 'actúa'],
    [/\bfrio\b/g, 'frío'],
    [/\bcancelacion\b/g, 'cancelación'],
    [/\breprogramacion\b/g, 'reprogramación'],
    [/\bminimo\b/g, 'mínimo'],
    [/\bantelacion\b/g, 'antelación'],
    [/\bIntentalo\b/g, 'Inténtalo'],
    [/\bintentalo\b/g, 'inténtalo'],
    // Additional fixes from PDF service descriptions
    [/\bperdida\b/g, 'pérdida'],
    [/\bPerdida\b/g, 'Pérdida'],
    [/\bgluteos\b/g, 'glúteos'],
    [/\bGluteos\b/g, 'Glúteos'],
    [/\bcelulitis\b/g, 'celulitis'],
    [/\bmas\b/g, 'más'],
    [/\bMas\b/g, 'Más'],
    [/\btambien\b/g, 'también'],
    [/\bTambien\b/g, 'También'],
    [/\bprotegido\b/g, 'protegido'],
    [/\bcarboxiterapia\b/g, 'carboxiterapia'],
    [/\bosigenacion\b/g, 'oxigenación'],
    [/\bfirma\b/g, 'firma'],
    [/\bfirmeza\b/g, 'firmeza'],
    [/\bRadiofrecuencia\b/g, 'Radiofrecuencia'],
    [/\bCriolipolisis\b/g, 'Criolipólisis'],
    [/\bcriolipolisis\b/g, 'criolipólisis'],
    [/\bPresoterapia\b/g, 'Presoterapia'],
    [/\bSculpt\b/g, 'Sculpt'],
    [/\bcaracteristicas\b/g, 'características'],
    [/\bpersonalizacion\b/g, 'personalización'],
    [/\bmejorar\b/g, 'mejorar'],
    [/\bultrafocusado\b/g, 'ultrafocalizado'],
    [/\bcolagena\b/g, 'colágena'],
    [/\btecnica\b/g, 'técnica'],
    [/\bTecnica\b/g, 'Técnica'],
    [/\bademas\b/g, 'además'],
    [/\bAdemas\b/g, 'Además'],
    [/\belasticidad\b/g, 'elasticidad'],
    [/\bfacil\b/g, 'fácil'],
    [/\bFacil\b/g, 'Fácil'],
    [/\brapido\b/g, 'rápido'],
    [/\bRapido\b/g, 'Rápido'],
    [/\bpuedes\b/g, 'puedes'],
    [/\bhidrata\b/g, 'hidrata'],
    [/\boxigenar\b/g, 'oxigenar'],
    [/\bpróxima\b/g, 'próxima'],
    [/\bcita\b/g, 'cita'],
    [/\bultima\b/g, 'última'],
    [/\bUltima\b/g, 'Última'],
    [/\bperiodo\b/g, 'período'],
    [/\bPeriodo\b/g, 'Período'],
    [/\bundecimo\b/g, 'undécimo'],
    [/\bclinica\b/g, 'clínica'],
    [/\bClinica\b/g, 'Clínica'],
    [/\bmedico\b/g, 'médico'],
    [/\bMedico\b/g, 'Médico'],
    [/\besteticos\b/g, 'estéticos'],
    [/\bpractico\b/g, 'práctico'],
    [/\bPractico\b/g, 'Práctico'],
    [/\bminutos\b/g, 'minutos'],
    [/\bmateria\b/g, 'materia'],
    [/\bprevio\b/g, 'previo'],
    [/\bprotocolo\b/g, 'protocolo'],
    [/\bevaluacion\b/g, 'evaluación'],
    [/\bEvaluacion\b/g, 'Evaluación'],
    [/\binformacion\b/g, 'información'],
    [/\bInformacion\b/g, 'Información'],
    [/\bpresentacion\b/g, 'presentación'],
    [/\bsesion\b/g, 'sesión'],
    [/\bSesion\b/g, 'Sesión'],
    [/\bsesiones\b/g, 'sesiones'],
    [/\bbono\b/g, 'bono'],
    [/\bfinanzas\b/g, 'finanzas'],
    [/\belectrico\b/g, 'eléctrico'],
    [/\bElectrico\b/g, 'Eléctrico'],
    [/\benergia\b/g, 'energía'],
    [/\bEnergia\b/g, 'Energía'],
    [/\bpiel\b/g, 'piel'],
    [/\bRostro\b/g, 'Rostro'],
    [/\bCorporales\b/g, 'Corporales'],
    [/\bAparatologia\b/g, 'Aparatología'],
    [/\bporos\b/g, 'poros'],
    [/\bextraer\b/g, 'extraer'],
    [/\btextura\b/g, 'textura'],
    [/\bbrillo\b/g, 'brillo'],
    [/\bluminosidad\b/g, 'luminosidad'],
    [/\bapariencia\b/g, 'apariencia'],
    [/\bnatural\b/g, 'natural'],
    [/\bprofundidad\b/g, 'profundidad'],
    [/\bactivos\b/g, 'activos'],
    [/\bsuave\b/g, 'suave'],
    [/\bcalmante\b/g, 'calmante'],
    [/\bfocalizado\b/g, 'focalizado'],
    [/\bultrafocalizado\b/g, 'ultrafocalizado'],
    [/\bultrafocusado\b/g, 'ultrafocalizado'],
    [/\bconveniente\b/g, 'conveniente'],
];

const normalizeSpanishText = (input) => {
    if (input === null || input === undefined) return input;
    let out = String(input);
    for (const [rx, replacement] of ES_TEXT_REGEX_FIXES) {
        out = out.replace(rx, replacement);
    }
    return out.normalize('NFC');
};

const normalizeWaResponseForSpanish = (locale, response) => {
    if (locale !== 'es' || !response) return response;
    const out = { ...response };
    if (typeof out.body === 'string') out.body = normalizeSpanishText(out.body);
    if (typeof out.footer === 'string') out.footer = normalizeSpanishText(out.footer);
    if (typeof out.header === 'string') out.header = normalizeSpanishText(out.header);
    if (typeof out.cta === 'string') out.cta = normalizeSpanishText(out.cta);
    if (Array.isArray(out.buttons)) {
        out.buttons = out.buttons.map((btn) => ({
            ...btn,
            title: normalizeSpanishText(btn?.title || '')
        }));
    }
    if (Array.isArray(out.sections)) {
        out.sections = out.sections.map((sec) => ({
            ...sec,
            title: normalizeSpanishText(sec?.title || ''),
            rows: (sec?.rows || []).map((row) => ({
                ...row,
                title: normalizeSpanishText(row?.title || ''),
                description: normalizeSpanishText(row?.description || '')
            }))
        }));
    }
    if (typeof out.buttonText === 'string') out.buttonText = normalizeSpanishText(out.buttonText);
    return out;
};
const setWaProfile = (from, profile) => {
    if (!from) return;
    if (WA_FIXED_PROFILE) {
        WA_USER_PROFILE.set(from, WA_FIXED_PROFILE);
        return;
    }
    if (![WA_PROFILE.KAPSALON, WA_PROFILE.SOFIA, WA_PROFILE.GARAGE, WA_PROFILE.ADVOCATE].includes(profile)) return;
    WA_USER_PROFILE.set(from, profile);
};

const buildWaProfileSelector = () => WA_PROFILE_LOCKED
    ? buildWaMainMenu('locked-profile')
    : waList(
        'Kies je bot / Choisis ton bot :',
        [{
            title: 'Demo bots',
            rows: [
                { id: 'profile_sofia', title: '✨ Sofía Beauty', description: 'Beauty / intake demo' },
                { id: 'profile_kapsalon', title: '✂️ KapSalon', description: 'Kapper / booking demo' },
                { id: 'profile_garage', title: '🚗 Garage demo', description: 'Auto lead / showroom' },
                { id: 'profile_advocaat', title: '⚖️ Advocaat demo', description: 'Juridische intake' }
            ]
        }],
        'Bots'
    );

const ui = (from, key) => {
    const locale = getWaLocale(from);
    return (WA_UI[locale] && WA_UI[locale][key]) || WA_UI.nl[key] || '';
};

const setWaLocale = (from, locale) => {
    if (!from) return;
    if (WA_LOCALE_LOCKED) return;
    if (!['nl', 'fr'].includes(locale)) return;
    WA_USER_PREFS.set(from, locale);
};

const trackWaFunnel = (event, from = '') => {
    try {
        const data = fs.existsSync(WA_FUNNEL_FILE)
            ? JSON.parse(fs.readFileSync(WA_FUNNEL_FILE, 'utf8'))
            : { updatedAt: null, events: {}, users: {} };

        data.updatedAt = new Date().toISOString();
        data.events = data.events || {};
        data.events[event] = (data.events[event] || 0) + 1;

        if (from) {
            data.users = data.users || {};
            data.users[from] = data.users[from] || { lastAt: null, hits: 0 };
            data.users[from].lastAt = data.updatedAt;
            data.users[from].hits += 1;
        }

        fs.writeFileSync(WA_FUNNEL_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.log('wa funnel track error:', e.message);
    }
};

const notifyGarageLead = async (from, lead) => {
    try {
        const ADMIN_NOTIFY_ID = Number(process.env.ADMIN_TELEGRAM_ID) || 0;
        if (!ADMIN_NOTIFY_ID || !bot.telegram) return;

        const lines = [
            '🚗 <b>Nieuwe Garage Lead</b>',
            '',
            `📱 ${from}`,
            `🏷️ Bron: ${lead.rkSource || '-'}`,
            `🎯 Doel: ${lead.intent || '-'}`,
            `💶 Budget: ${lead.budget || '-'}`,
            `🚘 Zoekopdracht: ${lead.carNeed || '-'}`,
            `⭐ Prioriteit: ${lead.priority || '-'}`,
            `🔁 Inruil: ${lead.tradeIn || '-'}`,
            `📞 Volgende stap: ${lead.nextStep || '-'}`,
            `📅 Gewenst: ${lead.day} om ${lead.time}`,
            `👤 Contact: ${lead.namePhone}`
        ];
        if (lead.reason) lines.splice(2, 0, `⚠️ Type: ${lead.reason}`);
        const text = lines.join('\n');

        await bot.telegram.sendMessage(ADMIN_NOTIFY_ID, text, { parse_mode: 'HTML' });
    } catch (e) {
        console.log('garage lead notify error:', e.message);
    }
};

const buildWaStaffText = (from = '') => {
    const locale = getWaLocale(from);
    const male = (STAFF.male || []).map(s => s.name).join(', ') || 'Team';
    const female = (STAFF.female || []).map(s => s.name).join(', ') || 'Team';

    if (locale === 'fr') {
        return [
            'Notre équipe :',
            `- Hommes : ${male}`,
            `- Femmes : ${female}`,
            '',
            'Tapez "book" ou choisissez une option du menu pour réserver.'
        ].join('\n');
    }

    return [
        'Ons team:',
        `- Heren: ${male}`,
        `- Dames: ${female}`,
        '',
        'Typ "boeken" of kies in het menu om direct te reserveren.'
    ].join('\n');
};

const buildWaMainMenu = (from = '') => {
    const activeProfile = getWaProfile(from);
    const locale = getWaLocale(from);
    if (activeProfile === WA_PROFILE.ADVOCATE) {
        return buildLawMainMenu();
    }

    const rows = activeProfile === WA_PROFILE.SOFIA
        ? [
            ...(!WA_LOCALE_LOCKED ? [{
                id: 'wa_lang',
                title: locale === 'fr' ? '🌐 Langue' : '🌐 Taal',
                description: 'NL / FR'
            }] : []),
            { id: 'wa_book', title: locale === 'fr' ? '📅 Réserver' : '📅 Afspraak boeken', description: locale === 'fr' ? 'Choisir date et heure' : 'Kies datum en uur' },
            { id: 'wa_calendar', title: locale === 'fr' ? '🌐 Calendrier web' : '🌐 Web kalender', description: locale === 'fr' ? 'Ouvrir la page de réservation' : 'Open de reserveringspagina' },
            { id: 'wa_services', title: locale === 'fr' ? '💆 Services & tarifs' : '💆 Behandelingen & prijzen', description: locale === 'fr' ? 'Voir les soins' : 'Bekijk behandelingen' },
            { id: 'wa_my', title: locale === 'fr' ? '📋 Mes rendez-vous' : '📋 Mijn afspraken', description: locale === 'fr' ? 'Voir mes réservations' : 'Bekijk mijn boekingen' },
            { id: 'wa_info', title: locale === 'fr' ? '📍 Contact' : '📍 Contact', description: locale === 'fr' ? 'Adresse et horaires' : 'Adres en openingsuren' },
            ...(!WA_PROFILE_LOCKED ? [{
                id: 'wa_switch_bot',
                title: locale === 'fr' ? '🔁 Changer de bot' : '🔁 Bot wisselen',
                description: 'Sofía / KapSalon / Garage'
            }] : [])
        ]
        : [
            ...(!WA_LOCALE_LOCKED ? [{ id: 'wa_lang', title: ui(from, 'langTitle'), description: ui(from, 'langDesc') }] : []),
            { id: 'wa_book', title: ui(from, 'bookTitle'), description: ui(from, 'bookDesc') },
            { id: 'wa_calendar', title: '🌐 Open calendar', description: 'Visuele dag- en slotpicker' },
            { id: 'wa_services', title: ui(from, 'servicesTitle'), description: ui(from, 'servicesDesc') },
            { id: 'wa_staff', title: ui(from, 'staffTitle'), description: ui(from, 'staffDesc') },
            { id: 'wa_info', title: ui(from, 'infoTitle'), description: ui(from, 'infoDesc') }
        ];

    return waList(
        activeProfile === WA_PROFILE.SOFIA
            ? (locale === 'fr'
                ? 'Bonjour ✨\nJe suis l’assistante virtuelle de The Beauty Salon.\n\nJe vous aide à choisir le soin idéal et à réserver votre rendez-vous.\n\nVeuillez choisir une option :'
                : 'Hallo ✨\nIk ben de virtuele assistent van The Beauty Salon.\n\nIk help je de juiste behandeling kiezen en je afspraak boeken.\n\nKies een optie:')
            : ui(from, 'menuText'),
        [{
            title: activeProfile === WA_PROFILE.SOFIA ? 'The Beauty Salon' : ui(from, 'section'),
            rows
        }],
        activeProfile === WA_PROFILE.SOFIA ? 'Menu' : ui(from, 'open')
    );
};

const createAppointmentFromSession = async (from, session) => {
    const booking = session.booking;
    const duration = booking.duration || SERVICE_DURATIONS[booking.service] || DEFAULT_DURATION;
    let assignedBarber = booking.barber;
    let assignedBarberName = booking.barberName;

    if (assignedBarber === 'any') {
        const available = await findAvailableBarber(booking.date, booking.category, booking.time, duration);
        if (!available) return null;
        assignedBarber = available.id;
        assignedBarberName = available.name;
    }

    const newAppt = {
        id: `wa_${Date.now()}`,
        name: session.profile === WA_PROFILE.SOFIA ? 'Beauty Client' : 'WhatsApp Customer',
        phone: from,
        whatsappUserId: from,
        category: booking.category || (session.profile === WA_PROFILE.SOFIA ? 'female' : booking.category),
        service: booking.service,
        selectedServices: booking.selectedServices && booking.selectedServices.length ? booking.selectedServices : [booking.service],
        duration,
        date: booking.date,
        time: booking.time,
        barber: assignedBarber,
        barberName: assignedBarberName || assignedBarber || (session.profile === WA_PROFILE.SOFIA ? 'Sofía' : 'any'),
        status: 'confirmed',
        locale: getWaLocale(from),
        post_visit_sent: false,
        system: 'whatsapp',
        profile: session.profile || WA_PROFILE.KAPSALON,
        details: `${booking.service} (${booking.date} ${booking.time})`,
        timestamp: new Date().toISOString()
    };

    // --- Google Calendar Integration ---
    try {
        await calendarModule.createCalendarEvent({
            bookingId: newAppt.id,
            serviceName: newAppt.service,
            date: newAppt.date,
            time: newAppt.time,
            durationMin: newAppt.duration,
            clientName: newAppt.name,
            clientPhone: from
        });
    } catch (calErr) {
        console.error('Sofia Calendar Create Error:', calErr.message);
    }

    return newAppt;
};

const buildSofiaFlowRetryResponse = (locale = 'nl') => waButtons(
    locale === 'fr'
        ? 'Ce créneau n’est plus disponible. Ouvrez la réservation intégrée à nouveau.'
        : 'Dit tijdslot is niet meer beschikbaar. Open de ingebouwde reservatie opnieuw.',
    [
        { id: 'wa_calendar', title: locale === 'fr' ? '📅 Ouvrir réservation' : '📅 Open reservatie' },
        { id: 'wa_services', title: locale === 'fr' ? '💆 Services' : '💆 Diensten' },
        { id: 'wa_cancel', title: '🏠 Menu' }
    ]
);

const handleSofiaFlowReply = async (from, payload) => {
    const locale = getWaLocale(from);
    const service = SOFIA_FLOW_SERVICE_MAP.get(String(payload?.service || ''));
    const date = resolveSofiaFlowDate(String(payload?.day || ''));
    const time = resolveSofiaFlowTime(String(payload?.time || ''));

    if (!service || !date || !time) {
        return buildSofiaFlowRetryResponse(locale);
    }

    const availableSlots = await getAvailableSlots(date, 'female', service.duration, 'sofia');
    if (!availableSlots.includes(time)) {
        return buildSofiaFlowRetryResponse(locale);
    }

    setWaProfile(from, WA_PROFILE.SOFIA);

    const appointment = await createAppointmentFromSession(from, {
        profile: WA_PROFILE.SOFIA,
        booking: {
            category: 'female',
            service: service.name,
            selectedServices: [service.name],
            duration: service.duration,
            price: service.price,
            barber: 'sofia',
            barberName: 'Sofia',
            date,
            time,
        }
    });

    if (!appointment) {
        return buildSofiaFlowRetryResponse(locale);
    }

    const appointments = await getAppointments();
    appointments.push(appointment);
    await saveAppointments(appointments);
    WA_SESSIONS.delete(from);
    trackWaFunnel('sofia_native_flow_confirmed', from);

    return waButtons(
        `${locale === 'fr' ? 'Rendez-vous confirmé' : 'Afspraak bevestigd'} ✅\n${appointment.date} ${appointment.time}\n${appointment.service}\n${locale === 'fr' ? 'Spécialiste' : 'Specialiste'}: ${appointment.barberName}`,
        [
            { id: 'wa_book', title: locale === 'fr' ? '📅 Nouveau rendez-vous' : '📅 Nieuwe afspraak' },
            { id: 'wa_my', title: locale === 'fr' ? '📋 Mes rendez-vous' : '📋 Mijn afspraken' },
            { id: 'wa_services', title: locale === 'fr' ? '💆 Services' : '💆 Diensten' }
        ]
    );
};

const handleWhatsAppMessage = async (from, rawText) => {
    const isFlowReply = rawText && typeof rawText === 'object' && rawText.type === 'flow_reply';
    const msg = isFlowReply ? '' : String(rawText || '').trim();
    const lower = msg.toLowerCase();
    const waLocale = getWaLocale(from);
    const L = (nlText, fallbackText) => {
        if (waLocale !== 'fr') return nlText;
        if (/[А-Яа-яЁё]/.test(String(fallbackText || ''))) return nlText;
        return fallbackText || nlText;
    };
    const S = (nlText, frText) => (waLocale === 'fr' ? frText : nlText);
    const existingSession = WA_SESSIONS.get(from);
    const activeProfile = getWaProfile(from);

    if (isFlowReply) {
        const flowName = String(rawText?.data?.flow || '').trim().toLowerCase();
        if (flowName === 'sofia_booking' || activeProfile === WA_PROFILE.SOFIA || existingSession?.profile === WA_PROFILE.SOFIA) {
            return handleSofiaFlowReply(from, rawText.data);
        }
        return waText('Flow reply received.');
    }

    if (['cancel', 'stop', 'annuleren', 'wa_cancel'].includes(lower)) {
        WA_SESSIONS.delete(from);
        return waText(L('Boeking geannuleerd. Typ "menu" om opnieuw te starten.', 'Réservation annulée. Tapez "menu" pour recommencer.'));
    }

    if (['reset', '/reset'].includes(lower)) {
        WA_SESSIONS.delete(from);
        WA_USER_PROFILE.delete(from);
        trackWaFunnel('reset', from);
        return buildWaProfileSelector();
    }

    if (['garage_back_menu', 'terug naar menu', 'wa_back_to_hub'].includes(lower)) {
        if (existingSession) {
            const keepSession = { ...existingSession, step: null };
            delete keepSession.garage;
            WA_SESSIONS.set(from, keepSession);
        }
        WA_USER_PROFILE.delete(from);
        trackWaFunnel('garage_back_to_menu', from);
        return buildWaProfileSelector();
    }

    if (['profile_sofia', 'sofia'].includes(lower)) {
        WA_SESSIONS.delete(from);
        setWaProfile(from, WA_PROFILE.SOFIA);
        // Don't hard-default to 'es', let it use detected locale or user preference
        trackWaFunnel('profile_sofia', from);
        return buildWaMainMenu(from);
    }
    if (['profile_kapsalon', 'kapsalon', 'kap'].includes(lower)) {
        WA_SESSIONS.delete(from);
        setWaProfile(from, WA_PROFILE.KAPSALON);
        setWaLocale(from, 'nl');
        trackWaFunnel('profile_kapsalon', from);
        return buildWaMainMenu(from);
    }
    if (['profile_garage', 'garage demo', 'autogarage', 'auto dealer'].includes(lower)) {
        setWaProfile(from, WA_PROFILE.GARAGE);
        setWaLocale(from, 'nl');
        WA_SESSIONS.set(from, {
            profile: WA_PROFILE.GARAGE,
            step: 'garage_intent',
            garage: {},
            garageLead: existingSession?.garageLead || null
        });
        trackWaFunnel('profile_garage', from);
        return buildGarageIntentPrompt();
    }
    if (['profile_advocaat', 'advocaat demo', 'advocaat', 'law demo'].includes(lower)) {
        setWaProfile(from, WA_PROFILE.ADVOCATE);
        setWaLocale(from, 'nl');
        WA_SESSIONS.delete(from);
        trackWaFunnel('profile_advocaat', from);
        return buildLawMainMenu();
    }

    if (lower === WA_RESUME_ID && existingSession) {
        return buildResumePromptForSession(from, existingSession, activeProfile || existingSession.profile);
    }

    if (['wa_calendar', 'calendar', 'open calendar', 'open kalender', 'abrir calendario'].includes(lower)) {
        const profileForCalendar = activeProfile || existingSession?.profile || WA_PROFILE.KAPSALON;
        return await buildCalendarCtaResponse(from, profileForCalendar, Boolean(existingSession));
    }

    if (!activeProfile) {
        trackWaFunnel('profile_required', from);
        return buildWaProfileSelector();
    }

    const garageNeedsStrictOptionValidation = activeProfile === WA_PROFILE.GARAGE
        && existingSession
        && ['garage_intent', 'garage_budget', 'garage_priority', 'garage_tradein', 'garage_next_step', 'garage_day', 'garage_time', 'garage_review'].includes(existingSession.step);
    const isGreetingShortcut = ['hello', 'hi', 'hey'].includes(lower);

    if (['menu', 'start', '/start', 'hello', 'hi', 'hey'].includes(lower)
        && !(garageNeedsStrictOptionValidation && isGreetingShortcut)) {
        WA_SESSIONS.delete(from);
        trackWaFunnel('menu_open', from);
        if (activeProfile === WA_PROFILE.GARAGE) {
            WA_SESSIONS.set(from, {
                profile: WA_PROFILE.GARAGE,
                step: 'garage_intent',
                garage: {},
                garageLead: existingSession?.garageLead || null
            });
            return buildGarageIntentPrompt();
        }
        return buildWaMainMenu(from);
    }

    if (activeProfile === WA_PROFILE.ADVOCATE) {
        if (['wa_switch_bot', 'switch bot', 'changer bot', 'bot wisselen'].includes(lower)) {
            WA_SESSIONS.delete(from);
            WA_USER_PROFILE.delete(from);
            return buildWaProfileSelector();
        }

        if (['law_practice', 'practice', 'rechtsgebieden'].includes(lower)) {
            const response = buildLawPracticeAreasResponse();
            if (existingSession && existingSession.step?.startsWith('law_')) {
                return buildResumeDetourResponse(from, 'Demo rechtsgebieden:\n• Werk & ontslag\n• Schulden\n• Contracten\n• Familie', WA_PROFILE.ADVOCATE);
            }
            return response;
        }

        if (['law_price', 'price', 'pricing', 'werkwijze'].includes(lower)) {
            const body = buildLawPriceText();
            if (existingSession && existingSession.step?.startsWith('law_')) {
                return buildResumeDetourResponse(from, body, WA_PROFILE.ADVOCATE);
            }
            return waButtons(body, [
                { id: 'law_intake', title: '⚖️ Intake starten' },
                { id: 'law_contact', title: '📞 Contact' },
                { id: 'law_practice', title: '📂 Rechtsgebieden' }
            ]);
        }

        if (['law_contact', 'contact', 'bel', 'bellen'].includes(lower)) {
            const body = buildLawContactText();
            if (existingSession && existingSession.step?.startsWith('law_')) {
                return buildResumeDetourResponse(from, body, WA_PROFILE.ADVOCATE);
            }
            return waButtons(body, [
                { id: 'law_intake', title: '⚖️ Intake starten' },
                { id: 'law_price', title: '💶 Werkwijze' },
                { id: 'law_practice', title: '📂 Rechtsgebieden' }
            ]);
        }

        if (['law_intake', 'book', 'consult'].includes(lower)) {
            const session = { profile: WA_PROFILE.ADVOCATE, step: 'law_practice_area', law: {} };
            WA_SESSIONS.set(from, session);
            return buildLawPromptForStep(session);
        }

        const session = (existingSession && existingSession.profile === WA_PROFILE.ADVOCATE)
            ? existingSession
            : { profile: WA_PROFILE.ADVOCATE, step: null, law: {} };

        if (!session.step) {
            return buildLawMainMenu();
        }

        session.profile = WA_PROFILE.ADVOCATE;
        session.law = session.law || {};

        if (session.step === 'law_practice_area') {
            if (!LAW_PRACTICE_AREAS.some((item) => item.id === lower)) {
                return buildLawPromptForStep(session, true);
            }

            session.law.practiceArea = lower;
            session.step = 'law_urgency';
            WA_SESSIONS.set(from, session);
            return buildLawPromptForStep(session);
        }

        if (session.step === 'law_urgency') {
            const urgencyMap = {
                law_urgency_today: 'Vandaag',
                law_urgency_week: 'Deze week',
                law_urgency_normal: 'Niet dringend'
            };

            if (!urgencyMap[lower]) {
                return buildLawPromptForStep(session, true);
            }

            session.law.urgency = urgencyMap[lower];
            session.step = 'law_contact_pref';
            WA_SESSIONS.set(from, session);
            return buildLawPromptForStep(session);
        }

        if (session.step === 'law_contact_pref') {
            const prefMap = {
                law_pref_whatsapp: 'WhatsApp',
                law_pref_call: 'Telefoon',
                law_pref_email: 'E-mail'
            };

            if (!prefMap[lower]) {
                return buildLawPromptForStep(session, true);
            }

            session.law.contactPreference = prefMap[lower];
            session.step = 'law_name_phone';
            WA_SESSIONS.set(from, session);
            return buildLawPromptForStep(session);
        }

        if (session.step === 'law_name_phone') {
            if (!msg) {
                return buildLawPromptForStep(session);
            }

            session.law.namePhone = msg;
            session.step = 'law_case_summary';
            WA_SESSIONS.set(from, session);
            return buildLawPromptForStep(session);
        }

        if (session.step === 'law_case_summary') {
            if (!msg) {
                return buildLawPromptForStep(session);
            }

            session.law.caseSummary = msg;
            session.step = 'law_confirm';
            WA_SESSIONS.set(from, session);
            return buildLawPromptForStep(session);
        }

        if (session.step === 'law_confirm_edit') {
            const editStepMap = {
                law_edit_area: 'law_practice_area',
                law_edit_urgency: 'law_urgency',
                law_edit_contact: 'law_name_phone',
                law_edit_summary: 'law_case_summary'
            };

            if (!editStepMap[lower]) {
                return buildLawPromptForStep(session);
            }

            session.step = editStepMap[lower];
            WA_SESSIONS.set(from, session);
            return buildLawPromptForStep(session);
        }

        if (session.step === 'law_confirm') {
            if (lower === 'law_confirm_edit' || lower === 'confirm_edit') {
                session.step = 'law_confirm_edit';
                WA_SESSIONS.set(from, session);
                return buildLawPromptForStep(session);
            }

            if (lower === 'law_confirm_yes' || lower === 'confirm_yes') {
                session.step = 'law_done';
                WA_SESSIONS.set(from, session);
                return buildLawPromptForStep(session);
            }

            return buildLawPromptForStep(session);
        }

        if (session.step === 'law_done') {
            if (['law_intake', 'book', 'consult'].includes(lower)) {
                const nextSession = { profile: WA_PROFILE.ADVOCATE, step: 'law_practice_area', law: {} };
                WA_SESSIONS.set(from, nextSession);
                return buildLawPromptForStep(nextSession);
            }

            if (['wa_cancel', 'cancel', 'stop'].includes(lower)) {
                WA_SESSIONS.delete(from);
                return buildLawMainMenu();
            }

            return buildLawPromptForStep(session);
        }

        WA_SESSIONS.set(from, session);
        return buildLawMainMenu();
    }

    if (activeProfile === WA_PROFILE.SOFIA) {
        if (['wa_lang', 'lang', 'taal', 'langue', 'language'].includes(lower)) {
            return waButtons('Taal / Langue', [
                { id: 'lang_nl', title: 'NL' },
                { id: 'lang_fr', title: 'FR' }
            ]);
        }

        if (['lang_nl', 'lang_fr'].includes(lower)) {
            const locale = lower.replace('lang_', '');
            setWaLocale(from, locale);
            trackWaFunnel('lang_' + locale, from);
            const msgLang = locale === 'fr'
                ? 'Langue mise à jour. Vous pouvez continuer.'
                : 'Taal bijgewerkt. Je kunt verdergaan.';
            if (existingSession) {
                return buildResumeDetourResponse(from, msgLang, WA_PROFILE.SOFIA);
            }
            WA_SESSIONS.delete(from);
            return waText(msgLang);
        }

        if (['wa_switch_bot', 'switch bot', 'changer bot', 'bot wisselen'].includes(lower)) {
            WA_SESSIONS.delete(from);
            WA_USER_PROFILE.delete(from);
            return buildWaProfileSelector();
        }

        if (['wa_info', 'info', 'contact'].includes(lower)) {
            const infoText = S(
                'The Beauty Salon\n📍 Oostende\n🕘 Afspraken via WhatsApp\n👩‍⚕️ Specialiste: Sofia',
                'The Beauty Salon\n📍 Ostende\n🕘 Rendez-vous via WhatsApp\n👩‍⚕️ Spécialiste : Sofia'
            );
            if (existingSession) {
                return buildResumeDetourResponse(from, infoText, WA_PROFILE.SOFIA);
            }
            return waText(infoText);
        }

        if (['wa_services', 'services', 'service', 'soins', 'diensten', 'behandelingen'].includes(lower)) {
            if (existingSession) {
                return buildResumeDetourResponse(from, buildSofiaServicesSummaryText(waLocale), WA_PROFILE.SOFIA);
            }
            return waList(
                S('Behandelingen en prijzen\nKies een categorie:', 'Services et tarifs\nChoisissez une catégorie :'),
                [{
                    title: 'The Beauty Salon',
                    rows: buildSofiaCategoriesRows(waLocale)
                }],
                S('Openen', 'Ouvrir')
            );
        }

        if (['wa_my', 'my', 'my bookings', 'mijn afspraken', 'mes rendez-vous'].includes(lower)) {
            const bookingsText = await buildMyBookingsTextSofia(from);
            if (existingSession) {
                return buildResumeDetourResponse(from, bookingsText, WA_PROFILE.SOFIA);
            }
            return waText(bookingsText);
        }

        if (isLegacySofiaServiceId(lower)) {
            WA_SESSIONS.delete(from);
            return waButtons(
                S(
                    'Dit menu is verouderd. Open de nieuwe dienstenlijst.',
                    'Ce menu est ancien. Ouvrez la nouvelle liste de services.'
                ),
                [
                    { id: 'wa_services', title: S('💆 Diensten', '💆 Services') },
                    { id: 'wa_book', title: S('📅 Afspraak boeken', '📅 Réserver') },
                    { id: 'wa_cancel', title: '🏠 Menu' }
                ]
            );
        }

        if (lower.startsWith('sofia_cat_')) {
            const categoryKey = lower.replace('sofia_cat_', '');
            const rows = buildSofiaServiceRows(categoryKey, waLocale);
            const meta = SOFIA_CATEGORY_META_LOCALIZED[categoryKey];
            if (!rows.length || !meta) return waText(S('Ongeldige categorie.', 'Catégorie invalide.'));
            const title = waLocale === 'fr' ? meta.fr.title : meta.nl.title;
            return waList(
                `${title}\n${S('Kies een behandeling:', 'Choisissez un soin :')}`,
                [{ title, rows }],
                S('Diensten', 'Services')
            );
        }

        const selectedById = getSofiaServiceByMessageId(lower) || getSofiaServiceByText(msg);
        if (selectedById && !existingSession) {
            return waButtons(buildSofiaServiceCard(selectedById.service, waLocale), [
                { id: 'wa_book', title: S('📅 Afspraak boeken', '📅 Réserver') },
                { id: 'wa_services', title: S('💆 Meer diensten', '💆 Plus de services') },
                { id: 'wa_cancel', title: '🏠 Menu' }
            ]);
        }

        if (['wa_book', 'book', 'appointment', 'boeken', 'afspraak', 'reserveren', 'réserver', 'rendez-vous'].includes(lower)) {
            WA_SESSIONS.set(from, { profile: WA_PROFILE.SOFIA, step: 'sofia_category', booking: {} });
            return waList(
                S('Om te reserveren, kies eerst een categorie:', 'Pour réserver, choisissez d’abord une catégorie :'),
                [{ title: S('Categorieën', 'Catégories'), rows: buildSofiaCategoriesRows(waLocale) }],
                S('Categorieën', 'Catégories')
            );
        }

        if (!existingSession) return buildWaMainMenu(from);

        const session = existingSession;
        const booking = session.booking;

        if (session.step === 'sofia_category') {
            if (lower.startsWith('sofia_svc_') || getSofiaServiceByText(msg)) {
                session.step = 'sofia_service';
            } else if (!lower.startsWith('sofia_cat_')) {
                return waText(S('Kies een categorie uit het menu.', 'Choisissez une catégorie du menu.'));
            }
            if (session.step !== 'sofia_service') {
                const categoryKey = lower.replace('sofia_cat_', '');
                const rows = buildSofiaServiceRows(categoryKey, waLocale);
                const meta = SOFIA_CATEGORY_META_LOCALIZED[categoryKey];
                if (!rows.length || !meta) return waText(S('Ongeldige categorie.', 'Catégorie invalide.'));
                const title = waLocale === 'fr' ? meta.fr.title : meta.nl.title;
                session.step = 'sofia_service';
                session.booking.categoryKey = categoryKey;
                return waList(
                    `${title}\n${S('Kies een behandeling:', 'Choisissez un soin :')}`,
                    [{ title, rows }],
                    S('Diensten', 'Services')
                );
            }
        }

        if (session.step === 'sofia_service') {
            const selected = getSofiaServiceByMessageId(lower) || getSofiaServiceByText(msg);
            if (!selected) return waText(S('Kies een behandeling uit de lijst.', 'Choisissez un soin dans la liste.'));
            const chosen = selected.service;

            booking.category = 'female';
            booking.service = getSofiaLocalizedName(chosen, waLocale);
            booking.selectedServices = [getSofiaLocalizedName(chosen, waLocale)];
            booking.duration = chosen.duration;
            booking.price = chosen.price;
            booking.serviceDesc = getSofiaLocalizedDesc(chosen, waLocale);
            booking.barber = 'sofia';
            booking.barberName = 'Sofia';
            session.step = 'date';
            return waButtons(S('Kies een datum:', 'Choisissez une date :'), [
                { id: 'date_today', title: S('📅 Vandaag', '📅 Aujourd’hui') },
                { id: 'date_tomorrow', title: S('📅 Morgen', '📅 Demain') },
                { id: 'date_manual', title: S('✍️ Datum typen', '✍️ Saisir une date') }
            ]);
        }

        if (session.step === 'date') {
            const dateInput =
                lower === 'date_today' ? 'today'
                    : (lower === 'date_tomorrow' ? 'tomorrow' : msg);
            if (lower === 'date_manual') return waText(S('Typ de datum in formaat YYYY-MM-DD.', 'Entrez la date au format YYYY-MM-DD.'));

            const selectedDate = parseDateInput(dateInput);
            if (!selectedDate) return waText(S('Ongeldige datum. Voorbeeld: 2026-03-10.', 'Date invalide. Exemple : 2026-03-10.'));
            if (selectedDate < getLocalDate()) return waText(S('Die datum ligt in het verleden. Kies een andere.', 'Cette date est déjà passée. Choisissez-en une autre.'));

            const slots = await getAvailableSlots(selectedDate, booking.category, booking.duration, booking.barber || 'sofia');
            if (!slots.length) return waText(S('Geen beschikbare uren op die datum. Kies een andere datum.', 'Aucun créneau disponible à cette date. Choisissez une autre date.'));

            booking.date = selectedDate;
            session.step = 'time';
            const chunks = [];
            const rows = slots.map((slot) => ({
                id: `time_${slot}`,
                title: slot,
                description: `${booking.duration} min`
            }));
            for (let i = 0; i < rows.length; i += 10) chunks.push(rows.slice(i, i + 10));
            return waList(
                S(`Beschikbare uren voor ${selectedDate}:`, `Créneaux disponibles pour ${selectedDate} :`),
                chunks.map((rows, i) => ({ title: i === 0 ? S('Uren', 'Créneaux') : `${S('Uren', 'Créneaux')} ${i + 1}`, rows })),
                S('Kies', 'Choisir')
            );
        }

        if (session.step === 'time') {
            const slotMatch = lower.match(/^time_(\d{2}:\d{2})$/);
            const selectedTime = slotMatch ? slotMatch[1] : msg;
            if (!/^\d{2}:\d{2}$/.test(selectedTime)) return waText(S('Ongeldig uurformaat. Voorbeeld: 14:00.', 'Format d’heure invalide. Exemple : 14:00.'));

            const slots = await getAvailableSlots(booking.date, booking.category, booking.duration, booking.barber || 'sofia');
            if (!slots.includes(selectedTime)) return waText(S('Dit uur is niet beschikbaar. Kies uit de lijst.', 'Cet horaire n’est pas disponible. Choisissez dans la liste.'));

            booking.time = selectedTime;
            session.step = 'confirm';
            return waButtons([
                S('Bevestig je afspraak:', 'Confirmez votre rendez-vous :'),
                `${S('Behandeling', 'Soin')}: ${booking.service}`,
                `${S('Specialiste', 'Spécialiste')}: ${booking.barberName}`,
                `${S('Datum', 'Date')}: ${booking.date}`,
                `${S('Uur', 'Heure')}: ${booking.time}`,
                `${S('Prijs', 'Prix')}: ${booking.price} €`
            ].join('\n'), [
                { id: 'confirm_yes', title: S('✅ Bevestigen', '✅ Confirmer') },
                { id: 'confirm_no', title: S('❌ Annuleren', '❌ Annuler') },
                { id: 'wa_cancel', title: '🏠 Menu' }
            ]);
        }

        if (session.step === 'confirm') {
            if (!['yes', 'no', 'confirm_yes', 'confirm_no'].includes(lower)) return waText(S('Kies ✅ Bevestigen of ❌ Annuleren.', 'Choisissez ✅ Confirmer ou ❌ Annuler.'));
            if (lower === 'no' || lower === 'confirm_no') {
                WA_SESSIONS.delete(from);
                return waText(S('Afspraak geannuleerd. Typ "menu" om terug te gaan.', 'Rendez-vous annulé. Tapez "menu" pour revenir.'));
            }

            const newAppt = await createAppointmentFromSession(from, { ...session, profile: WA_PROFILE.SOFIA });
            if (!newAppt) {
                WA_SESSIONS.delete(from);
                return waText(S('Dat uur is net bezet. Kies een ander uur.', 'Ce créneau vient d’être pris. Choisissez-en un autre.'));
            }

            const appointments = await getAppointments();
            appointments.push(newAppt);
            await saveAppointments(appointments);
            WA_SESSIONS.delete(from);
            return waButtons(
                `${S('Afspraak bevestigd', 'Rendez-vous confirmé')} ✅\n${newAppt.date} ${newAppt.time}\n${newAppt.service}\n${S('Specialiste', 'Spécialiste')}: ${newAppt.barberName}`,
                [
                    { id: 'wa_book', title: S('📅 Nieuwe afspraak', '📅 Nouveau rendez-vous') },
                    { id: 'wa_my', title: S('📋 Mijn afspraken', '📋 Mes rendez-vous') },
                    { id: 'wa_services', title: S('💆 Diensten', '💆 Services') }
                ]
            );
        }

        WA_SESSIONS.delete(from);
        return buildWaMainMenu(from);
    }

    if (activeProfile === WA_PROFILE.GARAGE) {
        if (['wa_switch_bot', 'switch bot', 'changer bot', 'bot wisselen'].includes(lower)) {
            if (existingSession) {
                const keepSession = { ...existingSession, step: null };
                delete keepSession.garage;
                WA_SESSIONS.set(from, keepSession);
            }
            WA_USER_PROFILE.delete(from);
            return buildWaProfileSelector();
        }

        const session = (existingSession && existingSession.profile === WA_PROFILE.GARAGE)
            ? existingSession
            : {
                profile: WA_PROFILE.GARAGE,
                step: 'garage_intent',
                garage: {},
                garageLead: existingSession?.garageLead || null
            };

        session.profile = WA_PROFILE.GARAGE;
        session.garage = session.garage || {};
        if (!session.step) session.step = 'garage_intent';

        const backToReview = session.garageBackToReview === true;
        const scheduleEdit = session.garageScheduleEdit === true;

        if (['garage_urgent', 'spoed', 'urgent'].includes(lower)) {
            const lead = getGarageLeadSnapshot(session, from);
            trackWaFunnel('garage_spoed', from);
            await notifyGarageLead(from, { ...lead, reason: 'Spoed' });
            WA_SESSIONS.set(from, session);
            return waButtons(
                '🚨 Spoed ontvangen. Een manager neemt zo snel mogelijk contact op.',
                [
                    { id: 'garage_continue', title: 'Verdergaan' },
                    { id: 'garage_call_manager', title: '📞 Bel manager' },
                    { id: 'garage_back_menu', title: 'Terug naar menu' }
                ]
            );
        }

        if (['garage_call_manager', 'bel manager', 'call manager', 'manager'].includes(lower)) {
            const lead = getGarageLeadSnapshot(session, from);
            trackWaFunnel('garage_manager_call', from);
            await notifyGarageLead(from, { ...lead, reason: 'Belverzoek' });
            WA_SESSIONS.set(from, session);
            return waButtons(
                'Dankje. We geven je aanvraag door aan een manager. Je wordt zo snel mogelijk teruggebeld.',
                [
                    { id: 'garage_continue', title: 'Verdergaan' },
                    { id: 'garage_urgent', title: '🚨 Spoed' },
                    { id: 'garage_back_menu', title: 'Terug naar menu' }
                ]
            );
        }

        if (['garage_continue', 'verdergaan', 'verder'].includes(lower)) {
            WA_SESSIONS.set(from, session);
            return buildGaragePromptForStep(session.step, session);
        }

        if (session.step === 'garage_intent') {
            const intent = pickGarageOption(lower, GARAGE_INTENT_OPTIONS, {
                'garage_intent_rk_stock': '🏪 RK voorraad bekijken',
                'garage_intent_rk_tradein': '🔁 RK inruil aanvraag',
                rk: '🏪 RK voorraad bekijken',
                voorraad: '🏪 RK voorraad bekijken',
                'rk voorraad': '🏪 RK voorraad bekijken',
                'rk inruil': '🔁 RK inruil aanvraag',
                kopen: '🚗 Auto kopen',
                inruilen: '🔁 Inruilen',
                proefrit: '📅 Proefrit',
                financiering: '💳 Financiering'
            });
            if (!intent) {
                WA_SESSIONS.set(from, session);
                return buildGarageIntentPrompt(true);
            }

            if (intent === '🏪 RK voorraad bekijken') {
                session.garage.rkSource = 'stock';
                session.garage.intent = '🚗 Auto kopen (RK Motors)';
                session.step = backToReview ? 'garage_review' : 'garage_budget';
                if (backToReview) delete session.garageBackToReview;
                WA_SESSIONS.set(from, session);
                if (backToReview) return buildGaragePromptForStep(session.step, session);
                return buildGarageBudgetPrompt(false, `RK Motors voorraad: ${RK_MOTORS_STOCK_URL}`);
            }

            if (intent === '🔁 RK inruil aanvraag') {
                session.garage.rkSource = 'tradein';
                session.garage.intent = '🔁 Inruilen (RK Motors)';
                session.garage.tradeIn = 'Ja, ik wil inruilen';
                session.garage.forceTradeIn = true;
                session.step = backToReview ? 'garage_review' : 'garage_budget';
                if (backToReview) delete session.garageBackToReview;
                WA_SESSIONS.set(from, session);
                if (backToReview) return buildGaragePromptForStep(session.step, session);
                return buildGarageBudgetPrompt(false, `RK Motors contact: ${RK_MOTORS_CONTACT_URL}`);
            }

            delete session.garage.forceTradeIn;
            if (!session.garage.rkSource) session.garage.rkSource = '';
            session.garage.intent = intent;
            session.step = backToReview ? 'garage_review' : 'garage_budget';
            if (backToReview) delete session.garageBackToReview;
            WA_SESSIONS.set(from, session);
            return buildGaragePromptForStep(session.step, session);
        }

        if (session.step === 'garage_budget') {
            const budget = pickGarageOption(lower, GARAGE_BUDGET_OPTIONS, {
                budget: '€10.000 - €20.000',
                goedkoop: 'Tot €10.000',
                midden: '€10.000 - €20.000',
                hoog: '€20.000+'
            });
            if (!budget) {
                WA_SESSIONS.set(from, session);
                return buildGarageBudgetPrompt(true);
            }
            session.garage.budget = budget;
            session.step = backToReview ? 'garage_review' : 'garage_car_need';
            if (backToReview) delete session.garageBackToReview;
            WA_SESSIONS.set(from, session);
            return buildGaragePromptForStep(session.step, session);
        }

        if (session.step === 'garage_car_need') {
            if (!msg) return buildGaragePromptForStep(session.step, session);
            session.garage.carNeed = msg;
            session.step = backToReview ? 'garage_review' : 'garage_priority';
            if (backToReview) delete session.garageBackToReview;
            WA_SESSIONS.set(from, session);
            return buildGaragePromptForStep(session.step, session);
        }

        if (session.step === 'garage_priority') {
            const priority = pickGarageOption(lower, GARAGE_PRIORITY_OPTIONS, {
                automaat: 'Automaat',
                zuinig: 'Zuinig / hybride',
                hybride: 'Zuinig / hybride',
                gezinsauto: 'Gezinsauto'
            });
            if (!priority) {
                WA_SESSIONS.set(from, session);
                return buildGaragePriorityPrompt(true);
            }
            session.garage.priority = priority;
            if (backToReview) {
                session.step = 'garage_review';
            } else if (session.garage.forceTradeIn) {
                session.garage.tradeIn = session.garage.tradeIn || 'Ja, ik wil inruilen';
                session.step = 'garage_next_step';
            } else {
                session.step = 'garage_tradein';
            }
            if (backToReview) delete session.garageBackToReview;
            WA_SESSIONS.set(from, session);
            return buildGaragePromptForStep(session.step, session);
        }

        if (session.step === 'garage_tradein') {
            const tradeIn = pickGarageOption(lower, GARAGE_TRADEIN_OPTIONS, {
                ja: 'Ja, ik wil inruilen',
                nee: 'Nee, geen inruil',
                later: 'Later beslissen',
                inruil: 'Ja, ik wil inruilen'
            });
            if (!tradeIn) {
                WA_SESSIONS.set(from, session);
                return buildGarageTradeInPrompt(true);
            }
            session.garage.tradeIn = tradeIn;
            delete session.garage.forceTradeIn;
            session.step = backToReview ? 'garage_review' : 'garage_next_step';
            if (backToReview) delete session.garageBackToReview;
            WA_SESSIONS.set(from, session);
            return buildGaragePromptForStep(session.step, session);
        }

        if (session.step === 'garage_next_step') {
            const nextStep = pickGarageOption(lower, GARAGE_NEXT_STEP_OPTIONS, {
                bellen: 'Belafspraak (10 min)',
                video: 'Video rondleiding',
                proefrit: 'Proefrit inplannen'
            });
            if (!nextStep) {
                WA_SESSIONS.set(from, session);
                return buildGarageNextStepPrompt(true);
            }
            session.garage.nextStep = nextStep;
            session.step = backToReview ? 'garage_review' : 'garage_day';
            if (backToReview) delete session.garageBackToReview;
            WA_SESSIONS.set(from, session);
            return buildGaragePromptForStep(session.step, session);
        }

        if (session.step === 'garage_day') {
            const day = pickGarageOption(lower, GARAGE_DAY_OPTIONS, {
                morgen: 'Morgen',
                donderdag: 'Donderdag',
                vrijdag: 'Vrijdag'
            });
            if (!day) {
                WA_SESSIONS.set(from, session);
                return buildGarageDayPrompt(true);
            }
            session.garage.day = day;
            if (scheduleEdit || !backToReview) {
                session.step = 'garage_time';
            } else {
                session.step = 'garage_review';
                delete session.garageBackToReview;
            }
            WA_SESSIONS.set(from, session);
            return buildGaragePromptForStep(session.step, session);
        }

        if (session.step === 'garage_time') {
            const time = pickGarageOption(lower, GARAGE_TIME_OPTIONS, {
                '09:00': '09:00',
                '13:30': '13:30',
                '16:00': '16:00'
            });
            if (!time) {
                WA_SESSIONS.set(from, session);
                return buildGarageTimePrompt(true);
            }
            session.garage.time = time;
            if (backToReview || scheduleEdit) {
                session.step = 'garage_review';
                delete session.garageBackToReview;
                delete session.garageScheduleEdit;
            } else {
                session.step = 'garage_contact';
            }
            WA_SESSIONS.set(from, session);
            return buildGaragePromptForStep(session.step, session);
        }

        if (session.step === 'garage_contact') {
            if (!msg) return buildGaragePromptForStep(session.step, session);
            session.garage.namePhone = msg;
            session.step = 'garage_review';
            if (backToReview) delete session.garageBackToReview;
            WA_SESSIONS.set(from, session);
            return buildGaragePromptForStep(session.step, session);
        }

        if (session.step === 'garage_review') {
            const editStepMap = {
                garage_edit_intent: 'garage_intent',
                garage_edit_budget: 'garage_budget',
                garage_edit_car_need: 'garage_car_need',
                garage_edit_priority: 'garage_priority',
                garage_edit_tradein: 'garage_tradein',
                garage_edit_next: 'garage_next_step',
                garage_edit_schedule: 'garage_day',
                garage_edit_contact: 'garage_contact'
            };

            const editStep = editStepMap[lower];
            if (editStep) {
                session.step = editStep;
                session.garageBackToReview = true;
                if (lower === 'garage_edit_schedule') session.garageScheduleEdit = true;
                WA_SESSIONS.set(from, session);
                return buildGaragePromptForStep(session.step, session);
            }

            if (!['garage_review_confirm', 'confirm_yes', 'yes'].includes(lower)) {
                WA_SESSIONS.set(from, session);
                return buildGaragePromptForStep(session.step, session, true);
            }

            const lead = {
                rkSource: session.garage.rkSource || '',
                intent: session.garage.intent || '',
                budget: session.garage.budget || '',
                carNeed: session.garage.carNeed || '',
                priority: session.garage.priority || '',
                tradeIn: session.garage.tradeIn || '',
                nextStep: session.garage.nextStep || '',
                day: session.garage.day || '',
                time: session.garage.time || '',
                namePhone: session.garage.namePhone || '',
                createdAt: new Date().toISOString()
            };

            session.garageLead = lead;
            session.step = 'garage_done';
            delete session.garage;
            delete session.garageBackToReview;
            delete session.garageScheduleEdit;
            WA_SESSIONS.set(from, session);
            trackWaFunnel('garage_lead_confirmed', from);
            await notifyGarageLead(from, lead);
            return waButtons(
                `✅ Afspraak bevestigd\n${lead.day} om ${lead.time}\nWe nemen contact op via ${lead.nextStep}.\nTot snel!`,
                [{ id: 'garage_back_menu', title: 'Terug naar menu' }]
            );
        }

        if (session.step === 'garage_done') {
            WA_SESSIONS.set(from, session);
            return buildGaragePromptForStep(session.step, session);
        }

        session.step = 'garage_intent';
        session.garage = {};
        delete session.garageBackToReview;
        delete session.garageScheduleEdit;
        WA_SESSIONS.set(from, session);
        return buildGarageIntentPrompt();
    }

    if (['info', 'wa_info'].includes(lower)) {
        const infoText = waLocale === 'fr'
            ? '📍 Alfons Pieterslaan 78, 8400 Ostende\n⏰ Mar-Sam: 09:00 - 18:00 | Dim-Lun: Fermé\n💳 Carte, cash et Apple Pay'
            : WA_INFO_TEXT;
        const valueText = waLocale === 'fr'
            ? 'Réservation 24/7, créneau immédiat, sans attente téléphonique.'
            : WA_VALUE_TEXT;
        const body = `${infoText}\n\n${ui(from, 'why')}\n• ${valueText}`;
        if (existingSession) {
            return buildResumeDetourResponse(from, body, activeProfile || existingSession?.profile || WA_PROFILE.KAPSALON);
        }
        return waText(body);
    }
    if (['wa_lang', 'taal', 'lang', 'language', 'langue'].includes(lower)) {
        if (activeProfile === WA_PROFILE.SOFIA) {
            return waButtons('Taal / Langue', [
                { id: 'lang_nl', title: 'NL' },
                { id: 'lang_fr', title: 'FR' }
            ]);
        }
        return waButtons('Kies taal / Choisissez la langue', [
            { id: 'lang_nl', title: 'NL' },
            { id: 'lang_fr', title: 'FR' }
        ]);
    }

    if (['lang_nl', 'lang_fr'].includes(lower)) {
        const locale = lower.replace('lang_', '');
        setWaLocale(from, locale);
        trackWaFunnel('lang_' + locale, from);
        if (existingSession) {
            return buildResumeDetourResponse(from, ui(from, 'langSaved'), activeProfile || existingSession?.profile || WA_PROFILE.KAPSALON);
        }
        WA_SESSIONS.delete(from);
        return waText(ui(from, 'langSaved'));
    }

    if (['wa_review', 'review', 'beoordeling', 'avis'].includes(lower)) {
        const body = L('Review link: ', 'Lien avis : ') + WA_REVIEW_LINK;
        if (existingSession) {
            return buildResumeDetourResponse(from, body, activeProfile || existingSession?.profile || WA_PROFILE.KAPSALON);
        }
        return waText(body);
    }
    if (['medewerker', 'team', 'kapper', 'wa_staff', 'équipe', 'equipe'].includes(lower)) {
        const body = buildWaStaffText(from);
        if (existingSession) {
            return buildResumeDetourResponse(from, body, activeProfile || existingSession?.profile || WA_PROFILE.KAPSALON);
        }
        return waText(body);
    }
    if (['services', 'service', 'wa_services', 'diensten', 'soins'].includes(lower)) {
        if (existingSession) {
            return buildResumeDetourResponse(from, buildKapsalonServicesSummaryText(from), activeProfile || existingSession?.profile || WA_PROFILE.KAPSALON);
        }
        return waList(
            L('Kies een diensten-categorie:', 'Choisissez une catégorie de services :'),
            [{
                title: L('Diensten', 'Services'),
                rows: [
                    { id: 'srv_top', title: L('Populaire behandelingen', 'Soins populaires'), description: L('Snel kiezen', 'Sélection rapide') },
                    { id: 'srv_male', title: L('Heren', 'Hommes'), description: L('Knippen, baard, styling', 'Coupe, barbe, styling') },
                    { id: 'srv_female', title: L('Dames', 'Femmes'), description: L('Knippen, kleur, brushen', 'Coupe, couleur, brushing') }
                ]
            }],
            L('Openen', 'Ouvrir')
        );
    }
    if (lower === 'wa_my' || lower === 'my bookings' || lower === 'mybookings' || lower === 'view' || lower === 'mijn afspraken' || lower === 'mes rendez-vous' || lower === 'mes rdv') {
        const bookingsText = await buildMyBookingsText(from);
        if (existingSession) {
            return buildResumeDetourResponse(from, bookingsText, activeProfile || existingSession?.profile || WA_PROFILE.KAPSALON);
        }
        return waText(bookingsText);
    }

    if (lower === 'srv_top') {
        return waList(
            L('Onze populairste behandelingen:', 'Nos soins les plus populaires :'),
            [{
                title: L('Populair', 'Populaire'),
                rows: [
                    { id: 'svcinfo_top1', title: WA_TOP_SERVICE_IDS.top1, description: L('Snel & strak', 'Rapide et soigné') },
                    { id: 'svcinfo_top2', title: WA_TOP_SERVICE_IDS.top2, description: L('Combi deal', 'Offre combinée') },
                    { id: 'svcinfo_top3', title: WA_TOP_SERVICE_IDS.top3, description: L('Meest geboekt dames', 'Le plus réservé femmes') }
                ]
            }],
            L('Kies', 'Choisir')
        );
    }

    if (lower === 'srv_male') {
        return waList(L('Kies een herenbehandeling:', 'Choisissez un soin homme :'), [{ title: L('Heren', 'Hommes'), rows: buildServiceRows('male', 'svcinfo', waLocale) }], L('Behandelingen', 'Soins'));
    }

    if (lower === 'srv_female') {
        return waList(L('Kies een damesbehandeling:', 'Choisissez un soin femme :'), [{ title: L('Dames', 'Femmes'), rows: buildServiceRows('female', 'svcinfo', waLocale) }], L('Behandelingen', 'Soins'));
    }

    const topMap = {
        svcinfo_top1: WA_TOP_SERVICE_IDS.top1,
        svcinfo_top2: WA_TOP_SERVICE_IDS.top2,
        svcinfo_top3: WA_TOP_SERVICE_IDS.top3
    };

    if (topMap[lower]) {
        return waButtons(buildServiceInfoText(topMap[lower], from), [
            { id: 'wa_book', title: L('📅 Boeken', '📅 Réserver') },
            { id: 'wa_services', title: L('💶 Diensten', '💶 Services') },
            { id: 'wa_cancel', title: L('🏠 Menu', '🏠 Menu') }
        ]);
    }

    const svcInfoMatch = lower.match(/^svcinfo_(male|female)_(\d+)$/);
    if (svcInfoMatch) {
        const category = svcInfoMatch[1];
        const index = Number.parseInt(svcInfoMatch[2], 10) - 1;
        const services = WA_SERVICE_MENU[category] || [];
        const service = services[index];
        if (service) {
            return waButtons(buildServiceInfoText(service, from), [
                { id: 'wa_book', title: L('📅 Boeken', '📅 Réserver') },
                { id: 'wa_services', title: L('💶 Diensten', '💶 Services') },
                { id: 'wa_cancel', title: L('🏠 Menu', '🏠 Menu') }
            ]);
        }
    }

    if (['book', 'appointment', 'schedule', 'boeken', 'wa_book', 'réserver', 'rendez-vous', 'rdv'].includes(lower)) {
        trackWaFunnel('funnel_start', from);
        WA_SESSIONS.set(from, { profile: WA_PROFILE.KAPSALON, step: 'category', booking: {} });
        return waButtons(L('Klaar om te boeken. Kies een categorie:', 'Prêt à réserver. Choisissez une catégorie :'), [
            { id: 'cat_male', title: L('👨 Heren', '👨 Hommes') },
            { id: 'cat_female', title: L('👩 Dames', '👩 Femmes') },
            { id: 'wa_cancel', title: L('❌ Stop', '❌ Stop') }
        ]);
    }

    if (!existingSession) {
        trackWaFunnel('drop_no_session', from);
        return buildWaMainMenu(from);
    }

    const session = existingSession;
    const booking = session.booking;

    if (session.step === 'category') {
        const category = (['1', 'cat_male', 'male', 'heren', 'hommes'].includes(lower))
            ? 'male'
            : ((['2', 'cat_female', 'female', 'dames', 'femmes'].includes(lower)) ? 'female' : null);
        if (!category) { trackWaFunnel('drop_category_invalid', from); return waText(L('Kies aub: 👨 Heren of 👩 Dames.', 'Choisissez : 👨 Hommes ou 👩 Femmes.')); }

        trackWaFunnel('funnel_category_selected', from);
        booking.category = category;
        session.step = 'service';
        const services = WA_SERVICE_MENU[category] || [];
        return waList(
            category === 'male' ? L('Kies een herenbehandeling:', 'Choisissez un soin homme :') : L('Kies een damesbehandeling:', 'Choisissez un soin femme :'),
            [{
                title: category === 'male' ? L('Herenbehandelingen', 'Soins hommes') : L('Damesbehandelingen', 'Soins femmes'),
                rows: services.slice(0, 10).map((service, idx) => ({
                    id: `svc_${idx + 1}`,
                    title: service,
                    description: `${SERVICE_DURATIONS[service] || DEFAULT_DURATION} min`
                }))
            }],
            L('Behandelingen', 'Soins')
        );
    }

    if (session.step === 'service') {
        const services = WA_SERVICE_MENU[booking.category] || [];
        const svcMatch = lower.match(/^svc_(\d+)$/);
        const index = svcMatch ? Number.parseInt(svcMatch[1], 10) : Number.parseInt(lower, 10);
        if (!Number.isInteger(index) || index < 1 || index > services.length) {
            trackWaFunnel('drop_service_invalid', from);
            return waText(L(`Stuur een geldig nummer van 1 t/m ${services.length}.`, `Envoyez un numéro valide de 1 à ${services.length}.`));
        }
        trackWaFunnel('funnel_service_selected', from);
        const service = services[index - 1];
        booking.service = service;
        booking.selectedServices = [service];
        booking.duration = SERVICE_DURATIONS[service] || DEFAULT_DURATION;

        const upsell = getUpsellOption(booking.category, service);
        booking.upsellOption = upsell;
        session.step = 'upsell';

        return waButtons(
            L('Top keuze: ', 'Excellent choix : ') + service + ' (' + booking.duration + ' min).\n' + L('Wil je ook ', 'Souhaitez-vous aussi ') + upsell.service + ' (+' + upsell.duration + ' min, ' + L('vanaf', 'à partir de') + ' €' + upsell.price + ')?',
            [
                { id: 'upsell_yes', title: L('✅ Ja, toevoegen', '✅ Oui, ajouter') },
                { id: 'upsell_no', title: L('Nee bedankt', 'Non merci') },
                { id: 'wa_cancel', title: L('🏠 Menu', '🏠 Menu') }
            ]
        );
    }

    if (session.step === 'upsell') {
        const upsell = booking.upsellOption;
        if (['upsell_yes', 'yes', 'ja'].includes(lower) && upsell) {
            trackWaFunnel('upsell_yes', from);
            if (!(booking.selectedServices || []).includes(upsell.service)) {
                booking.selectedServices = booking.selectedServices || [];
                booking.selectedServices.push(upsell.service);
            }
            booking.service = booking.selectedServices.join(' + ');
            booking.duration = (booking.duration || DEFAULT_DURATION) + (upsell.duration || 15);
        }
        if (!['upsell_yes', 'yes', 'ja'].includes(lower)) trackWaFunnel('upsell_no', from);
        session.step = 'barber';
        return waButtons(
            L('Gekozen: ', 'Choisi : ') + booking.service + ' (' + booking.duration + ' min). ' + L('Kies een kapper:', 'Choisissez un coiffeur :'),
            buildBarberButtons(booking.category, waLocale)
        );
    }

    if (session.step === 'barber') {
        const staffList = STAFF[booking.category] || [];
        let chosen = null;
        if (lower === 'barber_any' || lower.includes('maakt niet')) {
            chosen = { id: 'any', name: L('Eerste beschikbare kapper', 'Premier coiffeur disponible') };
        } else if (lower.startsWith('barber_')) {
            const staffId = lower.replace('barber_', '');
            chosen = staffList.find(s => s.id === staffId) || null;
        }

        if (!chosen && ['1', '2', '3'].includes(lower)) {
            const idx = Number.parseInt(lower, 10);
            if (idx === staffList.length + 1) {
                chosen = { id: 'any', name: L('Eerste beschikbare kapper', 'Premier coiffeur disponible') };
            } else {
                chosen = staffList[idx - 1] || null;
            }
        }

        if (!chosen) {
            trackWaFunnel('drop_barber_invalid', from);
            return waText(L('Kies aub een kapper via de knoppen.', 'Choisissez un coiffeur via les boutons.'));
        }

        trackWaFunnel('funnel_barber_selected', from);
        if (chosen.id === 'any') {
            booking.barber = 'any';
            booking.barberName = chosen.name;
        } else {
            booking.barber = chosen.id;
            booking.barberName = chosen.name;
        }

        session.step = 'date';
        return waButtons(L('Kies een datum:', 'Choisissez une date :'), [
            { id: 'date_today', title: L('📅 Vandaag', '📅 Aujourd’hui') },
            { id: 'date_tomorrow', title: L('📅 Morgen', '📅 Demain') },
            { id: 'date_manual', title: L('✍️ Zelf typen', '✍️ Saisir date') }
        ]);
    }

    if (session.step === 'date') {
        const dateInput =
            lower === 'date_today' ? 'today'
                : (lower === 'date_tomorrow' ? 'tomorrow' : msg);
        if (lower === 'date_manual') {
            return waText(L('Typ de datum als YYYY-MM-DD (bijv. 2026-02-25).', 'Saisissez la date au format YYYY-MM-DD (ex: 2026-02-25).'));
        }

        const selectedDate = parseDateInput(dateInput);
        if (!selectedDate) { trackWaFunnel('drop_date_invalid', from); return waText(L('Ongeldige datum. Gebruik vandaag/morgen of YYYY-MM-DD.', 'Date invalide. Utilisez aujourd’hui/demain ou YYYY-MM-DD.')); }

        if (selectedDate < getLocalDate()) return waText(L('Die datum ligt in het verleden. Kies een andere datum.', 'Cette date est dans le passé. Choisissez une autre date.'));
        if (await isClosedDay(selectedDate)) return waText(L('De salon is gesloten op die datum. Kies een andere dag.', 'Le salon est fermé ce jour-là. Choisissez un autre jour.'));

        const slots = await getAvailableSlots(selectedDate, booking.category, booking.duration, booking.barber || 'any');
        if (!slots.length) { trackWaFunnel('drop_no_slots', from); return waText(L('Geen beschikbare uren op die datum. Kies een andere dag.', 'Aucun créneau disponible à cette date. Choisissez un autre jour.')); }

        booking.date = selectedDate;
        session.step = 'time';
        return waList(
            L(`Beschikbare uren op ${selectedDate}:`, `Créneaux disponibles le ${selectedDate} :`),
            [{
                title: L('Uren', 'Créneaux'),
                rows: slots.slice(0, 10).map((slot) => ({
                    id: `time_${slot}`,
                    title: slot,
                    description: L(`Duur ${booking.duration} min`, `Durée ${booking.duration} min`)
                }))
            }],
            L('Uren', 'Créneaux')
        );
    }

    if (session.step === 'time') {
        const slotMatch = lower.match(/^time_(\d{2}:\d{2})$/);
        const selectedTime = slotMatch ? slotMatch[1] : msg;
        if (!/^\d{2}:\d{2}$/.test(selectedTime)) { trackWaFunnel('drop_time_format', from); return waText(L('Ongeldig tijdformaat. Gebruik HH:MM, bv. 14:00.', 'Format invalide. Utilisez HH:MM, ex: 14:00.')); }

        const slots = await getAvailableSlots(booking.date, booking.category, booking.duration, booking.barber || 'any');
        if (!slots.includes(selectedTime)) { trackWaFunnel('drop_time_unavailable', from); return waText(L(`Dit uur is niet beschikbaar. Kies uit: ${slots.join(', ')}`, `Cette heure n’est pas disponible. Choisissez : ${slots.join(', ')}`)); }

        trackWaFunnel('funnel_time_selected', from);
        booking.time = selectedTime;
        session.step = 'confirm';
        const basePrice = getBookingBasePrice(booking);
        return waButtons([
            L('Bevestig je afspraak:', 'Confirmez votre rendez-vous :'),
            `${L('Behandeling', 'Soin')}: ${booking.service}`,
            `${L('Kapper', 'Coiffeur')}: ${booking.barberName}`,
            `${L('Datum', 'Date')}: ${booking.date}`,
            `${L('Tijd', 'Heure')}: ${booking.time}`,
            `${L('Prijs vanaf', 'Prix à partir de')}: €${basePrice}`
        ].join('\n'), [
            { id: 'confirm_yes', title: L('✅ Bevestigen', '✅ Confirmer') },
            { id: 'confirm_no', title: L('❌ Annuleren', '❌ Annuler') },
            { id: 'wa_cancel', title: L('🏠 Menu', '🏠 Menu') }
        ]);
    }

    if (session.step === 'confirm') {
        if (!['yes', 'no', 'confirm_yes', 'confirm_no'].includes(lower)) { trackWaFunnel('drop_confirm_invalid', from); return waText(L('Kies aub ✅ Bevestigen of ❌ Annuleren.', 'Choisissez ✅ Confirmer ou ❌ Annuler.')); }
        if (lower === 'no' || lower === 'confirm_no') {
            trackWaFunnel('drop_confirm_cancel', from);
            WA_SESSIONS.delete(from);
            return waText(L('Afspraak geannuleerd. Typ "book" om opnieuw te starten.', 'Rendez-vous annulé. Tapez "book" pour recommencer.'));
        }

        trackWaFunnel('funnel_confirmed', from);
        const newAppt = await createAppointmentFromSession(from, session);
        if (!newAppt) {
            WA_SESSIONS.delete(from);
            return waText(L('Dit uur is net bezet geraakt. Typ "book" en probeer opnieuw.', 'Ce créneau vient d’être pris. Tapez "book" et réessayez.'));
        }

        const appointments = await getAppointments();
        appointments.push(newAppt);
        await saveAppointments(appointments);
        WA_SESSIONS.delete(from);

        return waButtons(
            `${L('Afspraak bevestigd', 'Rendez-vous confirmé')} ✅\n${newAppt.date} ${newAppt.time}\n${newAppt.service}\n${L('Kapper', 'Coiffeur')}: ${newAppt.barberName}\n📍 Alfons Pieterslaan 78, Oostende`,
            [
                { id: 'wa_book', title: L('📅 Nieuwe afspraak', '📅 Nouveau rendez-vous') },
                { id: 'wa_info', title: 'ℹ️ Info' },
                { id: 'wa_services', title: L('💶 Diensten', '💶 Services') }
            ]
        );
    }

    WA_SESSIONS.delete(from);
    trackWaFunnel('drop_session_expired', from);
    return waText(L('Sessie verlopen. Typ "book" om opnieuw te starten.', 'Session expirée. Tapez "book" pour recommencer.'));
};

const sendWaText = async (phoneNumberId, to, body) => {
    await sendWhatsAppPayload(phoneNumberId, to, {
        type: 'text',
        text: { body },
    }, 'whatsapp-hub');
};

const sendWaButtons = async (phoneNumberId, to, body, buttons) => {
    await sendWhatsAppPayload(phoneNumberId, to, {
        type: 'interactive',
        interactive: {
            type: 'button',
            body: { text: body },
            action: {
                buttons: (buttons || []).slice(0, 3).map((btn) => ({
                    type: 'reply',
                    reply: { id: btn.id, title: String(btn.title || '').slice(0, 20) }
                }))
            }
        }
    }, 'whatsapp-hub');
};

const sendWaList = async (phoneNumberId, to, body, sections, buttonText = 'Kies') => {
    await sendWhatsAppPayload(phoneNumberId, to, {
        type: 'interactive',
        interactive: {
            type: 'list',
            body: { text: body },
            action: {
                button: buttonText,
                sections: (sections || []).map((sec) => ({
                    title: sec.title,
                    rows: (sec.rows || []).slice(0, 10).map((row) => ({
                        id: row.id,
                        title: String(row.title || '').slice(0, 24),
                        description: String(row.description || '').slice(0, 72)
                    }))
                }))
            }
        }
    }, 'whatsapp-hub');
};

const sendWaFlow = async (phoneNumberId, to, response) => {
    await sendWhatsAppPayload(phoneNumberId, to, {
        type: 'interactive',
        interactive: {
            type: 'flow',
            ...(response.header ? { header: { type: 'text', text: String(response.header).slice(0, 60) } } : {}),
            body: { text: String(response.body || '').slice(0, 1024) },
            ...(response.footer ? { footer: { text: String(response.footer).slice(0, 60) } } : {}),
            action: {
                name: 'flow',
                parameters: {
                    flow_message_version: FLOW_MESSAGE_VERSION,
                    flow_token: buildFlowToken(to, response.profile || 'flow'),
                    flow_id: String(response.flowId || ''),
                    flow_cta: String(response.cta || 'Open flow').slice(0, 30),
                    flow_action: response.mode === 'data_exchange' ? 'data_exchange' : 'navigate',
                    ...(response.screen || response.data ? {
                        flow_action_payload: {
                            ...(response.screen ? { screen: response.screen } : {}),
                            ...(response.data ? { data: response.data } : {}),
                        },
                    } : {}),
                }
            }
        }
    }, 'whatsapp-hub');
};

// Handling incoming messages
app.post('/webhook', async (req, res) => {
    const body = req.body;

    if (body.message) {
        const response = await handleWhatsAppMessage('local-ui', body.message);
        const locale = getWaLocale('local-ui');
        const normalizedResponse = normalizeWaResponseForSpanish(locale, response);
        if (normalizedResponse.type === 'buttons') {
            return res.json({ reply: normalizedResponse.body, options: (normalizedResponse.buttons || []).map(b => b.title) });
        }
        if (normalizedResponse.type === 'list') {
            const options = (normalizedResponse.sections || []).flatMap(s => (s.rows || []).map(r => r.title));
            return res.json({ reply: normalizedResponse.body, options });
        }
        if (normalizedResponse.type === 'flow') {
            return res.json({ reply: normalizedResponse.body || '', options: [normalizedResponse.cta || 'Open flow'] });
        }
        return res.json({ reply: normalizedResponse.body || '', options: [] });
    }

    if (!body.object) return res.sendStatus(404);

    try {
        const value = body?.entry?.[0]?.changes?.[0]?.value;
        const incomingMessage = value?.messages?.[0];
        if (!incomingMessage) return res.sendStatus(200);

        rememberRuntimeWabaId(body?.entry?.[0]?.id);
        const phoneNumberId = value?.metadata?.phone_number_id || WA_PHONE_NUMBER_ID;
        const allowedPhoneIds = (process.env.WA_ALLOWED_PHONE_NUMBER_IDS || WA_PHONE_NUMBER_ID || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
        if (allowedPhoneIds.length && !allowedPhoneIds.includes(String(phoneNumberId))) {
            console.log(`Skip webhook for phone_number_id=${phoneNumberId}; allowed=${allowedPhoneIds.join(',')}`);
            return res.sendStatus(200);
        }
        const from = incomingMessage.from;
        const rawText = parseIncomingWaText(incomingMessage);
        const activeProfile = getWaProfile(from);

        console.log(`Received WhatsApp message from ${from}: ${typeof rawText === 'object' ? JSON.stringify(rawText) : rawText}`);

        const response = await handleWhatsAppMessage(from, rawText);
        const locale = getWaLocale(from);
        const normalizedResponse = normalizeWaResponseForSpanish(locale, response);
        if (normalizedResponse.type === 'buttons') {
            await sendWaButtons(phoneNumberId, from, normalizedResponse.body, normalizedResponse.buttons);
        } else if (normalizedResponse.type === 'list') {
            await sendWaList(phoneNumberId, from, normalizedResponse.body, normalizedResponse.sections, normalizedResponse.buttonText || 'Kies');
        } else if (normalizedResponse.type === 'flow') {
            await sendWaFlow(phoneNumberId, from, normalizedResponse);
        } else {
            await sendWaText(phoneNumberId, from, normalizedResponse.body || '');
        }
    } catch (error) {
        console.error('Error processing WhatsApp webhook:', error.response ? error.response.data : error.message);
    }

    return res.sendStatus(200);
});

if (process.env.TRANSPORT_MODE === 'sim') {
    app.post('/__sim/reset-session', (req, res) => {
        const user = String(req.body?.user || '').trim();

        if (user) {
            WA_SESSIONS.delete(user);
            WA_USER_PREFS.delete(user);
            WA_USER_PROFILE.delete(user);
        } else {
            WA_SESSIONS.clear();
            WA_USER_PREFS.clear();
            WA_USER_PROFILE.clear();
        }

        return res.json({
            ok: true,
            user: user || null,
        });
    });
}

// Cron job for reminders — runs every 15 min, sends 2h before appointment
scheduleCron('*/15 * * * *', async () => {
    try {
        const appointments = await getAppointments();
        const now = new Date();
        let changed = false;

        for (const apt of appointments) {
            if (!apt.date || !apt.time || apt.reminder_sent) continue;
            if (apt.status === 'cancelled') continue;
            if (!apt.telegramUserId) continue;

            const targetTime = new Date(apt.date + 'T' + apt.time + ':00');
            const brusselsNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Brussels' }));
            const timeDiff = targetTime - brusselsNow;

            // Between 1.5h and 2.5h before appointment
            if (timeDiff > 1.5 * 60 * 60 * 1000 && timeDiff < 2.5 * 60 * 60 * 1000) {
                const svcName = (apt.services || [apt.details]).join(', ');
                const locale = apt.locale || 'nl';

                // Build localized reminder using i18n
                const reminderText = i18n.t(locale, 'reminder', {
                    time: apt.time,
                    service: svcName,
                    barber: apt.barberName || '?'
                });

                try {
                    await bot.telegram.sendMessage(apt.telegramUserId, reminderText, { parse_mode: 'HTML' });
                    apt.reminder_sent = true;
                    changed = true;
                    console.log(`Reminder sent to ${apt.telegramUserId} for ${apt.date} ${apt.time}`);
                } catch (e) {
                    console.log(`Could not send reminder to ${apt.telegramUserId}: ${e.message}`);
                }
            }
        }

        if (changed) await saveAppointments(appointments);
    } catch (e) {
        console.error('Reminder cron error:', e.message);
    }
});

// Cron: Sunday 20:00 — Admin weekly schedule check
scheduleCron('0 20 * * 0', async () => {
    try {
        const ADMIN_NOTIFY_ID = Number(process.env.ADMIN_TELEGRAM_ID) || 0;
        if (!ADMIN_NOTIFY_ID || !bot.telegram) return;

        // Show next week's appointment count
        const appointments = await getAppointments();
        const today = new Date();
        const nextWeekDates = [];
        for (let i = 1; i <= 7; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() + i);
            nextWeekDates.push(d.toISOString().split('T')[0]);
        }
        const nextWeekAppts = appointments.filter(a =>
            nextWeekDates.includes(a.date) && a.status !== 'cancelled'
        );

        let text = i18n.t('nl', 'weekly_check');
        text += `\n\n📅 Komende week: <b>${nextWeekAppts.length} afspraken</b>`;

        // Show per-day breakdown
        for (const d of nextWeekDates) {
            const dayAppts = nextWeekAppts.filter(a => a.date === d);
            if (dayAppts.length > 0) {
                const dayName = new Date(d).toLocaleDateString('nl-BE', { weekday: 'short', timeZone: 'Europe/Brussels' });
                text += `\n  ${dayName} ${d}: ${dayAppts.length} afspraken`;
            }
        }

        // Show current blocks
        const blocks = await getBarberBlocks();
        const activeBlocks = blocks.filter(b => nextWeekDates.includes(b.date));
        if (activeBlocks.length > 0) {
            text += '\n\n🚫 <b>Actieve blokkeringen:</b>';
            for (const b of activeBlocks) {
                text += `\n  ${b.barberName || b.barber} — ${b.date}`;
            }
        }

        await bot.telegram.sendMessage(ADMIN_NOTIFY_ID, text, { parse_mode: 'HTML' });
    } catch (e) {
        console.error('Weekly check cron error:', e.message);
    }
});

// Cron: Auto-backup at closing time (18:00 every day)
scheduleCron('0 18 * * *', async () => {
    try {
        const backupDir = path.join(__dirname, 'backups');
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

        const today = getLocalDate();
        const backupFile = path.join(backupDir, `appointments_${today}.json`);
        fs.copyFileSync(DB_FILE, backupFile);
        console.log(`Backup created: ${backupFile}`);

        // Keep only last 30 backups
        const files = fs.readdirSync(backupDir)
            .filter(f => f.startsWith('appointments_') && f.endsWith('.json'))
            .sort();
        while (files.length > 30) {
            const oldest = files.shift();
            fs.unlinkSync(path.join(backupDir, oldest));
            console.log(`Old backup deleted: ${oldest}`);
        }

        // Notify admin
        const ADMIN_NOTIFY_ID = Number(process.env.ADMIN_TELEGRAM_ID) || 0;
        if (ADMIN_NOTIFY_ID && bot.telegram) {
            const apptCount = getAppointments().length;
            await bot.telegram.sendMessage(ADMIN_NOTIFY_ID,
                `💾 <b>Dagelijkse backup gemaakt</b>\n\n📅 ${today}\n📊 ${apptCount} afspraken opgeslagen\n📁 backups/appointments_${today}.json`,
                { parse_mode: 'HTML' }
            );
        }
    } catch (e) {
        console.error('Backup failed:', e.message);
    }
});

// Cron: Post-appointment review nudge (runs every hour)
// Sends a review request ~4 hours after a completed appointment
scheduleCron('30 * * * *', async () => {
    try {
        const appointments = await getAppointments();
        const now = new Date();
        let changed = false;

        for (const apt of appointments) {
            // Only for confirmed/completed appointments that haven't been nudged yet
            if (!apt.date || !apt.time || apt.review_sent) continue;
            if (apt.status !== 'confirmed' && apt.status !== 'completed') continue;
            if (!apt.telegramUserId && !apt.whatsappUserId && !apt.phone) continue;

            const apptStart = new Date(apt.date + 'T' + apt.time + ':00');
            const duration = apt.duration || 30;
            const apptEnd = new Date(apptStart.getTime() + duration * 60 * 1000);
            const hoursSinceEnd = (now - apptEnd) / (1000 * 60 * 60);

            // Send between 3.5 and 4.5 hours after the appointment ends
            if (hoursSinceEnd >= 3.5 && hoursSinceEnd < 4.5) {
                const barberName = apt.barberName || 'ons';
                let sent = false;

                if (apt.telegramUserId) {
                    try {
                        await bot.telegram.sendMessage(apt.telegramUserId,
                            `Hoe was je bezoek bij <b>${barberName}</b>? ⭐\n\nWe zouden het geweldig vinden als je een review achterlaat!`,
                            {
                                parse_mode: 'HTML',
                                ...Markup.inlineKeyboard([
                                    [Markup.button.url('⭐ Google Review', WA_REVIEW_LINK)]
                                ])
                            }
                        );
                        sent = true;
                        console.log(`Review nudge sent to telegram ${apt.telegramUserId} for appt ${apt.id}`);
                    } catch (e) {
                        console.log(`Could not send telegram review nudge to ${apt.telegramUserId}: ${e.message}`);
                    }
                }

                const waTo = apt.whatsappUserId || apt.phone;
                if (waTo) {
                    try {
                        const localeKey = apt.locale && ['nl', 'ru', 'es'].includes(apt.locale) ? apt.locale : 'nl';
                        const postMsg = (WA_UI[localeKey] || WA_UI.nl).postVisit;
                        await sendWaButtons(WA_PHONE_NUMBER_ID, waTo, postMsg, [
                            { id: 'wa_review', title: '⭐ Review' },
                            { id: 'wa_book', title: '📅 Opnieuw boeken' },
                            { id: 'wa_info', title: 'ℹ️ Info' }
                        ]);
                        sent = true;
                        console.log(`Review/rebook nudge sent to whatsapp ${waTo} for appt ${apt.id}`);
                    } catch (e) {
                        console.log(`Could not send whatsapp review nudge to ${waTo}: ${e.message}`);
                    }
                }

                if (sent) {
                    apt.review_sent = true;
                    apt.post_visit_sent = true;
                    changed = true;
                }
            }
        }

        if (changed) await saveAppointments(appointments);
    } catch (e) {
        console.error('Review nudge cron error:', e.message);
    }
});

// Stripe: verify paid checkout session and release full document
app.get("/payment/release", async (req, res) => {
    try {
        if (!stripe) return res.status(500).json({ ok: false, error: "Stripe is not configured" });

        const sessionId = String(req.query.session_id || "").trim();
        if (!sessionId) return res.status(400).json({ ok: false, error: "session_id is required" });

        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (!session) return res.status(404).json({ ok: false, error: "Session not found" });

        const paid = session.payment_status === "paid" || session.status === "complete";
        if (!paid) return res.status(402).json({ ok: false, error: "Payment not completed" });

        const ref = String(session.client_reference_id || "").trim();
        if (!ref) return res.status(400).json({ ok: false, error: "No document reference in session" });

        let decoded = "";
        try {
            decoded = Buffer.from(ref, "base64url").toString("utf8");
        } catch (e) {
            return res.status(400).json({ ok: false, error: "Bad document reference" });
        }

        const allowed = decoded.startsWith("/generated/") || decoded.startsWith("https://arrestofnet.asia/generated/");
        if (!allowed) return res.status(400).json({ ok: false, error: "Document URL is not allowed" });

        const docUrl = decoded.startsWith("http") ? decoded : `https://arrestofnet.asia`;
        return res.json({ ok: true, paid: true, url: docUrl });
    } catch (error) {
        console.error("Stripe release error:", error.message);
        return res.status(500).json({ ok: false, error: "Internal error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} and Telegram Bot is ${TELEGRAM_ENABLED ? 'active' : 'disabled'}`);
});
