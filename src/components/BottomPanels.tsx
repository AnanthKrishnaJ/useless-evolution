import { HistoryPoint, Creature, WorldState, SimEvent, SpeciesRecord } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function DashboardPanels({ state, onViewEvents, onViewSpecies }: { state: WorldState, onViewEvents?: () => void, onViewSpecies?: () => void }) {
  
  const speciesList = Object.values(state.speciesRegistry as Record<string, SpeciesRecord>)
    .sort((a,b) => b.generationDiscovered - a.generationDiscovered)
    .slice(0, 6);

  const recentEvents = state.events.slice(0, 5);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[250px] shrink-0">
      
      <div className="glass-panel border border-white/5 rounded-2xl p-5 flex flex-col bg-black/40">
         <h3 className="text-sm font-medium text-white mb-6">Population Over Time</h3>
         <div className="flex-1 w-full min-h-0 relative -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[...state.history]}>
                <XAxis dataKey="day" stroke="#334155" fontSize={10} tickFormatter={(v) => v % 10 === 0 ? v : ''} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(10, 10, 10, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#f8fafc', fontSize: '12px', padding: '4px 8px' }}
                  itemStyle={{ color: '#ef4444' }}
                  labelStyle={{ display: 'none' }}
                />
                <Line type="monotone" dataKey="population" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
         </div>
      </div>

      <div className="glass-panel border border-white/5 rounded-2xl p-5 flex flex-col bg-black/40">
         <h3 className="text-sm font-medium text-white mb-4">Key Statistics</h3>
         <div className="flex justify-between mb-6 pb-6 border-b border-white/5">
            <div className="flex flex-col items-center">
               <div className="text-2xl text-white font-medium">{state.creatures.length}</div>
               <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Population</div>
            </div>
            <div className="flex flex-col items-center">
               <div className="text-2xl text-white font-medium">{Object.keys(state.speciesRegistry).length}</div>
               <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Species</div>
            </div>
            <div className="flex flex-col items-center">
               <div className="text-2xl text-white font-medium">{state.generation}</div>
               <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Generation</div>
            </div>
            <div className="flex flex-col items-center">
               <div className="text-2xl text-white font-medium">{state.day}</div>
               <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Day</div>
            </div>
         </div>
         
         <div className="flex justify-between items-end mb-3">
            <h3 className="text-sm font-medium text-white">Recent Events</h3>
            {onViewEvents && <span onClick={onViewEvents} className="text-[10px] text-red-500 hover:text-red-400 cursor-pointer">View All →</span>}
         </div>
         <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-2">
            {recentEvents.map(evt => (
               <div key={evt.id} className="flex gap-3 text-[11px] items-center">
                  <div className="text-slate-500 w-12 shrink-0">Day {evt.day}</div>
                  <div className="text-slate-300 line-clamp-1">
                     {evt.type === 'disaster' && <span className="text-red-500 mr-1">☠</span>}
                     {evt.type === 'evolution' && <span className="text-emerald-400 mr-1">🧬</span>}
                     {evt.message}
                  </div>
               </div>
            ))}
            {recentEvents.length === 0 && <div className="text-xs text-slate-600">No events recorded.</div>}
         </div>
      </div>

      <div className="glass-panel border border-white/5 rounded-2xl p-5 flex flex-col bg-black/40">
         <div className="flex justify-between items-end mb-4">
            <h3 className="text-sm font-medium text-white">Latest Species</h3>
            {onViewSpecies && <span onClick={onViewSpecies} className="text-[10px] text-red-500 hover:text-red-400 cursor-pointer">View All →</span>}
         </div>
         <div className="grid grid-cols-3 gap-2 flex-1 min-h-0">
            {speciesList.map(sp => (
               <div key={sp.name} className="bg-[#0c0c0c] border border-white/5 rounded-lg p-2 flex flex-col items-center justify-center relative overflow-hidden group">
                  <div className="text-[10px] text-white font-medium truncate w-full text-center z-10">{sp.name}</div>
                  <div className="text-[9px] text-slate-500 z-10">{sp.status}</div>
               </div>
            ))}
         </div>
      </div>

    </div>
  );
}
