# Monolith — Multi-Tenant E-commerce SaaS Platform

> A Shopify-style "build your own online store" platform. A merchant signs up, subscribes, picks a
> storefront template, customizes it, and gets a live store on a subdomain or their own custom domain,
> plus a dashboard to manage products, catalogs, orders, customers, coupons and delivery.
> It targets both **B2C** (public shoppers) and **B2B** (private catalogs with per-customer pricing, dealers).

*Generated from a read-through of the codebase. Each section says whether a feature is **implemented**,
**partial**, or **schema-only** so this document can be trusted as a snapshot of reality, not of intent.*

**2026 update:** the app was split into a `frontend/` (Next.js, UI only) and a `backend/` (Node.js/Express,
all Supabase access and business logic) so they can be deployed, scaled and secured independently. Several
security issues from the original single-app version (§13 of the prior revision) were fixed as part of that
split; see §13 below for the current state.

---

## 1. Product Summary

| Aspect | Description |
|---|---|
| Product type | Multi-tenant SaaS: one deployment hosts many independent stores ("tenants") |
| Brand name in UI | **Monolith** |
| Users | (1) **Merchants** – log in to `/dashboard`. (2) **Shoppers** – log in to a specific store. Two completely separate auth systems. |
| Business models | B2C storefronts; B2B via *special catalogs* (restricted, custom prices) and *dealers* (wholesale partners) |
| Monetisation | Merchant subscription via Stripe (currently a single **Pro** plan: ₹3,999/mo or ₹3,199/mo billed yearly, INR) |
| Multiple stores | One merchant account can own several stores (hard cap of 10) and switch between them |

### Feature status at a glance

| Feature | Status |
|---|---|
| Merchant signup/login (email+password with OTP, Google OAuth) | Implemented |
| Onboarding → template pick → live-preview customization → provisioning | Implemented |
| 8 storefront templates | 6 wired to live stores (see §7), 2 preview-only |
| Subdomain routing (`slug.root-domain`) | Implemented |
| **Custom domain** (`www.customer.com`) | Implemented, **with DNS TXT ownership verification** before it goes live (see §8) |
| Products, images (Cloudinary), categories, 3D model URL | Implemented |
| Multi-catalog with price overrides + access-controlled SPECIAL catalogs (B2B) | Implemented |
| Storefront customer auth (phone + Firebase OTP + password) | Implemented |
| Cart, wishlist, addresses, orders, reviews, profile | Implemented; checkout is priced entirely server-side from the database (see §13) |
| Coupons (public/private, % or fixed) | Implemented |
| Delivery options | Implemented |
| Dashboard analytics (revenue, last-7-days chart, recent orders) | Implemented |
| Stripe subscriptions + webhook | Implemented (dev-only mock-subscribe bypass, gated behind an env flag) |
| Inventory / warehouses / invoices / payments / dealers | Schema + API + pages exist; depth varies |
| Team, roles/RBAC | Schema + seed data + helper exist; role/permission checks partially enforced (see §13) |
| API keys, webhooks (merchant-facing) | Schema + placeholder pages only |
| **AI image features** | **Not found in the codebase** — see §9 |

---

### Delivery, pricing, support & refunds update

Run `backend/supabase/migrations/020_logistics_support_refunds.sql` before deploying this version.

