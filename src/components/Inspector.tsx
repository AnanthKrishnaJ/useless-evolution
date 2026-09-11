import { Creature } from '../types';
import { X as CloseIcon, Target } from 'lucide-react';
import { SimulationEngine } from '../simulation/Engine';

export default function Inspector({ creature, onClose, engine }: { creature: Creature | null, onClose: () => void, engine: SimulationEngine }) {
  if (!creature) return null;
  const g = creature.genes;
  
  return (
    <div className="w-full flex flex-col h-full glass-panel rounded-2xl overflow-hidden shrink-0 flex-none border border-white/5 bg-[#0a0a0a] shadow-[0_0_30px_rgba(0,0,0,0.8)]">
      <div className="px-5 py-4 flex items-center justify-between bg-transparent border-b border-white/5">
        <h2 className="font-medium text-white text-base">Creature #{creature.id.replace('c_','')}</h2>
        <button onClick={onClose} className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
          <CloseIcon size={12} />
        </button>
      </div>
      
      <div className="flex-1 min-h-0 overflow-y-auto p-5 custom-scrollbar flex flex-col">
        <div className="flex gap-4 items-center mb-8">
          <div className="w-20 h-20 rounded-xl flex items-center justify-center shrink-0 bg-[#0c0c0c] border border-white/5 relative overflow-hidden">
             <div className="absolute inset-0 opacity-10" style={{ backgroundColor: g.color }}></div>
             
             <div className="w-10 h-10 rounded-full relative z-10" style={{ backgroundColor: g.color }}>
                <div className="absolute top-2 left-2 w-2 h-2 bg-white rounded-full"><div className="w-1 h-1 bg-black rounded-full absolute top-[1px] left-[1px]"></div></div>
                <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full"><div className="w-1 h-1 bg-black rounded-full absolute top-[1px] left-[1px]"></div></div>
             </div>
          </div>
          
          <div className="flex-1 text-[11px] text-slate-400 italic leading-relaxed">
             "{creature.action === 'dancing' ? 'Spreading joy for no reason.' : 
               creature.action === 'sleeping' ? 'Dreaming of a world with softer grass.' :
               'A perfectly unremarkable organism.'}"
          </div>
        </div>
        
        <div className="space-y-3 mb-8">
           <div className="flex items-center text-xs">
              <span className="text-slate-400 w-24">Species</span>
              <span className="text-slate-200">{creature.species}</span>
           </div>
           <div className="flex items-center text-xs">
              <span className="text-slate-400 w-24">Generation</span>
              <span className="text-slate-200">{creature.generation}</span>
           </div>
           <div className="flex items-center text-xs">
              <span className="text-slate-400 w-24">Age</span>
              <span className="text-slate-200">{creature.ageDays} days</span>
           </div>
           <div className="flex items-center text-xs gap-3">
              <span className="text-slate-400 w-20 shrink-0">Health</span>
              <span className="text-slate-200 w-8 text-right shrink-0">{Math.round((creature.health / creature.maxHealth)*100)}%</span>
              <div className="flex-1 bg-white/10 rounded-full h-1.5"><div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${Math.max(0, Math.min(100, (creature.health / creature.maxHealth) * 100))}%` }}></div></div>
           </div>
           <div className="flex items-center text-xs gap-3">
              <span className="text-slate-400 w-20 shrink-0">Energy</span>
              <span className="text-slate-200 w-8 text-right shrink-0">{Math.round((creature.energy / creature.maxEnergy)*100)}%</span>
              <div className="flex-1 bg-white/10 rounded-full h-1.5"><div className="bg-slate-400 h-1.5 rounded-full" style={{ width: `${Math.max(0, Math.min(100, (creature.energy / creature.maxEnergy) * 100))}%` }}></div></div>
           </div>
        </div>
        
        <div className="space-y-3 mb-8">
          <h3 className="text-sm text-white mb-4">Genetics & Mutation</h3>
          <MiniBar label="Speed" value={g.speed} color="bg-red-500" />
          <MiniBar label="Size" value={g.size} color="bg-red-500" />
          <MiniBar label="Vision" value={g.vision} color="bg-red-500" />
          <MiniBar label="Lifespan" value={g.lifespan} color="bg-red-500" />
          <MiniBar label="Efficiency" value={g.energyEfficiency} color="bg-red-500" />
        </div>
        
        <div className="space-y-2 mb-8 bg-black/40 border border-white/5 rounded-xl p-4">
          <h3 className="text-sm text-white mb-2">Evolution Criteria</h3>
          <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
            <strong className="text-slate-200">Mutation</strong> happens randomly at birth ({Math.round(engine.settings.mutationRate * 100)}% chance per gene). 
            <strong className="text-slate-200 ml-1">Evolution</strong> occurs when a child's genes diverge from its parent by more than {engine.settings.speciesThreshold} total points, forming a new species.
          </p>
          
          {engine.state.speciesRegistry[creature.species] && (
             <div className="mt-3 pt-3 border-t border-white/10">
               <div className="flex justify-between text-xs mb-1">
                 <span className="text-slate-400">Divergence from Species Base</span>
                 <span className="text-emerald-400 font-mono">
                   {Math.round(
                     Math.abs(g.size - engine.state.speciesRegistry[creature.species].avgSize) + 
                     Math.abs(g.speed - engine.state.speciesRegistry[creature.species].avgSpeed) + 
                     Math.abs(g.lifespan - engine.state.speciesRegistry[creature.species].avgLifespan)
                   )} pts
                 </span>
               </div>
               <div className="text-[9px] text-slate-500">Threshold for new species: {engine.settings.speciesThreshold} pts</div>
             </div>
          )}
        </div>
        
        <div className="w-full py-2.5 rounded-full border border-red-500/30 bg-red-500/10 flex items-center justify-center gap-2 text-xs text-red-100 mt-auto shadow-[0_0_15px_rgba(239,68,68,0.2)]">
           <Target size={14} className="text-red-400 animate-pulse" /> Following Creature
        </div>
      </div>
    </div>
  );
}

function MiniBar({ label, value, color }: { label: string, value: number, color: string }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="flex items-center text-xs gap-3">
      <span className="text-slate-300 w-20 shrink-0">{label}</span>
      <span className="text-red-500 w-8 shrink-0">{Math.round(value)}</span>
      <div className="flex-1 bg-white/5 rounded-full h-1.5">
         <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
}
