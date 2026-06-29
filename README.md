# AlzMedia — Africa's Ad Network

Self-serve ad network for African publishers and advertisers.

## Stack
- **Backend**: Node.js + Express + PostgreSQL
- **Frontend**: React (Vite) — served by Express from `client/dist`
- **Storage**: Telegram (GramJS session)
- **Payments**: Paystack
- **Hosting**: Render (single service — frontend + backend together)

## Render Setup

### 1. Create a new Web Service on Render
- Connect your GitHub repo
- **Build command**: `npm run build`
- **Start command**: `npm start`
- **Environment**: Node

### 2. Add a PostgreSQL database on Render
- Create → PostgreSQL → copy the Internal Database URL
- Set it as `DATABASE_URL` in your environment variables

### 3. Set environment variables on Render
```
NODE_ENV=production
SERVER_URL=https://your-app.onrender.com
CLIENT_URL=https://your-app.onrender.com
DATABASE_URL=postgresql://...
JWT_SECRET=long_random_string
JWT_REFRESH_SECRET=another_long_random_string

# Optional — add when ready
PAYSTACK_SECRET_KEY=sk_live_...
TELEGRAM_API_ID=...
TELEGRAM_API_HASH=...
TELEGRAM_SESSION=...
TELEGRAM_CHANNEL_ID=...
```

### 4. Run database schema
Connect to your Render PostgreSQL and run:
```bash
psql $DATABASE_URL < server/db/schema.sql
```

## Local Development

```bash
# Install backend deps
npm install

# Install frontend deps
cd client && npm install && cd ..

# Run backend (port 3000)
npm run dev

# Run frontend in separate terminal (port 5173)
cd client && npm run dev
```

Vite proxies `/api` to `localhost:3000` automatically in dev.

## Publisher Integration

### Website (script tag)
```html
<script src="https://your-app.onrender.com/serve.js?pub=PUB-XXXXXX" async></script>
<div class="alz-ad" data-slot="SLOT_ID" data-device="web"></div>
```

### App / API
```
GET /api/ad/serve?pub=PUB-XXXXXX&slot=SLOT_ID&device=mobile
POST /api/ad/click
```

## Security
- httpOnly cookies — no localStorage for tokens
- JWT 15min access + 7d refresh rotation
- bcrypt password hashing (rounds 12)
- Rate limiting on all routes
- XSS input sanitization (xss package)
- Paystack webhook signature verification
- Click fraud detection (IP dedup + rate abuse)
- Role-based access control (publisher / advertiser / admin)
- Helmet.js security headers
- IP addresses hashed — no PII stored in plain text