| Area | What it does | Where |
|---|---|---|
| **Price breakdown** | One server-side `buildQuote()` computes subtotal, coupon discount, delivery charge, GST/other taxes (CGST+SGST or IGST) and the total. The checkout screen and `placeOrder()` both use it, so the price shown is the price charged. | `backend/src/services/quote.ts`, `POST /api/v1/store/quote` |
| **Tax & delivery-fee settings** | Per store, set by the merchant: GST rate, prices inclusive/exclusive, GSTIN, extra taxes, delivery fee, "free delivery above" minimum, ETA tuning. Stored as `tenant_settings.checkout_settings`. | Dashboard → Settings → *Taxes & Delivery Fees* |
| **Delivery estimate** | Finds the nearest active warehouse that has every item in stock (haversine distance from geocoded PIN/city or browser location), adds warehouse dispatch time + travel time. Shown on product pages, checkout, the order confirmation and the orders list. Falls back to the store's default range when no warehouse data exists. | `backend/src/services/fulfillment.ts`, `geo.ts` |
| **Stock** | Orders allocate stock from the chosen warehouse (optimistic concurrency + `inventory_transactions`) and cancelling restocks. Warehouses now carry address, PIN, coordinates and dispatch hours. Stock is adjusted per *product* (a default variant is created on demand), which is also what the future employee panel will call. | Dashboard → Inventory |
| **Order help** | AI-assisted (Claude when the store has the AI add-on, rule-based otherwise) change of delivery address / phone within 24 hours of ordering and before shipping. The model only extracts the new value - the code checks eligibility and the shopper confirms. Unresolved requests are escalated to the store team. | `backend/src/services/order-support.ts`, Dashboard → *Support & Refunds* |
| **Refunds** | UPI/netbanking orders refund to the original source; Cash-on-Delivery orders collect bank details. There is no payment-gateway integration (shoppers pay the merchant directly), so the store team performs the transfer and records the reference; the shopper sees REQUESTED → APPROVED → PROCESSED. | `backend/src/services/refunds.ts` |
| **Store editor** | The live preview follows the tab being edited (page + scroll) and highlights the element of the focused field. New *Header & Menu* (announcement bar, menu labels) and *Policies* tabs; footer links now point to real Privacy / Terms / Shipping & Returns pages. | `frontend/src/components/storefront/PreviewBridge.tsx`, `onboarding/customize/schemas.ts` |
| **Storefront search** | Typo-tolerant, ranked search with synonyms, plus price / availability filters and sort, shared by all 8 templates. | `frontend/src/lib/storefront/catalog.ts`, `ProductToolbar.tsx` |

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | **Next.js 16** (App Router), **React 19.2**, React Compiler enabled |
| Backend framework | **Node.js 20+ / Express 5** (TypeScript, ESM) |
| Language | TypeScript 5 (strict, both projects) |
| Styling | Tailwind CSS 4, `clsx`, `tailwind-merge` |
| Animation / UX | Framer Motion, GSAP, Lenis (smooth scroll), custom page-transition provider |
| 3D | three.js, `@react-three/fiber`, `@react-three/drei` (`SneakerExperience` component, `public/models`) |
| Charts | Recharts |
| Icons | lucide-react |
| Database | **Supabase (PostgreSQL)** — accessed with the **service-role key**, from the backend only |
| Cache / rate limit | **Upstash Redis** (REST); backend falls back to an in-process store in development if unset |
| Merchant auth | Custom JWT (`jose`, HS256, per-purpose signing keys) + DB-backed sessions; `bcryptjs` (12 rounds); Google OAuth via Supabase Auth |
| Shopper auth | Firebase Phone Auth (OTP) verified by `firebase-admin`; custom JWT cookie `store_session` |
| Payments (merchant billing) | **Stripe** (subscription Checkout + webhook), backend-only |
| Media | **Cloudinary** (product image upload), backend-only, with magic-byte content sniffing |
| Email | Nodemailer over SMTP (OTP + password-reset mail) |
| Validation | Zod 4 on every request body/query on the backend |
| HTTP hardening | `helmet`, same-origin CSRF guard (Fetch Metadata + Origin check), per-route rate limiting |

---

## 3. High-Level Architecture

```
                        ┌─────────────────────────────┐        ┌──────────────────────────────┐
  Browser / shopper      │   frontend/ (Next.js 16)     │        │   backend/ (Node/Express)     │
  brand.monolith.com ──► │  proxy.ts (edge)             │        │                               │
  www.customer.com ────► │   host → store slug?         │        │  /api/v1/*  REST routes       │
  monolith.com/dashboard►│   yes → rewrite to            │        │  /api/webhooks/stripe         │
                        │   /store/[slug]/…             │  ────► │  /api/auth/callback (OAuth)   │
                        │   no  → dashboard cookie check │  /api  │                               │
                        ├─────────────────────────────┤ rewrite ├──────────────────────────────┤
                        │ Server Components fetch data  │        │ Zod-validated handlers        │
                        │ from the backend via          │        │  → Supabase (service role)    │
                        │ lib/api.ts / lib/store.ts      │        │  → Redis / Stripe / Cloudinary │
                        │ (forwards the visitor's        │        │  → SMTP / Firebase Admin       │
                        │  cookies when needed)          │        └──────────────────────────────┘
                        └─────────────────────────────┘
```

### Key architectural ideas

1. **Two processes, one origin from the browser's point of view.** The frontend never talks to Supabase,
   Redis, Stripe or Cloudinary directly; it renders UI and calls the backend. In the browser, all backend
   calls go through same-origin `/api/*` URLs that Next.js rewrites to the backend (`next.config.ts`), so
   session cookies stay first-party on the SaaS domain, every store subdomain, and any custom domain.
