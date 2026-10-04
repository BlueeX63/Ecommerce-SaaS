# Monolith — Multi-Tenant E-commerce SaaS

A Shopify-style platform: merchants sign up, subscribe, pick a storefront template, and get a live store on
a subdomain (or their own custom domain), plus a dashboard to manage products, catalogs, orders, customers,
coupons and delivery. See [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) for the full architecture.

## Layout

```
frontend/   Next.js 16 app — marketing site, merchant dashboard, storefront templates
backend/    Node.js / Express API — auth, billing, catalog, storefront, all Supabase access
```

The two run as separate processes. In development the frontend proxies every `/api/*` request to the
backend (see `frontend/next.config.ts`), so the browser only ever talks to one origin and cookies stay
first-party on the SaaS domain, every store subdomain, and any merchant's custom domain.

## Prerequisites

- Node.js 20.19+
- A Supabase project with the schema in `backend/supabase/migrations` applied, in order
- Accounts for the services you want working locally: Stripe, Upstash Redis, Cloudinary, an SMTP relay,
  Firebase (phone auth)

## Setup

```bash
# Backend
cd backend
npm install
cp .env.example .env      # fill in real values
npm run dev                # http://localhost:4100

# Frontend (in a second terminal)
cd frontend
npm install
cp .env.example .env.local # fill in real values (BACKEND_URL defaults to http://localhost:4100)
npm run dev                 # http://localhost:3000
```

To try a storefront locally, visit `http://<store-slug>.localhost:3000` once a store has been created
through onboarding.

### Development-only flags (backend/.env)

- `ALLOW_DUMMY_OTP=true` — accepts a fixed OTP for storefront shopper sign-up instead of a real Firebase
  phone verification. Set `NEXT_PUBLIC_DUMMY_OTP=true` in `frontend/.env.local` to match.
- `ALLOW_MOCK_SUBSCRIBE=true` — exposes `POST /api/v1/mock-subscribe`, which activates a merchant's
  subscription without going through Stripe.

Both flags are refused at startup when `NODE_ENV=production`.

## Building for production

```bash
cd backend && npm run build && npm start
cd frontend && npm run build && npm start
```

## Useful scripts

`backend/scripts/` has small one-off Node scripts (seeding sample products, clearing a tenant's cache,
checking users) — each reads credentials from `backend/.env`, never from source.
