# PNG Embroidery — Vendor Portal

Full-stack Next.js 15 vendor portal for **PNG Embroidery**, Port Moresby, Papua New Guinea. Handles the complete B2B uniform ordering lifecycle — from product browsing and customisation to order tracking, payment verification, and admin management.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Server Components) |
| Language | TypeScript |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 5 |
| Auth | NextAuth.js v5 (Credentials) |
| Styling | Tailwind CSS |
| UI Primitives | Radix UI, Lucide React |
| Charts | Recharts |
| PDF Generation | jsPDF + jspdf-autotable |
| Excel Export | xlsx |
| Deployment | Vercel |

---

## Features

### Customer Portal
- **Shop** — browse products by category, search, filter; per-variant (size × colour) stock indicators
- **Product Detail** — colour-first UX, per-variant stock levels (Out of Stock / Only X left / X available)
- **Cart & Checkout** — mixed standard + customised items, name embroidery, free delivery
- **Order Review** — download Quotation PDF before confirming
- **Order Confirmation** — download Tax Invoice PDF after confirming
- **My Orders** — full order history with status filter tabs including Pending Confirmation
- **Order Detail** — live status, payment status badge (Pending / Partially Paid / ✓ Paid), downloadable invoice with PAID watermark when payment confirmed
- **Dashboard** — active order count, recent activity, proof approval alerts
- **Notifications** — real-time in-app notification centre
- **Profile** — inline editing, password change

### Superior Customer Portal
All customer features, plus:
- **Team Purchase Reports** — team member spend, order counts, product analytics
- **Export** — CSV, Excel, PDF, Print

### Admin Portal
- **Order Management Dashboard** — search, date range filter, status tabs, pending-confirmation alert banner, CSV export
- **Order Detail** — 9-stage progress stepper, status update with notifications, timeline with admin name who changed each status, tracking number, estimated delivery, internal notes, customisation review, payment panel, delete with confirmation
- **Payment Management** — update payment status (Pending / Partially Paid / Paid / Failed / Refunded), payment method, received date, bank deposit reference, amount received, notes; sends notifications to customer + all superior customers on update
- **Customer Management** — create / edit / delete accounts, role assignment (Customer / Superior Customer / Admin / Super Admin), password reset, activate/deactivate toggle, stats cards
- **Product Management** — full create/edit form with live image preview and stock bar, SKU, category, sizes/colours tag input, name embroidery toggle, visibility control (Active / Hidden)
- **Inventory Management** — per-variant (size × colour) stock grid, colour-coded inputs (red = OOS, orange = low)
- **Customisation Queue** — review and approve embroidery artwork submissions
- **Reports & Analytics** — revenue, order volume, product analytics
- **Discount Codes** — percentage and fixed-amount promo codes

### Notifications
Automatic in-app notifications sent to:
- Customer — on order status change, payment update, cancellation
- All Superior Customers — same events for their team's orders

---

## Order Status Workflow

```
PENDING_CONFIRMATION → CONFIRMED → ORDER_RECEIVED → IN_REVIEW
  → PROOF_SENT → IN_PRODUCTION → QUALITY_CHECK → SHIPPED → DELIVERED
  (or CANCELLED at any point)
```

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/                  # Login, Register
│   ├── (admin-public)/          # Admin login
│   ├── (customer)/              # Customer portal
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── dashboard/
│   │   ├── notifications/
│   │   ├── orders/[id]/
│   │   ├── profile/
│   │   ├── reports/
│   │   └── shop/[slug]/
│   ├── (admin)/                 # Admin portal
│   │   └── admin/
│   │       ├── customers/
│   │       ├── dashboard/
│   │       ├── discounts/
│   │       ├── orders/[id]/
│   │       ├── products/
│   │       │   ├── new/
│   │       │   └── [id]/
│   │       │       ├── edit/
│   │       │       └── inventory/
│   │       ├── queue/
│   │       └── reports/
│   └── api/
│       ├── auth/                # NextAuth + register
│       ├── cart/
│       ├── categories/
│       ├── notifications/
│       ├── orders/[id]/
│       ├── products/[slug]/
│       ├── reports/
│       └── admin/
│           ├── categories/
│           ├── customers/[id]/
│           ├── discounts/
│           ├── orders/[id]/
│           ├── products/[id]/
│           │   └── variants/
│           ├── queue/
│           └── reports/
├── components/
│   ├── admin/                   # AdminLayout, ProductForm
│   └── shared/                  # StatusBadge, Providers
├── lib/
│   ├── auth.ts
│   ├── prisma.ts
│   └── utils.ts
└── middleware.ts                 # Route protection
prisma/
├── schema.prisma
└── seed.ts
```

---

## Database Schema

| Model | Description |
|---|---|
| `User` | Customers and admins; roles: CUSTOMER, SUPERIOR_CUSTOMER, ADMIN, SUPER_ADMIN |
| `Account / Session / VerificationToken` | NextAuth adapter tables |
| `Address` | Delivery addresses per user |
| `Category` | Product categories |
| `Product` | Products with sizes, colours, SKU, embroidery flag, visibility |
| `ProductVariant` | Per-variant (size × colour) stock tracking; unique `(productId, size, color)` |
| `ProductImage` | Multiple images per product with sort order |
| `CartItem` | Per-user cart with customisation JSON |
| `Order` | Full order with payment fields: `paymentStatus`, `paymentMethod`, `paymentReceivedDate`, `bankDepositRef`, `amountReceived`, `paymentNotes` |
| `OrderItem` | Line items with price + customisation snapshot |
| `OrderStatusHistory` | Full audit trail — status, note, timestamp, admin who changed it (`changedByUser` relation) |
| `CustomizationReview` | Admin review queue for embroidery artwork |
| `DiscountCode` | Percentage and fixed promo codes |
| `Notification` | In-app notifications per user |

### Enums

```prisma
enum OrderStatus {
  PENDING_CONFIRMATION | CONFIRMED | ORDER_RECEIVED | IN_REVIEW
  PROOF_SENT | PROOF_APPROVED | IN_PRODUCTION | QUALITY_CHECK
  SHIPPED | DELIVERED | CANCELLED
}

