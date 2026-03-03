'use client';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

interface RecentItem {
  id: string;
  title: string;
  time: string;
  icon: string;
}

const recentGenerations: RecentItem[] = [
  { id: '1', title: 'Symphony No. 5 Arrangement', time: '2 hours ago', icon: 'music_note' },
  { id: '2', title: 'Oboe Solo - Oct 24', time: 'Yesterday', icon: 'queue_music' },
  { id: '3', title: 'String Quartet Draft', time: 'Oct 22, 2024', icon: 'music_note' },
  { id: '4', title: 'Flute Sonata Rework', time: 'Oct 20, 2024', icon: 'air' },
];

const Sidebar = ({ isCollapsed, onToggle }: SidebarProps) => {
  return (
    <aside
      className={`
        bg-[#0a0c10] border-r border-[#1e293b] flex flex-col h-screen sticky top-0 
        transition-all duration-300 ease-in-out z-60
        ${isCollapsed ? 'w-0 border-r-0' : 'w-60'}
      `}
      style={{ overflow: isCollapsed ? 'hidden' : 'visible' }}
    >
      <div className="p-3 border-b border-[#1e293b] flex items-center justify-between min-w-[240px]">
        <div className="flex items-center gap-2">
          <div className="bg-[#3b82f6] p-1 rounded-lg">
            <span className="material-symbols-outlined text-white text-lg">graphic_eq</span>
          </div>
          <span className="text-base font-bold tracking-tight text-white">Harmonix</span>
        </div>
        <button
          onClick={onToggle}
          className="text-gray-500 hover:text-white transition-colors"
          aria-label="Toggle sidebar"
        >
          <span className="material-symbols-outlined text-lg">side_navigation</span>
        </button>
      </div>

      <div className="grow flex flex-col p-3 space-y-5 overflow-y-auto min-w-[240px]">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Recent Generations
            </h2>
            <button className="text-gray-500 hover:text-[#3b82f6] transition-colors">
              <span className="material-symbols-outlined text-base">add_circle</span>
            </button>
          </div>

          <div className="space-y-0.5">
            {recentGenerations.map((item) => (
              <a
                key={item.id}
                href="#"
                className="sidebar-item group flex items-center gap-2 px-2 py-2 rounded-lg text-xs text-gray-300 hover:text-white transition-all hover:bg-white/5"
              >
                <span className="material-symbols-outlined text-gray-500 group-hover:text-[#3b82f6] text-base">
                  {item.icon}
                </span>
                <div className="flex flex-col truncate">
                  <span className="truncate">{item.title}</span>
                  <span className="text-[9px] text-gray-600">{item.time}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-[#1e293b] space-y-0.5 min-w-[240px]">
        <a
          href="#"
          className="sidebar-item flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white transition-colors hover:bg-white/5"
        >
          <span className="material-symbols-outlined text-base">help</span>
          <span>Help &amp; Support</span>
        </a>
        <a
          href="#"
          className="sidebar-item flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white transition-colors hover:bg-white/5"
        >
          <span className="material-symbols-outlined text-base">settings</span>
          <span>Settings</span>
        </a>

        <div className="mt-3 flex items-center gap-2 px-2 py-1.5">
          <div className="h-7 w-7 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 border border-white/20"></div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-white">Alex Mercer</span>
            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter">
              Pro Plan
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
