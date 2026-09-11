import { useEffect, useRef, useState } from 'react';
import { SimulationEngine } from './simulation/Engine';
import { SpeciesRecord } from './types';
import CanvasRenderer from './components/CanvasRenderer';
import Inspector from './components/Inspector';
import LeftSidebar from './components/LeftSidebar';
import { DashboardPanels } from './components/BottomPanels';
import { Play, Pause, Settings, Save, MoreVertical } from 'lucide-react';
import Minimap from './components/Minimap';
import { SettingsView, CreaturesView, SpeciesView } from './components/Views';

export default function App() {
  const [, setEngineKey] = useState(0);
  const engineRef = useRef<SimulationEngine | null>(null);
  const cameraRef = useRef({ x: 800, y: 500, zoom: 1 });
  const [activeTab, setActiveTab] = useState('world');
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  
  if (!engineRef.current) {
    const saved = localStorage.getItem('ues_save');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        engineRef.current = new SimulationEngine(1600, 1000, parsed);
        engineRef.current.addEvent('Simulation loaded.', 'normal');
      } catch (e) {
        console.error('Failed to load save', e);
        engineRef.current = new SimulationEngine(1600, 1000);
      }
    } else {
        engineRef.current = new SimulationEngine(1600, 1000);
    }
  }
  
  const [, setTick] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSettingsOpen(false);
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let accumulator = 0;
    let lastRenderTick = engineRef.current ? engineRef.current.tickCount : 0;
    const TIME_STEP = 1000 / 60; 

    const loop = (currentTime: number) => {
      if (!paused && engineRef.current) {
        let frameTime = currentTime - lastTime;
        if (frameTime > 250) frameTime = 250; 
        
        accumulator += frameTime * speed;
        
        let updated = false;
        while (accumulator >= TIME_STEP) {
           engineRef.current.update();
           accumulator -= TIME_STEP;
           updated = true;
        }
        
        if (updated && engineRef.current.tickCount - lastRenderTick >= 15) {
           lastRenderTick = engineRef.current.tickCount;
           setTick(t => t + 1);
        }
      }
      lastTime = currentTime;
      animationFrameId = requestAnimationFrame(loop);
    };
    
    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [paused, speed]);
  
  const engine = engineRef.current;
  const state = engine.state;
  const selectedCreature = state.creatures.find(c => c.id === selectedId) || null;
  const speciesCount = Object.values(state.speciesRegistry as Record<string, SpeciesRecord>).filter(s => s.status === 'living').length;
  
  return (
    <div className="flex flex-col h-screen max-h-screen text-slate-200 font-sans overflow-hidden bg-[#050505]">
      
      <header className="flex flex-wrap gap-4 items-center justify-between px-8 py-4 shrink-0 z-40 relative">
        <div className="flex items-center gap-6 min-w-0">
          <div className="flex items-center gap-2 mr-2 shrink-0">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
            <div className="w-3 h-3 rounded-full bg-white/80"></div>
            <div className="w-3 h-3 rounded-full bg-neutral-600/80"></div>
          </div>
          
          <div className="flex items-baseline gap-4 min-w-0 truncate">
             <div className="truncate">
                <div className="flex items-baseline gap-3">
                   <h1 className="editorial-title text-xl text-white tracking-wide truncate uppercase">USELESS EVOLUTION SIMULATOR</h1>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 truncate italic">
                  Give life no purpose and see what happens.
                </p>
             </div>
          </div>
        </div>
        
        <div className="flex items-center p-1 glass-pill border border-white/10 shrink-0 max-md:hidden rounded-full bg-[#111]">
           <button 
             onClick={() => setPaused(!paused)}
             className={`flex items-center gap-2 px-5 py-1.5 rounded-full text-xs font-medium transition-all ${paused ? 'bg-red-500/20 text-red-400' : 'text-slate-200 hover:bg-white/5'}`}
           >
             {paused ? <Play size={12} fill="currentColor" /> : <Pause size={12} fill="currentColor" />} {paused ? 'Paused' : 'Running'}
           </button>
           <div className="w-px h-4 bg-slate-600/50 mx-1"></div>
           {[1, 5, 10, 50].map((sNum) => {
              const isActive = speed === sNum && !paused;
              return (
                <button 
                  key={sNum}
                  onClick={() => {setSpeed(sNum); setPaused(false);}}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${isActive ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                >
                  {sNum}x
                </button>
              )
           })}
        </div>

        <div className="flex items-center gap-6 shrink-0">
           <div className="flex gap-4 text-xs max-sm:hidden items-end">
              <div className="flex flex-col"><span className="text-slate-500 tracking-widest text-[9px] mb-0.5">Generation</span><span className="text-white font-medium text-sm">{state.generation}</span></div>
              <div className="flex flex-col"><span className="text-slate-500 tracking-widest text-[9px] mb-0.5">Population</span><span className="text-white font-medium text-sm">{state.creatures.length}</span></div>
              <div className="flex flex-col"><span className="text-slate-500 tracking-widest text-[9px] mb-0.5">Species</span><span className="text-red-500 font-medium text-sm">{speciesCount}</span></div>
           </div>
           
           <div className="w-px h-8 bg-slate-700/50 mx-2 max-sm:hidden"></div>
           
           <div className="flex gap-4 items-center">
              <button onClick={() => setSettingsOpen(true)} className="flex flex-col items-center text-slate-400 hover:text-white group">
                <Settings size={18} className="group-hover:rotate-45 transition-transform" />
                <span className="text-[9px] mt-1">Settings</span>
              </button>
              <button 
                 onClick={() => {
                   localStorage.setItem('ues_save', JSON.stringify({ 
                       state: engine.state, 
                       tickCount: engine.tickCount,
                       settings: engine.settings 
                   }));
                   engine.addEvent('Simulation saved.', 'normal');
                   setTick(t => t + 1);
                 }}
                 className="flex flex-col items-center text-slate-400 hover:text-white group"
              >
                 <Save size={18} className="group-hover:scale-110 transition-transform" />
                 <span className="text-[9px] mt-1">Save</span>
              </button>
           </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative px-6 pb-6 pt-2 gap-6">
        
        <LeftSidebar activeTab={activeTab} onSelectTab={setActiveTab} />

        <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden bg-black/20 rounded-3xl border border-white/5">
          {activeTab === 'world' && (
            <div className="flex-1 flex flex-col min-w-0 h-full relative p-6 gap-6">
              <section className="relative w-full flex-1 min-h-0 shrink rounded-2xl overflow-hidden shadow-2xl flex border border-white/5 z-10 bg-[#0a0a0a]">
                 <CanvasRenderer 
                   engine={engine} 
                   selectedId={selectedId} 
                   onSelect={setSelectedId}
                   cameraRef={cameraRef}
                 />
                 
                 <div className="absolute top-6 left-6 pointer-events-none z-20">
                    <div className="glass-card rounded-2xl px-4 py-2 flex items-center gap-3 bg-black/40 border border-white/5 backdrop-blur-md">
                       <div className="text-white drop-shadow-md text-xl">☀️</div>
                       <div>
                          <div className="text-xs font-bold text-white tracking-wide">The World</div>
                          <div className="text-[10px] text-slate-300 mt-0.5">Day {state.day}</div>
                       </div>
                    </div>
                 </div>
                 
                 <div className="absolute top-6 right-6 pointer-events-auto z-20 flex gap-2">
                    <div className="w-36 h-28 glass-card rounded-xl border border-white/10 bg-black/60 backdrop-blur-md overflow-hidden p-1 shadow-lg grayscale">
                       <div className="w-full h-full bg-white/5 rounded-lg relative overflow-hidden">
                          <Minimap engine={engine} cameraRef={cameraRef} />
                       </div>
                    </div>
                 </div>

                 <div className="absolute bottom-6 right-6 pointer-events-auto z-20">
                    <div className="flex items-center gap-2">
                       <div className="flex items-center h-8 bg-black/60 border border-white/10 rounded-full backdrop-blur-md text-slate-300 px-2 shadow-lg">
                          <button onClick={() => cameraRef.current.zoom = Math.max(0.5, cameraRef.current.zoom / 1.2)} className="w-6 h-full flex items-center justify-center hover:text-white">-</button>
                          <span className="text-[10px] px-2 font-mono">Zoom</span>
                          <button onClick={() => cameraRef.current.zoom = Math.min(5, cameraRef.current.zoom * 1.2)} className="w-6 h-full flex items-center justify-center hover:text-white">+</button>
                       </div>
                       <button onClick={() => { cameraRef.current.x = 800; cameraRef.current.y = 500; cameraRef.current.zoom = 1; }} className="w-8 h-8 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white backdrop-blur-md shadow-lg">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                       </button>
                    </div>
                 </div>
                 
                 {state.activeUselessEffect !== 'none' && (
                   <div className="absolute top-24 left-1/2 -translate-x-1/2 px-6 py-2 bg-red-600/10 backdrop-blur-xl text-white font-medium rounded-full shadow-2xl border border-red-500/50 animate-pulse flex items-center gap-3 z-20">
                      <span className="text-xl">⚠️</span> 
                      <span className="capitalize tracking-wide text-sm">{state.activeUselessEffect.replace('-', ' ')} Active</span>
                   </div>
                 )}
              </section>
              
              <DashboardPanels state={state} />
            </div>
          )}

          {activeTab === 'creatures' && <CreaturesView state={state} onSelect={(id) => { setSelectedId(id); setActiveTab('world'); }} />}
          {activeTab === 'species' && <SpeciesView state={state} />}
        </div>
        
        {selectedCreature && activeTab === 'world' && (
           <div className="w-[320px] shrink-0 h-full flex flex-col">
              <Inspector creature={selectedCreature} onClose={() => setSelectedId(null)} engine={engine} />
           </div>
        )}
      </div>

      {resetConfirmOpen && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setResetConfirmOpen(false)}></div>
            <div className="relative z-[110] bg-[#0c0c0c] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
               <h3 className="text-white text-lg mb-2">Reset World?</h3>
               <p className="text-slate-400 text-sm mb-6">This will destroy the current world and start a new one. This cannot be undone.</p>
               <div className="flex gap-3 justify-end">
                  <button onClick={() => setResetConfirmOpen(false)} className="px-4 py-2 text-sm text-slate-300 hover:text-white">Cancel</button>
                  <button 
                     onClick={() => {
                        localStorage.removeItem('ues_save');
                        engineRef.current = null;
                        setEngineKey(k => k + 1);
                        setResetConfirmOpen(false);
                        setSettingsOpen(false);
                     }} 
                     className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg"
                  >
                     Reset World
                  </button>
               </div>
            </div>
         </div>
      )}

      {settingsOpen && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSettingsOpen(false)}></div>
            <div className="relative z-[110] w-full max-w-2xl max-h-full">
               <SettingsView 
                  engine={engine} 
                  onReset={() => setResetConfirmOpen(true)} 
                  onClose={() => setSettingsOpen(false)}
               />
            </div>
         </div>
      )}
    </div>
  );
}
