"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Search, Plus, Package, Pencil, BarChart2, Trash2,
  Edit2, Loader2, Eye, EyeOff, X, Tag, TrendingDown,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

const TABS = [
  { key: "",         label: "All"    },
  { key: "active",   label: "Active" },
  { key: "inactive", label: "Hidden" },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [tab,      setTab]      = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (tab)    p.set("status", tab);
    fetch(`/api/admin/products?${p}`)
      .then(r => r.json())
      .then(d => { setProducts(d.data || []); setLoading(false); });
  }, [search, tab]);

  useEffect(() => { load(); }, [load]);

  async function toggleVisibility(prod: any) {
    setToggling(prod.id);
    await fetch(`/api/admin/products/${prod.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !prod.isActive }),
    });
    setToggling(null);
    load();
  }

  async function deleteProduct(prod: any) {
    if (!confirm(`Delete "${prod.name}"? This cannot be undone.`)) return;
    setDeleting(prod.id);
    await fetch(`/api/admin/products/${prod.id}`, { method: "DELETE" });
    setDeleting(null);
    load();
  }

  const active   = products.filter(p => p.isActive).length;
  const hidden   = products.filter(p => !p.isActive).length;
  const lowStock = products.filter(p => p.stockQty > 0 && p.stockQty <= (p.lowStockThreshold ?? 10)).length;
  const outStock = products.filter(p => p.stockQty === 0).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Products</h1>
          <p className="text-sm text-gray-400 mt-0.5">{products.length} products in catalogue</p>
        </div>
        <Link href="/admin/products/new"
          className="flex items-center gap-2 bg-navy text-white text-sm font-bold rounded-xl px-4 py-2.5 hover:bg-navy/90 transition-colors shadow-sm">
          <Plus size={15} /> Add Product
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total",      value: products.length, color: "text-gray-900",   bg: "bg-white",       icon: <Package size={16} className="text-gray-400" /> },
          { label: "Active",     value: active,          color: "text-green-600",  bg: "bg-green-50",    icon: <Eye      size={16} className="text-green-500" /> },
          { label: "Hidden",     value: hidden,          color: "text-gray-500",   bg: "bg-gray-50",     icon: <EyeOff  size={16} className="text-gray-400" /> },
          { label: "Low / Out",  value: `${lowStock} / ${outStock}`, color: "text-orange-600", bg: "bg-orange-50", icon: <TrendingDown size={16} className="text-orange-500" /> },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center gap-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.bg}`}>{s.icon}</div>
            <div>
              <p className="text-xs text-gray-400 font-medium">{s.label}</p>
              <p className={`text-2xl font-extrabold leading-none mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 flex-1 max-w-xs">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products…" className="text-sm outline-none flex-1 min-w-0" />
          {search && (
            <button onClick={() => setSearch("")} className="text-gray-300 hover:text-gray-500">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`text-xs font-semibold rounded-full px-3 py-1.5 border transition-colors ${
                tab === t.key
                  ? "bg-navy text-white border-navy"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="hidden md:grid grid-cols-[56px_3fr_1fr_110px_80px_90px_120px] px-5 py-3 border-b border-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          <span></span>
          <span>Product</span>
          <span>Category</span>
          <span>Price</span>
          <span className="text-center">Stock</span>
          <span className="text-center">Status</span>
          <span className="text-right">Actions</span>
        </div>

        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[72px] mx-4 my-1.5 bg-gray-50 rounded-xl animate-pulse" />
          ))
        ) : products.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <Package size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-semibold">No products found</p>
            <p className="text-xs mt-1">Try a different search or add a new product</p>
          </div>
        ) : products.map(prod => {
          const stockColor =
            prod.stockQty === 0                           ? "text-red-500"    :
            prod.stockQty <= (prod.lowStockThreshold ?? 10) ? "text-orange-500" :
            "text-gray-900";

          return (
            <div key={prod.id}
              className={`grid grid-cols-[56px_3fr_1fr_110px_80px_90px_120px] px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors items-center group ${!prod.isActive ? "opacity-55" : ""}`}>

              {/* Thumbnail */}
              <div className="w-11 h-11 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                {prod.imageUrl ? (
                  <img src={prod.imageUrl} alt="" className="w-full h-full object-contain p-1"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <Package size={18} className="text-gray-300" />
                )}
              </div>

              {/* Name + meta */}
              <div className="min-w-0 pr-3">
                <p className="font-semibold text-sm text-gray-900 truncate">{prod.name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {prod.sku && (
                    <span className="flex items-center gap-0.5 text-[10px] font-mono text-gray-400">
                      <Tag size={8} /> {prod.sku}
                    </span>
                  )}
                  {prod.isCustomizable && (
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold rounded-md px-1.5 py-0.5 flex items-center gap-0.5">
                      <Pencil size={7} /> Embroidery
                    </span>
                  )}
                  {prod.sizes?.length > 0 && (
                    <span className="text-[10px] text-gray-400">
                      {prod.sizes.slice(0, 4).join(" · ")}{prod.sizes.length > 4 ? ` +${prod.sizes.length - 4}` : ""}
                    </span>
                  )}
                </div>
              </div>

              <span className="text-xs text-gray-500 truncate">{prod.category?.name}</span>

              <div>
                <p className="font-bold text-sm text-gray-900">{formatCurrency(Number(prod.basePrice))}</p>
                {Number(prod.customSurcharge) > 0 && (
                  <p className="text-[10px] text-gray-400">+{formatCurrency(Number(prod.customSurcharge))} surcharge</p>
                )}
              </div>

              <div className="text-center">
                <span className={`text-sm font-bold ${stockColor}`}>{prod.stockQty}</span>
                {prod.stockQty === 0 && (
                  <p className="text-[10px] text-red-400 font-semibold">Out of stock</p>
                )}
              </div>

              <div className="flex justify-center">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                  prod.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {prod.isActive ? "Active" : "Hidden"}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-0.5">
                <Link href={`/admin/products/${prod.id}/edit`}
                  className="p-2 rounded-lg hover:bg-navy/5 text-gray-400 hover:text-navy transition-colors" title="Edit">
                  <Edit2 size={14} />
                </Link>
                <Link href={`/admin/products/${prod.id}/inventory`}
                  className="p-2 rounded-lg hover:bg-navy/5 text-gray-400 hover:text-navy transition-colors" title="Manage inventory">
                  <BarChart2 size={14} />
                </Link>
                <button onClick={() => toggleVisibility(prod)} disabled={toggling === prod.id}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  title={prod.isActive ? "Hide" : "Show"}>
                  {toggling === prod.id
                    ? <Loader2 size={14} className="animate-spin" />
                    : prod.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={() => deleteProduct(prod)} disabled={deleting === prod.id}
                  className="p-2 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete">
                  {deleting === prod.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && products.length > 0 && (
        <p className="text-xs text-gray-400 mt-3 text-right">
          {products.length} product{products.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
