"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, ShoppingCart, SlidersHorizontal, X, ChevronDown, Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type SortOption = "featured" | "price-asc" | "price-desc" | "name-asc";

const SORT_LABELS: Record<SortOption, string> = {
  featured: "Featured",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  "name-asc": "Name: A–Z",
};

export default function ShopPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("featured");
  const [sortOpen, setSortOpen] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyCustomizable, setOnlyCustomizable] = useState(false);
  const [maxPrice, setMaxPrice] = useState(1200);
  const [filterOpen, setFilterOpen] = useState(false); // mobile
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(d => setCategories(d.data || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "200" });
    if (activeCategory !== "all") params.set("category", activeCategory);
    if (search) params.set("search", search);
    fetch(`/api/products?${params}`)
      .then(r => r.json())
      .then(d => { setProducts(d.data || []); setLoading(false); });
  }, [activeCategory, search]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (onlyInStock) list = list.filter(p => p.stockQty > 0);
    if (onlyCustomizable) list = list.filter(p => p.isCustomizable);
    list = list.filter(p => Number(p.basePrice) <= maxPrice);
    if (sort === "price-asc") list.sort((a, b) => Number(a.basePrice) - Number(b.basePrice));
    else if (sort === "price-desc") list.sort((a, b) => Number(b.basePrice) - Number(a.basePrice));
    else if (sort === "name-asc") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, onlyInStock, onlyCustomizable, maxPrice, sort]);

  const FilterPanel = () => (
    <div className="space-y-7">
      {/* Categories */}
      <div>
        <p className="text-xs font-extrabold tracking-widest text-gray-400 uppercase mb-3">Category</p>
        <ul className="space-y-1">
          <li>
            <button onClick={() => setActiveCategory("all")}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg font-semibold transition-colors flex items-center justify-between
                ${activeCategory === "all" ? "bg-navy text-white" : "text-gray-700 hover:bg-gray-100"}`}>
              All Products
              {activeCategory === "all" && <Check size={14} />}
            </button>
          </li>
          {categories.map((c: any) => (
            <li key={c.slug}>
              <button onClick={() => setActiveCategory(c.slug)}
                className={`w-full text-left text-sm px-3 py-2 rounded-lg font-semibold transition-colors flex items-center justify-between
                  ${activeCategory === c.slug ? "bg-navy text-white" : "text-gray-700 hover:bg-gray-100"}`}>
                {c.name}
                {activeCategory === c.slug && <Check size={14} />}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Price */}
      <div>
        <p className="text-xs font-extrabold tracking-widest text-gray-400 uppercase mb-3">Max Price</p>
        <div className="px-1">
          <input type="range" min={10} max={1200} step={10} value={maxPrice}
            onChange={e => setMaxPrice(Number(e.target.value))}
            className="w-full accent-navy" />
          <div className="flex justify-between text-xs text-gray-500 mt-1 font-semibold">
            <span>$10</span>
            <span className="text-navy font-bold">{formatCurrency(maxPrice)}</span>
            <span>$1,200</span>
          </div>
        </div>
      </div>

      {/* Toggles */}
      <div>
        <p className="text-xs font-extrabold tracking-widest text-gray-400 uppercase mb-3">Filter By</p>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div onClick={() => setOnlyInStock(!onlyInStock)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors
                ${onlyInStock ? "bg-navy border-navy" : "border-gray-300 group-hover:border-navy"}`}>
              {onlyInStock && <Check size={12} className="text-white" strokeWidth={3} />}
            </div>
            <span className="text-sm font-semibold text-gray-700">In Stock Only</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <div onClick={() => setOnlyCustomizable(!onlyCustomizable)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors
                ${onlyCustomizable ? "bg-navy border-navy" : "border-gray-300 group-hover:border-navy"}`}>
              {onlyCustomizable && <Check size={12} className="text-white" strokeWidth={3} />}
            </div>
            <span className="text-sm font-semibold text-gray-700">Customizable Only</span>
          </label>
        </div>
      </div>

      {/* Reset */}
      {(onlyInStock || onlyCustomizable || maxPrice < 1200 || activeCategory !== "all") && (
        <button onClick={() => { setOnlyInStock(false); setOnlyCustomizable(false); setMaxPrice(1200); setActiveCategory("all"); }}
          className="w-full text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1.5 px-2">
          <X size={13} /> Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="flex gap-8 min-h-full">

      {/* ── Desktop Filter Sidebar ── */}
      <aside className="hidden lg:block w-52 shrink-0">
        <div className="sticky top-24">
          <FilterPanel />
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0">

        {/* Top bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Search */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 flex-1 min-w-[180px]">
            <Search size={15} className="text-gray-400 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="flex-1 text-sm text-gray-900 outline-none bg-transparent" />
            {search && <button onClick={() => setSearch("")}><X size={14} className="text-gray-400" /></button>}
          </div>

          {/* Product count */}
          <p className="text-sm text-gray-500 font-semibold whitespace-nowrap">
            {loading ? "Loading..." : `${filtered.length} products`}
          </p>

          {/* Mobile filter toggle */}
          <button onClick={() => setFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-gray-700">
            <SlidersHorizontal size={15} /> Filters
          </button>

          {/* Sort */}
          <div className="relative">
            <button onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-gray-700 hover:border-navy transition-colors whitespace-nowrap">
              {SORT_LABELS[sort]}
              <ChevronDown size={14} className={`transition-transform ${sortOpen ? "rotate-180" : ""}`} />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-20 w-48 py-1.5 overflow-hidden">
                {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([key, label]) => (
                  <button key={key} onClick={() => { setSort(key); setSortOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors flex items-center justify-between
                      ${sort === key ? "bg-navy/5 text-navy" : "text-gray-700 hover:bg-gray-50"}`}>
                    {label}
                    {sort === key && <Check size={13} className="text-navy" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active filter pills */}
        {(activeCategory !== "all" || onlyInStock || onlyCustomizable || maxPrice < 1200) && (
          <div className="flex flex-wrap gap-2 mb-5">
            {activeCategory !== "all" && (
              <span className="flex items-center gap-1.5 bg-navy/10 text-navy text-xs font-bold px-3 py-1.5 rounded-full">
                {categories.find(c => c.slug === activeCategory)?.name}
                <button onClick={() => setActiveCategory("all")}><X size={12} /></button>
              </span>
            )}
            {onlyInStock && (
              <span className="flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">
                In Stock <button onClick={() => setOnlyInStock(false)}><X size={12} /></button>
              </span>
            )}
            {onlyCustomizable && (
              <span className="flex items-center gap-1.5 bg-indigo-50 text-navy text-xs font-bold px-3 py-1.5 rounded-full">
                Customizable <button onClick={() => setOnlyCustomizable(false)}><X size={12} /></button>
              </span>
            )}
            {maxPrice < 1200 && (
              <span className="flex items-center gap-1.5 bg-orange-50 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-full">
                Under {formatCurrency(maxPrice)} <button onClick={() => setMaxPrice(1200)}><X size={12} /></button>
              </span>
            )}
          </div>
        )}

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                <div className="h-52 bg-gray-100 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-1/3" />
                  <div className="h-9 bg-gray-100 rounded-xl animate-pulse mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search size={28} className="text-gray-300" />
            </div>
            <p className="font-bold text-gray-900 mb-1">No products found</p>
            <p className="text-sm text-gray-500">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      {/* Mobile filter drawer */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFilterOpen(false)} />
          <div className="absolute right-0 inset-y-0 w-72 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="font-extrabold text-gray-900">Filters</p>
              <button onClick={() => setFilterOpen(false)}><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <FilterPanel />
            </div>
            <div className="p-4 border-t border-gray-100">
              <button onClick={() => setFilterOpen(false)}
                className="w-full bg-navy text-white font-bold rounded-xl py-3 text-sm">
                Show {filtered.length} products
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sort dropdown backdrop */}
      {sortOpen && <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />}
    </div>
  );
}

