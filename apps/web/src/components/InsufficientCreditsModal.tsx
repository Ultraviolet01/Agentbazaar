"use client";

import { AlertCircle, Wallet, ShoppingCart, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function InsufficientCreditsModal({ 
  open, 
  onOpenChange, 
  requiredCredits 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  requiredCredits?: number;
}) {
  const router = useRouter();

  const handleBuy = () => {
    onOpenChange(false);
    router.push("/wallet");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border-none shadow-[0_20px_60px_rgba(0,0,0,0.1)] p-12 rounded-[48px] overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-48 h-48 bg-red-50/50 blur-[80px] rounded-full pointer-events-none" />
        
        <DialogHeader className="relative z-10">
            <div className="flex items-center space-x-2 text-red-500 mb-4">
                <AlertCircle size={22} strokeWidth={3} />
                <span className="text-[11px] font-bold uppercase tracking-[0.3em]">Operational Fault</span>
            </div>
          <DialogTitle className="text-3xl font-bold text-gray-900 tracking-tight uppercase leading-none mb-2">Insufficient Credits</DialogTitle>
          <DialogDescription className="text-base font-semibold text-gray-500 normal-case leading-relaxed">
            Your terminal balance is too low to execute this agent protocol. 
            {requiredCredits && (
                <span className="block mt-1 text-red-500 font-bold">Requires at least {requiredCredits} CRD.</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-10 my-8 flex flex-col items-center justify-center space-y-5 bg-red-50 border border-red-100 rounded-[36px] shadow-inner relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-20 h-20 rounded-[28px] bg-white border border-red-100 flex items-center justify-center text-red-500 shadow-sm relative z-10 transition-transform group-hover:scale-110">
                <Wallet size={36} strokeWidth={2} />
            </div>
            <div className="text-center relative z-10 space-y-1">
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-[0.2em]">Protocol Stalled</p>
                <p className="text-2xl font-bold text-gray-900 tracking-tight uppercase">Registry Empty</p>
            </div>
        </div>

        <DialogFooter className="sm:justify-center flex flex-col gap-4 relative z-10">
          <Button 
            onClick={handleBuy}
            className="w-full h-16 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-[24px] text-lg shadow-xl shadow-orange-100 uppercase tracking-wider transition-all transform hover:-translate-y-1 active:scale-[0.98]"
          >
            <ShoppingCart size={20} className="mr-3" strokeWidth={2.5} />
            Top Up Registry
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="w-full h-12 text-gray-400 font-bold hover:text-gray-900 uppercase tracking-widest text-[11px] transition-colors"
          >
            Cancel Initialization
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