2. **Multi-tenancy by `tenant_id` column.** Every business table has `tenant_id`. Isolation is enforced in
   *application code* (`.eq('tenant_id', ...)` on every query, plus explicit ownership checks for anything
   referenced by id — see `backend/src/services/ownership.ts`), because the backend uses the Supabase
   service-role key, which bypasses Row Level Security. RLS policies exist in the migrations as
   defense-in-depth but are not what protects the data today.
3. **Host-based routing in `frontend/src/proxy.ts`.** One frontend deployment serves the SaaS site *and*
   every storefront; it only rewrites paths, it never makes the auth decision for API calls (the backend
   re-validates every session on every request).
4. **Template = React component set + a JSON "customization" blob.** A store's look is the chosen
   `templateId` plus merchant-edited content stored in `tenant_settings`, sanitised on write
   (`backend/src/lib/sanitize.ts`) to prevent stored-XSS via `javascript:`/`data:` URLs.
5. **Two independent identity systems**: `session` cookie (merchants, `users` table, HS256 JWT + revocable
   DB session row) vs `store_session` cookie (shoppers, `customers` table, scoped to a tenant). Each cookie
   is signed with its own derived key and audience, so a token from one flow (e.g. a password-reset link)
   can never be replayed as another.
6. **Read-heavy storefront caching** in Redis (`fetchWithCache`): tenant lookup 1h, settings 1h, products
   5min; invalidated on every merchant write that could affect it.

---

## 4. Request Routing & Multi-Tenancy

File: [frontend/src/proxy.ts](frontend/src/proxy.ts) (Next.js 16 renamed `middleware.ts` to `proxy.ts`)

1. Read `Host` header. Base domain = `NEXT_PUBLIC_ROOT_DOMAIN` (falls back to the request's own `localhost`
   host in development).
2. If host equals the base domain or `www.<base>` → it's the SaaS site.
3. Otherwise the store key is derived: `slug.base-domain` → `slug`; anything else (custom domain) → the
   entire hostname is the store key.
4. If a store key is present → **rewrite** to `/store/${storeKey}${pathname}` (unless already under
   `/store`).
5. For SaaS-site page requests under `/dashboard`, an early redirect to `/login` happens if there is no
   `session` cookie at all — a cheap pre-check, not the source of truth. The backend independently verifies
   the session (signature + DB row + user status) on every `/api/v1/*` call, and the dashboard's Server
   Component layouts call `GET /api/v1/auth/context` and redirect if it 401s.
6. `/api/*` is excluded from the proxy matcher entirely — those requests go straight to Next's rewrite
   (`next.config.ts`) into the backend, so bodies (file uploads, the raw Stripe webhook payload) are never
   buffered or touched by proxy logic.

Store resolution on the backend: `resolveStoreTenant()` in `backend/src/services/tenants.ts` looks up the
tenant by exact `code` match, then by exact `custom_domain` match — two separate queries, never a single
interpolated `.or()` filter, so the store key can't be used to alter the query.

---

## 5. Repository Layout

