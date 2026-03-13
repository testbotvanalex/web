export const TEXTS = {
    ru: { // Actually making this English by default for "Russian" users if they land here
        // Reminders
        reminder_15m: "You didn't finish filling the document. Need help?",
        reminder_1h: "Reminder: we are still waiting for your data to prepare the document. If you have questions — click the button below.",
        reminder_3h: "Looks like you are busy now. We saved your progress. When convenient — just write to us and we will continue! 👋",
        btn_contact: "👤 Contact Operator",

        consent_title: "Data Collection Consent",
        consent_text:
            "In accordance with the Law, " +
            "to prepare documents we need your consent for data processing " +
            "(Name, IIN, phone, address).\n\n" +
            "Click «Agree» to continue.",
        consent_btn_yes: "✅ Agree",
        consent_btn_no: "❌ Disagree",
        consent_declined:
            "Without consent, we cannot process data and prepare documents.\n\n" +
            "To start over, type «start».",

        greeting_with_name: "Hello, {{name}}! 👋\nI am your legal assistant BotMatic.\n\nPlease select language:",
        greeting_generic: "Hello! 👋\nI am your legal assistant BotMatic.\n\nPlease select language:",

        main_menu: "Main Menu. Please select a service from the list below:",

        donate_text: "✅ Документ готов и отправлен.\nЕсли сервис был полезен — вы можете поддержать его на любую сумму. Это помогает поддерживать бот и добавлять новые документы.",
        donate_link_text: "Ссылка для поддержки: https://buy.stripe.com/eVqdRa4WJ7sidyxa2800000",
        review_prompt: "Оцените, пожалуйста:",
        thanks_text: "Спасибо!",

        // HYBRID FLOW TEXTS
        check_arrests_text:
            "🔍 *Проверить аресты / Тексеру:*\n\n" +
            "Проверьте аресты по ссылке ниже:\n" +
            "🔗 https://aisoip.adilet.gov.kz/",

        btn_check_link: "🌐 AISOIP.GOV.KZ",

        attention_text:
            "⚠️ *ВНИМАНИЕ / НАЗАР АУДАРЫҢЫЗ!!!*\n\n" +
            "При проверке на сайте обратите внимание на эти строки:\n\n" +
            "1️⃣ *«Орган выдавший документ»* -> если написано *«Нотариальная палата»*:\n" +
            "👉 В меню выберите **«📄 ЧСИ (Нотариус)»** или **«✍️ Возражение»**.\n\n" +
            "2️⃣ Если написано *«Решение суда»*, *«ДВД»* и т.д.:\n" +
            "👉 Нажмите **«👤 Связь со специалистом»**.",

        // Updated Menu Items
        btn_s1: "Заявление ЧСИ об ознакомлении",
        btn_s2: "Возражение на исполнительную надпись",
        btn_complaint: "Жалоба на ЧСИ",
        btn_restruct: "Заявление на реструктуризацию",
        btn_price: "💳 Поддержать сервис",
        btn_operator: "Связь со специалистом",
        btn_docs_menu: "📂 Меню документов",
        btn_check_arrests: "🔍 Как проверить аресты",

        // New Placeholders
        complaint_text: "🚨 *Жалоба на ЧСИ*\n\nЕсли ЧСИ игнорирует вас в WhatsApp или нарушает закон, мы поможем подать жалобу.\n\nНапишите специалисту для подробностей 👇",
        restruct_text: "🔄 *Реструктуризация*\n\nПереговоры с банком/ЧСИ для графика погашения.\n\nНапишите специалисту для подробностей 👇",


        info_how_text: // [NEW]
            "📋 *Как это работает:*\n\n" +
            "1. Выберите нужную услугу в меню.\n" +
            "2. Заполните данные (Бот будет спрашивать по шагам).\n" +
            "3. Получите готовый PDF документ.\n" +
            "4. Распечатайте и отправьте куда нужно (ЧСИ или Нотариусу).\n\n" +
            "Выберите пункт меню, чтобы начать 👇",

        info_price_text:
            "💳 *Стоимость и оплата:*\n\n" +
            "🎉 **Пока бесплатно!**\n\n" +
            "Мы работаем в тестовом режиме, поэтому денег не берем.\n" +
            "Если хотите поддержать проект — можно отправить добровольный взнос.\n\n" +
            "Оплата по ссылке: https://buy.stripe.com/14A14o88VfYO2TTfms00002\n\n" +
            "Спасибо за поддержку!",

        info_contacts_text:


            "📞 *Контакты и поддержка:*\n\n" +
            "• Виолетта: +7 707 019 1037\n" +
            "• Санжар: +7 708 711 07 30\n\n" +
            "• WhatsApp: wa.me/77070191037\n" +
            "• WhatsApp: wa.me/77087110730\n" +
            "• Telegram: @support_arrestov",

        menu_btn: "Открыть услуги",
        btn_s1: "📄 Bailiff Statement",
        btn_s2: "✍️ Objection",
        btn_more: "📂 Other Docs",
        btn_operator: "👤 Specialist",

        more_docs_title: "Other documents:",
        btn_notary: "📄 Notary",

        operator_ask:
            "📞 *Contact Specialist:*\n\n" +
            "👇 *Click to write on WhatsApp:*\n\n" +
            "👤 Violetta: https://wa.me/77070191037\n" +
            "👤 Sanzhar: https://wa.me/77087110730\n\n" +
            "Or write your question in one message here — I will pass it to the specialist:",
        operator_sent: "✅ Accepted! I passed the message to the specialist.",

        btn_yes: "✅ Yes",
        btn_back: "⬅️ Back",
        btn_edit: "✏️ Edit",
        btn_menu: "🏠 Menu",

        edit_title: "Editing",
        edit_desc: "Select the field you want to change:",

        confirm_title: "Check data:",
        processing: "⏳ Preparing document, please wait...",
        doc_ready_s1: "✅ Document ready! Print, sign, and send to the bailiff.",
        doc_ready_s2: "✅ Document ready! Send to the notary.",

        after_doc_title: "Done ✅ What's next?",
        after_doc_btn_q: "❓ Question",
        after_doc_btn_fb: "⭐ Feedback",
        after_doc_btn_rahmet: "🙏 Thanks",
        after_doc_q_ask: "Write your question in one message — I will pass it to the specialist:",
        after_doc_fb_ask: "Write your feedback in one message:",
        after_doc_thanks: "Thanks! ✅ Message sent.",

        rahmet_reply: "Thanks! 😊\nGlad I could help.\nPlease rate the work:",
        rahmet_btn_rate: "⭐ Rate",

        video_choice_text: "Before filling, you can watch the video instruction. What to do?",
        btn_watch_video: "▶️ Watch Video",
        btn_continue: "➡️ Continue",

        errors: {
            date: "⚠️ Date format DD.MM.YYYY (e.g. 25.12.2023).",
            iin: "⚠️ IIN must be 12 digits.",
            email: "⚠️ Email is required. Enter a valid email (example: name@gmail.com).",
        },

        steps_s1: [
            "🧾 Step 1/11. Bailiff Full Name:",
            "📍 Step 2/11. Bailiff Address:",
            "📞 Step 3/11. Bailiff Phone (or «no»):",
            "✉️ Step 4/11. Bailiff Email (or «no»):",
            "№ Step 5/11. Enforcement Proceeding Number:",
            "📅 Step 6/11. Opening Date (DD.MM.YYYY):",
            "👤 Step 7/11. Your Full Name:",
            "🏠 Step 8/11. Your Address:",
            "🆔 Step 9/11. Your IIN (12 digits):",
            "📱 Step 10/11. Your Phone:",
            "✉️ Step 11/11. Your Email:",
        ],

        steps_s2: [
            "👤 Step 1/11. Notary Full Name:",
            "📍 Step 2/11. Notary Address:",
            "📞 Step 3/11. Notary Phone (or «no»):",
            "✉️ Step 4/11. Notary Email (or «no»):",
            "🏛️ Step 5/11. Creditor Name:",
            "👤 Step 6/11. Your Full Name:",
            "🏠 Step 7/11. Your Address:",
            "🆔 Step 8/11. Your IIN (12 digits):",
            "📱 Step 9/11. Your Phone:",
            "💰 Step 10/11. Debt Amount:",
            "✉️ Step 11/11. Your Email:",
        ],

        // Notary Flow Extra
        notary_choice_ask: "👤 Шаг 1/11. Как вы хотите указать нотариуса?",
        btn_search_base: "🔍 Найти в базе",
        btn_manual_entry: "✍️ Ввести вручную",
        notary_search_ask: "🔎 Введите ФИО нотариуса (или часть) для поиска:",
        notary_manual_ask: "✍️ Введите ФИО нотариуса (полностью):",
        notary_not_found: "😔 Нотариус не найден. Попробуйте другой запрос или введите вручную.",
        btn_retry: "🔄 Искать снова",
    },

    kk: {
        // Reminders
        reminder_15m: "Сіз құжатты толтыруды аяқтамадыңыз. Көмек керек пе?",
        reminder_1h: "Ескерту: құжатты дайындау үшін деректеріңізді күтеміз. Сұрақтарыңыз болса — төмендегі батырманы басыңыз.",
        reminder_3h: "Қазір уақытыңыз жоқ сияқты. Біз сіздің нәтижеңізді сақтадық. Ыңғайлы болғанда жазыңыз, жалғастырамыз! 👋",
        btn_contact: "👤 Маманмен байланысу",

        consent_title: "Деректерді жинау келісімі",
        consent_text:
            "ҚР «Дербес деректер және оларды қорғау туралы» Заңына сәйкес, " +
            "құжаттарды дайындау үшін сіздің деректеріңізді (аты-жөні, ЖСН, телефон, мекенжай) " +
            "жинауға және өңдеуге келісіміңіз қажет.\n\n" +
            "Жалғастыру үшін «Келісемін» басыңыз.",
        consent_btn_yes: "✅ Келісемін",
        consent_btn_no: "❌ Келіспеймін",
        consent_declined:
            "Келісімсіз біз деректерді өңдей алмаймыз және құжат дайындай алмаймыз.\n\n" +
            "Қайта бастау үшін «старт» деп жазыңыз.",

        greeting_with_name: "Сәлеметсіз бе, {{name}}! 👋\nМен — сіздің заңгер көмекшіңіз ArrestovNet.\n\nТілді таңдаңыз / Выберите язык:",
        greeting_generic: "Сәлеметсіз бе! 👋\nМен — сіздің заңгер көмекшіңіз ArrestovNet.\n\nТілді таңдаңыз / Выберите язык:",

        // HYBRID FLOW TEXTS
        check_arrests_text:
            "🔍 *Тексеру / Проверить аресты:*\n\n" +
            "Төмендегі сілтеме арқылы аресттерді тексеріңіз:\n" +
            "🔗 https://aisoip.adilet.gov.kz/",

        btn_check_link: "🌐 AISOIP.GOV.KZ",

        attention_text:
            "⚠️ *НАЗАР АУДАРЫҢЫЗ / ВНИМАНИЕ!!!*\n\n" +
            "Сайтта тексеру кезінде мына жолдарға мән беріңіз:\n\n" +
            "1️⃣ *«Орган выдавший документ»* -> егер *«Нотариальная палата»* деп жазылса:\n" +
            "👉 Мәзірден **«📄 ЧСИ (Нотариус)»** немесе **«✍️ Возражение»** таңдаңыз.\n\n" +
            "2️⃣ Егер *«Решение суда»*, *«ДВД»* және т.б. жазылса:\n" +
            "👉 **«👤 Связь со специалистом»** басыңыз.",

        main_menu: "Басты мәзір. Төменнен қызметті таңдаңыз:",

        donate_text: "✅ Құжат дайын және жіберілді.\nЕгер сервис пайдалы болса — кез келген сомаға қолдау көрсете аласыз. Бұл ботты қолдап, жаңа құжаттарды қосуға көмектеседі.",
        donate_link_text: "Қолдау сілтемесі: https://buy.stripe.com/eVqdRa4WJ7sidyxa2800000",
        review_prompt: "Бағалаңыз, өтінеміз:",
        thanks_text: "Рақмет!",

        menu_btn: "Қызметтер тізімі",

        // Updated Menu Items
        btn_s1: "ЧСИ-ға танысу туралы өтініш",
        btn_s2: "Атқарушылық жазбаға қарсылық",
        btn_complaint: "ЧСИ-ға шағым",
        btn_restruct: "Реструктуризацияға өтініш",
        btn_price: "💳 Қолдау",
        btn_operator: "Маманмен байланыс",
        btn_docs_menu: "📂 Құжаттар мәзірі",
        btn_check_arrests: "🔍 Арестті тексеру",

        // New Placeholders
        complaint_text: "🚨 *Жалоба на ЧСИ*\n\nЕгер ЧСИ сізге WhatsApp арқылы жауап бермесе немесе заңсыз әрекет етсе, біз шағым түсіруге көмектесеміз.\n\nТолығырақ білу үшін маманға жазыңыз 👇",
        restruct_text: "🔄 *Реструктуризация*\n\nҚарызды бөліп төлеу немесе кесте жасау үшін банкпен келіссөз жүргізу.\n\nТолығырақ білу үшін маманға жазыңыз 👇",

        // Existing items...
        info_how_title: "ℹ️ Қалай жұмыс істейді",
        info_how_desc: "Қысқаша нұсқаулық",
        info_how_text:
            "📋 *Қалай жұмыс істейді:*\n\n" +
            "1. Мәзірден қажетті қызметті таңдаңыз.\n" +
            "2. Деректерді толтырыңыз (Бот қадам бойынша сұрайды).\n" +
            "3. Дайын PDF құжатты алыңыз.\n" +
            "4. Басып шығарып, қажетті жерге жіберіңіз (ЖСО немесе Нотариусқа).\n\n" +
            "Бастау үшін мәзірден таңдаңыз 👇",

        info_price_text:
            "💳 *Бағасы және төлем:*\n\n" +
            "🎉 **Әзірге тегін!**\n\n" +
            "Біз тест режимінде жұмыс істеп жатырмыз, сондықтан ақы алмаймыз.\n" +
            "Қаласаңыз, жобаны қолдау үшін ерікті төлем жіберуге болады.\n\n" +
            "Төлем сілтемесі: https://buy.stripe.com/14A14o88VfYO2TTfms00002\n\n" +
            "Қолдауыңызға рақмет!",

        info_contacts_text:
            "📞 *Байланыс және қолдау:*\n\n" +
            "• Виолетта: +7 707 019 1037\n" +
            "• Санжар: +7 708 711 07 30\n\n" +
            "• WhatsApp: wa.me/77070191037\n" +
            "• WhatsApp: wa.me/77087110730\n" +
            "• Telegram: @support_arrestov",

        menu_btn: "Қызметтер тізімі",
        btn_s1: "📄 ЧСИ өтініші",
        btn_s2: "✍️ Қарсылық",
        btn_more: "📂 Басқа құжаттар",
        btn_operator: "👤 Маман",

        more_docs_title: "Басқа құжаттар:",
        btn_notary: "📄 Нотариус",

        operator_ask:
            "📞 *Маманмен байланыс:*\n\n" +
            "👇 *WhatsApp-қа жазу үшін басыңыз:*\n\n" +
            "👤 Виолетта: https://wa.me/77070191037\n" +
            "👤 Санжар: https://wa.me/77087110730\n\n" +
            "Немесе сұрағыңызды осында бір хабарламамен жазыңыз — маманға жіберемін.",
        operator_sent: "✅ Қабылданды! Маманға жіберілді.",

        btn_yes: "✅ Иә",
        btn_back: "⬅️ Артқа",
        btn_edit: "✏️ Өзгерту",
        btn_menu: "🏠 Мәзір",

        edit_title: "Өзгерту",
        edit_desc: "Өзгерткіңіз келетін жолды таңдаңыз:",

        confirm_title: "Деректерді тексеріңіз:",
        processing: "⏳ Құжат дайындалуда...",
        doc_ready_s1: "✅ Құжат дайын!",
        doc_ready_s2: "✅ Құжат дайын!",

        after_doc_title: "Дайын ✅ Келесі қадам?",
        after_doc_btn_q: "❓ Сұрақ",
        after_doc_btn_fb: "⭐ Пікір",
        after_doc_btn_rahmet: "🙏 Рахмет", // [NEW]
        after_doc_q_ask: "Сұрағыңызды бір хабарламаға жазыңыз:",
        after_doc_fb_ask: "Пікіріңізді бір хабарламаға жазыңыз:",
        after_doc_thanks: "Рақмет! ✅ Жіберілді.",

        rahmet_reply: "Рахмет! 😊\nКөмектескеніме қуаныштымын.\nЖұмысымызды бағалаңыз:",
        rahmet_btn_rate: "⭐ Бағалау",

        video_choice_text: "Толтырмас бұрын видео-нұсқаулықты көре аласыз. Не істейміз?",
        btn_watch_video: "▶️ Видеоны көру",
        btn_continue: "➡️ Жалғастыру",

        errors: {
            date: "⚠️ Күні: КК.АА.ЖЖЖЖ",
            iin: "⚠️ ЖСН 12 сан болуы керек.",
            email: "⚠️ Email міндетті. Дұрыс email енгізіңіз (мысалы: name@gmail.com).",
        },

        steps_s1: [
            "🧾 1/11-қадам. Жеке сот орындаушысының аты-жөні:",
            "📍 2/11-қадам. ЖСО мекенжайы:",
            "📞 3/11-қадам. ЖСО телефоны (немесе «жоқ»):",
            "✉️ 4/11-қадам. ЖСО email (немесе «жоқ»):",
            "№ 5/11-қадам. Атқарушылық өндіріс нөмірі:",
            "📅 6/11-қадам. АӨ қозғалған күні (КК.АА.ЖЖЖЖ):",
            "👤 7/11-қадам. Сіздің аты-жөні:",
            "🏠 8/11-қадам. Сіздің мекенжайыңыз:",
            "🆔 9/11-қадам. Сіздің ЖСН (12 сан):",
            "📱 10/11-қадам. Сіздің телефоныңыз:",
            "✉️ 11/11-қадам. Сіздің email:",
        ],
        steps_s2: [
            "👤 1/11-қадам. Нотариустың аты-жөні:",
            "📍 2/11-қадам. Нотариустың мекенжайы:",
            "📞 3/11-қадам. Нотариус телефоны (немесе «жоқ»):",
            "✉️ 4/11-қадам. Нотариус email (немесе «жоқ»):",
            "🏛️ 5/11-қадам. Өндіріп алушының атауы:",
            "👤 6/11-қадам. Сіздің аты-жөні:",
            "🏠 7/11-қадам. Сіздің мекенжайыңыз:",
            "🆔 8/11-қадам. Сіздің ЖСН (12 сан):",
            "📱 9/11-қадам. Сіздің телефоныңыз:",
            "💰 10/11-қадам. Қарыз сомасы:",
            "✉️ 11/11-қадам. Сіздің email:",
        ],

        // Notary Flow Extra (Kazakh)
        notary_choice_ask: "👤 1/11-қадам. Нотариусты қалай көрсеткіңіз келеді?",
        btn_search_base: "🔍 Базадан іздеу",
        btn_manual_entry: "✍️ Қолмен енгізу",
        notary_search_ask: "🔎 Нотариустың аты-жөнін (немесе бөлігін) енгізіңіз:",
        notary_manual_ask: "✍️ Нотариустың толық аты-жөнін енгізіңіз:",
        notary_not_found: "😔 Нотариус табылмады. Қайта іздеңіз немесе қолмен енгізіңіз.",
        btn_retry: "🔄 Қайта іздеу",
    },
};
