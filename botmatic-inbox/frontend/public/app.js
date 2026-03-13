const state = {
  user: null,
  chats: [],
  activeChatId: null,
  messages: [],
  currentFilter: "all",
  search: "",
  pollTimer: null,
};

const loginScreen = document.getElementById("login-screen");
const dashboardScreen = document.getElementById("dashboard-screen");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const companyName = document.getElementById("company-name");
const logoutButton = document.getElementById("logout-button");
const chatList = document.getElementById("chat-list");
const chatSearch = document.getElementById("chat-search");
const filterButtons = [...document.querySelectorAll(".filter-button")];
const emptyState = document.getElementById("empty-state");
const chatView = document.getElementById("chat-view");
const chatTitle = document.getElementById("chat-title");
const chatMeta = document.getElementById("chat-meta");
const messageList = document.getElementById("message-list");
const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");
const takeoverButton = document.getElementById("takeover-button");
const releaseButton = document.getElementById("release-button");

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response
    .json()
    .catch(() => ({ error: "Unexpected server response" }));

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

function formatTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

function setAuthenticated(user) {
  state.user = user;
  loginScreen.classList.add("hidden");
  dashboardScreen.classList.remove("hidden");
  companyName.textContent = `${user.companyName || ""} · ${user.name}`;
}

function setLoggedOut() {
  state.user = null;
  state.chats = [];
  state.activeChatId = null;
  state.messages = [];
  loginScreen.classList.remove("hidden");
  dashboardScreen.classList.add("hidden");
  clearInterval(state.pollTimer);
  state.pollTimer = null;
}

function renderChats() {
  const normalizedSearch = state.search.trim().toLowerCase();
  const chats = state.chats.filter((chat) => {
    const haystack = `${chat.customerName || ""} ${chat.customerPhone || ""}`.toLowerCase();
    return haystack.includes(normalizedSearch);
  });

  chatList.innerHTML = "";

  if (!chats.length) {
    chatList.innerHTML = `<div class="chat-card"><p>No chats found.</p></div>`;
    return;
  }

  for (const chat of chats) {
    const card = document.createElement("article");
    card.className = "chat-card";
    if (chat.id === state.activeChatId) {
      card.classList.add("active");
    }

    card.innerHTML = `
      <div class="chat-card-header">
        <div class="chat-card-title">${chat.customerName || chat.customerPhone}</div>
        <div>${chat.lastMessageAt ? formatTime(chat.lastMessageAt) : ""}</div>
      </div>
      <div class="chat-card-preview">${chat.lastMessagePreview || "No messages yet"}</div>
      <div class="chat-card-footer">
        <span class="badge ${chat.mode === "human" ? "mode-human" : "mode-bot"}">${chat.mode}</span>
        ${chat.unreadCount ? `<span class="badge unread">${chat.unreadCount}</span>` : ""}
      </div>
    `;

    card.addEventListener("click", () => selectChat(chat.id));
    chatList.appendChild(card);
  }
}

function renderMessages() {
  const chat = state.chats.find((item) => item.id === state.activeChatId);
  if (!chat) {
    emptyState.classList.remove("hidden");
    chatView.classList.add("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  chatView.classList.remove("hidden");
  chatTitle.textContent = chat.customerName || chat.customerPhone;
  chatMeta.textContent = `${chat.customerPhone} · mode: ${chat.mode} · status: ${chat.status}`;
  takeoverButton.disabled = chat.mode === "human";
  releaseButton.disabled = chat.mode === "bot";

  messageList.innerHTML = "";
  for (const message of state.messages) {
    const messageNode = document.createElement("div");
    messageNode.className = `message ${message.senderType}`;
    messageNode.innerHTML = `
      <span class="message-meta">${message.senderName || message.senderType} · ${formatTime(message.createdAt)}</span>
      <div>${message.text}</div>
    `;
    messageList.appendChild(messageNode);
  }

  messageList.scrollTop = messageList.scrollHeight;
}

async function loadChats() {
  const data = await api(`/api/chats?filter=${state.currentFilter}`);
  state.chats = data.chats;
  renderChats();

  if (state.activeChatId) {
    const stillExists = state.chats.some((chat) => chat.id === state.activeChatId);
    if (!stillExists) {
      state.activeChatId = null;
      state.messages = [];
      renderMessages();
    }
  }
}

async function loadMessages(chatId) {
  const data = await api(`/api/chats/${chatId}/messages`);
  state.messages = data.messages;
  renderMessages();
}

async function selectChat(chatId) {
  state.activeChatId = chatId;
  await api(`/api/chats/${chatId}`);
  await loadChats();
  await loadMessages(chatId);
}

async function bootstrap() {
  try {
    const data = await api("/api/auth/me");
    setAuthenticated(data.user);
    await loadChats();
    state.pollTimer = setInterval(async () => {
      try {
        await loadChats();
        if (state.activeChatId) {
          await loadMessages(state.activeChatId);
        }
      } catch (error) {
        console.error(error);
      }
    }, 5000);
  } catch (error) {
    setLoggedOut();
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginError.textContent = "";
  const formData = new FormData(loginForm);

  try {
    const data = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });
    setAuthenticated(data.user);
    await loadChats();
    if (!state.pollTimer) {
      state.pollTimer = setInterval(async () => {
        try {
          await loadChats();
          if (state.activeChatId) await loadMessages(state.activeChatId);
        } catch (error) {
          console.error(error);
        }
      }, 5000);
    }
  } catch (error) {
    loginError.textContent = error.message;
  }
});

logoutButton.addEventListener("click", async () => {
  try {
    await api("/api/auth/logout", { method: "POST" });
  } finally {
    setLoggedOut();
  }
});

chatSearch.addEventListener("input", (event) => {
  state.search = event.target.value;
  renderChats();
});

for (const button of filterButtons) {
  button.addEventListener("click", async () => {
    state.currentFilter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    await loadChats();
  });
}

messageForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.activeChatId) return;
  const text = messageInput.value.trim();
  if (!text) return;

  try {
    await api(`/api/chats/${state.activeChatId}/messages`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    messageInput.value = "";
    await loadChats();
    await loadMessages(state.activeChatId);
  } catch (error) {
    alert(error.message);
  }
});

takeoverButton.addEventListener("click", async () => {
  if (!state.activeChatId) return;
  await api(`/api/chats/${state.activeChatId}/takeover`, { method: "POST" });
  await loadChats();
  await loadMessages(state.activeChatId);
});

releaseButton.addEventListener("click", async () => {
  if (!state.activeChatId) return;
  await api(`/api/chats/${state.activeChatId}/release`, { method: "POST" });
  await loadChats();
  await loadMessages(state.activeChatId);
});

bootstrap();
