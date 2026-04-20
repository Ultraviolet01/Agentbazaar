'use client';

import { motion } from "framer-motion";
import { FolderRoot, Plus, Zap, ArrowRight, Bell, Rocket, ExternalLink, Search, Database } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateProjectModal } from "@/components/CreateProjectModal";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const fetchProjects = () => {
    setLoading(true);
    api.get("/projects").then(res => {
        setProjects(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-6xl mx-auto space-y-12 pb-24 px-6 md:px-0 bg-transparent text-gray-900"
    >
      <CreateProjectModal 
        open={createModalOpen} 
        onOpenChange={setCreateModalOpen} 
        onSuccess={fetchProjects}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-10">
        <div className="space-y-4">
          <div className="flex items-center space-x-5 text-orange-500">
            <div className="w-16 h-16 rounded-[24px] bg-orange-100 flex items-center justify-center border border-orange-200 shadow-sm transition-all hover:scale-105">
              <FolderRoot size={32} strokeWidth={2.5} />
            </div>
            <div>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 tracking-tight uppercase leading-none">My Projects</h1>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-3">Operational Workspaces</p>
            </div>
          </div>
          <p className="text-gray-500 text-lg max-w-2xl leading-relaxed font-semibold">
            Centralize your 0G Network operations. Manage monitoring, audits, and content generation in dedicated project environments.
          </p>
        </div>
        <Button 
            onClick={() => setCreateModalOpen(true)}
            className="rounded-2xl h-14 px-10 bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg hover:shadow-xl transition-all"
        >
            <Plus size={22} className="mr-2.5" strokeWidth={3} />
            CREATE PROJECT
        </Button>
      </div>

      {/* Alert Banner */}
      <Card className="bg-orange-50/50 border border-orange-100 p-8 flex items-start space-x-6 relative overflow-hidden group rounded-[32px] shadow-sm">
         <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100/50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
         <div className="bg-orange-500 p-3.5 rounded-2xl shadow-lg shadow-orange-200 shrink-0">
           <Bell className="text-white" size={20} strokeWidth={3} />
         </div>
         <div className="text-[15px] leading-relaxed text-gray-600 font-medium relative z-10">
            <span className="text-orange-700 font-bold uppercase tracking-widest text-[10px] block mb-1">Infrastructure Note</span> 
            Protocol alerts use the <span className="text-gray-900 font-bold">0G modular data layer</span> for primary delivery. 
            Legacy email delivery is available as a secondary bridge. Configure your endpoints in{" "}
            <Link href="/settings" className="text-orange-600 font-bold hover:underline inline-flex items-center">
              Terminal Settings
              <ExternalLink size={14} className="ml-1.5" strokeWidth={2.5} />
            </Link>.
         </div>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3].map(i => <Skeleton key={i} className="h-64 rounded-[40px] bg-gray-100" />)}
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
                <Card key={project.id} className="p-10 space-y-8 hover:border-orange-200 group flex flex-col justify-between bg-white border-gray-100 shadow-sm hover:shadow-md transition-all rounded-[40px]">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-orange-50 group-hover:border-orange-100 transition-all shadow-sm">
                                <Database size={24} className="text-gray-400 group-hover:text-orange-500 transition-colors" strokeWidth={2.5} />
                            </div>
                            <span className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">ID: {project.id.slice(0, 6)}</span>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors leading-none">{project.name}</h3>
                            <p className="text-sm font-medium text-gray-400 line-clamp-2 leading-relaxed">{project.description || "No project description provided."}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                        <div className="flex -space-x-2.5">
                            {[1,2].map(i => (
                                <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center shadow-sm">
                                    <Zap size={12} className="text-orange-500" strokeWidth={3} />
                                </div>
                            ))}
                        </div>
                        <Button variant="ghost" size="sm" className="rounded-full text-[11px] font-bold uppercase tracking-widest group/btn hover:bg-orange-50 hover:text-orange-600 transition-all">
                            Open Terminal <ArrowRight size={14} className="ml-2 group-hover/btn:translate-x-1.5 transition-transform" strokeWidth={3} />
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
      ) : (
        <Card className="bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[48px] p-24 shadow-inner">
            <EmptyState 
                icon={Rocket}
                title="Workspace Empty"
                description="Initialize your first project to start connecting autonomous monitoring and agent intelligence."
                actionLabel="INITIALIZE PROJECT"
                onAction={() => setCreateModalOpen(true)}
            />
        </Card>
      )}
    </motion.div>
  );
}
