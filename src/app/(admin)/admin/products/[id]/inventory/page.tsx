"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save, Package, Loader2 } from "lucide-react";

type Variant = { id?: string; size: string; color: string; stockQty: number };

export default function InventoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct]   = useState<any>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const safeFetch = (url: string) =>
      fetch(url).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); });

    Promise.all([
      safeFetch(`/api/admin/products/${id}`),
      safeFetch(`/api/admin/products/${id}/variants`),
    ]).then(([prod, vars]) => {
      const p = prod.data;
      setProduct(p);
      const existing: Variant[] = vars.data ?? [];

      const sizes:  string[] = p.sizes?.length  ? p.sizes  : [""];
      const colors: string[] = p.colors?.length ? p.colors : [""];

      const matrix: Variant[] = colors.flatMap((color: string) =>
        sizes.map((size: string) => {
          const found = existing.find(v => v.size === size && v.color === color);
          return { size, color, stockQty: found?.stockQty ?? 0 };
        })
      );
      setVariants(matrix);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to load inventory:", err);
      setLoading(false);
    });
  }, [id]);

  function update(color: string, size: string, value: string) {
    const qty = Math.max(0, parseInt(value) || 0);
    setVariants(prev => prev.map(v =>
      v.color === color && v.size === size ? { ...v, stockQty: qty } : v
    ));
  }

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/admin/products/${id}/variants`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(variants),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-6 bg-gray-100 rounded w-48" />
      <div className="h-64 bg-gray-100 rounded-2xl" />
    </div>
  );

  const colors = [...new Set(variants.map(v => v.color))];
  const sizes  = [...new Set(variants.map(v => v.size))];
  const hasColors = colors.some(c => c !== "");
  const hasSizes  = sizes.some(s => s !== "");

  return (
    <div className="max-w-4xl">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5">
        <ChevronLeft size={14} /> Back to Products
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">{product?.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage per-variant inventory stock</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-navy text-white text-sm font-bold rounded-xl px-4 py-2.5 hover:bg-navy-dark disabled:opacity-60 transition-colors">
          {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? "✓ Saved!" : <><Save size={15} /> Save Stock</>}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Header row */}
        <div className={`grid px-5 py-3 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100`}
          style={{ gridTemplateColumns: `${hasColors ? "160px " : ""}${hasSizes ? "1fr " : ""}120px` }}>
          {hasColors && <span>Color</span>}
          {hasSizes  && <span>Size</span>}
          <span>Stock Qty</span>
        </div>

        {variants.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <Package size={32} className="mx-auto mb-2 opacity-30" />
            <p>No variants found for this product</p>
          </div>
        )}

        {variants.map((v, idx) => {
          const isLow = v.stockQty > 0 && v.stockQty <= 5;
          const isOOS = v.stockQty === 0;
          return (
            <div key={`${v.color}-${v.size}`}
              className={`grid items-center px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50`}
              style={{ gridTemplateColumns: `${hasColors ? "160px " : ""}${hasSizes ? "1fr " : ""}120px` }}>
              {hasColors && (
                <span className="text-sm font-semibold text-gray-700">{v.color || "—"}</span>
              )}
              {hasSizes && (
                <span className="text-sm text-gray-600">{v.size || "—"}</span>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={v.stockQty}
                  onChange={e => update(v.color, v.size, e.target.value)}
                  className={`w-20 border rounded-lg px-3 py-1.5 text-sm font-bold text-center outline-none transition-colors
                    ${isOOS  ? "border-red-300 text-red-500 bg-red-50" :
                      isLow  ? "border-orange-300 text-orange-600 bg-orange-50" :
                               "border-gray-200 text-gray-900 focus:border-navy"}`}
                />
                {isOOS  && <span className="text-xs font-semibold text-red-400">Out of stock</span>}
                {isLow  && <span className="text-xs font-semibold text-orange-500">Low stock</span>}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Stock shown to customers per size/color. When a customer orders, stock is automatically deducted.
      </p>
    </div>
  );
}
