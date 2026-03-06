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
  version: string;
  uptime: number;
  components: Record<string, string>;
  metrics: {
    cpu_usage: string;
    memory_usage: string;
    active_agents: number;
    anomalies_detected: number;
    model_latency: string;
    neural_sync?: string;
  };
}

interface ArchitectureDesign {
  version: string;
  design: {
    components: Array<{ name: string; service: string; description: string }>;
    data_flow: string;
    mlops_pipeline: string[];
    devops_pipeline: string[];
    ai_lifecycle: string[];
    agentic_loop: string[];
    folder_structure: string[];
    future_v5: string[];
  };
}

export default function App() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [aiHistory, setAiHistory] = useState<AIInteraction[]>([]);
  const [archDesign, setArchDesign] = useState<ArchitectureDesign | null>(null);
  const [prompt, setPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ai' | 'logs' | 'architecture'>('dashboard');

  const logEndRef = useRef<HTMLDivElement>(null);

  // Initialize Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  const fetchData = async () => {
    try {
      const [statusRes, logsRes, historyRes, archRes] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/logs'),
        fetch('/api/ai/history'),
        fetch('/api/architecture')
      ]);
      
      if (statusRes.ok) setStatus(await statusRes.json());
      if (logsRes.ok) setLogs(await logsRes.json());
      if (historyRes.ok) setAiHistory(await historyRes.json());
      if (archRes.ok) setArchDesign(await archRes.json());
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
          <div className="hidden md:block">
            <span className="font-bold tracking-tight text-lg block leading-none">NEXUS <span className="text-emerald-500">AI</span></span>
            <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Version 4.1</span>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-4">
          <NavItem 
            icon={<Activity size={20} />} 
            label="System Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<ShieldCheck size={20} />} 
            label="Architecture Design" 
            active={activeTab === 'architecture'} 
            onClick={() => setActiveTab('architecture')} 
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
            <h1 className="text-3xl font-bold tracking-tight mb-1">Nexus AI Platform v4.1</h1>
            <p className="text-zinc-500 text-sm">Neural Core Integration & Autonomous Agentic Control</p>
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
              className="space-y-6"
            >
              {/* Metrics Bar */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <MetricCard label="CPU Usage" value={status?.metrics.cpu_usage || '0%'} icon={<Activity size={14} />} />
                <MetricCard label="Memory" value={status?.metrics.memory_usage || '0GB'} icon={<DbIcon size={14} />} />
                <MetricCard label="Active Agents" value={status?.metrics.active_agents.toString() || '0'} icon={<Cpu size={14} />} />
                <MetricCard label="Anomalies" value={status?.metrics.anomalies_detected.toString() || '0'} icon={<AlertCircle size={14} />} color="text-emerald-500" />
                <MetricCard label="AI Latency" value={status?.metrics.model_latency || '0ms'} icon={<Zap size={14} />} />
                <MetricCard label="Neural Sync" value={status?.metrics.neural_sync || '0%'} icon={<Layers size={14} />} color="text-purple-500" />
              </div>

              {/* Architecture Components Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ComponentCard 
                  title="Neural Core Engine" 
                  status={status?.components.neural_core || 'unknown'} 
                  icon={<Zap className="text-purple-500" />}
                  description="Real-time neural synchronization"
                  metric="Sync: 99.9%"
                />
                <ComponentCard 
                  title="AIOps Engine" 
                  status={status?.components.aiops || 'unknown'} 
                  icon={<ShieldCheck className="text-cyan-400" />}
                  description="Real-time monitoring & self-healing"
                  metric="Auto-remediation active"
                />
                <ComponentCard 
                  title="Vertex AI Core" 
                  status={status?.components.vertex_ai || 'unknown'} 
                  icon={<Cpu className="text-purple-400" />}
                  description="Transformer-based model serving"
                  metric="Gemini 3.1 Pro"
                />
                <ComponentCard 
                  title="GKE Cluster" 
                  status={status?.components.gke || 'unknown'} 
                  icon={<Globe className="text-blue-400" />}
                  description="Scalable cloud-native microservices"
                  metric="16 Nodes / 64 Pods"
                />
                <ComponentCard 
                  title="MLOps Pipeline" 
                  status={status?.components.mlops || 'unknown'} 
                  icon={<BarChart3 className="text-emerald-400" />}
                  description="Continuous training & evaluation"
                  metric="Pipeline v4.5"
                />
                <ComponentCard 
                  title="DevOps CI/CD" 
                  status={status?.components.devops || 'unknown'} 
                  icon={<GitBranch className="text-rose-400" />}
                  description="Automated GKE deployment"
                  metric="Build #912 Success"
                />
              </div>

              {/* Agentic AI Decision Loop Visualization */}
              <div className="bg-[#121214] border border-white/5 rounded-2xl p-6">
                <h3 className="font-bold flex items-center gap-2 mb-8">
                  <Zap size={18} className="text-amber-500" />
                  Agentic AI Decision Loop
                </h3>
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative">
                  <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2 -z-10" />
                  <LoopStep icon={<Activity />} label="Monitor" description="Ingest logs & telemetry" />
                  <ChevronRight className="hidden md:block text-zinc-700" />
                  <LoopStep icon={<BarChart3 />} label="Analyze" description="Transformer-based anomaly detection" />
                  <ChevronRight className="hidden md:block text-zinc-700" />
                  <LoopStep icon={<Cpu />} label="Plan" description="Agentic AI reasoning" />
                  <ChevronRight className="hidden md:block text-zinc-700" />
                  <LoopStep icon={<Zap />} label="Act" description="Autonomous self-healing action" />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'architecture' && (
            <motion.div 
              key="architecture"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <div className="space-y-8">
                <section>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Layers size={20} className="text-emerald-500" />
                    System Architecture Components
                  </h2>
                  <div className="space-y-4">
                    {archDesign?.design.components.map((c, i) => (
                      <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-emerald-400">{c.name}</h4>
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">{c.service}</span>
                        </div>
                        <p className="text-sm text-zinc-400">{c.description}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <RefreshCw size={20} className="text-blue-500" />
                    Data Flow & Microservices
                  </h2>
                  <div className="p-6 rounded-xl bg-white/5 border border-white/10 font-mono text-xs leading-relaxed text-zinc-300">
                    {archDesign?.design.data_flow}
                  </div>
                </section>
              </div>

              <div className="space-y-8">
                <section>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <BarChart3 size={20} className="text-purple-500" />
                    MLOps Pipeline (Vertex AI)
                  </h2>
                  <div className="space-y-2">
                    {archDesign?.design.mlops_pipeline.map((step, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center text-[10px] font-bold">{i+1}</div>
                        <span className="text-sm">{step}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Activity size={20} className="text-emerald-500" />
                    AI/ML Model Lifecycle
                  </h2>
                  <div className="space-y-2">
                    {archDesign?.design.ai_lifecycle.map((step, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-sm text-zinc-300">{step}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Zap size={20} className="text-amber-500" />
                    Agentic AI Decision Loop
                  </h2>
                  <div className="space-y-2">
                    {archDesign?.design.agentic_loop.map((step, i) => (
                      <div key={i} className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-sm text-amber-200/70">
                        {step}
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <GitBranch size={20} className="text-rose-500" />
                    DevOps CI/CD Pipeline
                  </h2>
                  <div className="space-y-2">
                    {archDesign?.design.devops_pipeline.map((step, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center text-[10px] font-bold">{i+1}</div>
                        <span className="text-sm">{step}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                  <h3 className="font-bold mb-4 text-emerald-500">Security & Scalability</h3>
                  <ul className="text-sm text-zinc-400 space-y-2 list-disc list-inside">
                    <li>IAM-based granular access control for all GCP services.</li>
                    <li>VPC Service Controls for data exfiltration prevention.</li>
                    <li>Horizontal Pod Autoscaling (HPA) in GKE based on custom AI metrics.</li>
                    <li>Global Load Balancing with Cloud Armor for DDoS protection.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Terminal size={20} className="text-amber-500" />
                    GitHub Repository Structure
                  </h2>
                  <div className="space-y-2">
                    {archDesign?.design.folder_structure.map((item, i) => (
                      <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10 font-mono text-xs text-zinc-400">
                        {item}
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Zap size={20} className="text-cyan-500" />
                    Future Roadmap (v5.0)
                  </h2>
                  <div className="space-y-2">
                    {archDesign?.design.future_v5.map((item, i) => (
                      <div key={i} className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10 text-sm text-cyan-200/70">
                        {item}
                      </div>
                    ))}
                  </div>
                </section>
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

function MetricCard({ label, value, icon, color = "text-zinc-400" }: { label: string, value: string, icon: React.ReactNode, color?: string }) {
  return (
    <div className="bg-[#121214] border border-white/5 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={color}>{icon}</div>
        <span className="text-[10px] text-zinc-500 uppercase font-mono">{label}</span>
      </div>
      <div className="text-xl font-bold tracking-tight">{value}</div>
    </div>
  );
}

function LoopStep({ icon, label, description }: { icon: React.ReactNode, label: string, description: string }) {
  return (
    <div className="flex flex-col items-center text-center space-y-3 z-10 bg-[#121214] p-4 rounded-2xl border border-white/5 w-full md:w-48">
      <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-sm">{label}</h4>
        <p className="text-[10px] text-zinc-500 mt-1">{description}</p>
      </div>
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
