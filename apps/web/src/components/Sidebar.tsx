"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutGrid, 
  Cpu, 
  FolderOpen, 
  History,
  Wallet,
  Settings,
  Plus,
  LogOut,
  Network,
  Rocket
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AgentSelectionModal } from "./AgentSelectionModal";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, signOut } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  const navItems = [
    { 
      label: 'Marketplace', 
      href: '/', 
      icon: LayoutGrid,
      description: 'Agent Market'
    },
    { 
      label: 'Agents', 
      href: '/agents', 
      icon: Cpu,
      description: 'Official Registry'
    },
    { 
      label: 'My Projects', 
      href: '/projects', 
      icon: FolderOpen,
      description: 'Active Projects'
    }
  ];

  const accountItems = [
    { label: 'Wallet', href: '/wallet', icon: Wallet },
    { label: 'Settings', href: '/settings', icon: Settings }
  ];

  return (
    <>
      <AgentSelectionModal open={modalOpen} onOpenChange={setModalOpen} />
      
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 z-40 transition-all">
        
        {/* Logo */}
        <div className="p-5 border-b border-gray-200">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md transition-all group-hover:rotate-6">
               <Network className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-none">AgentBazaar</h1>
              <p className="text-[10px] font-bold text-orange-600 tracking-widest uppercase mt-1">0G MAINNET</p>
            </div>
          </Link>
        </div>

        {/* Run Agent Button - only show when authenticated */}
        {user && (
          <div className="p-4">
            <Button 
              variant="primary"
              onClick={() => setModalOpen(true)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" strokeWidth={3} />
              RUN AGENT
            </Button>
          </div>
        )}

        {/* Navigation - only show when authenticated */}
        {user && (
          <nav className="flex-1 px-3 py-4 space-y-8 overflow-y-auto custom-scrollbar">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase px-3 mb-3 block tracking-[0.15em]">
                Global Console
              </span>
              <div className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    
                    return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                              isActive 
                              ? "bg-orange-50 text-orange-600 font-bold" 
                              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          )}
                        >
                          <Icon className={cn("w-4 h-4", isActive ? "text-orange-600" : "text-gray-400")} strokeWidth={isActive ? 2.5 : 2} />
                          <span className="text-sm tracking-tight">{item.label}</span>
                        </Link>
                    );
                  })}
              </div>

              {/* NEW: Deploy Agent Button */}
              <div className="pt-2">
                <Link 
                  href="/deploy"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 bg-orange-500 text-white hover:bg-orange-600 rounded-lg font-bold transition-all shadow-sm",
                    pathname === '/deploy' && "ring-2 ring-orange-200 ring-offset-1"
                  )}
                >
                  <Rocket className="w-4 h-4 text-white" strokeWidth={2.5} />
                  <span className="text-sm tracking-tight">Deploy Agent</span>
                </Link>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase px-3 mb-3 block tracking-[0.15em]">
                Management
              </span>
              <div className="space-y-1">
                  {accountItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    
                    return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                              isActive 
                              ? "bg-orange-50 text-orange-600 font-bold" 
                              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          )}
                        >
                          <Icon className={cn("w-4 h-4", isActive ? "text-orange-600" : "text-gray-400")} strokeWidth={isActive ? 2.5 : 2} />
                          <span className="text-sm tracking-tight">{item.label}</span>
                        </Link>
                    );
                  })}
              </div>
            </div>
          </nav>
        )}

        {/* Spacer for guest view to maintain logo and status positioning */}
        {!user && <div className="flex-1" />}

        {/* Bottom - User Profile / Auth Toggle */}
        <div className="p-4 border-t border-gray-200 mt-auto">
          {user ? (
            <div className="space-y-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {user.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.username}
                  </p>
                  <p className="text-[10px] font-medium text-gray-500 lowercase">
                    {user.credits} CRD
                  </p>
                </div>
              </div>
              <Button 
                variant="secondary"
                onClick={signOut}
                className="w-full h-8 text-[10px] font-bold uppercase tracking-widest bg-gray-50 border-gray-100 hover:bg-gray-100"
              >
                <LogOut className="w-3 h-3 mr-1.5" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Button asChild variant="secondary" className="h-8 rounded-lg text-[10px] font-bold border-gray-100 hover:bg-gray-50 text-gray-900 uppercase tracking-tight">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild variant="primary" className="h-8 rounded-lg text-[10px] font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-sm uppercase tracking-tight">
                <Link href="/register">Join</Link>
              </Button>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-gray-600 font-medium">0G Mainnet Live</span>
          </div>
        </div>
      </aside>
    </>
  );
}
