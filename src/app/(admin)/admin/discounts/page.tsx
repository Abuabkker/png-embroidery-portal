"use client";
import { useState, useEffect } from "react";
import { Plus, Tag, Loader2 } from "lucide-react";

export default function DiscountsPage() {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ code:"", type:"PERCENTAGE", value:"", minOrderValue:"", maxUses:"", expiresAt:"" });

  useEffect(() => { fetch("/api/admin/discounts").then(r => r.json()).then(d => { setCodes(d.data || []); setLoading(false); }); }, []);

  async function createCode(e: React.FormEvent) {
    e.preventDefault(); setCreating(true);
    const body: any = { ...form, value: parseFloat(form.value), isActive: true };
    if (form.minOrderValue) body.minOrderValue = parseFloat(form.minOrderValue);
    if (form.maxUses) body.maxUses = parseInt(form.maxUses);
    if (form.expiresAt) body.expiresAt = new Date(form.expiresAt);
    const res = await fetch("/api/admin/discounts", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
    const d = await res.json();
    setCodes(c => [d.data, ...c]);
    setForm({ code:"", type:"PERCENTAGE", value:"", minOrderValue:"", maxUses:"", expiresAt:"" });
    setCreating(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Discount Codes</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Create form */}
        <div className="bg-white rounded-2xl p-5">
          <h2 className="font-bold text-base mb-4">Create New Code</h2>
          <form onSubmit={createCode} className="space-y-3">
            {[["Discount Code", "code", "text"], ["Value", "value", "number"], ["Min Order Value", "minOrderValue", "number"], ["Max Uses", "maxUses", "number"]].map(([ph, key, type]) => (
              <input key={key} type={type} placeholder={ph} value={(form as any)[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))} required={key === "code" || key === "value"}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-navy" />
            ))}
            <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none">
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed Amount (K)</option>
            </select>
            <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({...f, expiresAt: e.target.value}))}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
            <button type="submit" disabled={creating} className="w-full bg-navy text-white font-bold text-sm rounded-xl py-2.5 flex items-center justify-center gap-2 disabled:opacity-60">
              {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Create Code
            </button>
          </form>
        </div>

        {/* Code list */}
        <div className="lg:col-span-2 bg-white rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1fr_80px_80px_80px_80px_80px] px-5 py-3 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            <span>Code</span><span>Type</span><span>Value</span><span>Used</span><span>Expires</span><span>Active</span>
          </div>
          {loading ? Array.from({length:4}).map((_,i) => <div key={i} className="h-12 m-2 bg-gray-50 rounded-xl animate-pulse" />) :
           codes.map(c => (
            <div key={c.id} className="grid grid-cols-[1fr_80px_80px_80px_80px_80px] px-5 py-3.5 border-b border-gray-50 last:border-0 text-sm items-center">
              <span className="font-bold text-navy flex items-center gap-2"><Tag size={14} />{c.code}</span>
              <span className="text-xs text-gray-500">{c.type}</span>
              <span className="font-semibold">{c.type === "PERCENTAGE" ? `${c.value}%` : `K${c.value}`}</span>
              <span className="text-gray-500">{c.usedCount}{c.maxUses ? `/${c.maxUses}` : ""}</span>
              <span className="text-xs text-gray-400">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "Never"}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{c.isActive ? "Active" : "Inactive"}</span>
            </div>
          ))}
          {!loading && codes.length === 0 && <div className="py-12 text-center text-gray-400"><Tag size={32} className="mx-auto mb-2 opacity-30" /><p>No discount codes yet</p></div>}
        </div>
      </div>
    </div>
  );
}
