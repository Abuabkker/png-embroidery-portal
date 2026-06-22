"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, X, Loader2, Save, ArrowLeft, Package,
  Tag, Layers, DollarSign, Eye, EyeOff, Pencil,
  ImageIcon, Hash,
} from "lucide-react";

interface Props { productId?: string; }

const EMPTY = {
  name: "", sku: "", description: "", categoryId: "",
  basePrice: "", customSurcharge: "0",
  isCustomizable: false, isActive: true,
  stockQty: "0", lowStockThreshold: "10",
  imageUrl: "",
  sizes: [] as string[], colors: [] as string[],
};

function TagInput({
  label, values, inputVal, onInputChange, onAdd, onRemove, placeholder, colorClass,
}: {
  label: string; values: string[]; inputVal: string;
  onInputChange: (v: string) => void;
  onAdd: () => void; onRemove: (v: string) => void;
  placeholder: string; colorClass: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-2">{label}</label>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {values.map(v => (
            <span key={v} className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${colorClass}`}>
              {v}
              <button type="button" onClick={() => onRemove(v)}
                className="hover:opacity-70 transition-opacity ml-0.5">
                <X size={9} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={inputVal}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onAdd(); } }}
          placeholder={placeholder}
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-navy transition-colors"
        />
        <button type="button" onClick={onAdd}
          className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 transition-colors">
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

export default function ProductForm({ productId }: Props) {
  const router = useRouter();
  const isEdit = !!productId;

  const [form,       setForm]       = useState(EMPTY);
  const [categories, setCategories] = useState<any[]>([]);
  const [saving,     setSaving]     = useState(false);
  const [err,        setErr]        = useState("");
  const [loading,    setLoading]    = useState(isEdit);
  const [sizeInput,  setSizeInput]  = useState("");
  const [colorInput, setColorInput] = useState("");
  const [imgError,   setImgError]   = useState(false);

  useEffect(() => {
    fetch("/api/admin/categories").then(r => r.json()).then(d => setCategories(d.data || []));
    if (isEdit) {
      fetch(`/api/admin/products/${productId}`)
        .then(r => r.json())
        .then(d => {
          const p = d.data;
          if (!p) return;
          setForm({
            name: p.name || "", sku: p.sku || "", description: p.description || "",
            categoryId: p.categoryId || "",
            basePrice: String(p.basePrice || ""),
            customSurcharge: String(p.customSurcharge || "0"),
            isCustomizable: p.isCustomizable ?? false,
            isActive: p.isActive ?? true,
            stockQty: String(p.stockQty || "0"),
            lowStockThreshold: String(p.lowStockThreshold || "10"),
            imageUrl: p.imageUrl || "",
            sizes: p.sizes || [], colors: p.colors || [],
          });
          setLoading(false);
        });
    }
  }, [productId, isEdit]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    if (k === "imageUrl") setImgError(false);
  };

  function addSize()  { const v = sizeInput.trim().toUpperCase();  if (v && !form.sizes.includes(v))  setForm(f => ({ ...f, sizes:  [...f.sizes,  v] })); setSizeInput("");  }
  function addColor() { const v = colorInput.trim();               if (v && !form.colors.includes(v)) setForm(f => ({ ...f, colors: [...f.colors, v] })); setColorInput(""); }
  function removeSize(s: string)  { setForm(f => ({ ...f, sizes:  f.sizes.filter(x => x !== s)  })); }
  function removeColor(c: string) { setForm(f => ({ ...f, colors: f.colors.filter(x => x !== c) })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.categoryId || !form.basePrice) {
      setErr("Product name, category and base price are required."); return;
    }
    setSaving(true); setErr("");
    const payload = {
      ...form,
      basePrice:         parseFloat(form.basePrice),
      customSurcharge:   parseFloat(form.customSurcharge || "0"),
      stockQty:          parseInt(form.stockQty   || "0"),
      lowStockThreshold: parseInt(form.lowStockThreshold || "10"),
      sku:      form.sku      || null,
      imageUrl: form.imageUrl || null,
    };
    const res = isEdit
      ? await fetch(`/api/admin/products/${productId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      : await fetch("/api/admin/products",              { method: "POST",  headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const d = await res.json();
    if (!res.ok) { setErr(d.error || "Failed to save product."); setSaving(false); return; }
    router.push("/admin/products");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin text-gray-300" />
      </div>
    );
  }

  const stockNum = parseInt(form.stockQty || "0");
  const threshold = parseInt(form.lowStockThreshold || "10");

  return (
    <form onSubmit={handleSubmit}>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 leading-none">
              {isEdit ? "Edit Product" : "New Product"}
            </h1>
            {isEdit && form.name && (
              <p className="text-xs text-gray-400 mt-0.5">{form.name}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => router.back()}
            className="border border-gray-200 text-gray-600 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-navy text-white font-bold text-sm px-5 py-2 rounded-xl hover:bg-navy/90 transition-colors disabled:opacity-50 shadow-sm">
            {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : <><Save size={13} /> {isEdit ? "Save Changes" : "Create Product"}</>}
          </button>
        </div>
      </div>

      {err && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-5">
          {err}
        </div>
      )}

      <div className="grid grid-cols-[1fr_300px] gap-5 items-start">
        {/* ── Left column: all form sections ── */}
        <div className="space-y-5">

          {/* Basic info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-navy/10 rounded-lg flex items-center justify-center">
                <Package size={13} className="text-navy" />
              </div>
              <p className="font-extrabold text-sm text-gray-900">Basic Information</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Product Name <span className="text-red-400">*</span></label>
                <input value={form.name} onChange={set("name")} placeholder="e.g. Classic Polo Shirt"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-navy transition-colors" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    <span className="flex items-center gap-1"><Hash size={10} /> SKU / Code</span>
                  </label>
                  <input value={form.sku} onChange={set("sku")} placeholder="e.g. POLO-001"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono outline-none focus:border-navy transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Category <span className="text-red-400">*</span></label>
                  <select value={form.categoryId} onChange={set("categoryId")}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-navy transition-colors appearance-none bg-white">
                    <option value="">Select category…</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Description</label>
                <textarea value={form.description} onChange={set("description")} rows={3}
                  placeholder="Describe this product…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-navy transition-colors resize-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  <span className="flex items-center gap-1"><ImageIcon size={10} /> Image URL</span>
                </label>
                <input value={form.imageUrl} onChange={set("imageUrl")} placeholder="https://example.com/image.jpg"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-navy transition-colors" />
              </div>
            </div>
          </div>

          {/* Pricing & stock */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
                <DollarSign size={13} className="text-green-600" />
              </div>
              <p className="font-extrabold text-sm text-gray-900">Pricing & Inventory</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Base Price (PGK) <span className="text-red-400">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">K</span>
                  <input type="number" step="0.01" min="0" value={form.basePrice} onChange={set("basePrice")} placeholder="0.00"
                    className="w-full border border-gray-200 rounded-xl pl-7 pr-3 py-2.5 text-sm outline-none focus:border-navy transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Embroidery Surcharge (PGK)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">K</span>
                  <input type="number" step="0.01" min="0" value={form.customSurcharge} onChange={set("customSurcharge")} placeholder="0.00"
                    className="w-full border border-gray-200 rounded-xl pl-7 pr-3 py-2.5 text-sm outline-none focus:border-navy transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Stock Quantity</label>
                <input type="number" min="0" value={form.stockQty} onChange={set("stockQty")}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-navy transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Low Stock Alert Threshold</label>
                <input type="number" min="0" value={form.lowStockThreshold} onChange={set("lowStockThreshold")}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-navy transition-colors" />
              </div>
            </div>
          </div>

          {/* Variations */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center">
                <Layers size={13} className="text-purple-600" />
              </div>
              <p className="font-extrabold text-sm text-gray-900">Variations</p>
            </div>

            <div className="space-y-5">
              <TagInput
                label="Sizes"
                values={form.sizes}
                inputVal={sizeInput}
                onInputChange={setSizeInput}
                onAdd={addSize}
                onRemove={removeSize}
                placeholder="Type size and press Enter — e.g. S, M, L, XL"
                colorClass="bg-navy/10 text-navy"
              />
              <TagInput
                label="Colors"
                values={form.colors}
                inputVal={colorInput}
                onInputChange={setColorInput}
                onAdd={addColor}
                onRemove={removeColor}
                placeholder="Type colour and press Enter — e.g. Navy, White"
                colorClass="bg-purple-50 text-purple-700"
              />

              {/* Embroidery toggle */}
              <div className="flex items-center justify-between bg-indigo-50/60 rounded-xl px-4 py-3 border border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Pencil size={12} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Name Embroidery</p>
                    <p className="text-xs text-gray-500">Customers can add custom embroidered names</p>
                  </div>
                </div>
                <button type="button"
                  onClick={() => setForm(f => ({ ...f, isCustomizable: !f.isCustomizable }))}
                  className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${form.isCustomizable ? "bg-indigo-600" : "bg-gray-200"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isCustomizable ? "translate-x-[26px]" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right column: preview + visibility ── */}
        <div className="space-y-4 sticky top-20">

          {/* Image preview card */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="aspect-square bg-gray-50 flex items-center justify-center relative">
              {form.imageUrl && !imgError ? (
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  className="w-full h-full object-contain p-4"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="text-center text-gray-300">
                  <Package size={48} className="mx-auto mb-2" />
                  <p className="text-xs font-medium">Image preview</p>
                </div>
              )}
            </div>
            <div className="p-4">
              <p className="font-bold text-gray-900 text-sm truncate">{form.name || <span className="text-gray-300 font-normal">Product name</span>}</p>
              {form.sku && <p className="text-[10px] font-mono text-gray-400 mt-0.5">{form.sku}</p>}
              <p className="text-lg font-extrabold text-navy mt-2">
                {form.basePrice ? `K ${parseFloat(form.basePrice).toFixed(2)}` : <span className="text-gray-300 font-normal text-sm">Price</span>}
              </p>
              {Number(form.customSurcharge) > 0 && (
                <p className="text-xs text-gray-400">+K {parseFloat(form.customSurcharge).toFixed(2)} embroidery</p>
              )}
            </div>
          </div>

          {/* Stock status */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Stock Status</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Quantity</span>
              <span className={`text-sm font-extrabold ${stockNum === 0 ? "text-red-500" : stockNum <= threshold ? "text-orange-500" : "text-green-600"}`}>
                {stockNum}
              </span>
            </div>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${stockNum === 0 ? "bg-red-400" : stockNum <= threshold ? "bg-orange-400" : "bg-green-400"}`}
                style={{ width: `${Math.min((stockNum / Math.max(threshold * 3, 1)) * 100, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Alert threshold: {threshold} units</p>
          </div>

          {/* Visibility */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Visibility</p>
            <div className="space-y-2">
              {[
                { val: true,  label: "Active",  desc: "Visible in storefront", icon: <Eye size={14} />, color: "border-green-300 bg-green-50 text-green-700" },
                { val: false, label: "Hidden",  desc: "Not visible to customers", icon: <EyeOff size={14} />, color: "border-gray-200 bg-gray-50 text-gray-500" },
              ].map(opt => (
                <button key={String(opt.val)} type="button"
                  onClick={() => setForm(f => ({ ...f, isActive: opt.val }))}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all text-left ${
                    form.isActive === opt.val ? opt.color : "border-gray-100 hover:border-gray-200"}`}>
                  <span className={form.isActive === opt.val ? "" : "text-gray-300"}>{opt.icon}</span>
                  <div>
                    <p className="text-xs font-bold">{opt.label}</p>
                    <p className="text-[10px] opacity-70">{opt.desc}</p>
                  </div>
                  {form.isActive === opt.val && (
                    <span className="ml-auto w-4 h-4 rounded-full bg-current opacity-20 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Variation summary */}
          {(form.sizes.length > 0 || form.colors.length > 0) && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Variation Summary</p>
              {form.sizes.length > 0 && (
                <div className="mb-2">
                  <p className="text-[10px] text-gray-400 mb-1">Sizes ({form.sizes.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {form.sizes.map(s => (
                      <span key={s} className="text-[10px] font-bold bg-navy/10 text-navy px-2 py-0.5 rounded">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {form.colors.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-400 mb-1">Colors ({form.colors.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {form.colors.map(c => (
                      <span key={c} className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded">{c}</span>
                    ))}
                  </div>
                </div>
              )}
              {form.sizes.length > 0 && form.colors.length > 0 && (
                <p className="text-[10px] text-gray-400 mt-2 pt-2 border-t border-gray-50">
                  {form.sizes.length * form.colors.length} variant combinations
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
