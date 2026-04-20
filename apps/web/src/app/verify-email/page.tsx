"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found.");
      return;
    }

    const verify = async () => {
      try {
        const { data } = await api.get(`/auth/verify?token=${token}`);
        setStatus("success");
        setMessage(data.message);
        // Redirect to login after 3 seconds
        setTimeout(() => router.push("/login"), 3000);
      } catch (err: any) {
        setStatus("error");
        setMessage(err.response?.data?.error || "Verification failed. The token may be invalid or expired.");
      }
    };

    verify();
  }, [token, router]);

  return (
    <div className="max-w-md w-full bg-white p-12 rounded-[48px] border border-gray-100/80 shadow-[0_20px_60px_rgba(0,0,0,0.04)] text-center backdrop-blur-sm relative z-10 transition-all duration-500">
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50/40 blur-[100px] rounded-full pointer-events-none" />
      
      {status === "loading" && (
        <div className="space-y-8 relative z-10 py-4">
          <div className="w-20 h-20 rounded-[28px] bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto shadow-sm">
            <Loader2 className="animate-spin text-orange-500" size={40} strokeWidth={2.5} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight uppercase leading-none">Verifying</h1>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em]">Identity Protocol</p>
          </div>
          <p className="text-gray-500 font-semibold text-sm">Please wait while we activate your terminal access.</p>
        </div>
      )}

      {status === "success" && (
        <div className="space-y-8 relative z-10 py-4 scale-in-center">
          <div className="w-24 h-24 rounded-[32px] bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="text-emerald-500" size={56} strokeWidth={2.5} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight uppercase leading-none">Verified</h1>
            <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-[0.3em]">Terminal Active</p>
          </div>
          <p className="text-gray-500 font-semibold text-[15px] leading-relaxed px-4">{message}</p>
          
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-center space-x-2">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" />
            </div>
            <Link href="/login" className="w-full bg-orange-500 hover:bg-orange-600 text-white px-10 py-5 rounded-[24px] font-bold text-lg inline-block transform transition-all hover:-translate-y-1 shadow-xl shadow-orange-100 uppercase tracking-wider">
                Proceed to Login
            </Link>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-8 relative z-10 py-4">
          <div className="w-24 h-24 rounded-[32px] bg-red-50 border border-red-100 flex items-center justify-center mx-auto shadow-sm">
            <XCircle className="text-red-500" size={56} strokeWidth={2.5} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight uppercase leading-none">Error</h1>
            <p className="text-[11px] font-bold text-red-500 uppercase tracking-[0.3em]">Protocol Fault</p>
          </div>
          <p className="text-gray-500 font-semibold text-[15px] leading-relaxed px-4">{message}</p>
          <div className="pt-6">
            <Link href="/register" className="inline-block text-[11px] font-bold text-orange-500 hover:text-orange-600 transition-colors uppercase tracking-widest border-b border-orange-200">Try Registering Again</Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#fcfcfd] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute inset-0 opacity-[0.4] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #e5e7eb 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[500px] bg-orange-100/40 blur-[130px] rounded-full pointer-events-none" />
        
        <Suspense fallback={
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        }>
            <VerifyEmailContent />
        </Suspense>
    </div>
  );
}
