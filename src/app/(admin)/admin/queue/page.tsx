"use client";
import { useState, useEffect } from "react";
import { Check, RotateCcw, X, Paperclip, Loader2 } from "lucide-react";

export default function QueuePage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/queue").then(r => r.json()).then(d => { setQueue(d.data || []); setLoading(false); });
  }, []);

  async function act(reviewId: string, status: string, adminComment?: string) {
    setActing(reviewId);
    await fetch("/api/admin/queue", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviewId, status, adminComment }) });
    setQueue(q => q.map(r => r.id === reviewId ? { ...r, status } : r));
    setActing(null);
  }

  const statusColors: Record<string, string> = { PENDING: "border-gray-200", APPROVED: "border-green-400", REVISION_REQUESTED: "border-amber-400", REJECTED: "border-red-400" };
  const statusBadge: Record<string, string> = { APPROVED: "bg-green-100 text-green-700", REVISION_REQUESTED: "bg-amber-100 text-amber-700", REJECTED: "bg-red-100 text-red-700" };

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Customization Review Queue</h1>
      {loading ? <div className="text-center py-16 text-gray-400"><Loader2 size={32} className="animate-spin mx-auto" /></div> :
       queue.length === 0 ? <div className="bg-white rounded-2xl py-16 text-center text-gray-400"><p className="text-lg font-semibold">Queue is empty ✓</p><p className="text-sm">All customization requests have been reviewed.</p></div> :
       <div className="space-y-4">
        {queue.map(r => (
          <div key={r.id} className={`bg-white rounded-2xl p-5 border-2 transition-colors ${statusColors[r.status] || "border-gray-200"}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-extrabold text-base text-gray-900">{r.order?.items?.[0]?.productName || "Product"}{r.order?.items?.length > 1 ? ` +${r.order.items.length - 1} items` : ""}</p>
                <p className="text-sm text-gray-500 mt-0.5">#{r.order?.orderNumber} · {r.order?.user?.name} · {r.order?.user?.email}</p>
              </div>
              {r.status !== "PENDING" && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide ${statusBadge[r.status]}`}>{r.status.replace(/_/g," ")}</span>
              )}
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Customer Instructions</p>
              <p className="text-sm text-gray-700 leading-relaxed">{r.instructions || "No specific instructions provided."}</p>
              {r.uploadedFiles && r.uploadedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {r.uploadedFiles.map((f: string, i: number) => (
                    <span key={i} className="flex items-center gap-1.5 bg-white border border-gray-200 text-navy text-xs font-semibold rounded-lg px-2.5 py-1.5">
                      <Paperclip size={12} />{f}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {r.status === "PENDING" && (
              <div className="flex flex-wrap gap-3">
                <button disabled={acting === r.id} onClick={() => act(r.id, "APPROVED")} className="flex items-center gap-2 bg-green-600 text-white text-sm font-bold rounded-xl px-5 py-2.5 hover:bg-green-700 transition-colors disabled:opacity-60">
                  {acting === r.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Approve
                </button>
                <button disabled={acting === r.id} onClick={() => act(r.id, "REVISION_REQUESTED", "Please revise your design file.")} className="flex items-center gap-2 bg-amber-500 text-white text-sm font-bold rounded-xl px-5 py-2.5 hover:bg-amber-600 transition-colors disabled:opacity-60">
                  <RotateCcw size={14} /> Request Revision
                </button>
                <button disabled={acting === r.id} onClick={() => act(r.id, "REJECTED", "Design does not meet requirements.")} className="flex items-center gap-2 border-2 border-red-500 text-red-500 text-sm font-bold rounded-xl px-5 py-2.5 hover:bg-red-50 transition-colors disabled:opacity-60">
                  <X size={14} /> Reject
                </button>
              </div>
            )}
            {r.adminComment && <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3"><span className="font-bold">Admin note:</span> {r.adminComment}</p>}
          </div>
        ))}
       </div>}
    </div>
  );
}