```
E-commerce-SaaS-app/
├─ frontend/                        Next.js 16 app (UI only — no direct Supabase/Redis/Stripe access)
│  ├─ src/
│  │  ├─ proxy.ts                   Host routing (renamed from middleware.ts in Next 16)
│  │  ├─ app/
│  │  │  ├─ page.tsx, LandingPageClient.tsx      Marketing landing page
│  │  │  ├─ (auth)/ login, signup, set-password, forgot-password, reset-password
│  │  │  ├─ pricing/, checkout/[planId]/, payment-success/, privacy/, terms/
│  │  │  ├─ onboarding/  template-selection, customize (+ schemas.ts), checkout
│  │  │  ├─ dashboard/
│  │  │  │   ├─ layout.tsx          Subscription gate (via backend /auth/context)
│  │  │  │   ├─ page.tsx, create/   Store list / create-store
│  │  │  │   └─ (store)/            Merchant back-office pages (see §10)
│  │  │  ├─ store/[slug]/           Live storefront (renders the chosen template)
│  │  │  │   ├─ layout.tsx, page.tsx, products, cart, checkout, orders,
│  │  │  │   │   wishlist, profile, about, contact, auth/{login,signup}
│  │  │  │   └─ c/[catalog_slug]/   Catalog-scoped storefront (B2B/special)
│  │  │  └─ templates/              8 template demo/preview sites + shared layout
│  │  ├─ components/  dashboard/, storefront/, auth/, onboarding/, pricing/, 3d/
│  │  ├─ context/AuthContext.tsx
│  │  ├─ hooks/useCustomization.ts  Live-preview postMessage bridge (same-origin only)
│  │  └─ lib/
│  │     ├─ api.ts                  Server-side fetch helper for calling the backend
│  │     ├─ store.ts                Public storefront data helpers (store, products, catalog)
│  │     ├─ redirect.ts             safeRedirectPath() — blocks open-redirect via ?next=
│  │     ├─ supabase/client.ts      Browser-only client, used solely to kick off Google OAuth
│  │     └─ firebase.ts             Firebase Web SDK config (shopper phone auth)
│  ├─ public/                       screenshots, hero images, 3D models, auth backgrounds
│  ├─ scripts/                      dev-only local file-patching helpers
│  └─ next.config.ts                Proxies /api/* to the backend; sets security headers
│
├─ backend/                         Node.js / Express REST API
│  ├─ src/
│  │  ├─ server.ts, app.ts          Express app wiring, graceful shutdown
│  │  ├─ config/env.ts              Zod-validated environment, fails fast on boot
│  │  ├─ lib/                       jwt, session, store-session, password, kv (Redis), rate-limit,
│  │  │                             http (ApiError/parse/pagination), sanitize, supabase, email, firebase
│  │  ├─ middleware/                requireMerchant, requireShopper, csrfGuard, security headers
│  │  ├─ services/                  tenants, templates, ownership, pricing, orders (server-side pricing)
│  │  └─ routes/                    auth, oauth, billing, tenant, dashboard, products, categories,
│  │                                catalogs, coupons, crm, finance, inventory, team, store,
│  │                                store-auth, public, upload
│  ├─ scripts/                      seed_products.mjs, clear_cache.mjs, check-users.js, test-signup.js
│  │                                (all read credentials from backend/.env, never hard-coded)
│  └─ supabase/migrations/001…019_*.sql   Full schema history (unchanged by the split)
│
├─ Architecture/                    10 ER-diagram PNGs (design docs)
└─ AGENTS.md / CLAUDE.md
```

---

## 6. End-to-End User Journeys

### 6.1 Merchant journey

