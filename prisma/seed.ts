import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const BASE = "https://pngembroidery.net/wp-content/uploads/2025/";

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Admin user ─────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("Admin@2025!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@pngembroidery.net" },
    update: {},
    create: {
      name: "PNG Embroidery Admin",
      email: "admin@pngembroidery.net",
      password: adminPassword,
      role: Role.SUPER_ADMIN,
      emailVerified: new Date(),
    },
  });
  console.log("✅ Admin user:", admin.email);

  // ─── Demo customer ───────────────────────────────────────────────────────────
  const custPassword = await bcrypt.hash("Customer@2025!", 12);
  const customer = await prisma.user.upsert({
    where: { email: "john@gmail.com" },
    update: {},
    create: {
      name: "John Doe",
      email: "john@gmail.com",
      password: custPassword,
      role: Role.CUSTOMER,
      phone: "+675 7000 1234",
      emailVerified: new Date(),
    },
  });
  console.log("✅ Demo customer:", customer.email);

  // ─── Demo address ────────────────────────────────────────────────────────────
  await prisma.address.upsert({
    where: { id: "demo-address-001" },
    update: {},
    create: {
      id: "demo-address-001",
      userId: customer.id,
      label: "Office",
      fullName: "John Doe",
      phone: "+675 7000 1234",
      street: "Section 451, Cameron Road, Waigani Drive",
      city: "Port Moresby",
      province: "National Capital District",
      country: "Papua New Guinea",
      isDefault: true,
    },
  });

  // ─── Categories ──────────────────────────────────────────────────────────────
  const categories = [
    { name: "T-Shirts",     slug: "t-shirts",     sortOrder: 1, imageUrl: BASE+"08/CT6002-720x1000-1-600x833-1-400x400.png" },
    { name: "Workwear",     slug: "workwear",      sortOrder: 2, imageUrl: BASE+"10/Yellow-Navy-Long-Sleeve-With-Reflector-400x379.png" },
    { name: "Hi-Vis",       slug: "hi-vis",        sortOrder: 3, imageUrl: BASE+"10/Lime-Navy-Padded-Jacket-400x379.png" },
    { name: "Safety Vests", slug: "safety-vests",  sortOrder: 4, imageUrl: BASE+"08/vest-blue-1-390x390-1.png" },
    { name: "PPE",          slug: "ppe",           sortOrder: 5, imageUrl: BASE+"10/white-safety-helmet-400x400.jpg" },
    { name: "Safety Boots", slug: "safety-boots",  sortOrder: 6, imageUrl: BASE+"10/5-400x267.jpg" },
    { name: "Uniforms",     slug: "uniforms",      sortOrder: 7, imageUrl: BASE+"08/light-blue-1-1-400x309.png" },
    { name: "Graduation",   slug: "graduation",    sortOrder: 8, imageUrl: BASE+"10/gowns-400x480.png" },
    { name: "Promotional",  slug: "promotional",   sortOrder: 9, imageUrl: BASE+"10/cotton-tote-bags-400x253.png" },
    { name: "Services",     slug: "services",      sortOrder: 10,imageUrl: BASE+"08/xdmasmdmasd.jpg.pagespeed.ic_.K4ZE_mDqdW.png" },
  ];

  const catMap: Record<string, string> = {};
  for (const cat of categories) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    catMap[cat.slug] = c.id;
  }
  console.log("✅ Categories seeded:", Object.keys(catMap).length);

  // ─── Products ────────────────────────────────────────────────────────────────
  const products = [
    // T-Shirts
    { name: "Cotton Round Neck T-Shirt",               slug: "cotton-round-neck-t-shirt",               cat: "t-shirts",     price: 18,   surcharge: 5,  customizable: true,  stock: 200, img: BASE+"08/CT6002-720x1000-1-600x833-1-400x400.png",       sizes: ["XS","S","M","L","XL","2XL","3XL"], colors: ["White","Black","Navy","Red","Grey"] },
    { name: "Quick Dry Round Neck T-Shirt",            slug: "quick-dry-round-neck-t-shirt",            cat: "t-shirts",     price: 22,   surcharge: 5,  customizable: true,  stock: 150, img: BASE+"10/mens-football-jersey-500x500-1-400x400.webp",   sizes: ["XS","S","M","L","XL","2XL"],       colors: ["White","Black","Red","Blue"] },
    { name: "Quick Dry Polo",                          slug: "quick-dry-polo",                          cat: "t-shirts",     price: 28,   surcharge: 5,  customizable: true,  stock: 180, img: BASE+"08/0000497_qd-3100-white-sea-blue-white-psea-blue_750-400x556.png", sizes: ["XS","S","M","L","XL","2XL","3XL"], colors: ["White","Navy","Red","Black","Grey"] },
    { name: "Cotton Polo",                             slug: "cotton-polo",                             cat: "t-shirts",     price: 25,   surcharge: 5,  customizable: true,  stock: 160, img: BASE+"08/image-6.png",                                    sizes: ["XS","S","M","L","XL","2XL","3XL"], colors: ["White","Black","Navy","Red","Green"] },
    // Workwear — Shirts
    { name: "Yellow Navy Long Sleeve With Reflector",  slug: "yellow-navy-long-sleeve-reflector",       cat: "workwear",     price: 45,   surcharge: 10, customizable: true,  stock: 120, img: BASE+"10/Yellow-Navy-Long-Sleeve-With-Reflector-400x379.png",  sizes: ["S","M","L","XL","2XL","3XL"] },
    { name: "Orange Navy Long Sleeve With Reflector",  slug: "orange-navy-long-sleeve-reflector",       cat: "workwear",     price: 45,   surcharge: 10, customizable: true,  stock: 100, img: BASE+"10/Orange-Navy-Long-Sleeve-With-Reflector-400x379.png", sizes: ["S","M","L","XL","2XL","3XL"] },
    { name: "Green Long Sleeve With Reflector",        slug: "green-long-sleeve-reflector",             cat: "workwear",     price: 42,   surcharge: 10, customizable: true,  stock: 90,  img: BASE+"10/Green-Long-Sleeve-with-reflector-400x379.png",       sizes: ["S","M","L","XL","2XL","3XL"] },
    { name: "Navy Long Sleeve With Reflector",         slug: "navy-long-sleeve-reflector",              cat: "workwear",     price: 42,   surcharge: 10, customizable: true,  stock: 110, img: BASE+"10/Navy-Long-Sleeve-With-Reflector-1-400x379.png",      sizes: ["S","M","L","XL","2XL","3XL"] },
    { name: "Khaki Long Sleeve With Reflector",        slug: "khaki-long-sleeve-reflector",             cat: "workwear",     price: 42,   surcharge: 10, customizable: true,  stock: 80,  img: BASE+"10/Khaki-Long-Sleeve-With-Reflector-1-400x379.png",     sizes: ["S","M","L","XL","2XL","3XL"] },
    { name: "Green Short Sleeve With Reflector",       slug: "green-short-sleeve-reflector",            cat: "workwear",     price: 38,   surcharge: 10, customizable: true,  stock: 95,  img: BASE+"10/Green-Short-Sleeve-With-Reflector-1-400x379.png",    sizes: ["S","M","L","XL","2XL","3XL"] },
    { name: "Orange Navy Short Sleeve With Reflector", slug: "orange-navy-short-sleeve-reflector",      cat: "workwear",     price: 38,   surcharge: 10, customizable: true,  stock: 85,  img: BASE+"10/Orange-Navy-Short-Sleeve-With-Reflector-400x379.png",sizes: ["S","M","L","XL","2XL","3XL"] },
    { name: "Navy Short Sleeve With Reflector",        slug: "navy-short-sleeve-reflector",             cat: "workwear",     price: 38,   surcharge: 10, customizable: true,  stock: 100, img: BASE+"10/Navy-Short-Sleeve-With-Reflector-400x379.png",       sizes: ["S","M","L","XL","2XL","3XL"] },
    { name: "Orange Navy Cool & Comfort (Ventilated)", slug: "orange-navy-cool-comfort-ventilated",     cat: "workwear",     price: 52,   surcharge: 10, customizable: true,  stock: 60,  img: BASE+"10/Orange-Navy-Long-Sleeve-With-Reflector-Cool-And-Comfort-Shirts-Ventilated-400x379.png", sizes: ["S","M","L","XL","2XL","3XL"] },
    // Workwear — Trousers
    { name: "Green Trousers With Reflector",           slug: "green-trousers-reflector",                cat: "workwear",     price: 48,   surcharge: 0,  customizable: false, stock: 80,  img: BASE+"10/Green-Trousers-With-Reflector-400x379.png",          sizes: ["28","30","32","34","36","38","40"] },
    { name: "Navy Trouser With Reflector",             slug: "navy-trouser-reflector",                  cat: "workwear",     price: 48,   surcharge: 0,  customizable: false, stock: 75,  img: BASE+"10/Navy-Trouser-With-Reflector-400x379.png",            sizes: ["28","30","32","34","36","38","40"] },
    { name: "Khaki Trousers With Reflector",           slug: "khaki-trousers-reflector",                cat: "workwear",     price: 48,   surcharge: 0,  customizable: false, stock: 70,  img: BASE+"10/Khaki-trousers-with-reflector-1-400x379.png",        sizes: ["28","30","32","34","36","38","40"] },
    { name: "Navy Trousers",                           slug: "navy-trousers",                           cat: "workwear",     price: 42,   surcharge: 0,  customizable: false, stock: 90,  img: BASE+"10/Navy-Trousers-400x379.png",                          sizes: ["28","30","32","34","36","38","40"] },
    // Hi-Vis Jackets
    { name: "Yellow Navy Padded Jacket",               slug: "yellow-navy-padded-jacket",               cat: "hi-vis",       price: 85,   surcharge: 15, customizable: true,  stock: 45,  img: BASE+"10/Yellow-Navy-Polo-Long-Sleeve-With-Reflector-1-400x379.png", sizes: ["S","M","L","XL","2XL","3XL"] },
    { name: "Orange Navy Padded Jacket",               slug: "orange-navy-padded-jacket",               cat: "hi-vis",       price: 85,   surcharge: 15, customizable: true,  stock: 40,  img: BASE+"08/Orange-Navy-Padded-Jacket-400x445.png",               sizes: ["S","M","L","XL","2XL","3XL"] },
    { name: "Lime Navy Padded Jacket",                 slug: "lime-navy-padded-jacket",                 cat: "hi-vis",       price: 85,   surcharge: 15, customizable: true,  stock: 5,   img: BASE+"10/Lime-Navy-Padded-Jacket-400x379.png",                 sizes: ["S","M","L","XL","2XL","3XL"] },
    // Safety Vests
    { name: "Canvas Safety Vest Black",                slug: "canvas-safety-vest-black",                cat: "safety-vests", price: 15,   surcharge: 5,  customizable: false, stock: 200, img: BASE+"08/vest-blue-1-390x390-1.png",                          sizes: ["S","M","L","XL","2XL"], colors: ["Black","Blue"] },
    { name: "Safety Vest Hi-Vis Yellow",               slug: "safety-vest-hi-vis-yellow",               cat: "safety-vests", price: 18,   surcharge: 5,  customizable: false, stock: 180, img: BASE+"08/10-400x556.png",                                     sizes: ["S","M","L","XL","2XL"] },
    // PPE — Helmets
    { name: "Safety Helmet White",                     slug: "safety-helmet-white",                     cat: "ppe",          price: 12,   surcharge: 0,  customizable: false, stock: 150, img: BASE+"10/white-safety-helmet-400x400.jpg",                    colors: ["White"] },
    { name: "Green Ventilation Safety Helmet",         slug: "green-ventilation-safety-helmet",         cat: "ppe",          price: 14,   surcharge: 0,  customizable: false, stock: 3,   img: BASE+"10/green-ventilation-helmet-400x400.jpg",               colors: ["Green","Yellow","White"] },
    { name: "Safety Helmet Yellow",                    slug: "safety-helmet-yellow",                    cat: "ppe",          price: 12,   surcharge: 0,  customizable: false, stock: 120, img: BASE+"08/fdsds-1-600x800-1-400x533.png",                      colors: ["Yellow"] },
    { name: "White Ventilation Safety Helmet",         slug: "white-ventilation-safety-helmet",         cat: "ppe",          price: 14,   surcharge: 0,  customizable: false, stock: 90,  img: BASE+"08/55-400x556.png",                                     colors: ["White"] },
    { name: "Blue Ventilation Safety Helmet",          slug: "blue-ventilation-safety-helmet",          cat: "ppe",          price: 14,   surcharge: 0,  customizable: false, stock: 0,   img: BASE+"08/sdds-1-600x800-1-400x533.png",                       colors: ["Blue"] },
    // PPE — Other
    { name: "Safety Glass",                            slug: "safety-glass",                            cat: "ppe",          price: 8,    surcharge: 0,  customizable: false, stock: 300, img: BASE+"08/ashdahsd-600x636-1-400x424.png" },
    { name: "Safety Glove",                            slug: "safety-glove",                            cat: "ppe",          price: 10,   surcharge: 0,  customizable: false, stock: 250, img: BASE+"08/6-1-1-400x556.png",                                  sizes: ["S","M","L","XL"] },
    { name: "Safety Jacket",                           slug: "safety-jacket",                           cat: "ppe",          price: 55,   surcharge: 10, customizable: true,  stock: 60,  img: BASE+"08/4-1-1.png",                                          sizes: ["S","M","L","XL","2XL","3XL"] },
    { name: "Ear Plugs",                               slug: "ear-plugs",                               cat: "ppe",          price: 5,    surcharge: 0,  customizable: false, stock: 500, img: BASE+"08/4-1-400x556.png" },
    { name: "Ear Muffs",                               slug: "ear-muffs",                               cat: "ppe",          price: 18,   surcharge: 0,  customizable: false, stock: 80,  img: BASE+"08/2-400x556.png" },
    // Safety Boots
    { name: "Black Wings Safety Boots Mid-Cut Black",  slug: "black-wings-safety-boots-mid-cut",        cat: "safety-boots", price: 95,   surcharge: 0,  customizable: false, stock: 80,  img: BASE+"10/5-400x267.jpg",                                      sizes: ["38","39","40","41","42","43","44","45","46"] },
    { name: "Blackwings Safety Boots High-Cut",        slug: "blackwings-safety-boots-high-cut",        cat: "safety-boots", price: 110,  surcharge: 0,  customizable: false, stock: 60,  img: BASE+"08/xnew-blalalal.jpg.pagespeed.ic_.0SngBacFHq.png",     sizes: ["38","39","40","41","42","43","44","45","46"] },
    { name: "Black Wings Safety Boots Slip-On",        slug: "black-wings-safety-boots-slip-on",        cat: "safety-boots", price: 88,   surcharge: 0,  customizable: false, stock: 55,  img: BASE+"08/xkjasdasdjj.jpg.pagespeed.ic_.8G15ZoRoaO.png",       sizes: ["38","39","40","41","42","43","44","45","46"] },
    { name: "Gum Boots",                               slug: "gum-boots",                               cat: "safety-boots", price: 45,   surcharge: 0,  customizable: false, stock: 100, img: BASE+"08/36-400x556.png",                                     sizes: ["38","39","40","41","42","43","44","45","46"] },
    { name: "GP Boots",                                slug: "gp-boots",                                cat: "safety-boots", price: 65,   surcharge: 0,  customizable: false, stock: 0,   img: BASE+"08/xgp-boot.jpg.pagespeed.ic_.q9lEqadMkv.png",          sizes: ["38","39","40","41","42","43","44","45","46"] },
    // Uniforms
    { name: "Corporate Office Wear",                   slug: "corporate-office-wear",                   cat: "uniforms",     price: 1000, surcharge: 50, customizable: true,  stock: 30,  img: BASE+"08/light-blue-1-1-400x309.png",                         sizes: ["XS","S","M","L","XL","2XL"], colors: ["Black","Dark Blue","Light Blue","Pink","Red","White"] },
    { name: "Corporate Wear Suites",                   slug: "corporate-wear-suites",                   cat: "uniforms",     price: 350,  surcharge: 50, customizable: true,  stock: 20,  img: BASE+"08/42-400x556.png",                                     sizes: ["XS","S","M","L","XL","2XL"] },
    { name: "Chef Uniform",                            slug: "chef-uniform",                            cat: "uniforms",     price: 80,   surcharge: 15, customizable: true,  stock: 50,  img: BASE+"08/chef-uniform-400x400.png",                           sizes: ["XS","S","M","L","XL","2XL"] },
    { name: "Hospital Nurse Uniform",                  slug: "hospital-nurse-uniform",                  cat: "uniforms",     price: 75,   surcharge: 15, customizable: true,  stock: 45,  img: BASE+"08/xpasted-image-0-21.png.pagespeed.ic_.zhPyICF5Hi.png",sizes: ["XS","S","M","L","XL","2XL"] },
    { name: "Hospital Nursing Scrub",                  slug: "hospital-nursing-scrub",                  cat: "uniforms",     price: 60,   surcharge: 10, customizable: true,  stock: 60,  img: BASE+"08/21-400x556.png",                                     sizes: ["XS","S","M","L","XL","2XL"], colors: ["Blue","Green","Ceil","Navy"] },
    { name: "Waiter Uniform",                          slug: "waiter-uniform",                          cat: "uniforms",     price: 70,   surcharge: 15, customizable: true,  stock: 40,  img: BASE+"08/13.png",                                             sizes: ["XS","S","M","L","XL","2XL"] },
    { name: "Military Uniform",                        slug: "military-uniform",                        cat: "uniforms",     price: 120,  surcharge: 20, customizable: true,  stock: 25,  img: BASE+"08/8.png",                                              sizes: ["XS","S","M","L","XL","2XL","3XL"] },
    { name: "Formal Uniform",                          slug: "formal-uniform",                          cat: "uniforms",     price: 95,   surcharge: 20, customizable: true,  stock: 35,  img: BASE+"08/9-2.png",                                            sizes: ["XS","S","M","L","XL","2XL"] },
    { name: "Police Uniform",                          slug: "police-uniform",                          cat: "uniforms",     price: 130,  surcharge: 20, customizable: true,  stock: 0,   img: BASE+"08/14.png",                                             sizes: ["XS","S","M","L","XL","2XL","3XL"] },
    { name: "Front Office Uniform",                    slug: "front-office-uniform",                    cat: "uniforms",     price: 90,   surcharge: 15, customizable: true,  stock: 40,  img: BASE+"08/15.png",                                             sizes: ["XS","S","M","L","XL","2XL"] },
    { name: "Women's 2-Pieces Dress",                  slug: "womens-2-pieces-dress",                   cat: "uniforms",     price: 85,   surcharge: 15, customizable: true,  stock: 30,  img: BASE+"08/dddaa-600x800-1-400x533.png",                        sizes: ["XS","S","M","L","XL","2XL"] },
    // Graduation
    { name: "Graduation Gowns",                        slug: "graduation-gowns",                        cat: "graduation",   price: 150,  surcharge: 20, customizable: true,  stock: 80,  img: BASE+"10/gowns-400x480.png",                                  sizes: ["XS","S","M","L","XL","2XL"] },
    { name: "Mortar Boards & Bonnets",                 slug: "mortar-boards-bonnets",                   cat: "graduation",   price: 45,   surcharge: 0,  customizable: false, stock: 100, img: BASE+"10/mortar-boards-and-bonnets-400x314.png" },
    { name: "Hoods",                                   slug: "hoods",                                   cat: "graduation",   price: 35,   surcharge: 0,  customizable: false, stock: 90,  img: BASE+"10/hoods-400x516.png" },
    { name: "Scroll",                                  slug: "scroll",                                  cat: "graduation",   price: 20,   surcharge: 0,  customizable: false, stock: 200, img: BASE+"10/scroll-400x417.png" },
    { name: "Certificates",                            slug: "certificates",                            cat: "graduation",   price: 15,   surcharge: 5,  customizable: true,  stock: 500, img: BASE+"10/certificates-400x425.png" },
    // Promotional
    { name: "Cotton Tote Bags",                        slug: "cotton-tote-bags",                        cat: "promotional",  price: 8,    surcharge: 3,  customizable: true,  stock: 300, img: BASE+"10/cotton-tote-bags-400x253.png" },
    { name: "Non-Woven Tote Bags",                     slug: "non-woven-tote-bags",                     cat: "promotional",  price: 5,    surcharge: 3,  customizable: true,  stock: 400, img: BASE+"10/non-woven-tote-bags-400x306.png" },
    { name: "Drawstring Bags",                         slug: "drawstring-bags",                         cat: "promotional",  price: 6,    surcharge: 3,  customizable: true,  stock: 350, img: BASE+"10/drawstring-bags-400x290.png" },
    { name: "Clear ID Card Holder",                    slug: "clear-id-card-holder",                    cat: "promotional",  price: 3,    surcharge: 0,  customizable: false, stock: 500, img: BASE+"10/clear-id-card-holder-400x437.png" },
    { name: "Flash Drive 16GB",                        slug: "flash-drive-16gb",                        cat: "promotional",  price: 12,   surcharge: 3,  customizable: true,  stock: 200, img: BASE+"10/Flash-drive-16gb-1.png" },
    { name: "Metal Pen",                               slug: "metal-pen",                               cat: "promotional",  price: 4,    surcharge: 2,  customizable: true,  stock: 600, img: BASE+"10/metal-pen-400x300.png" },
    { name: "Ceramic Mug",                             slug: "ceramic-mug",                             cat: "promotional",  price: 10,   surcharge: 5,  customizable: true,  stock: 150, img: BASE+"10/ceramic-mug-400x294.png" },
    { name: "Stainless Steel Vacuum Bottle",           slug: "stainless-steel-vacuum-bottle",           cat: "promotional",  price: 22,   surcharge: 5,  customizable: true,  stock: 100, img: BASE+"10/stainless-steel-vaccum-bottle-400x303.png" },
    { name: "Aluminum Bottle",                         slug: "aluminum-bottle",                         cat: "promotional",  price: 18,   surcharge: 5,  customizable: true,  stock: 120, img: BASE+"08/aluminum-bottle-promotional-items-400x349.png" },
    { name: "Small Folder Umbrella",                   slug: "small-folder-umbrella",                   cat: "promotional",  price: 14,   surcharge: 5,  customizable: true,  stock: 80,  img: BASE+"10/small-folder-umbrella-400x339.png" },
    { name: "Umbrella Long 37 Inches",                 slug: "umbrella-long-37-inches",                 cat: "promotional",  price: 20,   surcharge: 5,  customizable: true,  stock: 60,  img: BASE+"10/umbrella-long-37-400x326.png" },
    { name: "ID Card Reel",                            slug: "id-card-reel",                            cat: "promotional",  price: 3,    surcharge: 2,  customizable: true,  stock: 400, img: BASE+"10/id-card-reel-400x290.png" },
    { name: "Executive Folder",                        slug: "executive-folder",                        cat: "promotional",  price: 12,   surcharge: 5,  customizable: true,  stock: 90,  img: BASE+"10/executive-folder-400x286.png" },
    { name: "Caps",                                    slug: "caps",                                    cat: "promotional",  price: 15,   surcharge: 5,  customizable: true,  stock: 200, img: BASE+"08/image-7.png",                                        sizes: ["One Size"] },
    // Services
    { name: "Embroidery Service",                      slug: "embroidery-service",                      cat: "services",     price: 30,   surcharge: 0,  customizable: true,  stock: 999, img: BASE+"08/xdmasmdmasd.jpg.pagespeed.ic_.K4ZE_mDqdW.png" },
    { name: "Screen Printing",                         slug: "screen-printing",                         cat: "services",     price: 20,   surcharge: 0,  customizable: true,  stock: 999, img: BASE+"08/51-400x556.png" },
  ];

  let productCount = 0;
  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        categoryId: catMap[p.cat],
        basePrice: p.price,
        customSurcharge: p.surcharge,
        isCustomizable: p.customizable,
        stockQty: p.stock,
        imageUrl: p.img,
        sizes: p.sizes ?? [],
        colors: p.colors ?? [],
        lowStockThreshold: 10,
        isActive: true,
      },
    });
    productCount++;
  }
  console.log("✅ Products seeded:", productCount);

  // ─── Discount codes ──────────────────────────────────────────────────────────
  await prisma.discountCode.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: { code: "WELCOME10", type: "PERCENTAGE", value: 10, minOrderValue: 50, maxUses: 100, isActive: true },
  });
  await prisma.discountCode.upsert({
    where: { code: "BULK20" },
    update: {},
    create: { code: "BULK20", type: "PERCENTAGE", value: 20, minOrderValue: 500, maxUses: 50, isActive: true },
  });
  await prisma.discountCode.upsert({
    where: { code: "SAVE50" },
    update: {},
    create: { code: "SAVE50", type: "FIXED", value: 50, minOrderValue: 200, maxUses: 30, isActive: true },
  });

  console.log("✅ Discount codes seeded");
  console.log("\n🎉 Seed complete!");
  console.log("   Admin:    admin@pngembroidery.net / Admin@2025!");
  console.log("   Customer: john@gmail.com / Customer@2025!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
