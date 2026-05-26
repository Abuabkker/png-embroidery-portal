"use client";
import { useState, useEffect } from "react";
import { Search, Plus, Package, Pencil } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`/api/admin/products${search ? `?search=${search}` : ""}`).then(r => r.json()).then(d => { setProducts(d.data || []); setLoading(false); });
  }, [search]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Products</h1>
        <button className="flex items-center gap-2 bg-navy text-white text-sm font-bold rounded-xl px-4 py-2.5 hover:bg-navy-dark">
          <Plus size={16} /> Add Product
        </button>
      </div>
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 w-72 mb-5">
        <Search size={14} className="text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="text-sm outline-none flex-1" />
      </div>
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[48px_2fr_1fr_100px_80px_80px_80px] px-5 py-3 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          <span></span><span>Product</span><span>Category</span><span>Price</span><span>Stock</span><span>Status</span><span>Edit</span>
        </div>
        {loading ? Array.from({length:10}).map((_,i) => <div key={i} className="h-14 m-2 bg-gray-50 rounded-xl animate-pulse" />) :
         products.map(p => (
          <div key={p.id} className="grid grid-cols-[48px_2fr_1fr_100px_80px_80px_80px] px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 text-sm items-center">
            <div className="w-10 h-10 bg-gray-100 rounded-xl overflow-hidden">
              {p.imageUrl && <img src={p.imageUrl} alt="" className="w-full h-full object-contain p-1" onError={e => (e.target as any).style.display="none"} />}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">{p.name}</p>
              {p.isCustomizable && <span className="text-[10px] bg-indigo-50 text-navy font-bold rounded px-1.5 py-0.5 flex items-center gap-1 w-fit mt-0.5"><Pencil size={8} />Customizable</span>}
            </div>
            <span className="text-gray-500 text-xs">{p.category?.name}</span>
            <span className="font-bold">{formatCurrency(Number(p.basePrice))}</span>
            <span className={`font-bold ${p.stockQty < 10 ? "text-red-500" : "text-gray-900"}`}>{p.stockQty}</span>
            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{p.isActive ? "Active" : "Draft"}</span>
            <button className="text-gray-400 hover:text-navy transition-colors"><Pencil size={15} /></button>
          </div>
        ))}
        {!loading && products.length === 0 && <div className="py-12 text-center text-gray-400"><Package size={32} className="mx-auto mb-2 opacity-30" /><p>No products found</p></div>}
      </div>
    </div>
  );
}
