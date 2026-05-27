# Dubplate Cutting Service — Architecture & Implementation Spec

## 1. Executive Summary
This spec outlines the build of a premium, Awwwards-caliber dubplate ordering experience. Our core goal is to merge an editorial, tactile frontend with a resilient Edge-first backend.

Moving to **Cloudflare Pages** means our Next.js app will run entirely on the Edge via `@cloudflare/next-on-pages`. 

**The 3 Riskiest Parts:**
1. **Edge Runtime Constraints:** Next.js on Cloudflare runs on the Edge, meaning Node.js native modules (like traditional ORMs) will fail. We must use Edge-native tools (Drizzle ORM) and edge-compatible payment signature verification.
2. **Idempotency & Race Conditions:** TBC/BOG webhooks could fire multiple times or simultaneously with the user returning to the success page. We must use atomic operations to ensure Web3Forms only fires exactly once.
3. **Staged Data Management:** We must reliably hold the user's PII in a temporary cache (Cloudflare KV) and successfully flush it to Supabase upon webhook success to prevent DB pollution.

---

## 2. Tech Stack & Rationale
- **Framework:** Next.js 14+ (App Router). Rationale: Server components are excellent for performance, but we will compile for the Edge using `@cloudflare/next-on-pages`.
- **Styling:** Tailwind CSS v4. Rationale: Already installed, extremely fast.
- **Motion:** Framer Motion. Rationale: Essential for the scroll-linked reveals and magnetic cursor micro-interactions requested.
- **Database:** Supabase (PostgreSQL). Rationale: Fully managed, scales easily.
- **ORM:** **Drizzle ORM**. *Opinionated switch from Prisma.* Rationale: Prisma requires a heavy query engine that struggles on Cloudflare Edge without paid Prisma Accelerate. Drizzle is ultra-light, Edge-native, and the gold standard for Cloudflare + Next.js.
- **Temporary Staging:** **Cloudflare KV**. Rationale: Built directly into Cloudflare Pages. Perfect for short-lived (TTL) JSON data staging.
- **File Uploads:** **Cloudflare R2** or **Supabase Storage**. Rationale: We will use Supabase Storage since we are already using Supabase. It has generous limits and handles large artwork files seamlessly via client-to-storage presigned URLs.
- **Localization:** `next-intl`. Rationale: Works flawlessly with App Router and supports Edge runtimes natively.

---

## 3. Information Architecture & Routing Map
All routes will utilize the Edge runtime (`export const runtime = 'edge'`).

- `[locale]/layout.tsx` (Server Component) — Global nav (magnetic hover effects), global footer, locale provider.
- `[locale]/page.tsx` (Server Component + Client islands) — Home. 5 sections with Framer Motion scroll reveals.
- `[locale]/order/page.tsx` (Client Component) — The heavy configurator. Needs complex client state (Zustand or React Hook Form) for multi-step validation and live pricing.
- `[locale]/collab-order/page.tsx` (Client Component) — Similar to `/order`, but initialized via URL params (e.g., `?release=123`) with locked fields.
- `[locale]/about/page.tsx` (Server Component) — Static text, editorial layout.
- `[locale]/contact/page.tsx` (Server Component)
- `[locale]/pricing/page.tsx` (Server Component)
- `[locale]/order/success/page.tsx` (Server Component) — Confirms order completion to the user.
- `[locale]/order/failed/page.tsx` (Server Component) — Clean error boundary and retry CTA.

**API Routes (Edge Runtime):**
- `POST /api/checkout` — Generates order ID, writes to Cloudflare KV, pings TBC/BOG for redirect URL.
- `POST /api/webhooks/tbc` — TBC callback endpoint.
- `POST /api/webhooks/bog` — BOG callback endpoint.

---

## 4. Design System Spec
**Typography:**
- *Display:* **Oswald** (or a bespoke Grotesk like *Clash Display* if licensed). For Georgian, **BPG Arial** or a similar sturdy sans.
- *Body:* **Inter** (supports EN/KA seamlessly) for clean, highly legible form inputs.

**Color Palette:**
- *Background:* Wax Black (`#0a0a0a`)
- *Surface:* Matte Grey (`#171717`) — used for form cards and modals.
- *Accent:* Vinyl Red (`#e11d48`) or Cobalt Blue (`#2563eb`) — used sparingly for the selected state rings and main CTAs.
- *Text:* Off-White (`#f5f5f5`) and Muted (`#a3a3a3`).

**Motion Principles:**
- **Materiality:** Elements shouldn't just fade; they should slide up with a subtle spring physics (damping: 20, stiffness: 100) mimicking physical weight.
- **Magnetic Cursors:** On the `ORDER NOW` button, the button subtly pulls toward the cursor on hover.
- **Texture:** A fixed, 5% opacity noise overlay across the `<body>` to mimic the analog feel of wax.

---

## 5. Page-by-Page Wireframes

### Home (`/`)
1. **Hero:** 100vh. Dark, moody macro shot of grooves. Large "CUSTOM CUTTING SERVICE" text slides up on load. 7", 10", 12" boxes are glassmorphic, tilting slightly on mouse movement.
2. **Service:** Two-column grid. Left: Large typography. Right: 3 stacked cards (One-off, Fast, All Formats) that stagger-fade in on scroll.
3. **Collaboration:** 4-column CSS grid. Hovering a tile scales the image and reveals the title. Clicking triggers a Framer Motion `AnimatePresence` modal overlaying the screen.
4. **About / Contact:** Large, editorial typography spanning multiple columns.

