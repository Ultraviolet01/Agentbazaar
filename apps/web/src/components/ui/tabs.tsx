"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const TabsContext = React.createContext<{
  activeTab: string;
  setActiveTab: (id: string) => void;
}>({ activeTab: "", setActiveTab: () => {} });

const Tabs = ({ 
  defaultValue, 
  value, 
  onValueChange, 
  children, 
  className 
}: { 
  defaultValue?: string; 
  value?: string; 
  onValueChange?: (val: string) => void; 
  children: React.ReactNode; 
  className?: string;
}) => {
  const [activeTab, setActiveTabInternal] = React.useState(value || defaultValue || "");
  
  const currentTab = value !== undefined ? value : activeTab;
  const setTab = onValueChange || setActiveTabInternal;

  return (
    <TabsContext.Provider value={{ activeTab: currentTab, setActiveTab: setTab }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
};

const TabsList = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("flex p-1.5 bg-[#0a0b0d] rounded-2xl border border-white/5", className)}>
    {children}
  </div>
);

const TabsTrigger = ({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) => {
  const { activeTab, setActiveTab } = React.useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={cn(
        "relative flex-1 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest transition-colors duration-200 z-10",
        isActive ? "text-black" : "text-[#4b5563] hover:text-[#9ca3af]",
        className
      )}
    >
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-[#f5a623] rounded-xl z-[-1]"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      {children}
    </button>
  );
};

const TabsContent = ({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) => {
  const { activeTab } = React.useContext(TabsContext);
  
  return (
    <AnimatePresence mode="wait">
      {activeTab === value && (
        <motion.div
          key={value}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={cn("mt-6", className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
