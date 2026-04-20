"use client";

import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-6"
    >
      <div className="w-24 h-24 rounded-[32px] bg-white/[0.02] border border-white/5 flex items-center justify-center relative group">
          <div className="absolute inset-0 bg-[#f5a623]/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          <Icon size={48} className="text-[#4b5563] group-hover:text-[#f5a623] transition-colors" />
      </div>
      
      <div className="space-y-2 max-w-sm">
        <h3 className="text-xl font-black text-white">{title}</h3>
        <p className="text-sm font-bold text-[#4b5563] leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <Button onClick={onAction} className="rounded-2xl px-8 h-12">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
