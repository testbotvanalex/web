# BotMatic Inbox MVP

Multi-tenant WhatsApp inbox MVP for BotMatic.

## Stack

- Backend: Node.js + Express + SQLite (`better-sqlite3`)
- Frontend: static HTML/CSS/JS
- Auth: cookie session
- Webhook: Meta Cloud API compatible

## Project structure

```text
botmatic-inbox/
  backend/
    package.json
    src/
      app.js
      server.js
      routes/
      controllers/
      services/
      middleware/
      db/
      utils/
  frontend/
    public/
      index.html
      styles.css
      app.js
  .env.example
  README.md
```

## Install

```bash
cd /Users/botmatic/consturctror/botmatic-inbox/backend
npm install
```

## Environment

Copy the example file:

```bash
cd /Users/botmatic/consturctror/botmatic-inbox
cp .env.example .env
```

For MVP, only this value is required:

```env
PORT=4100
WHATSAPP_VERIFY_TOKEN=botmatic_inbox_verify_token
```

Company-specific WhatsApp credentials are stored in the database, not in frontend code.

## Seed demo data

```bash
cd /Users/botmatic/consturctror/botmatic-inbox/backend
npm run seed
```

Demo credentials:

- Email: `owner@botmatic.test`
- Password: `demo12345`

## Run

```bash
cd /Users/botmatic/consturctror/botmatic-inbox/backend
npm run dev
```

Open:

- App: [http://localhost:4100](http://localhost:4100)
- Health check: [http://localhost:4100/health](http://localhost:4100/health)

## Login

Use the seeded user:

- `owner@botmatic.test`
- `demo12345`

## Test webhook verification

```bash
curl "http://localhost:4100/webhook?hub.mode=subscribe&hub.verify_token=botmatic_inbox_verify_token&hub.challenge=12345"
```

Expected response:

```text
12345
```

## Test inbound webhook

This example assumes the seeded company has `phone_number_id=123456789012345`.

```bash
curl -X POST http://localhost:4100/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "metadata": {
            "phone_number_id": "123456789012345"
          },
          "contacts": [{
            "wa_id": "32470000000",
            "profile": { "name": "Test Customer" }
          }],
          "messages": [{
            "id": "wamid.test.1",
            "from": "32470000000",
            "text": { "body": "Hello from webhook" }
          }]
        }
      }]
    }]
  }'
```

That will:

1. find the company by `phone_number_id`
2. create the chat if missing
3. store the customer message
4. auto-reply if the chat is in `bot` mode

## REST API

### Auth

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Chats

- `GET /api/chats?filter=all|open|bot|human`
- `GET /api/chats/:id`
- `POST /api/chats/:id/takeover`
- `POST /api/chats/:id/release`

### Messages

- `GET /api/chats/:id/messages`
- `POST /api/chats/:id/messages`

### Webhook

- `GET /webhook`
- `POST /webhook`

## Notes

- The MVP enforces company isolation by always filtering chat/message reads by `company_id`.
- WhatsApp access tokens are stored in the `companies` table and never exposed to the browser.
- The current bot behavior is intentionally simple: when a chat is in `bot` mode, incoming messages get a basic automatic reply.
- SQLite is used for MVP, but service/controller separation keeps migration to PostgreSQL straightforward.
