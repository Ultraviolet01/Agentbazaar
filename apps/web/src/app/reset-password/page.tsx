"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
    }

    setLoading(true);

    try {
      await api.post("/auth/reset-password", { token, password });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Reset failed. The token may be invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
      return (
          <div className="max-w-md w-full bg-white p-12 rounded-[48px] border border-red-100 shadow-[0_20px_60px_rgba(0,0,0,0.04)] text-center space-y-6">
              <div className="w-20 h-20 rounded-[28px] bg-red-50 border border-red-100 flex items-center justify-center mx-auto shadow-sm">
                <AlertCircle className="text-red-500" size={40} strokeWidth={2.5} />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Invalid Link</h1>
                <p className="text-gray-400 font-semibold text-sm">The reset token is missing or expired.</p>
              </div>
              <Link href="/login" className="inline-block text-[11px] font-bold text-orange-500 hover:text-orange-600 uppercase tracking-widest mt-4">Back to Safety</Link>
          </div>
      );
  }

  return (
    <div className="max-w-md w-full space-y-10 bg-white p-12 rounded-[48px] border border-gray-100/80 shadow-[0_20px_60px_rgba(0,0,0,0.04)] relative z-10 backdrop-blur-sm">
      <div className="text-center space-y-5">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-[28px] bg-orange-50 border border-orange-100 mb-2 relative shadow-sm">
            <Lock className="text-orange-500" size={36} strokeWidth={2.5} />
        </div>
        <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight uppercase leading-none">New Access</h1>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em]">Credentials Update</p>
        </div>
      </div>

      {success ? (
        <div className="space-y-8 text-center animate-in fade-in zoom-in duration-500">
           <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[32px] text-emerald-600 shadow-sm">
              <CheckCircle2 className="mx-auto mb-4 text-emerald-500" size={48} strokeWidth={2.5} />
              <p className="font-bold leading-relaxed text-lg">
                Password updated!
              </p>
              <p className="text-sm font-semibold text-emerald-600/70 mt-2">Initializing session redirect...</p>
           </div>
           <div className="flex items-center justify-center space-x-2">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" />
           </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-100 p-5 rounded-2xl flex items-start space-x-4 text-red-600 text-xs font-bold leading-relaxed shadow-sm">
              <AlertCircle size={20} className="shrink-0 mt-0.5" strokeWidth={2.5} />
              <span>{error}</span>
            </div>
          )}
          
          <div className="space-y-4">
            <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">New Passkey</label>
            <div className="relative group/input">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within/input:text-orange-500 transition-colors" size={20} strokeWidth={2.5} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-15 bg-gray-50/50 border border-gray-100 rounded-[22px] pl-16 pr-6 text-sm font-bold text-gray-900 placeholder-gray-300 focus:bg-white focus:border-orange-200 focus:ring-4 focus:ring-orange-50/50 outline-none transition-all"
                placeholder="Min. 8 characters"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Confirm Identity</label>
            <div className="relative group/input">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within/input:text-orange-500 transition-colors" size={20} strokeWidth={2.5} />
              <input 
                type="password" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-15 bg-gray-50/50 border border-gray-100 rounded-[22px] pl-16 pr-6 text-sm font-bold text-gray-900 placeholder-gray-300 focus:bg-white focus:border-orange-200 focus:ring-4 focus:ring-orange-50/50 outline-none transition-all"
                placeholder="Re-enter password"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-16 bg-orange-500 hover:bg-orange-600 text-white rounded-[24px] font-bold text-lg transition-all shadow-xl shadow-orange-100 flex items-center justify-center space-x-3 transform hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : (
              <span className="uppercase tracking-wider">Update Credentials</span>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-[#fcfcfd] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute inset-0 opacity-[0.4] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #e5e7eb 1px, transparent 0)', backgroundSize: '32px 32px' }} />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[500px] bg-orange-100/40 blur-[120px] rounded-full pointer-events-none" />
            
            <Suspense fallback={
                <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            }>
                <ResetPasswordContent />
            </Suspense>
        </div>
    );
}
