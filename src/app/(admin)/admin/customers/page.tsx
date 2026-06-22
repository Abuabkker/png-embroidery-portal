"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Search, Plus, X, Check, Trash2, Users,
  ToggleLeft, ToggleRight, KeyRound, Loader2, ChevronDown,
  UserCircle2, Mail, Phone, ShoppingBag, Shield,
} from "lucide-react";

const ROLES = ["ALL", "CUSTOMER", "SUPERIOR_CUSTOMER", "ADMIN", "SUPER_ADMIN"];
const ROLE_LABELS: Record<string, string> = {
  ALL: "All Roles", CUSTOMER: "Customer",
  SUPERIOR_CUSTOMER: "Superior Customer",
  ADMIN: "Admin", SUPER_ADMIN: "Super Admin",
};
const ROLE_COLORS: Record<string, string> = {
  CUSTOMER:          "bg-blue-50 text-blue-700 border-blue-100",
  SUPERIOR_CUSTOMER: "bg-purple-50 text-purple-700 border-purple-100",
  ADMIN:             "bg-orange-50 text-orange-700 border-orange-100",
  SUPER_ADMIN:       "bg-red-50 text-red-700 border-red-100",
};
const AVATAR_COLORS = [
  "bg-blue-500", "bg-purple-500", "bg-emerald-500",
  "bg-orange-500", "bg-pink-500", "bg-indigo-500",
];

const EMPTY_FORM = { name: "", email: "", phone: "", role: "CUSTOMER", password: "", isActive: true };

