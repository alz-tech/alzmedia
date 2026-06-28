# AlzMedia — Africa's Ad Network

Self-serve ad network for African publishers and advertisers.

## Stack
- **Backend**: Node.js + Express + PostgreSQL
- **Frontend**: React (Vite)
- **Storage**: Telegram (GramJS session)
- **Payments**: Paystack
- **Hosting**: Heroku

## Setup

### 1. Clone & install
```bash
npm install
cd client && npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in all values
```

### 3. Setup database
```bash
psql $DATABASE_URL < server/db/schema.sql
```

### 4. Run
```bash
# Development
npm run dev          # backend on :3000
cd client && npm run dev  # frontend on :5173

# Production
npm start
```

## Publisher Integration

### Website
```html
<script src="https://media.alz.name.ng/serve.js?pub=PUB-XXXXXX" async></script>
<div class="alz-ad" data-slot="SLOT_ID" data-device="web"></div>
```

### App / API
```
GET /api/ad/serve?pub=PUB-XXXXXX&slot=SLOT_ID&device=mobile
POST /api/ad/click  { campaign_id, creative_id, slot_id, publisher_id }
```

## Security
- httpOnly cookies (no localStorage for tokens)
- JWT 15min access + 7d refresh rotation
- bcrypt password hashing (rounds 12)
- Rate limiting on all routes
- XSS input sanitization
- Paystack webhook signature verification
- Click fraud detection (IP dedup + rate abuse)
- Role-based access control
