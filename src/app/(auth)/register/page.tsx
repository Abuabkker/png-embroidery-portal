"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, User, Lock, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError("Passwords do not match"); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.name, email: form.email, password: form.password }) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Registration failed"); return; }
    router.push("/login?registered=1");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-md">
        <div className="text-right mb-8">
          <div className="text-2xl font-extrabold text-navy">PNG</div>
          <div className="text-lg font-serif italic text-brand-red -mt-1">Embroidery</div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Create Account</h1>
        <p className="text-sm text-gray-500 mb-6">Join the PNG Embroidery Vendor Portal</p>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}
        <form onSubmit={handleRegister} className="space-y-3">
          {[["Full Name", "name", "text", User], ["Email address", "email", "email", Mail], ["Password", "password", "password", Lock], ["Confirm Password", "confirm", "password", Lock]].map(([ph, key, type, Icon]: any) => (
            <div key={key} className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <input type={type} placeholder={ph} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} required
                className="flex-1 text-sm bg-transparent outline-none text-gray-900" />
              <Icon size={16} className="text-gray-400" />
            </div>
          ))}
          <button type="submit" disabled={loading} className="w-full bg-navy text-white font-bold text-base rounded-xl py-3.5 flex items-center justify-center gap-2 hover:bg-navy-dark transition-colors disabled:opacity-70 mt-2">
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account? <Link href="/login" className="text-navy font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
