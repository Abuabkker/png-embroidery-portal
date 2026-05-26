"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Search, ShoppingCart, Pencil, SlidersHorizontal } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function ShopPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(d => setCategories(d.data || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    if (filter !== "all") params.set("category", filter);
    if (search) params.set("search", search);
    fetch(`/api/products?${params}`).then(r => r.json()).then(d => { setProducts(d.data || []); setLoading(false); });
  }, [filter, search]);

  async function addToCart(productId: string) {
    if (!session) return;
    setAdding(productId);
    await fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, quantity: 1 }) });
    setAdding(null);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Shop Products</h1>
        <p className="text-sm text-gray-500">{products.length} products · ISO-9001 Certified</p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-[200px] max-w-xs">
          <Search size={15} className="text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="flex-1 text-sm text-gray-900 outline-none" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilter("all")} className={`text-xs font-semibold rounded-full px-3.5 py-1.5 border transition-colors ${filter === "all" ? "bg-navy text-white border-navy" : "bg-white text-gray-600 border-gray-300 hover:border-navy"}`}>All</button>
          {categories.map((c: any) => (
            <button key={c.slug} onClick={() => setFilter(c.slug)} className={`text-xs font-semibold rounded-full px-3.5 py-1.5 border transition-colors whitespace-nowrap ${filter === c.slug ? "bg-navy text-white border-navy" : "bg-white text-gray-600 border-gray-300 hover:border-navy"}`}>{c.name}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({length: 10}).map((_, i) => <div key={i} className="bg-white rounded-2xl h-64 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((p: any) => (
            <div key={p.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow group">
              <div className="relative h-36 bg-gray-50 overflow-hidden">
                {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform" onError={e => (e.target as any).style.display = "none"} />}
                {p.stockQty === 0 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg">OUT OF STOCK</span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-[10px] text-gray-400 font-bold tracking-wider uppercase mb-1">{p.category?.name}</p>
                <p className="font-bold text-xs text-gray-900 mb-2 leading-snug line-clamp-2">{p.name}</p>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-base font-extrabold text-navy">{formatCurrency(Number(p.basePrice))}</span>
                  {p.isCustomizable && <span className="text-[10px] bg-indigo-50 text-navy font-bold rounded-md px-1.5 py-0.5 flex items-center gap-1"><Pencil size={9} />Custom</span>}
                </div>
                <button disabled={p.stockQty === 0 || adding === p.id} onClick={() => addToCart(p.id)}
                  className="w-full flex items-center justify-center gap-1.5 bg-navy text-white text-xs font-bold rounded-xl py-2.5 hover:bg-navy-dark transition-colors disabled:opacity-50">
                  <ShoppingCart size={13} />
                  {adding === p.id ? "Adding..." : p.stockQty === 0 ? "Unavailable" : "Add to Cart"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
