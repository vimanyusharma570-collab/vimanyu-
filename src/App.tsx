import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Cpu, 
  Database as DbIcon, 
  Globe, 
  Layers, 
  Terminal, 
  Zap, 
  ShieldCheck, 
  RefreshCw,
  Send,
  ChevronRight,
  AlertCircle,
  BarChart3,
  GitBranch
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

// Types
interface Log {
  id: number;
  component: string;
  message: string;
  level: string;
  timestamp: string;
}

interface AIInteraction {
  id: number;
  prompt: string;
  response: string;
  tokens: number;
  timestamp: string;
}

interface SystemStatus {
  status: string;
  uptime: number;
  components: Record<string, string>;
}

export default function App() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [aiHistory, setAiHistory] = useState<AIInteraction[]>([]);
  const [prompt, setPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ai' | 'logs'>('dashboard');

  const logEndRef = useRef<HTMLDivElement>(null);

  // Initialize Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  const fetchData = async () => {
    try {
      const [statusRes, logsRes, historyRes] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/logs'),
        fetch('/api/ai/history')
      ]);
      
      if (statusRes.ok) setStatus(await statusRes.json());
      if (logsRes.ok) setLogs(await logsRes.json());
      if (historyRes.ok) setAiHistory(await historyRes.json());
    } catch (error) {
      console.error('Failed to fetch system data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const addLog = async (component: string, message: string, level: string = 'info') => {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ component, message, level })
      });
      fetchData();
    } catch (e) {
      console.error('Failed to add log', e);
    }
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isProcessing) return;

    setIsProcessing(true);
    setAiResponse('');
    addLog('AI Processing Layer', `Processing request: "${prompt.substring(0, 30)}..."`, 'info');

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const text = response.text || "No response generated.";
      setAiResponse(text);
      
      // Record interaction
      await fetch('/api/ai/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt, 
          response: text, 
          tokens: Math.ceil(text.length / 4) // Mock token count
        })
      });

      addLog('AI Processing Layer', 'Response generated successfully', 'success');
      setPrompt('');
      fetchData();
    } catch (error) {
      console.error('AI Error:', error);
      setAiResponse('Error processing request.');
      addLog('AI Processing Layer', `Error: ${error instanceof Error ? error.message : 'Unknown'}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E4E4E7] font-sans selection:bg-emerald-500/30">
      {/* Sidebar / Navigation */}
      <div className="fixed left-0 top-0 bottom-0 w-16 md:w-64 bg-[#121214] border-r border-white/5 flex flex-col z-50">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            <Layers className="text-black w-5 h-5" />
          </div>
          <span className="hidden md:block font-bold tracking-tight text-lg">NEXUS <span className="text-emerald-500">AI</span></span>
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-4">
          <NavItem 
            icon={<Activity size={20} />} 
            label="System Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<Cpu size={20} />} 
            label="AI Processor" 
            active={activeTab === 'ai'} 
            onClick={() => setActiveTab('ai')} 
          />
          <NavItem 
            icon={<Terminal size={20} />} 
            label="System Logs" 
            active={activeTab === 'logs'} 
            onClick={() => setActiveTab('logs')} 
          />
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 py-3 rounded-xl bg-white/5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-emerald-500/80 uppercase tracking-widest">System Online</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="ml-16 md:ml-64 p-4 md:p-8">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Architecture Overview</h1>
            <p className="text-zinc-500 text-sm">Monitoring Agentic AI & Google Cloud Infrastructure</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchData}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
            >
              <RefreshCw size={18} className={isProcessing ? 'animate-spin' : ''} />
            </button>
            <div className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-mono">
              UPTIME: {status ? Math.floor(status.uptime / 60) : 0}m {status ? Math.floor(status.uptime % 60) : 0}s
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Architecture Components Grid */}
              <ComponentCard 
                title="API Gateway" 
                status={status?.components.gateway || 'unknown'} 
                icon={<Globe className="text-blue-400" />}
                description="Traffic routing and security layer"
                metric="99.9% Uptime"
              />
              <ComponentCard 
                title="AI Processing Layer" 
                status={status?.components.ai_layer || 'unknown'} 
                icon={<Cpu className="text-purple-400" />}
                description="Gemini 3.1 Pro Agentic Core"
                metric="Active Session"
              />
              <ComponentCard 
                title="Data Storage Layer" 
                status={status?.components.storage || 'unknown'} 
                icon={<DbIcon className="text-amber-400" />}
                description="SQLite Persistence Engine"
                metric="Healthy"
              />
              <ComponentCard 
                title="MLOps Pipeline" 
                status={status?.components.mlops || 'unknown'} 
                icon={<BarChart3 className="text-emerald-400" />}
                description="Vertex AI Continuous Training"
                metric="Idle"
              />
              <ComponentCard 
                title="DevOps Pipeline" 
                status={status?.components.devops || 'unknown'} 
                icon={<GitBranch className="text-rose-400" />}
                description="Cloud Run Deployment"
                metric="v1.0.4-stable"
              />
              <ComponentCard 
                title="Security Layer" 
                status="active" 
                icon={<ShieldCheck className="text-cyan-400" />}
                description="IAM & OAuth Integration"
                metric="Encrypted"
              />

              {/* Recent Activity Mini-Log */}
              <div className="md:col-span-3 bg-[#121214] border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold flex items-center gap-2">
                    <Terminal size={18} className="text-emerald-500" />
                    Live System Stream
                  </h3>
                  <button onClick={() => setActiveTab('logs')} className="text-xs text-zinc-500 hover:text-white transition-colors">View All Logs</button>
                </div>
                <div className="space-y-3 font-mono text-xs">
                  {logs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-start gap-4 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                      <span className="text-zinc-600 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                      <span className={`px-2 py-0.5 rounded uppercase text-[10px] font-bold shrink-0 ${
                        log.level === 'error' ? 'bg-rose-500/20 text-rose-500' : 
                        log.level === 'success' ? 'bg-emerald-500/20 text-emerald-500' : 
                        'bg-blue-500/20 text-blue-500'
                      }`}>
                        {log.component}
                      </span>
                      <span className="text-zinc-400">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'ai' && (
            <motion.div 
              key="ai"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]"
            >
              {/* AI Interaction Console */}
              <div className="lg:col-span-2 flex flex-col bg-[#121214] border border-white/5 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu size={18} className="text-purple-400" />
                    <span className="font-bold text-sm">Agentic AI Console</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Model: Gemini 3.1 Pro</span>
                  </div>
                </div>
                
                <div className="flex-1 p-6 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-white/10">
                  {aiResponse ? (
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl max-w-[80%] text-sm">
                          {aiHistory[0]?.prompt}
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl max-w-[90%] text-sm leading-relaxed whitespace-pre-wrap">
                          {aiResponse}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4">
                      <Zap size={48} className="opacity-20" />
                      <p className="text-sm">Enter a prompt to interface with the AI Processing Layer</p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-white/[0.02] border-t border-white/5">
                  <form onSubmit={handleAiSubmit} className="relative">
                    <input 
                      type="text" 
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Send command to AI layer..."
                      disabled={isProcessing}
                      className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl py-4 pl-6 pr-14 text-sm focus:outline-none focus:border-emerald-500/50 transition-all disabled:opacity-50"
                    />
                    <button 
                      type="submit"
                      disabled={isProcessing || !prompt.trim()}
                      className="absolute right-2 top-2 bottom-2 w-10 bg-emerald-500 text-black rounded-lg flex items-center justify-center hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:hover:bg-emerald-500"
                    >
                      {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                  </form>
                </div>
              </div>

              {/* History Sidebar */}
              <div className="bg-[#121214] border border-white/5 rounded-2xl p-6 flex flex-col">
                <h3 className="font-bold text-sm mb-6 flex items-center gap-2">
                  <Activity size={16} className="text-zinc-500" />
                  Interaction History
                </h3>
                <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                  {aiHistory.map((item) => (
                    <div key={item.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all cursor-pointer group">
                      <p className="text-xs text-zinc-400 line-clamp-2 mb-2 group-hover:text-zinc-200 transition-colors">{item.prompt}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-600 font-mono">{new Date(item.timestamp).toLocaleTimeString()}</span>
                        <span className="text-[10px] text-emerald-500/60 font-mono">{item.tokens} tokens</span>
                      </div>
                    </div>
                  ))}
                  {aiHistory.length === 0 && (
                    <div className="text-center py-12 text-zinc-600 text-xs">No history recorded</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'logs' && (
            <motion.div 
              key="logs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[#121214] border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-12rem)]"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <Terminal size={20} className="text-emerald-500" />
                  <h2 className="font-bold">System Event Stream</h2>
                </div>
                <div className="flex gap-2">
                  <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase">Live</div>
                  <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-[10px] font-bold uppercase">{logs.length} Total Events</div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-2 font-mono text-xs scrollbar-thin scrollbar-thumb-white/10">
                <div className="grid grid-cols-12 gap-4 text-zinc-500 pb-4 border-b border-white/5 mb-4 uppercase tracking-widest text-[10px] font-bold">
                  <div className="col-span-2">Timestamp</div>
                  <div className="col-span-2">Component</div>
                  <div className="col-span-1">Level</div>
                  <div className="col-span-7">Message</div>
                </div>
                {logs.map((log) => (
                  <div key={log.id} className="grid grid-cols-12 gap-4 py-2 border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors group">
                    <div className="col-span-2 text-zinc-600">{new Date(log.timestamp).toLocaleString()}</div>
                    <div className="col-span-2">
                      <span className="px-2 py-0.5 rounded bg-white/5 text-zinc-300 text-[10px]">{log.component}</span>
                    </div>
                    <div className="col-span-1">
                      <span className={`uppercase font-bold text-[10px] ${
                        log.level === 'error' ? 'text-rose-500' : 
                        log.level === 'success' ? 'text-emerald-500' : 
                        'text-blue-500'
                      }`}>
                        {log.level}
                      </span>
                    </div>
                    <div className="col-span-7 text-zinc-400 group-hover:text-zinc-200 transition-colors">{log.message}</div>
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
        active 
          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
          : 'text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent'
      }`}
    >
      <div className={`${active ? 'text-emerald-500' : 'text-zinc-500 group-hover:text-white'} transition-colors`}>
        {icon}
      </div>
      <span className="hidden md:block text-sm font-medium">{label}</span>
      {active && <div className="hidden md:block ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />}
    </button>
  );
}

function ComponentCard({ title, status, icon, description, metric }: { title: string, status: string, icon: React.ReactNode, description: string, metric: string }) {
  const isHealthy = status === 'active' || status === 'healthy' || status === 'operational' || status === 'connected' || status === 'deployed';
  const isWarning = status === 'idle';
  
  return (
    <div className="bg-[#121214] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors">
          {icon}
        </div>
        <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
          isHealthy ? 'bg-emerald-500/10 text-emerald-500' : 
          isWarning ? 'bg-amber-500/10 text-amber-500' : 
          'bg-rose-500/10 text-rose-500'
        }`}>
          {status}
        </div>
      </div>
      <h3 className="font-bold mb-1">{title}</h3>
      <p className="text-xs text-zinc-500 mb-4 line-clamp-1">{description}</p>
      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
        <span className="text-[10px] text-zinc-600 uppercase font-mono">Metric</span>
        <span className="text-[10px] text-zinc-300 font-mono">{metric}</span>
      </div>
    </div>
  );
}
