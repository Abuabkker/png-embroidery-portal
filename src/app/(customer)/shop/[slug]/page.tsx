"use client";
import { useState, useEffect, useMemo, use } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ChevronRight, ChevronDown, ChevronLeft, ChevronRight as ChevronRightIcon,
  Ruler, ShoppingCart, Check, Loader2, Shield, Clock, Award, Flame, Eye, Star, X,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const COLOR_HEX: Record<string, string> = {
  Khaki:         "#B4A882",
  Navy:          "#1B2A4A",
  "Yellow/Navy": "#F5C518",
  Blue:          "#1E88E5",
  Denim:         "#5C7FA6",
  White:         "#F5F5F5",
  Black:         "#1A1A1A",
};

const FEATURE_BADGES = [
  { label: "Built-In Insect Protection",          Icon: Shield, bg: "bg-green-600" },
  { label: "Long-Lasting, Odorless Repellent",    Icon: Clock,  bg: "bg-green-600" },
  { label: "EPA-Registered & Expert Recommended", Icon: Award,  bg: "bg-green-600" },
  { label: "Flame-Resistant",                     Icon: Flame,  bg: "bg-red-500"   },
  { label: "High-Visibility",                     Icon: Eye,    bg: "bg-lime-500"  },
];

function StarRow({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(s => {
          const filled = s <= Math.floor(rating);
          const half   = !filled && s === Math.ceil(rating) && rating % 1 >= 0.5;
          return (
            <Star key={s} size={15}
              fill={filled ? "#FFA500" : half ? "url(#half)" : "none"}
              stroke="#FFA500" strokeWidth={1.5} />
          );
        })}
      </div>
      <span className="text-sm text-gray-500">({count})</span>
    </div>
  );
}

function BadgePill({ label }: { label: string }) {
  if (label === "Proman Exclusive")       return <span className="bg-red-600 text-white text-[11px] font-bold px-3 py-1 rounded">{label}</span>;
  if (label === "Price Includes Discount") return <span className="bg-blue-600 text-white text-[11px] font-bold px-3 py-1 rounded">{label}</span>;
  if (label === "Clearance")              return <span className="bg-green-600 text-white text-[11px] font-bold px-3 py-1 rounded">{label}</span>;
  if (label === "Sold Out")               return <span className="bg-gray-500 text-white text-[11px] font-bold px-3 py-1 rounded">{label}</span>;
  return null;
}

