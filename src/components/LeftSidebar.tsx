import { Globe, Users, Dna, Settings } from 'lucide-react';

export default function LeftSidebar({ activeTab, onSelectTab }: { activeTab: string, onSelectTab: (tab: string) => void }) {
  const tabs = [
    { id: 'world', icon: Globe, label: 'The World' },
    { id: 'creatures', icon: Users, label: 'Creatures' },
    { id: 'species', icon: Dna, label: 'Species' }
  ];

  return (
    <div className="w-[72px] shrink-0 h-full flex flex-col items-center py-6 glass-panel rounded-3xl border border-white/5 bg-black/40 backdrop-blur-md">
       <div className="flex flex-col gap-4 w-full px-3">
          {tabs.map(tab => {
             const Icon = tab.icon;
             const isActive = activeTab === tab.id;
             return (
               <button 
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all relative group
                    ${isActive ? 'bg-white/10 text-white shadow-inner' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
               >
                 {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-red-500 rounded-r-full shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>}
                 <Icon size={20} className={isActive ? 'text-red-400' : ''} />
                 <span className="text-[9px] font-medium tracking-wide uppercase opacity-0 group-hover:opacity-100 absolute -bottom-5 transition-opacity whitespace-nowrap">{tab.label}</span>
               </button>
             )
          })}
       </div>
    </div>
  );
}
