import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const md = (data: object) => JSON.stringify(data);

const CATEGORIES = [
  { name: "Shirts",    slug: "shirts",    sortOrder: 1, imageUrl: "https://placehold.co/400x400/8d7b5e/ffffff?text=Shirts" },
  { name: "Pants",     slug: "pants",     sortOrder: 2, imageUrl: "https://placehold.co/400x400/1a237e/ffffff?text=Pants" },
  { name: "Coveralls", slug: "coveralls", sortOrder: 3, imageUrl: "https://placehold.co/400x400/4a148c/ffffff?text=Coveralls" },
  { name: "Jeans",     slug: "jeans",     sortOrder: 4, imageUrl: "https://placehold.co/400x400/37474f/ffffff?text=Jeans" },
];

const PRODUCTS = [
  {
    name: "Women's 7oz Tecasafe® Flame Resistant Uniform Shirt w/ Hi-Vis - Proman Exclusive",
    slug: "womens-7oz-tecasafe-fr-uniform-shirt-hi-vis-Proman-exclusive",
    cat: "shirts",
    price: 157.00,
    colors: ["Khaki"],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    stock: 50,
    customizable: true,
    tags: ["Proman-exclusive"],
    imageUrl: "https://i.pinimg.com/736x/aa/70/7e/aa707ecfe154f99350dc77969188202b.jpg",
    description: md({
      subtitle: "Women's Insect Repellent Tecasafe Flame Resistant Uniform Shirt w/ Hi-Vis",
      sku: "IS-VS7FR-HVE-KHK",
      badges: ["Proman Exclusive"],
      originalPrice: null,
      rating: 0,
      reviewCount: 0,
      notes: [
        "This item runs small, it is recommended that you order a size larger than normal.",
        "SPECIAL ORDER: 3-4 weeks preparation time needed.",
      ],
      features: [
        "Repels mosquitoes, ticks, ants, flies, chiggers and midges",
        "EPA-registered permethrin repellent built into the fabric",
        "Flame resistant",
        "Tecasafe fabric: 48% modacrylic, 37% Lyocell, 15% Para-Aramid",
        "Hi-Vis taping at critical areas - over shoulder, across upper back & on upper arms",
        "Arc rating ATPV 8.5 calories/cm2 - NFPA 2112",
        "Long sleeve, button front",
        "Gusset side seam to allow ease of movement",
        "Banded topstitched collar",
        "Placket front with button closure",
        "Insect Shield logo on right sleeve",
        "Note that there is a price increase for sizes 2XL and above.",
        "Normal home laundering is recommended. Do not dry clean.",
      ],
    }),
  },
  {
    name: "Women's 7oz Tecasafe® Flame Resistant Work Pant - Proman Exclusive",
    slug: "womens-7oz-tecasafe-fr-work-pant-Proman-exclusive",
    cat: "pants",
    price: 145.00,
    colors: ["Navy"],
    sizes: ["2", "4", "6", "8", "10", "12", "14", "16", "18", "20"],
    stock: 40,
    customizable: false,
    tags: ["Proman-exclusive", "price-includes-discount"],
    imageUrl: "https://placehold.co/600x800/1a237e/ffffff?text=Women%27s+FR+Work+Pant",
    description: md({
      subtitle: "Women's Insect Repellent Tecasafe Flame Resistant Work Pant",
      sku: "IS-WP7FR-NVY-EXX",
      badges: ["Proman Exclusive", "Price Includes Discount"],
      originalPrice: null,
      rating: 0,
      reviewCount: 0,
      notes: ["SPECIAL ORDER: 3-4 weeks preparation time needed."],
      features: [
        "Repels mosquitoes, ticks, ants, flies, chiggers and midges",
        "EPA-registered permethrin repellent built into the fabric",
        "Flame resistant",
        "Tecasafe fabric: 48% modacrylic, 37% Lyocell, 15% Para-Aramid",
        "Hi-Vis taping at critical areas",
        "Arc rating ATPV 8.5 calories/cm2 - NFPA 2112",
        "Multiple pockets for storage",
        "Belt loops",
        "Women's relaxed fit",
        "Normal home laundering is recommended. Do not dry clean.",
      ],
    }),
  },
  {
    name: "Insect Shield Men's 7 oz. Tecasafe® Flame Resistant Uniform Shirt w/ Hi-Vis",
    slug: "mens-7oz-tecasafe-fr-uniform-shirt-hi-vis",
    cat: "shirts",
    price: 157.00,
    colors: ["Khaki", "Navy"],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    stock: 75,
    customizable: true,
    tags: [],
    imageUrl: "https://placehold.co/600x800/8d7b5e/ffffff?text=Men%27s+FR+Uniform+Shirt",
    description: md({
      subtitle: "Men's Insect Repellent Tecasafe Flame Resistant Uniform Shirt w/ Hi-Vis",
      sku: "IS-MS7FR-HVE",
      badges: [],
      originalPrice: null,
      rating: 5,
      reviewCount: 1,
      notes: [
        "This item runs small, it is recommended that you order a size larger than normal.",
        "SPECIAL ORDER: 3-4 weeks preparation time needed.",
      ],
      features: [
        "Repels mosquitoes, ticks, ants, flies, chiggers and midges",
        "EPA-registered permethrin repellent built into the fabric",
        "Flame resistant",
        "Tecasafe fabric: 48% modacrylic, 37% Lyocell, 15% Para-Aramid",
        "Hi-Vis taping at critical areas - over shoulder, across upper back & on upper arms",
        "Arc rating ATPV 8.5 calories/cm2 - NFPA 2112",
        "Long sleeve, button front",
        "Gusset side seam to allow ease of movement",
        "Banded topstitched collar",
        "Placket front with button closure",
        "Insect Shield logo on right sleeve",
        "Note that there is a price increase for sizes 2XL and above.",
        "Normal home laundering is recommended. Do not dry clean.",
      ],
    }),
  },
  {
    name: "Insect Shield Men's 7 oz. Tecasafe® Flame Resistant Work Pants w/ Hi-Vis",
    slug: "mens-7oz-tecasafe-fr-work-pants-hi-vis",
    cat: "pants",
    price: 134.00,
    colors: ["Khaki", "Navy"],
    sizes: ["28x30", "30x30", "32x30", "32x32", "34x30", "34x32", "36x32", "38x32", "40x32"],
    stock: 60,
    customizable: false,
    tags: [],
    imageUrl: "https://placehold.co/600x800/1a237e/ffffff?text=Men%27s+FR+Work+Pants",
    description: md({
      subtitle: "Men's Insect Repellent Tecasafe Flame Resistant Work Pants w/ Hi-Vis",
      sku: "IS-MP7FR-HVE",
      badges: [],
      originalPrice: null,
      rating: 4.5,
      reviewCount: 2,
      notes: ["SPECIAL ORDER: 3-4 weeks preparation time needed."],
      features: [
        "Repels mosquitoes, ticks, ants, flies, chiggers and midges",
        "EPA-registered permethrin repellent built into the fabric",
        "Flame resistant",
        "Tecasafe fabric: 48% modacrylic, 37% Lyocell, 15% Para-Aramid",
        "Hi-Vis taping at critical areas",
        "Arc rating ATPV 8.5 calories/cm2 - NFPA 2112",
        "Multiple pockets",
        "Belt loops",
        "Relaxed fit for comfort",
        "Normal home laundering is recommended. Do not dry clean.",
      ],
    }),
  },
  {
    name: "Insect Shield Men's Two-Tone Work Shirt with Hi-Vis",
    slug: "mens-two-tone-work-shirt-with-hi-vis",
    cat: "shirts",
    price: 40.00,
    colors: ["Yellow/Navy"],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    stock: 15,
    customizable: false,
    tags: ["clearance", "final-sale"],
    imageUrl: "https://placehold.co/600x800/f9a825/000000?text=Two-Tone+Work+Shirt",
    description: md({
      subtitle: "Men's Insect Repellent Two-Tone Work Shirt with Hi-Vis",
      sku: "IS-TT-WS-YNVY",
      badges: ["Clearance"],
      originalPrice: 52.00,
      rating: 4.5,
      reviewCount: 6,
      notes: [
        "Final Sale - No Returns/Exchanges.",
        "Not Valid for Extra Discounts.",
      ],
      features: [
        "Repels mosquitoes, ticks, ants, flies, chiggers and midges",
        "EPA-registered permethrin repellent built into the fabric",
        "Hi-Vis taping for maximum visibility",
        "Two-tone yellow and navy design meets ANSI/ISEA 107 standards",
        "Durable work shirt construction",
        "Button-front closure",
        "Two chest pockets with button flaps",
        "Normal home laundering is recommended.",
      ],
    }),
  },
  {
    name: "Insect Shield Men's 7 oz Tecasafe® Flame Resistant Coverall w/ Hi-Vis",
    slug: "mens-7oz-tecasafe-fr-coverall-hi-vis",
    cat: "coveralls",
    price: 229.00,
    colors: ["Khaki", "Navy"],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    stock: 25,
    customizable: false,
    tags: [],
    imageUrl: "https://placehold.co/600x800/8d7b5e/ffffff?text=FR+Coverall+w%2F+Hi-Vis",
    description: md({
      subtitle: "Men's Insect Repellent Tecasafe Flame Resistant Coverall w/ Hi-Vis",
      sku: "IS-COV7FR-HVE",
      badges: [],
      originalPrice: null,
      rating: 0,
      reviewCount: 0,
      notes: ["SPECIAL ORDER: 3-4 weeks preparation time needed."],
      features: [
        "Repels mosquitoes, ticks, ants, flies, chiggers and midges",
        "EPA-registered permethrin repellent built into the fabric",
        "Flame resistant",
        "Tecasafe fabric: 48% modacrylic, 37% Lyocell, 15% Para-Aramid",
        "Hi-Vis taping at critical areas",
        "Arc rating ATPV 8.5 calories/cm2 - NFPA 2112",
        "Full-length brass zipper",
        "Multiple utility pockets",
        "Insect Shield logo on right sleeve",
        "Normal home laundering is recommended. Do not dry clean.",
      ],
    }),
  },
  {
    name: "Insect Shield Lightweight Flame Resistant Hi-Vis Premium Coveralls",
    slug: "lightweight-fr-hi-vis-premium-coveralls",
    cat: "coveralls",
    price: 218.00,
    colors: ["Blue", "Khaki", "Navy"],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    stock: 0,
    customizable: false,
    tags: ["sold-out"],
    imageUrl: "https://placehold.co/600x800/1565c0/ffffff?text=Hi-Vis+Premium+Coveralls",
    description: md({
      subtitle: "Insect Repellent Lightweight Flame Resistant Hi-Vis Premium Coveralls",
      sku: "IS-LW-COV-HIV",
      badges: ["Sold Out"],
      originalPrice: null,
      rating: 0,
      reviewCount: 0,
      notes: [
        "Currently out of stock. Please check back later.",
        "SPECIAL ORDER: 3-4 weeks preparation time needed when available.",
      ],
      features: [
        "Repels mosquitoes, ticks, ants, flies, chiggers and midges",
        "EPA-registered permethrin repellent built into the fabric",
        "Lightweight flame resistant fabric for all-day comfort",
        "Hi-Vis premium design for maximum worksite visibility",
        "Full-length brass zipper",
        "Multiple utility pockets",
        "Elastic waistband for comfort",
        "Normal home laundering is recommended. Do not dry clean.",
      ],
    }),
  },
  {
    name: "Insect Shield Men's Wrangler Flame Resistant Jeans",
    slug: "mens-wrangler-flame-resistant-jeans",
    cat: "jeans",
    price: 119.00,
    colors: ["Denim"],
    sizes: ["28x30", "30x30", "32x30", "32x32", "34x30", "34x32", "36x32", "38x32", "40x32"],
    stock: 30,
    customizable: false,
    tags: [],
    imageUrl: "https://placehold.co/600x800/37474f/ffffff?text=Men%27s+Wrangler+FR+Jeans",
    description: md({
      subtitle: "Men's Wrangler Flame Resistant Jeans with Built-In Insect Shield",
      sku: "IS-WR-MFR-DEN",
      badges: [],
      originalPrice: null,
      rating: 0,
      reviewCount: 0,
      notes: [
        "Wrangler × Insect Shield collaboration.",
        "Traditional jeans fit and styling with FR protection.",
      ],
      features: [
        "Repels mosquitoes, ticks, ants, flies, chiggers and midges",
        "EPA-registered permethrin repellent built into the fabric",
        "Flame resistant denim construction",
        "Wrangler brand quality and durability",
        "Traditional 5-pocket styling",
        "Belt loops",
        "Classic relaxed fit",
        "Normal home laundering is recommended.",
      ],
    }),
  },
  {
    name: "Insect Shield Women's Wrangler Flame Resistant Jeans",
    slug: "womens-wrangler-flame-resistant-jeans",
    cat: "jeans",
    price: 117.00,
    colors: ["Denim"],
    sizes: ["2", "4", "6", "8", "10", "12", "14", "16"],
    stock: 35,
    customizable: false,
    tags: [],
    imageUrl: "https://placehold.co/600x800/37474f/ffffff?text=Women%27s+Wrangler+FR+Jeans",
    description: md({
      subtitle: "Women's Wrangler Flame Resistant Jeans with Built-In Insect Shield",
      sku: "IS-WR-WFR-DEN",
      badges: [],
      originalPrice: null,
      rating: 0,
      reviewCount: 0,
      notes: [
        "Wrangler × Insect Shield collaboration.",
        "Women's fit with FR protection.",
      ],
      features: [
        "Repels mosquitoes, ticks, ants, flies, chiggers and midges",
        "EPA-registered permethrin repellent built into the fabric",
        "Flame resistant denim construction",
        "Wrangler brand quality and durability",
        "Women's relaxed fit",
        "5-pocket styling",
        "Belt loops",
        "Normal home laundering is recommended.",
      ],
    }),
  },
];