function avatarColor(id: string) {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [roleTab,   setRoleTab]   = useState("ALL");

  const [modal,     setModal]     = useState<"create" | "edit" | null>(null);
  const [selected,  setSelected]  = useState<any>(null);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState<string | null>(null);
  const [resetPw,   setResetPw]   = useState("");
  const [showReset, setShowReset] = useState(false);
  const [err,       setErr]       = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (roleTab !== "ALL") p.set("role", roleTab);
    if (search) p.set("search", search);
    fetch(`/api/admin/customers?${p}`)
      .then(r => r.json())
      .then(d => { setCustomers(d.data || []); setLoading(false); });
  }, [roleTab, search]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setForm(EMPTY_FORM); setErr(""); setResetPw(""); setShowReset(false);
    setSelected(null); setModal("create");
  }
  function openEdit(c: any) {
    setForm({ name: c.name || "", email: c.email, phone: c.phone || "", role: c.role, password: "", isActive: c.isActive });
    setErr(""); setResetPw(""); setShowReset(false);
    setSelected(c); setModal("edit");
  }
  function closeModal() { setModal(null); setSelected(null); setErr(""); }

  async function handleSave() {
    setSaving(true); setErr("");
    try {
      if (modal === "create") {
        if (!form.email || !form.password) { setErr("Email and password are required."); setSaving(false); return; }
        const res = await fetch("/api/admin/customers", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const d = await res.json();
        if (!res.ok) { setErr(d.error || "Failed to create customer."); setSaving(false); return; }
      } else {
        const payload: any = { name: form.name, email: form.email, phone: form.phone, role: form.role, isActive: form.isActive };
        if (showReset && resetPw) payload.newPassword = resetPw;
        const res = await fetch(`/api/admin/customers/${selected.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const d = await res.json();
        if (!res.ok) { setErr(d.error || "Failed to update."); setSaving(false); return; }
      }
      closeModal(); load();
    } catch { setErr("Network error."); }
    setSaving(false);
  }

  async function toggleActive(c: any, e: React.MouseEvent) {
    e.stopPropagation();
    await fetch(`/api/admin/customers/${c.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    load();
  }

  async function handleDelete(c: any) {
    if (!confirm(`Delete ${c.name || c.email}? This cannot be undone.`)) return;
    setDeleting(c.id);
    await fetch(`/api/admin/customers/${c.id}`, { method: "DELETE" });
    setDeleting(null);
    closeModal(); load();
  }

  const setField = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const counts = {
    CUSTOMER:          customers.filter(c => c.role === "CUSTOMER").length,
    SUPERIOR_CUSTOMER: customers.filter(c => c.role === "SUPERIOR_CUSTOMER").length,
    ADMIN:             customers.filter(c => c.role === "ADMIN" || c.role === "SUPER_ADMIN").length,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-400 mt-0.5">{customers.length} total accounts</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-navy text-white text-sm font-bold rounded-xl px-4 py-2.5 hover:bg-navy/90 transition-colors shadow-sm">
          <Plus size={15} /> New Customer
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Customers",        count: counts.CUSTOMER,          color: "text-blue-600",   bg: "bg-blue-50"   },
          { label: "Superior Customers",count: counts.SUPERIOR_CUSTOMER, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Admins",           count: counts.ADMIN,             color: "text-orange-600", bg: "bg-orange-50" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
            <p className="text-xs text-gray-400 font-medium">{s.label}</p>
            <p className={`text-3xl font-extrabold mt-1 ${s.color}`}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Search + role tabs */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 flex-1 max-w-sm">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="text-sm outline-none flex-1 min-w-0" />
          {search && (
            <button onClick={() => setSearch("")} className="text-gray-300 hover:text-gray-500">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {ROLES.map(r => (
            <button key={r} onClick={() => setRoleTab(r)}
              className={`text-xs font-semibold rounded-full px-3 py-1.5 border transition-colors ${
                roleTab === r
                  ? "bg-navy text-white border-navy"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
              {r === "ALL" ? "All" : ROLE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_1fr_120px_80px_90px_48px] px-5 py-3 border-b border-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          <span>Customer</span>
          <span>Contact</span>
          <span>Role</span>
          <span className="text-center">Orders</span>
          <span className="text-center">Status</span>
          <span></span>
        </div>

        {loading ? (
          Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-[68px] mx-4 my-1.5 bg-gray-50 rounded-xl animate-pulse" />
          ))
        ) : customers.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-semibold">No customers found</p>
            <p className="text-xs mt-1">Try adjusting your search or filters</p>
          </div>
        ) : customers.map(c => (
          <div key={c.id}
            onClick={() => openEdit(c)}
            className="grid grid-cols-[1fr_1fr_120px_80px_90px_48px] px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors cursor-pointer items-center group">

            {/* Avatar + name */}
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-full ${avatarColor(c.id)} text-white text-sm font-bold flex items-center justify-center flex-shrink-0 select-none`}>
                {c.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">{c.name || <span className="text-gray-400 italic">No name</span>}</p>
                <p className="text-[10px] text-gray-400">
                  Joined {new Date(c.createdAt).toLocaleDateString("en-PG", { month: "short", year: "numeric" })}
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="min-w-0">
              <p className="text-xs text-gray-600 truncate">{c.email}</p>
              {c.phone && <p className="text-[10px] text-gray-400 mt-0.5">{c.phone}</p>}
            </div>

            {/* Role badge */}
            <div>
              <span className={`inline-flex text-[10px] font-bold px-2.5 py-1 rounded-lg border ${ROLE_COLORS[c.role] || "bg-gray-50 text-gray-500 border-gray-100"}`}>
                {ROLE_LABELS[c.role] || c.role}
              </span>
            </div>

            {/* Orders */}
            <p className="text-sm font-bold text-gray-900 text-center">{c._count?.orders ?? 0}</p>

            {/* Active toggle */}
            <div className="flex justify-center">
              <button
                onClick={e => toggleActive(c, e)}
                className={`flex items-center gap-1.5 text-[11px] font-bold rounded-full px-2.5 py-1 transition-colors ${
                  c.isActive
                    ? "bg-green-50 text-green-600 hover:bg-green-100"
                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}>
                {c.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                {c.isActive ? "Active" : "Off"}
              </button>
            </div>

            {/* Delete */}
            <div className="flex justify-center">
              <button
                onClick={e => { e.stopPropagation(); handleDelete(c); }}
                disabled={deleting === c.id}
                className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all">
                {deleting === c.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {!loading && customers.length > 0 && (
        <p className="text-xs text-gray-400 mt-3 text-right">
          Showing {customers.length} account{customers.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-navy/10 rounded-xl flex items-center justify-center">
                  <UserCircle2 size={18} className="text-navy" />
                </div>
                <div>
                  <h2 className="font-extrabold text-gray-900 text-base leading-none">
                    {modal === "create" ? "New Customer" : "Edit Customer"}
                  </h2>
                  {modal === "edit" && selected && (
                    <p className="text-xs text-gray-400 mt-0.5">{selected.email}</p>
                  )}
                </div>
              </div>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Form body */}
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full Name</label>
                <div className="relative">
                  <UserCircle2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input value={form.name} onChange={setField("name")} placeholder="John Smith"
                    className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-navy transition-colors" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email Address <span className="text-red-400">*</span></label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input type="email" value={form.email} onChange={setField("email")} placeholder="john@example.com"
                    className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-navy transition-colors" />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input value={form.phone} onChange={setField("phone")} placeholder="+675 xxx xxxx"
                    className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-navy transition-colors" />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Account Role</label>
                <div className="relative">
                  <Shield size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <select value={form.role} onChange={setField("role")}
                    className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-navy transition-colors appearance-none bg-white">
                    <option value="CUSTOMER">Customer</option>
                    <option value="SUPERIOR_CUSTOMER">Superior Customer</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
              </div>

              {/* Password */}
              {modal === "create" ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Password <span className="text-red-400">*</span></label>
                  <input type="password" value={form.password} onChange={setField("password")} placeholder="Min 8 characters"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-navy transition-colors" />
                </div>
              ) : (
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => setShowReset(!showReset)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <KeyRound size={14} className="text-gray-400" />
                      Reset Password
                    </div>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${showReset ? "rotate-180" : ""}`} />
                  </button>
                  {showReset && (
                    <div className="px-4 pb-3 border-t border-gray-50">
                      <input type="password" value={resetPw} onChange={e => setResetPw(e.target.value)}
                        placeholder="Enter new password"
                        className="mt-2.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-navy transition-colors" />
                    </div>
                  )}
                </div>
              )}

              {/* Active toggle (edit only) */}
              {modal === "edit" && (
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Account Active</p>
                    <p className="text-xs text-gray-400 mt-0.5">{form.isActive ? "Customer can log in" : "Account is disabled"}</p>
                  </div>
                  <button
                    onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${form.isActive ? "bg-green-500" : "bg-gray-200"}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? "translate-x-[26px]" : "translate-x-0.5"}`} />
                  </button>
                </div>
              )}

              {err && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-xs px-4 py-3 rounded-xl">
                  {err}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
              {modal === "edit" && selected && (
                <button onClick={() => handleDelete(selected)} disabled={deleting === selected.id}
                  className="flex items-center gap-1.5 border border-red-200 text-red-500 hover:bg-red-50 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50">
                  {deleting === selected.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  Delete
                </button>
              )}
              <button onClick={closeModal}
                className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-navy text-white text-sm font-bold py-2.5 rounded-xl hover:bg-navy/90 transition-colors disabled:opacity-50">
                {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : <><Check size={13} /> {modal === "create" ? "Create" : "Save Changes"}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