function ProductCard({ product: p }: { product: any }) {
  const outOfStock = p.stockQty === 0;
  const lowStock = p.stockQty > 0 && p.stockQty <= 10;

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-200 group flex flex-col">
      {/* Image — clicking navigates to detail page */}
      <Link href={`/shop/${p.slug}`} className="block relative overflow-hidden bg-gray-50" style={{ aspectRatio: "4/3" }}>
        {p.imageUrl ? (
          <img src={p.imageUrl} alt={p.name}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart size={32} className="text-gray-200" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {p.tags?.includes("proman-exclusive") && (
            <span className="bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md tracking-wide">PROMAN EXCLUSIVE</span>
          )}
          {p.tags?.includes("clearance") && (
            <span className="bg-green-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md tracking-wide">CLEARANCE</span>
          )}
          {outOfStock && (
            <span className="bg-gray-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md tracking-wide">SOLD OUT</span>
          )}
          {lowStock && !outOfStock && (
            <span className="bg-orange-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md tracking-wide">LOW STOCK</span>
          )}
        </div>

        {/* Hover overlay */}
        {!outOfStock && (
          <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <span className="bg-white text-navy font-extrabold text-xs px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 -translate-y-2 group-hover:translate-y-0 transition-transform duration-200">
              View Product
            </span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-[10px] font-extrabold tracking-widest text-gray-400 uppercase mb-1">{p.category?.name}</p>
        <Link href={`/shop/${p.slug}`} className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 mb-3 flex-1 hover:text-navy transition-colors">{p.name}</Link>

        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-lg font-extrabold text-navy">{formatCurrency(Number(p.basePrice))}</span>
            {p.customSurcharge > 0 && p.isCustomizable && (
              <span className="text-xs text-gray-400 ml-1">+{formatCurrency(Number(p.customSurcharge))} custom</span>
            )}
          </div>
          {p.sizes?.length > 0 && (
            <span className="text-[10px] text-gray-400 font-semibold">{p.sizes.length} sizes</span>
          )}
        </div>

        <Link href={`/shop/${p.slug}`}
          className={`w-full flex items-center justify-center gap-2 text-xs font-bold rounded-xl py-2.5 transition-all
            ${outOfStock ? "bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none" : "bg-navy text-white hover:bg-blue-900"}`}>
          {outOfStock ? "Unavailable" : "View Product"}
        </Link>
      </div>
    </div>
  );
}