async function main() {
  console.log("🗑️  Clearing existing data...");
  await prisma.cartItem.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.customizationReview.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.discountCode.deleteMany();
  console.log("✅ Cleared");

  console.log("🌱 Seeding categories...");
  const catMap: Record<string, string> = {};
  for (const c of CATEGORIES) {
    const cat = await prisma.category.create({ data: c });
    catMap[c.slug] = cat.id;
  }
  console.log("✅ Categories:", Object.keys(catMap).join(", "));

  console.log("🌱 Seeding products...");
  for (const p of PRODUCTS) {
    await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        categoryId: catMap[p.cat],
        basePrice: p.price,
        customSurcharge: 0,
        isCustomizable: p.customizable,
        stockQty: p.stock,
        lowStockThreshold: 5,
        imageUrl: p.imageUrl,
        description: p.description,
        sizes: p.sizes,
        colors: p.colors,
        tags: p.tags,
        isActive: true,
      },
    });
    console.log(`  ✅ ${p.name}`);
  }

  console.log("🌱 Seeding admin + discount codes...");
  const adminPassword = await bcrypt.hash("Admin@2025!", 12);
  await prisma.user.upsert({
    where: { email: "admin@pngembroidery.net" },
    update: {},
    create: {
      name: "PNG Embroidery Admin",
      email: "admin@pngembroidery.net",
      password: adminPassword,
      role: "SUPER_ADMIN",
      emailVerified: new Date(),
    },
  });
  const custPassword = await bcrypt.hash("Customer@2025!", 12);
  await prisma.user.upsert({
    where: { email: "john@gmail.com" },
    update: {},
    create: {
      name: "John Doe",
      email: "john@gmail.com",
      password: custPassword,
      role: "CUSTOMER",
      phone: "+675 7000 1234",
      emailVerified: new Date(),
    },
  });
  await prisma.discountCode.createMany({
    data: [
      { code: "WELCOME10", type: "PERCENTAGE", value: 10, minOrderValue: 50, maxUses: 100, isActive: true },
      { code: "BULK20",    type: "PERCENTAGE", value: 20, minOrderValue: 500, maxUses: 50,  isActive: true },
      { code: "SAVE50",    type: "FIXED",      value: 50, minOrderValue: 200, maxUses: 30,  isActive: true },
    ],
  });

  console.log("\n🎉 Seed complete!");
  console.log(`   Products: ${PRODUCTS.length}`);
  console.log("   Admin:    admin@pngembroidery.net / Admin@2025!");
  console.log("   Customer: john@gmail.com / Customer@2025!");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