1. **Landing** (`/`) → **Pricing** (`/pricing`): single Pro plan; user chooses to *preview templates first* or go straight to checkout.
2. **Register** (`POST /api/v1/auth/register`): Zod validation, strong-password rule (8+, upper, lower, digit,
   special, capped at bcrypt's 72-byte limit), per-IP and per-email rate limits, creates a `users` row with
   **no tenant**, generates a 6-digit OTP whose **hash** (not the code) is stored in Redis for 15 min, emails
   it. **Verify** at `POST /api/v1/auth/verify-otp` (constant-time compare, capped attempts, single use).
   *Alternative:* **Google sign-in** (Supabase Auth) → `GET /api/auth/callback` auto-creates a user + starter
   tenant, flags the user to set a name/password.
3. **Login** (`POST /api/v1/auth/login`): per-IP and per-account rate limits, bcrypt compare against a dummy
   hash when the account doesn't exist (constant time), creates a `user_sessions` row and a signed JWT cookie
   `session` (7 days, HttpOnly, SameSite=Lax, per-purpose signing key).
4. **Subscribe** (`/checkout/[planId]` → `POST /api/checkout`): Stripe Checkout in `subscription` mode (INR).
   `checkout.session.completed` / `customer.subscription.*` webhooks keep the `subscriptions` row in sync;
   `payment-success` also calls `POST /api/v1/billing/confirm` so activation doesn't depend on webhook timing.
5. **Dashboard gate**: `dashboard/layout.tsx` calls the backend's `/auth/context` and redirects to `/pricing`
   unless the merchant has an active subscription.
6. **Onboarding**: choose a template (`/onboarding/template-selection`) → customize content with a **live
   iframe preview** (same-origin `postMessage` only) → submit.
7. **Provision** (`POST /api/v1/tenant/provision` or `/api/v1/store/create`): creates `tenant` (unique code),
   `tenant_branding`, `tenant_settings['customization']` (sanitised JSON incl. `templateId`), `tenant_domain`,
   default catalog/category (a DB trigger also auto-creates a default "General" catalog). Rolls back the
   tenant if any later step fails.
8. **Run the store** in `/dashboard/...` (products, catalogs, orders, …) and share
   `https://<slug>.<root-domain>`, or attach a custom domain in *Store Settings* (see §8 for verification).

### 6.2 Shopper journey (B2C)

1. Visit `slug.root-domain` (or custom domain) → the proxy rewrites to `/store/[slug]` → the frontend fetches
   tenant + settings + active products from the backend's public API (Redis-cached there) → chosen template
   rendered with the mapped product data.
2. **Sign up** at `/store/[slug]/auth/signup`: phone number verified by **Firebase Phone Auth** in production
   (a `dummy_token` shortcut exists only when both `backend` `ALLOW_DUMMY_OTP=true` and frontend
   `NEXT_PUBLIC_DUMMY_OTP=true` — refused by the backend otherwise, and refused outright when
   `NODE_ENV=production`); backend verifies the Firebase ID token (`firebase-admin`, with an auth-time
   freshness check), bcrypt-hashes the password, upserts the `customers` row for that tenant, sets
   `store_session` JWT cookie. **Login** = phone + password.
3. Browse products / catalogs, wishlist, cart (`carts`/`cart_items`), saved addresses, apply coupon, place
   order (`POST /api/v1/store/orders` or `/store/checkout`) — **priced entirely server-side** from the
   `products`/`catalog_products` tables (see §13), view orders, leave reviews (linked to a *fulfilled* order
   item, one per item, and checked against the product actually ordered).

### 6.3 Buyer journey (B2B)

- Merchant creates a **SPECIAL catalog** (`catalogs.catalog_type = 'SPECIAL'`), adds products with
  `price_override` / `compare_at_price_override`, and grants access via `catalog_customers` (by
  `customer_id` or by normalised phone number).
- Buyer visits `/store/[slug]/c/[catalog_slug]`: not logged in → redirected to store login with a
  same-site-only `next` callback; logged in but not on the access list → **Access Denied** page; otherwise
  the storefront renders with the catalog's negotiated prices. Access is re-checked by the backend on every
  request, not cached in the shopper's session.
- **Dealers** (`dealers`, `dealer_branches`) model wholesale partners with tax id, payment terms and credit
  limit; `orders.dealer_id` supports B2B2B orders.

---

## 7. Storefront Templates

Registered in `frontend/src/app/templates/page.tsx`; content fields per template defined in
`frontend/src/app/onboarding/customize/schemas.ts` (field types: `text`, `textarea`, `image`, `array`,
grouped in tabs). The set of valid template ids is also enforced server-side in
`backend/src/services/templates.ts`, so a request can't provision a store with an unknown template.

| Template ID | Name | Style / niche | Wired into live stores? |
|---|---|---|---|
| `starter-minimalist` | Minimalist | Fashion | Yes (also the **fallback**) |
| `starter-essence` | Essence | Clean skincare | Yes |
| `starter-origin` | Origin | Soft ceramics | Yes |
| `starter-canvas` | Canvas | Editorial furniture | Preview only (falls back to Minimalist) |
| `growth-nexus-pro` | Nexus Pro | Tech & gadgets | Yes |
| `growth-velocity` | Velocity | Dark cyberpunk | Yes |
| `growth-quantum` | Quantum | Animated | Yes |
| `growth-horizon` | Horizon | Digital | Preview only (falls back to Minimalist) |

Each template folder has its own `layout.tsx`, context provider (cart/wishlist state), and pages: home,
products, product detail, cart, checkout, wishlist, profile, orders, about, contact, auth. `store/[slug]/`
picks the component by `templateId`. `basePath` is `''` on subdomain/custom-domain hosts and
`/store/<slug>` when accessed through the path form.

The Minimalist template can show a product's 3D model (`three_d_model_url`) using react-three-fiber.

---

## 8. Custom Domain Support

**How it works today**

- `tenant.custom_domain TEXT UNIQUE` (migration 018, indexed).
- Merchant enters it in **Dashboard → Settings → General** (`customDomain`). `POST /api/v1/dashboard/settings`
  validates and normalises the hostname, then requires **DNS ownership verification** before it takes effect:
  the backend generates a one-time token, tells the merchant to add a
  `_monolith-verify.<domain>` TXT record with that value, and only writes `tenant.custom_domain` once
  `resolveTxt()` confirms the record is live. Until then the pending domain (and the exact record to add) is
  returned to the settings page so the merchant can complete verification and save again.
- `proxy.ts`: any host that is not the root domain or a `*.root-domain` subdomain is treated as a custom
  domain and the whole hostname is used as the store key; the backend resolves the tenant via an exact
  `custom_domain` match.
- Domains already claimed by another tenant, or that fall under the platform's own root domain, are
  rejected outright.

**What is still not there**

- No automated SSL provisioning / domain attach (e.g. Vercel Domains API) — the hosting layer must be
  configured manually once DNS is verified.
- Apex vs `www` handling is only basic normalisation (lower-casing, trimming a trailing dot); no redirect
  logic between the two.
- `tenant_domain` (multi-domain, `is_primary`) is written on provisioning but routing uses
  `tenant.custom_domain`.

---

## 9. AI Integration — Current State

**No AI feature exists in the code.** A search across both projects and their env files found no AI/LLM/
vision SDK or API keys (no OpenAI, Gemini, Anthropic, Replicate, remove.bg, Stability, etc.).

What exists around images today:

- `POST /api/v1/upload` ([backend/src/routes/upload.ts](backend/src/routes/upload.ts)) — authenticated,
  rate-limited (10/min/user), accepts JPEG/PNG/WebP/GIF/AVIF up to 10 MB, **verifies the file's actual magic
  bytes** (not just the client-declared MIME type) before uploading to Cloudinary under
  `tenant_<id>/products`, returns `secure_url` + `public_id`. Used by *Dashboard → Products → New*.

Natural insertion points if you're building AI features: a step inside `POST /api/v1/upload` (after
validation, before/instead of the Cloudinary upload) or a new `backend/src/routes/ai.ts` mounted at
`/api/v1/ai/*`, storing results back into `product_images`.

