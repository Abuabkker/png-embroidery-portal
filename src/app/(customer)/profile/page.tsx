"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { User, Mail, Phone, Shield, Calendar, ShoppingBag, DollarSign, Edit2, Check, X, Lock, Eye, EyeOff } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const ROLE_LABEL: Record<string, { label: string; color: string }> = {
  CUSTOMER:          { label: "Customer",          color: "bg-gray-100 text-gray-700" },
  SUPERIOR_CUSTOMER: { label: "Superior Customer", color: "bg-navy text-white" },
  ADMIN:             { label: "Admin",             color: "bg-purple-100 text-purple-700" },
  SUPER_ADMIN:       { label: "Super Admin",       color: "bg-red-100 text-red-700" },
};

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [profile, setProfile]   = useState<any>(null);
  const [loading, setLoading]   = useState(true);

  // Edit state
  const [editing, setEditing]   = useState(false);
  const [name, setName]         = useState("");
  const [phone, setPhone]       = useState("");
  const [saving, setSaving]     = useState(false);
  const [saveMsg, setSaveMsg]   = useState("");

  // Password state
  const [pwOpen, setPwOpen]     = useState(false);
  const [curPw, setCurPw]       = useState("");
  const [newPw, setNewPw]       = useState("");
  const [showCur, setShowCur]   = useState(false);
  const [showNew, setShowNew]   = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg]       = useState("");

  useEffect(() => {
    fetch("/api/user/profile").then(r => r.json()).then(d => {
      setProfile(d.data);
      setName(d.data?.name || "");
      setPhone(d.data?.phone || "");
      setLoading(false);
    });
  }, []);

  async function saveProfile() {
    setSaving(true); setSaveMsg("");
    const res  = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setProfile((p: any) => ({ ...p, ...data.data }));
      setEditing(false);
      setSaveMsg("Profile updated!");
      await updateSession({ name });
      setTimeout(() => setSaveMsg(""), 3000);
    } else {
      setSaveMsg(data.error || "Failed to save");
    }
  }

  function cancelEdit() {
    setName(profile?.name || "");
    setPhone(profile?.phone || "");
    setEditing(false);
    setSaveMsg("");
  }

  async function changePassword() {
    if (!newPw || !curPw) return;
    setPwSaving(true); setPwMsg("");
    const res  = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: curPw, newPassword: newPw }),
    });
    const data = await res.json();
    setPwSaving(false);
    setPwMsg(data.message || data.error || "");
    if (res.ok) { setCurPw(""); setNewPw(""); setPwOpen(false); }
  }

  const initials = (profile?.name || session?.user?.name || "?")
    .split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  if (loading) return (
    <div className="max-w-xl animate-pulse space-y-4">
      <div className="h-32 bg-gray-100 rounded-2xl" />
      <div className="h-48 bg-gray-100 rounded-2xl" />
      <div className="h-28 bg-gray-100 rounded-2xl" />
    </div>
  );

  const roleCfg = ROLE_LABEL[profile?.role] ?? ROLE_LABEL.CUSTOMER;

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-extrabold text-gray-900">My Profile</h1>

      {/* ── Avatar + name card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-navy flex items-center justify-center text-white text-xl font-extrabold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-lg font-extrabold text-gray-900 truncate">{profile?.name || "—"}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleCfg.color}`}>
                {roleCfg.label}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">{profile?.email}</p>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Calendar size={11} />
              Member since {new Date(profile?.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)}
              className="shrink-0 p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
              <Edit2 size={15} />
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-100 shrink-0">
              <ShoppingBag size={14} className="text-navy" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-gray-900">{profile?.totalOrders ?? 0}</p>
              <p className="text-[10px] text-gray-400 font-medium">Total Orders</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-100 shrink-0">
              <DollarSign size={14} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-gray-900">{formatCurrency(profile?.totalSpent ?? 0)}</p>
              <p className="text-[10px] text-gray-400 font-medium">Total Spent</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit form ── */}
      {editing ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <p className="font-extrabold text-gray-900 text-sm">Edit Details</p>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1.5 block">Full Name</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5">
              <User size={14} className="text-gray-400 shrink-0" />
              <input value={name} onChange={e => setName(e.target.value)}
                className="flex-1 text-sm outline-none text-gray-900 bg-transparent" placeholder="Your full name" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1.5 block">Phone Number</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5">
              <Phone size={14} className="text-gray-400 shrink-0" />
              <input value={phone} onChange={e => setPhone(e.target.value)}
                className="flex-1 text-sm outline-none text-gray-900 bg-transparent" placeholder="+675 XXX XXXX" />
            </div>
          </div>
          {saveMsg && <p className={`text-xs font-semibold ${saveMsg.includes("updated") ? "text-green-600" : "text-red-500"}`}>{saveMsg}</p>}
          <div className="flex gap-2 pt-1">
            <button onClick={saveProfile} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-navy text-white text-sm font-bold rounded-xl hover:bg-blue-900 disabled:opacity-60 transition-colors">
              <Check size={14} /> {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={cancelEdit}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-200 transition-colors">
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        /* ── Info display ── */
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {[
            { icon: User,   label: "Full Name",    value: profile?.name  || "—" },
            { icon: Mail,   label: "Email Address", value: profile?.email || "—" },
            { icon: Phone,  label: "Phone",         value: profile?.phone || "—" },
            { icon: Shield, label: "Account Role",  value: roleCfg.label },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 px-5 py-3.5">
              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                <Icon size={14} className="text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{label}</p>
                <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {saveMsg && !editing && (
        <p className="text-xs font-semibold text-green-600 px-1">{saveMsg}</p>
      )}

      {/* ── Change password ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <button onClick={() => { setPwOpen(o => !o); setPwMsg(""); }}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
              <Lock size={14} className="text-gray-400" />
            </div>
            <span className="text-sm font-bold text-gray-800">Change Password</span>
          </div>
          <span className="text-xs text-gray-400">{pwOpen ? "▲" : "▼"}</span>
        </button>

        {pwOpen && (
          <div className="px-5 pb-5 space-y-3 border-t border-gray-50">
            <div className="pt-4">
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">Current Password</label>
              <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5">
                <Lock size={13} className="text-gray-400 shrink-0" />
                <input type={showCur ? "text" : "password"} value={curPw} onChange={e => setCurPw(e.target.value)}
                  className="flex-1 text-sm outline-none bg-transparent" placeholder="Current password" />
                <button type="button" onClick={() => setShowCur(s => !s)} className="text-gray-400 hover:text-gray-600">
                  {showCur ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">New Password</label>
              <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5">
                <Lock size={13} className="text-gray-400 shrink-0" />
                <input type={showNew ? "text" : "password"} value={newPw} onChange={e => setNewPw(e.target.value)}
                  className="flex-1 text-sm outline-none bg-transparent" placeholder="Min 8 characters" />
                <button type="button" onClick={() => setShowNew(s => !s)} className="text-gray-400 hover:text-gray-600">
                  {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {newPw.length > 0 && newPw.length < 8 && (
                <p className="text-[10px] text-red-500 mt-1">Must be at least 8 characters</p>
              )}
            </div>
            {pwMsg && (
              <p className={`text-xs font-semibold ${pwMsg.includes("updated") ? "text-green-600" : "text-red-500"}`}>{pwMsg}</p>
            )}
            <button onClick={changePassword} disabled={pwSaving || !curPw || newPw.length < 8}
              className="w-full py-2.5 bg-navy text-white text-sm font-bold rounded-xl hover:bg-blue-900 disabled:opacity-50 transition-colors">
              {pwSaving ? "Updating…" : "Update Password"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
