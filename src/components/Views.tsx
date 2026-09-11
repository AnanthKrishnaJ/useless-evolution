import { Creature, WorldState, SimEvent, SpeciesRecord } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { SimulationEngine } from '../simulation/Engine';

export function SettingsView({ engine, onReset, onClose }: { engine: SimulationEngine, onReset: () => void, onClose: () => void }) {
  return (
    <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
      <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-black/20">
        <h2 className="text-lg font-medium text-white">Simulation Settings</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
      </div>
      
      <div className="p-6 overflow-y-auto space-y-8 flex-1">
         <section>
            <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-4">World Parameters</h3>
            <div className="space-y-4">
               <div>
                  <div className="flex justify-between mb-1">
                     <label className="text-sm text-slate-300">Food Abundance</label>
                     <span className="text-xs text-red-400 font-mono">{(engine.settings.foodAbundance * 100).toFixed(0)}%</span>
                  </div>
                  <input type="range" min="0.1" max="1" step="0.05" 
                     defaultValue={engine.settings.foodAbundance} 
                     onChange={(e) => engine.settings.foodAbundance = parseFloat(e.target.value)}
                     className="w-full accent-red-500" />
               </div>
               <div>
                  <div className="flex justify-between mb-1">
                     <label className="text-sm text-slate-300">Mutation Rate</label>
                     <span className="text-xs text-red-400 font-mono">{(engine.settings.mutationRate * 100).toFixed(0)}%</span>
                  </div>
                  <input type="range" min="0.01" max="0.2" step="0.01" 
                     defaultValue={engine.settings.mutationRate} 
                     onChange={(e) => engine.settings.mutationRate = parseFloat(e.target.value)}
                     className="w-full accent-red-500" />
               </div>
               <div>
                  <div className="flex justify-between mb-1">
                     <label className="text-sm text-slate-300">Speciation Threshold</label>
                     <span className="text-xs text-red-400 font-mono">{engine.settings.speciesThreshold}</span>
                  </div>
                  <input type="range" min="10" max="100" step="1" 
                     defaultValue={engine.settings.speciesThreshold} 
                     onChange={(e) => engine.settings.speciesThreshold = parseInt(e.target.value)}
                     className="w-full accent-red-500" />
                  <p className="text-[10px] text-slate-500 mt-1">Lower values create new species more frequently.</p>
               </div>
            </div>
         </section>

         <section>
            <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-4">System Actions</h3>
            <button onClick={onReset} className="w-full py-3 rounded-lg border border-red-900/50 bg-red-950/20 text-red-500 hover:bg-red-900/40 hover:text-red-400 transition-colors text-sm font-medium">
               Annihilate World (Hard Reset)
            </button>
            <p className="text-xs text-slate-500 mt-2 text-center">This cannot be undone. All species will perish.</p>
         </section>
      </div>
    </div>
  );
}

export function CreaturesView({ state, onSelect }: { state: WorldState, onSelect: (id: string) => void }) {
  return (
    <div className="flex-1 min-h-0 flex flex-col p-8 overflow-hidden bg-[#050505]">
      <h2 className="editorial-title text-3xl text-white mb-6">Creature Directory</h2>
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
           {state.creatures.map(c => (
              <div key={c.id} onClick={() => onSelect(c.id)} className="glass-card p-4 hover:border-red-500/50 cursor-pointer transition-colors group">
                 <div className="flex justify-between items-start mb-3">
                    <div className="font-medium text-white group-hover:text-red-400 transition-colors">#{c.id.replace('c_','')}</div>
                    <div className="w-4 h-4 rounded-full border border-white/10 shadow-sm" style={{ backgroundColor: c.genes.color }}></div>
                 </div>
                 <div className="text-xs text-slate-400 mb-1">{c.species}</div>
                 <div className="text-[10px] text-slate-500 uppercase tracking-widest">Gen {c.generation} • {c.ageDays}d old</div>
                 <div className="mt-4 flex gap-1">
                    <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-red-500/50" style={{width: `${(c.health/c.maxHealth)*100}%`}}></div></div>
                    <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-blue-500/50" style={{width: `${(c.energy/c.maxEnergy)*100}%`}}></div></div>
                 </div>
              </div>
           ))}
           {state.creatures.length === 0 && (
             <div className="col-span-full py-12 text-center text-slate-500 font-light italic">
               The world is empty.
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

export function SpeciesView({ state }: { state: WorldState }) {
  const speciesList = Object.values(state.speciesRegistry as Record<string, SpeciesRecord>).sort((a,b) => b.generationDiscovered - a.generationDiscovered);
  
  return (
    <div className="flex-1 min-h-0 flex flex-col p-8 overflow-hidden bg-[#050505]">
      <h2 className="editorial-title text-3xl text-white mb-6">Species Registry</h2>
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="space-y-4 max-w-4xl pb-12">
           {speciesList.map(s => {
              const livingCount = state.creatures.filter(c => c.species === s.name).length;
              return (
                 <div key={s.name} className={`glass-card p-5 flex items-center justify-between ${s.status === 'extinct' ? 'opacity-50 grayscale' : ''}`}>
                    <div>
                       <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-bold text-white">{s.name}</h3>
                          <span className={`text-[9px] px-2 py-0.5 rounded-sm uppercase tracking-widest ${s.status === 'living' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                             {s.status}
                          </span>
                       </div>
                       <div className="text-xs text-slate-400">
                          Discovered Gen {s.generationDiscovered} {s.parentSpecies && `• Descended from ${s.parentSpecies}`}
                       </div>
                       
                       <div className="flex gap-6 mt-4 text-[10px] text-slate-500">
                          <div>Avg Size: <span className="text-slate-300">{Math.round(s.avgSize)}</span></div>
                          <div>Avg Speed: <span className="text-slate-300">{Math.round(s.avgSpeed)}</span></div>
                          <div>Avg Lifespan: <span className="text-slate-300">{Math.round(s.avgLifespan)}</span></div>
                       </div>
                    </div>
                    
                    <div className="text-right">
                       <div className="text-2xl font-light text-white">{livingCount}</div>
                       <div className="text-[9px] uppercase tracking-widest text-slate-500">Alive</div>
                    </div>
                 </div>
              );
           })}
        </div>
      </div>
    </div>
  );
}