---

## 10. Merchant Dashboard (`frontend/src/app/dashboard/(store)/…`)

Sidebar nav: Overview, Orders, Products, Catalogs, Coupons, Customers, Analytics, Delivery Settings, Store Settings.
A store switcher lets one account move between owned stores (`POST /api/v1/auth/switch-store` re-issues the session
JWT with the new `tenantId` after checking `tenant.created_by`).

| Page | Purpose | Backing API |
|---|---|---|
| Overview | Revenue, order count, 7-day revenue chart, recent orders | `/api/v1/tenant/metrics` |
| Orders | List/update orders (statuses incl. `RETURN_REQUESTED`) | `/api/v1/orders`, `/orders/[id]` |
| Products (+ New) | CRUD, images, 3D model URL, catalog assignment with price overrides | `/api/v1/products`, `/upload` |
| Catalogs | GENERAL / SPECIAL catalogs, product membership, customer access list | `/api/v1/catalogs/*` |
| Coupons (+ New) | % or fixed, expiry, max uses, public/private | `/api/v1/coupons/*` |
| Customers | Customer list | `/api/v1/customers` |
| Dealers | B2B wholesale partners | `/api/v1/dealers` |
| Inventory | Stock by warehouse (optimistic-concurrency adjustments) | `/api/v1/inventory`, `/warehouses` |
| Invoices | Invoices/payments | `/api/v1/invoices`, `/payments` |
| Analytics | Charts (thin) | — |
| Settings → General | Store name, support email, currency, **custom domain** (with DNS verification), delete store | `/api/v1/dashboard/settings`, `/store/delete` |
| Settings → Delivery | Delivery options (name, price, ETA) | `/api/v1/dashboard/delivery-options` |
| Settings → Team / API keys / Webhooks / Billing | Team is enforced to the store owner only; API keys/Webhooks pages are mostly placeholder UI | `/api/v1/users`, `/api/v1/roles` |

`CurrencyProvider` applies the store's currency across dashboard views.

---

## 11. Database Design (Supabase / PostgreSQL)

Unchanged by the frontend/backend split. 19 migrations in `backend/supabase/migrations/`; ER diagrams for
each domain are in `Architecture/`.