enum PaymentStatus {
  PENDING | PARTIALLY_PAID | PAID | FAILED | REFUNDED
}

enum Role {
  CUSTOMER | SUPERIOR_CUSTOMER | ADMIN | SUPER_ADMIN
}
```

---

## Setup

### 1. Clone and install

```bash
git clone <repo>
cd png-embroidery-portal
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
# Supabase
DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[pass]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
AUTH_SECRET="your-secret-here"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="PNG Embroidery Vendor Portal"
```

### 3. Set up database

```bash
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to Supabase
npm run db:seed       # Seed products + demo users
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@pngembroidery.net | Admin@2025! |
| Superior Customer | philip@gmail.com | Superior@2025! |
| Standard Customer | john@gmail.com | Customer@2025! |

Admin login page: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

---

## Role Permissions

| Feature | Customer | Superior Customer | Admin |
|---|:---:|:---:|:---:|
| Shop & Browse | ✅ | ✅ | — |
| Cart & Checkout | ✅ | ✅ | — |
| My Orders + Invoice | ✅ | ✅ | — |
| Dashboard | ✅ | ✅ | — |
| Notifications | ✅ | ✅ | ✅ |
| Team Purchase Reports | ❌ | ✅ | — |
| PDF / Excel Export | ❌ | ✅ | — |
| Order Management | ❌ | ❌ | ✅ |
| Product Management | ❌ | ❌ | ✅ |
| Customer Management | ❌ | ❌ | ✅ |
| Payment Verification | ❌ | ❌ | ✅ |
| Inventory Management | ❌ | ❌ | ✅ |
| Discount Codes | ❌ | ❌ | ✅ |
| Reports & Analytics | ❌ | ❌ | ✅ |

---

## API Routes

### Public
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products` | List products (search, filter, paginate) |
| GET | `/api/products/[slug]` | Product detail with variants |
| GET | `/api/categories` | All categories |
| POST | `/api/auth/register` | Register new customer |

### Customer (authenticated)
| Method | Endpoint | Description |
|---|---|---|
| GET/POST/DELETE | `/api/cart` | Cart management |
| GET/POST | `/api/orders` | Order list / place order |
| GET | `/api/orders/[id]` | Order detail |
| GET/PATCH | `/api/notifications` | Notifications list / mark read |
| GET | `/api/reports/customer` | Purchase analytics |

### Admin only
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/orders` | All orders (search, filter, date range) |
| GET/PATCH/DELETE | `/api/admin/orders/[id]` | Order detail / status + payment update / delete |
| GET/POST | `/api/admin/products` | Product list / create |
| GET/PATCH/DELETE | `/api/admin/products/[id]` | Product detail / update / delete |
| GET/PUT/PATCH | `/api/admin/products/[id]/variants` | Variant stock management |
| GET/POST | `/api/admin/customers` | Customer list (all roles) / create |
| GET/PATCH/DELETE | `/api/admin/customers/[id]` | Customer detail / update / delete |
| GET | `/api/admin/categories` | Category list |
| GET/POST | `/api/admin/discounts` | Discount codes |
| GET/PATCH | `/api/admin/queue` | Customisation review queue |
| GET | `/api/admin/reports` | Revenue and analytics data |

---

## PDF Documents

| Document | Trigger | Content |
|---|---|---|
| **Quotation** | Order review page (pre-confirm) | Items, totals, FREE delivery, PNG Embroidery branding |
| **Tax Invoice** | Post-confirmation & order detail page | Same + invoice number, order date |
| **PAID Stamp** | When `paymentStatus = PAID` | Diagonal watermark + green PAID badge on invoice |

---

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Add all environment variables from `.env.local` in the Vercel dashboard. The `vercel.json` runs `prisma generate && next build` automatically.

---

## Contact

**PNG Embroidery**  
Section 451, Cameron Road, Waigani Drive  
Port Moresby, NCD, Papua New Guinea  
Tel: +675 311 2000 · sales@pngembroidery.net · [pngembroidery.net](https://pngembroidery.net)
