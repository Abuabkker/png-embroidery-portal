# PNG Embroidery — Vendor Portal

Full-stack Next.js 15 vendor portal for PNG Embroidery, Port Moresby, Papua New Guinea.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 5 |
| Auth | NextAuth.js v5 (Google + Credentials) |
| Styling | Tailwind CSS + Radix UI |
| Charts | Recharts |
| Deployment | Vercel |

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login, Register pages
│   ├── (customer)/          # Customer portal (dashboard, shop, orders, cart)
│   ├── (admin)/             # Admin portal (dashboard, orders, products, queue, reports)
│   └── api/                 # REST API routes
│       ├── auth/            # NextAuth + register
│       ├── products/        # Product listing + detail
│       ├── categories/      # Category listing
│       ├── cart/            # Cart CRUD
│       ├── orders/          # Customer orders
│       └── admin/           # Admin-only endpoints
├── components/
│   ├── shared/              # Logo, StatusBadge, Providers
│   ├── customer/            # CustomerLayout
│   └── admin/               # AdminLayout
├── lib/
│   ├── auth.ts              # NextAuth config
│   ├── prisma.ts            # Prisma client singleton
│   └── utils.ts             # Helpers (formatCurrency, slugify, etc.)
├── types/                   # TypeScript types
└── middleware.ts            # Route protection
prisma/
├── schema.prisma            # Full DB schema (12 models)
└── seed.ts                  # 69 real products + demo users
```

## Database Schema

- **User** — customers & admins with role-based access
- **Account / Session / VerificationToken** — NextAuth tables
- **Category** — 10 product categories
- **Product** — 69 real products from pngembroidery.net
- **ProductImage** — multi-image support per product
- **CartItem** — per-user cart with customization JSON
- **Order** — full order lifecycle with status history
- **OrderItem** — order line items with price snapshots
- **OrderStatusHistory** — audit trail for status changes
- **CustomizationReview** — admin review queue for embroidery designs
- **DiscountCode** — percentage/fixed promo codes
- **Notification** — in-app notification system

## Setup Instructions

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

Fill in your `.env.local`:

```env
# Supabase (get from Supabase dashboard → Settings → Database)
DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[pass]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# NextAuth (generate: openssl rand -base64 32)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"

# Google OAuth (console.cloud.google.com)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 3. Set up database

```bash
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to Supabase
npm run db:seed       # Seed 69 products + demo users
```

### 4. Run locally

```bash
npm run dev
```

Open http://localhost:3000

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@pngembroidery.net | Admin@2025! |
| Customer | john@gmail.com | Customer@2025! |

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Set environment variables in Vercel dashboard matching your `.env.local`.

The `vercel.json` runs `prisma generate && next build` automatically.

## API Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/products | Public | List products (filter, search, paginate) |
| GET | /api/products/[slug] | Public | Product detail |
| GET | /api/categories | Public | All categories |
| GET | /api/cart | Customer | Get cart |
| POST | /api/cart | Customer | Add to cart |
| DELETE | /api/cart | Customer | Remove from cart |
| GET | /api/orders | Customer | My orders |
| POST | /api/orders | Customer | Place order |
| GET | /api/orders/[id] | Customer | Order detail |
| POST | /api/auth/register | Public | Register customer |
| GET | /api/admin/orders | Admin | All orders |
| PATCH | /api/admin/orders/[id] | Admin | Update order status |
| GET | /api/admin/products | Admin | All products |
| POST | /api/admin/products | Admin | Create product |
| GET | /api/admin/queue | Admin | Customization queue |
| PATCH | /api/admin/queue | Admin | Review customization |
| GET | /api/admin/reports | Admin | Analytics data |
| GET | /api/admin/customers | Admin | Customer list |
| GET | /api/admin/discounts | Admin | Discount codes |
| POST | /api/admin/discounts | Admin | Create discount |

## Contact

**PNG Embroidery** — Section 451, Cameron Road, Waigani Drive, Port Moresby, NCD, Papua New Guinea  
Tel: +675 311 2000 · sales@pngembroidery.net · pngembroidery.net