| Domain | Tables |
|---|---|
| Tenant & platform | `subscription_plan`, `tenant` (`code` = slug, `custom_domain`), `tenant_settings` (key/value; `customization` JSON), `tenant_branding`, `tenant_domain`, `tenant_features`, `license`, `api_keys`, `webhooks`, `subscriptions` (Stripe mapping) |
| Identity & RBAC | `users`, `user_profiles`, `user_sessions`, `roles`, `user_roles`, `role_hierarchy`, `modules`, `permissions`, `role_permissions`, `audit_log` (+ seeded modules/permissions via `seed_permissions()`) |
| Catalog | `categories` (nested), `products` (status DRAFT/ACTIVE/ARCHIVED, `three_d_model_url`), `product_images`, `product_options`, `product_option_values`, `product_variants`, `variant_options` |
| Multi-catalog (B2B) | `catalogs` (GENERAL/SPECIAL), `catalog_products` (price overrides), `catalog_customers` (access list); trigger auto-creates default General catalog per tenant |
| Inventory | `warehouses`, `inventory`, `inventory_transactions` |
| CRM | `customer_groups` (discount %), `customers` (+ `password_hash`, `is_verified`, unique per-tenant phone/email), `dealers`, `dealer_branches`, `customer_addresses` |
| Storefront | `carts`, `cart_items`, `wishlists`, `wishlist_items`, `reviews` (one per order item), `delivery_options`, `coupons` |
| Orders & money | `orders` (+ statuses, payment/fulfilment status, shipping/billing address, delivery option), `order_items`, `fulfillments`, `invoices`, `payments` |

Conventions: UUID PKs, `tenant_id` on every tenant-owned table with `ON DELETE CASCADE`, `created_date/created_by`,
CHECK constraints for status enums, unique constraints scoped by tenant (e.g. `(tenant_id, slug)`).
RLS is enabled with `tenant_id = auth.jwt()->>'tenant_id'` policies as defense-in-depth; the backend's
service-role client bypasses it and is responsible for tenant scoping (see §13 for how that's enforced).

---

## 12. API Surface (`backend/src`, mounted at `/api/*`)

| Group | Endpoints |
|---|---|
| Merchant auth | `auth/register`, `verify-otp`, `login`, `logout`, `session`, `context`, `forgot-password`, `reset-password`, `set-password`, `switch-store`, `update-name` |
| OAuth | `GET /api/auth/callback` (Google, via Supabase Auth) |
| Billing | `POST /api/checkout` (Stripe Checkout), `POST /api/webhooks/stripe`, `POST /api/v1/billing/confirm`; `POST /api/v1/mock-subscribe` only when `ALLOW_MOCK_SUBSCRIBE=true` |
| Tenant | `tenant/me`, `tenant/metrics`, `tenant/provision`, `store/create`, `store/delete`, `dashboard/settings`, `dashboard/delivery-options[/id]` |
| Catalog & sales (merchant, session-auth) | `products[/id]`, `categories`, `catalogs[/id]` (+ `/products`, `/customers`), `coupons[/id]`, `coupons/validate`, `customers`, `dealers`, `orders[/id]`, `inventory`, `warehouses`, `invoices`, `payments`, `roles[/id]`, `users[/id]` |
| Storefront (shopper, `store_session`) | `store/auth/{signup,login,logout}`, `store/cart`, `store/wishlist`, `store/addresses`, `store/checkout`, `store/orders`, `store/reviews`, `store/profile`, `store/coupons/{validate,public}`, `store/delivery-options`, `reviews` |
| Public (no auth) | `public/stores/:slug`, `public/stores/:slug/products[/id]`, `public/stores/:slug/catalogs/:catalogSlug` — used by the frontend's Server Components to render storefronts |
| Media | `upload` |

Common patterns: every handler validates its input with Zod (`backend/src/lib/http.ts#parse`); merchant
routes resolve `{ userId, tenantId }` via `requireMerchant`/`tenantCtx` and scope every query by
`tenant_id`; any id referencing another record (a category on a product, a customer on an order, …) is
checked with `services/ownership.ts` before use. List endpoints paginate with `?page=&limit=` and return
`{ data, meta:{total,page,limit,totalPages} }`.

---

## 13. Security Model

**In place**

- Default-deny-by-design: every merchant/shopper route requires a validated session; public routes are
  explicit and narrow (read-only storefront data).
- Session cookies are HttpOnly, SameSite=Lax, and `Secure` in production; JWTs use per-purpose signing keys
  and are checked against a revocable DB session row (merchant) or the live `customers` row (shopper).
- CSRF defence beyond SameSite: storefronts live on sibling subdomains of the SaaS domain, so
  `middleware/security.ts#csrfGuard` requires Fetch Metadata (`Sec-Fetch-Site: same-origin`) or a matching
  `Origin`/forwarded-host pair on any non-GET request.
- bcrypt (12 rounds) with a length cap matching bcrypt's own 72-byte limit; constant-time comparisons (dummy
  hash on unknown accounts, `timingSafeEqual` for OTPs); password-strength rules; Zod validation on every
  input; Stripe webhook signature verification with the raw body.
