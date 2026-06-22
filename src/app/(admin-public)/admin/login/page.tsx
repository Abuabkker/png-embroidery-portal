"use client";
import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Mail, Eye, EyeOff, Loader2, Shield } from "lucide-react";

const BASE = "https://pngembroidery.net/wp-content/uploads/2025/";
const PHOTOS = [
  { url: BASE+"10/white-safety-helmet-400x400.jpg", label: "Safety Helmets" },
  { url: BASE+"10/gowns-400x480.png",               label: "Graduation Gowns" },
  { url: BASE+"08/light-blue-1-1-400x309.png",       label: "Corporate Wear", wide: true },
  { url: BASE+"08/chef-uniform-400x400.png",         label: "Chef Uniforms" },
  { url: BASE+"10/5-400x267.jpg",                    label: "Safety Boots" },
];

export default function AdminLoginPage() {
  const [email, setEmail] = useState("admin@pngembroidery.net");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setLoading(false);
      setError("Invalid admin credentials");
      return;
    }
    const session = await getSession();
    const role = (session?.user as any)?.role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      setLoading(false);
      setError("Access denied. This portal is for administrators only.");
      return;
    }
    router.push("/admin/dashboard");
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <div className="w-[46%] p-5 bg-gray-100 hidden lg:block">
        <div className="grid grid-cols-2 gap-2.5 h-full">
          {PHOTOS.map((p, i) => (
            <div key={i} className={`relative rounded-2xl overflow-hidden ${p.wide ? "col-span-2" : ""}`} style={{minHeight: p.wide ? 180 : 140}}>
              <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                <span className="text-white font-semibold text-xs tracking-wide">{p.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 overflow-y-auto">
        <div className="max-w-md w-full mx-auto">
          <div className="flex justify-end mb-8">
            <Image src="/logo-new.webp" alt="PNG Embroidery" width={90} height={90} className="object-contain" priority />
          </div>
          <div className="flex items-center gap-4 mb-5">
            <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">Admin Portal</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1.5">Sign in to Admin</h1>
          <p className="text-sm text-gray-500 mb-7">Use your admin credentials. Unauthorized access is strictly prohibited.</p>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-3">
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Admin Email" required className="flex-1 text-sm bg-transparent outline-none" />
              <Mail size={18} className="text-gray-400" />
            </div>
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5">
              <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="flex-1 text-sm bg-transparent outline-none" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="text-gray-400">{showPass ? <Eye size={18}/> : <EyeOff size={18}/>}</button>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-navy text-white font-bold text-base rounded-2xl py-4 flex items-center justify-center gap-2 hover:bg-navy-dark transition-colors disabled:opacity-70">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
