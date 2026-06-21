"use client";
import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Mail, Shield, Loader2 } from "lucide-react";

const BASE = "https://pngembroidery.net/wp-content/uploads/2025/";
const PHOTOS = [
  { url: BASE+"10/white-safety-helmet-400x400.jpg", label: "Safety Helmets" },
  { url: BASE+"10/gowns-400x480.png",               label: "Graduation Gowns" },
  { url: BASE+"08/chef-uniform-400x400.png",         label: "Uniforms", wide: true },
  { url: BASE+"08/light-blue-1-1-400x309.png",       label: "Corporate Wear" },
  { url: BASE+"10/5-400x267.jpg",                    label: "Safety Boots" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) { setLoading(false); setError("Invalid email or password"); return; }
    const session = await getSession();
    const role = (session?.user as any)?.role;
    setLoading(false);
    router.push(role === "ADMIN" || role === "SUPER_ADMIN" ? "/admin/dashboard" : "/dashboard");
  }

  async function handleGoogle() {
    await signIn("google", { callbackUrl: "/" });
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Left — photo grid */}
      <div className="w-[46%] p-5 bg-gray-100 hidden lg:block">
        <div className="grid grid-cols-2 gap-2.5 h-full">
          {PHOTOS.map((p, i) => (
            <div key={i} className={`relative rounded-2xl overflow-hidden ${p.wide ? "col-span-2" : ""}`} style={{ minHeight: p.wide ? 180 : 140 }}>
              <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                <span className="text-white font-semibold text-xs tracking-wide">{p.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 overflow-y-auto">
        <div className="max-w-md w-full mx-auto">
          {/* Logo */}
          <div className="flex justify-end mb-10">
            <div className="text-right">
              <div className="text-3xl font-extrabold text-navy tracking-tight">PNG</div>
              <div className="text-xl font-serif italic text-brand-red -mt-1">Embroidery</div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome to <strong>PNG Embroidery</strong></h1>
          <p className="text-sm text-gray-500 mb-8">ISO-9001 Certified Uniform & Embroidery Specialist</p>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">{error}</div>}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" required
                className="flex-1 text-sm text-gray-900 bg-transparent outline-none" />
              <Mail size={18} className="text-gray-400" />
            </div>
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5">
              <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required
                className="flex-1 text-sm text-gray-900 bg-transparent outline-none" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="text-gray-400">
                {showPass ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-navy text-white font-bold text-base rounded-2xl py-4 flex items-center justify-center gap-2 hover:bg-navy-dark transition-colors disabled:opacity-70">
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="flex items-center gap-4 my-5">
            <div className="flex-1 h-px bg-gray-200" /><span className="text-sm text-gray-400">Or</span><div className="flex-1 h-px bg-gray-200" />
          </div>

          <button onClick={handleGoogle} className="w-full flex items-center justify-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl py-3.5 text-sm font-semibold text-gray-800 hover:bg-gray-100 transition-colors mb-3">
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-navy font-semibold hover:underline">Create account</Link>
          </p>
          <p className="text-center text-xs text-gray-400 mt-3">
            Admin?{" "}
            <Link href="/admin/login" className="text-gray-600 hover:underline">Admin login →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