- Redis-backed rate limiting (per IP and, on sensitive routes, per account/email/phone too); **fails closed
  in production** when the store is unavailable.
- OTP codes are stored **hashed**, single-use, attempt-capped, and expire; registration is rolled back if the
  verification e-mail fails to send.
- Checkout is priced **entirely server-side** (`backend/src/services/pricing.ts` / `services/orders.ts`):
  product prices, special-catalog overrides, coupon discounts and delivery costs are all looked up from the
  database — nothing the client sends about price is ever trusted.
- Custom domains require DNS TXT ownership verification before they are attached to a tenant (§8).
- `postMessage` between the onboarding/dashboard preview and the iframed template only accepts and sends
  messages targeted at the app's own origin (not `"*"`).
- `dashboard/settings` and every other tenant-scoped route resolve the tenant from the **authenticated
  session**, not from "the first row in the table" or an unauthenticated caller.
- Secrets are read from environment variables only; `backend/src/config/env.ts` validates them at startup
  and refuses to boot in production if required production secrets, or either of the two dev-only bypass
  flags (`ALLOW_DUMMY_OTP`, `ALLOW_MOCK_SUBSCRIBE`), are misconfigured.

**Known gaps / accepted trade-offs**

| # | Severity | Note |
|---|---|---|
| 1 | Medium | Tenant isolation still relies on every query being written with `.eq('tenant_id', …)` (the service role bypasses RLS). This is now consistently applied and centralised in `services/ownership.ts`, but a future contributor could still write an unscoped query. |
| 2 | Medium | RBAC is modelled (roles, permissions) but only partially enforced: managing teammates/roles is restricted to the store owner; per-permission checks (`hasPermission`) are not wired into most routes. |
| 3 | Low | No automated SSL provisioning for custom domains once DNS is verified — the hosting layer is configured manually. |
| 4 | Low | `subscription_plan` limits (users/products/warehouses per plan) are not enforced; only a flat 10-stores-per-account cap is. |
| 5 | Low | Stripe webhook handles the common lifecycle events; some edge cases (e.g. `invoice.payment_action_required`) are not specifically handled and fall through to the default no-op case. |

**Fixed in the 2026 restructure** (previously tracked here as open issues): the leaked Supabase service-role
key was removed from `seed_products.mjs` (**the key itself must still be rotated in the Supabase dashboard —
it remains in git history**); `dashboard/settings` now requires the caller's own session instead of
operating on an unauthenticated "first tenant"; the storefront `dummy_token` OTP bypass is now gated behind
an explicit dev-only flag the server refuses to honour in production; checkout no longer uses mock prices;
`mock-subscribe` is now gated the same way; store-not-found no longer returns a debug dump of every tenant;
custom-domain claims now require DNS proof of ownership.

---

## 14. Configuration

See `backend/.env.example` and `frontend/.env.example` for the full list of environment variables, with
comments on what each one is for and which are development-only.

## 15. Running Locally

See [README.md](README.md) for setup steps. In short:

```bash
cd backend && npm install && cp .env.example .env   # fill in values
npm run dev                                           # http://localhost:4100

cd frontend && npm install && cp .env.example .env.local
npm run dev                                           # http://localhost:3000
```

Apply `backend/supabase/migrations/001…019` in order to a Supabase project. Helper scripts live in
`backend/scripts/` (seed sample products, clear a tenant's Redis cache, list users, exercise the storefront
signup endpoint) — each takes its target as a CLI argument and reads credentials from `backend/.env`.

## 16. Suggested Next Steps

1. **Rotate the Supabase service-role key** that was previously hard-coded in `seed_products.mjs` — it is
   still present in git history even though the current file no longer contains it.
2. Wire up RBAC (`hasPermission`) across merchant routes, driven by `user_roles`, instead of the current
   owner-only checks on team/role management.
3. Automate SSL/domain attach once a custom domain's DNS is verified (e.g. via the hosting provider's API).
4. Finish the two preview-only templates (Canvas, Horizon) or hide them from the picker.
5. Enforce plan limits from `subscription_plan` (users/products/warehouses/stores) instead of the flat
   10-store cap.
6. Add the AI image pipeline (background removal, enhancement, auto-alt-text, etc.) behind
   `backend/src/routes/ai.ts` → `/api/v1/ai/*`.