type SizeEntry = { color: string; size: string; qty: number; names: string[] };
type Variant   = { id: string; size: string; color: string; stockQty: number };

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [product, setProduct]         = useState<any>(null);
  const [fetchError, setFetchError]   = useState(false);
  const [loading, setLoading]         = useState(true);
  const [selectedColor, setColor]     = useState("");
  const [sizeEntries, setSizeEntries] = useState<SizeEntry[]>([]);
  const [activeImg, setActiveImg]     = useState(0);
  const [adding, setAdding]           = useState(false);
  const [added, setAdded]             = useState(false);
  const [returnsOpen, setReturns]     = useState(false);
  const [sizeChartOpen, setSizeChart] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    fetch(`/api/products/${slug}`)
      .then(r => r.json())
      .then(d => {
        if (!d.data) { setFetchError(true); setLoading(false); return; }
        const p = d.data;
        setProduct(p);
        if (p?.colors?.length) setColor(p.colors[0]);
        const colors: string[] = p?.colors?.length ? p.colors : [""];
        const sizes: string[]  = p?.sizes  ?? [];
        setSizeEntries(
          colors.flatMap(color => sizes.map(size => ({ color, size, qty: 0, names: [] })))
        );
        setLoading(false);
      })
      .catch(() => { setFetchError(true); setLoading(false); });
  }, [slug]);

  const meta = useMemo(() => {
    if (!product?.description) return null;
    try { return JSON.parse(product.description); } catch { return null; }
  }, [product]);

  const images = useMemo((): string[] => {
    if (!product) return [];
    if (product.images?.length) {
      // If images are color-tagged, show only the ones matching the selected color
      const colorTagged = product.images.filter((i: any) => i.altText === selectedColor);
      if (colorTagged.length > 0) {
        return colorTagged
          .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
          .map((i: any) => i.url);
      }
      // No color tags — show main image + all extra images
      const untagged = product.images
        .filter((i: any) => !i.altText)
        .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
        .map((i: any) => i.url);
      return [product.imageUrl, ...untagged].filter(Boolean);
    }
    return [product.imageUrl].filter(Boolean);
  }, [product, selectedColor]);

  // Reset slider when color changes
  useEffect(() => { setActiveImg(0); }, [selectedColor]);

  function updateSizeQty(color: string, size: string, newQty: number) {
    const stock = variantStock(color, size);
    const capped = stock !== null ? Math.min(newQty, stock) : newQty;
    setSizeEntries(prev => prev.map(e =>
      e.color !== color || e.size !== size ? e : {
        ...e,
        qty: capped,
        names: capped > e.names.length
          ? [...e.names, ...Array(capped - e.names.length).fill("")]
          : e.names.slice(0, capped),
      }
    ));
  }

  function updateName(color: string, size: string, index: number, value: string) {
    setSizeEntries(prev => prev.map(e =>
      e.color !== color || e.size !== size ? e : {
        ...e,
        names: e.names.map((n, i) => i === index ? value : n),
      }
    ));
  }

  function removeItem(color: string, size: string, index: number) {
    setSizeEntries(prev => prev.map(e =>
      e.color !== color || e.size !== size ? e : {
        ...e,
        qty: e.qty - 1,
        names: e.names.filter((_, i) => i !== index),
      }
    ));
  }

  const activeEntries = sizeEntries.filter(e => e.qty > 0);

  async function handleAddToCart() {
    if (!session || activeEntries.length === 0 || product?.stockQty === 0) return;
    setAdding(true);

    await Promise.all(activeEntries.map(entry => {
      const customization: Record<string, any> = { size: entry.size };
      if (entry.color) customization.color = entry.color;
      const names = entry.names.map((n: string) => n.trim());
      if (names.some((n: string) => n)) customization.embroideryNames = names;
      return fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: entry.qty, customization }),
      });
    }));

    setAdding(false);
    setAdded(true);
    window.dispatchEvent(new Event("cart-updated"));
    setTimeout(() => setAdded(false), 2000);
  }

  if (loading) return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 bg-gray-100 rounded w-64" />
      <div className="grid grid-cols-2 gap-12">
        <div className="aspect-square bg-gray-100 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-8 bg-gray-100 rounded w-3/4" />
          <div className="h-4 bg-gray-100 rounded w-1/3" />
          <div className="h-6 bg-gray-100 rounded w-1/4" />
        </div>
      </div>
    </div>
  );

  if (fetchError) return (
    <div className="text-center py-24">
      <p className="font-bold text-gray-900 mb-2">Could not load product</p>
      <p className="text-sm text-gray-500 mb-4">Please try refreshing the page.</p>
      <button onClick={() => window.location.reload()} className="text-navy text-sm font-semibold hover:underline mr-4">Refresh</button>
      <Link href="/shop" className="text-sm text-gray-500 hover:underline">← Back to Shop</Link>
    </div>
  );

  if (!product) return (
    <div className="text-center py-24">
      <p className="font-bold text-gray-900 mb-2">Product not found</p>
      <Link href="/shop" className="text-navy text-sm font-semibold hover:underline">← Back to Shop</Link>
    </div>
  );

  const variants: Variant[] = product.variants ?? [];

  function variantStock(color: string, size: string): number | null {
    if (variants.length === 0) return null; // no variant data — unlimited
    const v = variants.find(v => v.color === color && v.size === size);
    return v ? v.stockQty : null;
  }

  const outOfStock = product.stockQty === 0;

  return (
    <div className="max-w-6xl">

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-7 flex-wrap">
        <Link href="/dashboard" className="hover:text-gray-800">Home</Link>
        <ChevronRight size={12} />
        <Link href="/shop" className="hover:text-gray-800">Shop</Link>
        {product.category && <>
          <ChevronRight size={12} />
          <Link href={`/shop?cat=${product.category.slug}`} className="hover:text-gray-800">{product.category.name}</Link>
        </>}
        <ChevronRight size={12} />
        <span className="text-gray-800 font-semibold line-clamp-1 max-w-xs">{product.name}</span>
      </nav>

      {/* ── Main product section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">

        {/* Left: Image slider */}
        <div>
          <div className="relative bg-gray-50 rounded-2xl overflow-hidden" style={{ aspectRatio: "4/5" }}>
            {images[activeImg] ? (
              <img src={images[activeImg]} alt={product.name}
                className="w-full h-full object-contain p-6 transition-opacity duration-200"
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingCart size={48} className="text-gray-200" />
              </div>
            )}
            {images.length > 1 && (
              <>
                <button onClick={() => setActiveImg(Math.max(0, activeImg - 1))}
                  disabled={activeImg === 0}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition-opacity">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={() => setActiveImg(Math.min(images.length - 1, activeImg + 1))}
                  disabled={activeImg === images.length - 1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition-opacity">
                  <ChevronRightIcon size={16} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setActiveImg(i)}
                      className={`rounded-full transition-all ${activeImg === i ? "w-4 h-1.5 bg-gray-800" : "w-1.5 h-1.5 bg-gray-400 hover:bg-gray-600"}`} />
                  ))}
                </div>
              </>
            )}
          </div>
          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {images.map((url, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  className={`w-16 h-16 shrink-0 rounded-lg bg-gray-50 overflow-hidden border-2 transition-colors
                    ${activeImg === i ? "border-gray-800" : "border-gray-200 hover:border-gray-400"}`}>
                  <img src={url} alt="" className="w-full h-full object-contain p-1"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product info */}
        <div>
          {/* Badges */}
          {meta?.badges?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {meta.badges.map((b: string) => <BadgePill key={b} label={b} />)}
              {product.tags?.includes("clearance") && <BadgePill label="Clearance" />}
            </div>
          )}

          <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-2">{product.name}</h1>
          <StarRow rating={meta?.rating ?? 0} count={meta?.reviewCount ?? 0} />
          {meta?.sku && <p className="text-sm text-gray-500 mt-1 mb-3">{meta.sku}</p>}

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-5">
            {meta?.originalPrice && (
              <span className="text-base text-gray-400 line-through">
                {formatCurrency(meta.originalPrice)}
              </span>
            )}
            <span className="text-xl font-bold text-gray-900">
              {formatCurrency(product.basePrice)}
            </span>
            {meta?.originalPrice && (
              <span className="text-sm font-semibold text-green-600">
                Save {formatCurrency(meta.originalPrice - Number(product.basePrice))}
              </span>
            )}
          </div>

          <hr className="mb-5 border-gray-200" />

          {/* Color selector — clicking also switches the size panel */}
          {product.colors?.length > 0 && (
            <div className="mb-5">
              <p className="text-sm font-semibold text-gray-800 mb-2.5">
                Color — <span className="font-normal">{selectedColor}</span>
              </p>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color: string) => {
                  const colorTotal = sizeEntries
                    .filter(e => e.color === color)
                    .reduce((s, e) => s + e.qty, 0);
                  const isLight = color === "Khaki" || color === "Yellow/Navy" || color === "White";
                  return (
                    <button key={color} onClick={() => setColor(color)} title={color}
                      className={`relative w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all
                        ${selectedColor === color
                          ? "border-gray-900 ring-2 ring-gray-300 ring-offset-1"
                          : "border-gray-300 hover:border-gray-600"}`}
                      style={{ backgroundColor: COLOR_HEX[color] ?? "#ccc" }}>
                      {selectedColor === color && (
                        <Check size={14} className={isLight ? "text-gray-900" : "text-white"} strokeWidth={3} />
                      )}
                      {/* qty badge — shown when this color has items but isn't selected */}
                      {colorTotal > 0 && selectedColor !== color && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-900 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                          {colorTotal}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sizes for selected color only */}
          {sizeEntries.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-3 mb-3">
                <p className="text-sm font-semibold text-gray-800">
                  Size & Quantity
                  {product.colors?.length > 1 && (
                    <span className="ml-1.5 text-xs font-normal text-gray-400">for {selectedColor}</span>
                  )}
                </p>
                <button onClick={() => setSizeChart(!sizeChartOpen)}
                  className="flex items-center gap-1 text-sm font-semibold text-gray-800 underline underline-offset-2 hover:text-navy">
                  <Ruler size={13} /> View Size Chart
                </button>
              </div>
              {sizeChartOpen && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-3 text-xs text-gray-600">
                  <p className="font-bold text-gray-800 mb-2">Size Guide</p>
                  <p>This item runs small — order one size up from your usual size.</p>
                  <p className="mt-1">S=34–36" chest, M=38–40", L=42–44", XL=46–48", 2XL=50–52", 3XL=54–56"</p>
                </div>
              )}

              {/* Only show sizes for selectedColor */}
              <div className="space-y-1.5">
                {sizeEntries.filter(e => e.color === selectedColor || (!selectedColor && !e.color)).map(entry => {
                  const stock = variantStock(entry.color, entry.size);
                  const isVariantOOS = stock !== null && stock === 0;
                  const isLowStock   = stock !== null && stock > 0 && stock <= 5;
                  return (
                    <div key={entry.size} className="flex items-center gap-3">
                      <span className={`w-10 text-sm font-bold ${isVariantOOS ? "text-gray-300" : entry.qty > 0 ? "text-gray-900" : "text-gray-400"}`}>
                        {entry.size}
                      </span>
                      <div className={`flex items-center border rounded-lg overflow-hidden ${isVariantOOS ? "border-gray-200 opacity-40 pointer-events-none" : "border-gray-300"}`}>
                        <button onClick={() => updateSizeQty(entry.color, entry.size, Math.max(0, entry.qty - 1))}
                          className="px-3 py-2 text-gray-700 hover:bg-gray-50 text-base font-light select-none">−</button>
                        <span className="px-3 text-sm font-bold text-gray-900 min-w-[2rem] text-center">{entry.qty}</span>
                        <button
                          onClick={() => updateSizeQty(entry.color, entry.size, entry.qty + 1)}
                          disabled={stock !== null && entry.qty >= stock}
                          className="px-3 py-2 text-gray-700 hover:bg-gray-50 text-base font-light select-none disabled:opacity-30">+</button>
                      </div>
                      {isVariantOOS ? (
                        <span className="text-xs font-semibold text-red-400">Out of stock</span>
                      ) : isLowStock ? (
                        <span className="text-xs font-semibold text-orange-500">Only {stock} left</span>
                      ) : stock !== null && stock <= 20 ? (
                        <span className="text-xs text-gray-400">{stock} available</span>
                      ) : entry.qty > 0 ? (
                        <span className="text-xs text-gray-400">{entry.qty} item{entry.qty > 1 ? "s" : ""}</span>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {/* Summary of other colors already selected */}
              {product.colors?.length > 1 && (() => {
                const others = sizeEntries.filter(e => e.color !== selectedColor && e.qty > 0);
                if (!others.length) return null;
                const summary = Object.entries(
                  others.reduce((acc: Record<string, number>, e) => {
                    acc[e.color] = (acc[e.color] ?? 0) + e.qty;
                    return acc;
                  }, {})
                ).map(([c, q]) => `${c} ×${q}`).join(", ");
                return (
                  <p className="mt-2 text-xs text-gray-400">
                    Also added: <span className="font-semibold text-gray-600">{summary}</span>
                  </p>
                );
              })()}
            </div>
          )}

          {/* Name Embroidery — one input per item, grouped by size */}
          {activeEntries.length > 0 && (
            <div className="mb-5 space-y-2">
              <p className="text-sm font-semibold text-gray-800">
                Name Embroidery <span className="text-gray-400 font-normal text-xs">(optional)</span>
              </p>
              {activeEntries.flatMap(entry =>
                entry.names.map((name, i) => (
                  <div key={`${entry.color}-${entry.size}-${i}`} className="flex items-center gap-2">
                    {entry.qty > 1 && (
                      <span className="text-xs text-gray-400 w-12 shrink-0">Item {i + 1}</span>
                    )}
                    <div className="flex-1 flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white focus-within:border-gray-900 focus-within:ring-1 focus-within:ring-gray-200">
                      <span className="px-3 py-2.5 text-xs font-bold text-gray-900 bg-gray-100 border-r border-gray-300 shrink-0 select-none flex items-center gap-1.5">
                        {entry.color && (
                          <span
                            className="w-3 h-3 rounded-full border border-gray-300 shrink-0 inline-block"
                            style={{ backgroundColor: COLOR_HEX[entry.color] ?? "#ccc" }}
                          />
                        )}
                        {entry.size}{entry.color ? ` · ${entry.color}` : ""}
                      </span>
                      <input
                        type="text"
                        value={name}
                        onChange={e => updateName(entry.color, entry.size, i, e.target.value)}
                        placeholder="Enter name for embroidery…"
                        maxLength={50}
                        className="flex-1 px-3 py-2.5 text-sm text-gray-800 bg-transparent outline-none"
                      />
                    </div>
                    <button onClick={() => removeItem(entry.color, entry.size, i)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Add to cart */}
          <div className="mb-4">
            <button onClick={handleAddToCart}
              disabled={outOfStock || adding || !session || activeEntries.length === 0}
              className="w-full flex items-center justify-center gap-2 text-white font-bold text-sm py-3 rounded-full transition-all disabled:opacity-60"
              style={outOfStock ? { backgroundColor: "#9E9E9E" } : { background: "linear-gradient(to bottom, #4B9C3A, #3B8B2A)" }}>
              {adding ? (
                <><Loader2 size={16} className="animate-spin" /> Adding...</>
              ) : added ? (
                <><Check size={16} strokeWidth={3} /> Added to Cart!</>
              ) : outOfStock ? (
                "Sold Out"
              ) : (
                <><ShoppingCart size={15} /> Add to cart</>
              )}
            </button>
          </div>

          {!session && (
            <p className="text-xs text-gray-500 mb-3">
              <Link href="/login" className="text-navy font-semibold hover:underline">Sign in</Link> to add items to cart.
            </p>
          )}

          {/* Notes */}
          {meta?.notes?.map((note: string, i: number) => (
            <p key={i} className={`text-sm mb-1.5 ${i === 0 ? "font-bold text-gray-900" : "font-semibold text-gray-600"}`}>
              {note}
            </p>
          ))}
        </div>
      </div>

      {/* ── Features section ── */}
      {(meta?.subtitle || meta?.features?.length > 0) && (
        <div className="mb-12 pb-12 border-b border-gray-200">
          <div>
            {meta?.subtitle && (
              <p className="font-bold text-gray-900 mb-4 text-base">{meta.subtitle}</p>
            )}
            <ul className="space-y-2 mb-8">
              {meta?.features?.map((f: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-gray-400 mt-0.5 shrink-0">•</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="grid grid-cols-3 gap-4">
              {FEATURE_BADGES.map(({ label, Icon, bg }) => (
                <div key={label} className="flex flex-col items-center text-center gap-2">
                  <div className={`w-14 h-14 rounded-full ${bg} flex items-center justify-center shadow-sm`}>
                    <Icon size={24} className="text-white" strokeWidth={1.5} />
                  </div>
                  <p className="text-xs font-bold text-gray-800 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Returns & Exchanges accordion ── */}
      <div className="border-t border-gray-200">
        <button onClick={() => setReturns(!returnsOpen)}
          className="w-full flex items-center justify-between py-4 text-sm font-extrabold tracking-widest text-gray-800 uppercase hover:text-gray-600 transition-colors">
          Returns & Exchanges
          <ChevronDown size={16} className={`transition-transform ${returnsOpen ? "rotate-180" : ""}`} />
        </button>
        {returnsOpen && (
          <div className="pb-6 space-y-2 text-sm text-gray-700">
            <p>We accept returns within 30 days of delivery for unworn, unwashed items in original condition with tags attached.</p>
            <p>Items marked <strong>Final Sale</strong> cannot be returned or exchanged.</p>
            <p>Special orders (embroidered or customized items) are non-refundable.</p>
            <p>To initiate a return, please contact our customer service team.</p>
          </div>
        )}
      </div>

    </div>
  );
}
