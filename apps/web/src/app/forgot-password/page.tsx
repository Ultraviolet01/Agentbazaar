"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, Mail, AlertCircle, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/forgot-password", { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-[0.4] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #e5e7eb 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[500px] bg-orange-100/40 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-50/50 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full space-y-10 bg-white p-12 rounded-[48px] border border-gray-100/80 shadow-[0_20px_60px_rgba(0,0,0,0.04)] relative z-10 backdrop-blur-sm">
        <div className="text-center space-y-5">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[28px] bg-orange-50 border border-orange-100 mb-2 relative transition-all duration-500 shadow-sm">
            <KeyRound className="text-orange-500" size={36} strokeWidth={2.5} />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight uppercase leading-none">Reset Access</h1>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em]">Protocol Recovery</p>
          </div>
        </div>

        {success ? (
          <div className="space-y-8 text-center animate-in fade-in zoom-in duration-500">
             <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[32px] text-emerald-600 shadow-sm">
                <CheckCircle2 className="mx-auto mb-4 text-emerald-500" size={48} strokeWidth={2.5} />
                <p className="font-bold leading-relaxed text-lg">
                  Reset link sent!
                </p>
                <p className="text-sm font-semibold text-emerald-600/70 mt-2">Please check your inbox for instructions.</p>
             </div>
             <Link href="/login" className="inline-flex items-center space-x-3 text-gray-400 hover:text-orange-500 transition-all font-bold text-[11px] uppercase tracking-widest group">
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" strokeWidth={2.5} />
                <span>Back to Login</span>
             </Link>
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
              <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Work Email</label>
              <div className="relative group/input">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within/input:text-orange-500 transition-colors" size={20} strokeWidth={2.5} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-15 bg-gray-50/50 border border-gray-100 rounded-[22px] pl-16 pr-6 text-sm font-bold text-gray-900 placeholder-gray-300 focus:bg-white focus:border-orange-200 focus:ring-4 focus:ring-orange-50/50 outline-none transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-16 bg-orange-500 hover:bg-orange-600 text-white rounded-[24px] font-bold text-lg transition-all shadow-xl shadow-orange-100 flex items-center justify-center space-x-3 transform hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : (
                <span className="uppercase tracking-wider">Send Reset Link</span>
              )}
            </button>

            <div className="text-center pt-2">
                 <Link href="/login" className="text-[11px] font-bold text-gray-400 hover:text-orange-500 uppercase tracking-widest transition-colors">Return to Session</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
