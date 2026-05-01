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
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [projectsRes, agentsRes] = await Promise.all([
        api.get("/projects"),
        api.get("/agents/my")
      ]);
      
      setProjects(projectsRes.data);
      if (Array.isArray(agentsRes.data)) {
        setAgents(agentsRes.data);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
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
        onSuccess={fetchAllData}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-10">
        <div className="space-y-4">
          <div className="flex items-center space-x-5 text-orange-500">
            <div className="w-16 h-16 rounded-[24px] bg-orange-100 flex items-center justify-center border border-orange-200 shadow-sm transition-all hover:scale-105">
              <FolderRoot size={32} strokeWidth={2.5} />
            </div>
            <div>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 tracking-tight uppercase leading-none">My Console</h1>
                <p className="text-[11px] font-bold text-gray-600 uppercase tracking-[0.3em] mt-3">Projects & Deployed Agents</p>
            </div>
          </div>
          <p className="text-gray-700 text-lg max-w-2xl leading-relaxed font-semibold">
            Manage your TEE-verified autonomous agents in a single command center.
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

      {/* Deployed Agents Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Rocket className="w-6 h-6 text-orange-600" />
            <h2 className="text-2xl font-bold text-gray-900">Deployed TEE Agents</h2>
          </div>
          <Link href="/deploy">
            <Button variant="outline" size="sm" className="rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50 font-bold">
              <Plus className="w-4 h-4 mr-1" />
              DEPLOY NEW
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2].map(i => <Skeleton key={i} className="h-48 rounded-[32px] bg-gray-100" />)}
          </div>
        ) : agents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <Link key={agent.id} href={`/agents/deployed/${agent.slug}`}>
                <Card className="p-6 hover:border-orange-300 group transition-all rounded-[32px] bg-white border-gray-100 shadow-sm relative overflow-hidden h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
                        style={{ backgroundColor: (agent.color || '#f97316') + '15' }}
                      >
                        {agent.icon || '🤖'}
                      </div>
                      {agent.status === 'pending' ? (
                        <span className="px-3 py-1 bg-yellow-50 text-yellow-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-yellow-100 flex items-center gap-1">
                          <Zap size={10} className="animate-pulse" />
                          In Review
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-green-100">
                          Live
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">{agent.name}</h3>
                    <p className="text-sm text-gray-700 line-clamp-2">{agent.description}</p>
                  </div>
                  
                  <div className="mt-6 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-600">
                    <span>{agent.category}</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform text-orange-500" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-12 border-2 border-dashed border-gray-100 rounded-[32px] flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
              <Rocket className="w-8 h-8 text-gray-300" />
            </div>
            <div>
              <p className="text-gray-900 font-bold">No Agents Deployed</p>
              <p className="text-sm text-gray-700">Deploy your first TEE-verified agent to start earning.</p>
            </div>
            <Link href="/deploy">
              <Button size="sm" className="rounded-xl bg-orange-500 hover:bg-orange-600 font-bold shadow-md">
                GET STARTED
              </Button>
            </Link>
          </Card>
        )}
      </div>


    </motion.div>
  );
}