### Order Configurator (`/order`)
- **Layout:** Two columns on Desktop. Left: Scrolling form fields. Right: Sticky "TOTAL + SUBMIT" summary panel.
- **Step 1 (Customer Info):** Minimalist input fields, bottom-border only, floating labels.
- **Step 2 (Size):** 3 large clickable cards. Selected state gains a glowing Accent border.
- **Step 3 (Color):** 3 circular swatches. Clicking one applies a scale spring animation.
- **Step 4 & 5 (Sticker / Packaging):** Drag-and-drop file zones. Upload progress bar is a thin, satisfying line.

---

## 6. Order & Payment Flow Sequence

1. **Staging:** 
   - User clicks `SUBMIT ORDER`. 
   - Client uploads any sticker/artwork files directly to **Supabase Storage** (in a `temp/` bucket) and gets URLs.
   - Client sends payload (Name, Phone, Specs, File URLs) to `POST /api/checkout`.
   - Server generates a UUID (`order_id`).
   - Server writes the payload to **Cloudflare KV** using `await env.ORDERS_KV.put(order_id, JSON.stringify(payload), { expirationTtl: 3600 })` (1 hour TTL).
2. **Payment Generation:**
   - Server uses generated `tbc/types.ts` or `bog/types.ts` to call the bank API, passing the `order_id` in the bank's `external_order_id` field.
   - Server returns the bank `_link` to the client. Client redirects.
3. **Success Callback (Webhook):**
   - Bank fires `POST /api/webhooks/bog`.
   - Server verifies BOG signature / TBC token using Edge-compatible Web Crypto API.
   - Server calls `await env.ORDERS_KV.get(order_id)`. If null, abort (idempotency/expired).
   - Server inserts the payload into the **Supabase** `orders` table.
   - Server moves files from `temp/` to `final/` bucket in Supabase Storage.
   - Server fires a `POST` to **Web3Forms** with the formatted order specs.
   - Server calls `await env.ORDERS_KV.delete(order_id)` to ensure this can never fire twice (strict idempotency).

---

## 7. i18n Plan
- **Library:** `next-intl` (Edge compatible).
- **Structure:** `messages/en.json` and `messages/ka.json`.
- **Routing:** Use the `[locale]` dynamic segment (e.g., `/en/order`, `/ka/order`).
- **Switcher:** A server-side cookie `NEXT_LOCALE` combined with next-intl's middleware to auto-detect and persist preferences.
- **SEO:** `generateMetadata` will map `hreflang` tags dynamically for both languages.

---

## 8. Folder Structure
```text
/firfita-nextjs
├── messages/
│   ├── en.json
│   └── ka.json
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── order/
│   │   │   │   ├── page.tsx
│   │   │   │   └── success/page.tsx
│   │   │   └── (other pages)
│   │   ├── api/
│   │   │   ├── checkout/route.ts
│   │   │   └── webhooks/
│   │   │       ├── bog/route.ts
│   │   │       └── tbc/route.ts
│   ├── components/
│   │   ├── ui/ (buttons, inputs, modals)
│   │   ├── order/ (Configurator steps)
│   │   └── layout/ (Nav, Footer)
│   ├── lib/
│   │   ├── tbc/
│   │   ├── bog/
│   │   ├── db/ (Drizzle schema)
│   │   └── web3forms.ts
```

---

## 9. Environment Variables
```env
# Cloudflare Pages injects these via its dashboard, but locally:
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Payment Gateways (Already mapped)
TBC_API_KEY="..."
TBC_CLIENT_ID="..."
TBC_CLIENT_SECRET="..."
BOG_CLIENT_ID="..."
BOG_CLIENT_SECRET="..."

# Email
WEB3FORMS_ACCESS_KEY="..."
```
*(Cloudflare KV bindings are handled via `wrangler.toml` during dev/build).*

---

## 10. Build Phases
1. **Foundation:** Setup Drizzle, Supabase, `next-intl`, and Cloudflare Pages configurations (`wrangler.toml`).
2. **Design System:** Implement fonts, Tailwind tokens, and global Framer Motion wrappers. Build Navbar & Footer.
3. **Landing Pages:** Build Home, About, Pricing, Contact with responsive grids and motion.
4. **Order Configurator UI:** Build the complex client-side form, file uploads (to Supabase Storage), and live price calculator.
5. **Payment APIs & KV Staging:** Implement `/api/checkout`, Cloudflare KV bindings, and redirect to TBC/BOG sandboxes.
6. **Webhooks & Email:** Implement callback routes, signature verification, Supabase insertion, KV cleanup, and Web3Forms dispatch.
7. **Testing & QA:** Verify mobile layouts, test Edge runtime constraints, and validate idempotency (double-submitting webhooks).

---

## 11. Open Questions for You

> [!IMPORTANT]
> **1. Cloudflare KV Setup:** Are you comfortable managing the Cloudflare Pages deployment (connecting the GitHub repo to the Cloudflare dashboard and binding the KV namespace)? I will provide the `wrangler.toml` file, but the dashboard setup requires your Cloudflare account.
> 
> **2. File Uploads:** Since we are moving to Cloudflare Pages, the server cannot temporarily hold huge files on disk. Uploading them directly from the browser to **Supabase Storage** (or Cloudflare R2) before the user clicks "Pay" is the cleanest method. Do you already have a Supabase project created that we can use?
>
> **3. Web3Forms Attachment Limitations:** Web3Forms doesn't handle massive file attachments natively in the email payload. Is it acceptable if the email you receive just contains **clickable links** to the artwork files stored in Supabase/R2?
