"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, User, Lock, Loader2, ShoppingBag, BarChart2, Check } from "lucide-react";

const ROLES = [
  {
    value: "CUSTOMER",
    title: "Standard Customer",
    desc: "Shop products, track orders, and manage your account.",
    icon: ShoppingBag,
    features: ["Shop & browse products", "Place & track orders", "Cart & checkout", "Personal dashboard"],
  },
  {
    value: "SUPERIOR_CUSTOMER",
    title: "Superior Customer",
    desc: "Everything in Standard, plus full purchase analytics and reports.",
    icon: BarChart2,
    features: ["All Standard features", "Purchase reports & analytics", "Customer-wise reports", "Export PDF / Excel"],
    badge: "Account Manager",
  },
];

export default function RegisterPage() {
  const [form, setForm]     = useState({ name: "", email: "", password: "", confirm: "" });
  const [role, setRole]     = useState("CUSTOMER");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError("Passwords do not match"); return; }
    if (form.password.length < 8)       { setError("Password must be at least 8 characters"); return; }
    setLoading(true); setError("");
    const res  = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password, role }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Registration failed"); return; }
    router.push("/login?registered=1");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-lg">

        {/* Logo */}
        <div className="text-right mb-7">
          <div className="text-2xl font-extrabold text-navy">PNG</div>
          <div className="text-lg font-serif italic text-brand-red -mt-1">Embroidery</div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Create Account</h1>
        <p className="text-sm text-gray-500 mb-6">Join the PNG Embroidery Vendor Portal</p>

        {/* Role selector */}
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Choose Account Type</p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {ROLES.map(r => {
            const Icon    = r.icon;
            const active  = role === r.value;
            return (
              <button key={r.value} type="button" onClick={() => setRole(r.value)}
                className={`relative text-left rounded-2xl border-2 p-4 transition-all focus:outline-none
                  ${active
                    ? "border-navy bg-navy/5 ring-2 ring-navy/20"
                    : "border-gray-200 hover:border-gray-300 bg-white"}`}>

                {r.badge && (
                  <span className="absolute top-3 right-3 text-[9px] font-extrabold bg-navy text-white rounded-full px-2 py-0.5 tracking-wide">
                    {r.badge}
                  </span>
                )}

                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${active ? "bg-navy" : "bg-gray-100"}`}>
                  <Icon size={16} className={active ? "text-white" : "text-gray-500"} strokeWidth={1.8} />
                </div>

                <p className={`text-sm font-bold mb-1 ${active ? "text-navy" : "text-gray-800"}`}>{r.title}</p>
                <p className="text-[11px] text-gray-400 leading-snug mb-3">{r.desc}</p>

                <ul className="space-y-1">
                  {r.features.map(f => (
                    <li key={f} className="flex items-center gap-1.5 text-[11px] text-gray-500">
                      <Check size={10} className={active ? "text-navy" : "text-gray-300"} strokeWidth={3} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Selected indicator */}
                {active && (
                  <div className="absolute top-3 left-3 w-4 h-4 bg-navy rounded-full flex items-center justify-center">
                    <Check size={9} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-3">
          {([
            ["Full Name",        "name",    "text",     User],
            ["Email address",    "email",   "email",    Mail],
            ["Password",         "password","password", Lock],
            ["Confirm Password", "confirm", "password", Lock],
          ] as const).map(([ph, key, type, Icon]) => (
            <div key={key} className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <input
                type={type}
                placeholder={ph}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                required
                className="flex-1 text-sm bg-transparent outline-none text-gray-900"
              />
              <Icon size={16} className="text-gray-400" />
            </div>
          ))}

          <button type="submit" disabled={loading}
            className="w-full bg-navy text-white font-bold text-base rounded-xl py-3.5 flex items-center justify-center gap-2 hover:bg-blue-900 transition-colors disabled:opacity-70 mt-2">
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-navy font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
