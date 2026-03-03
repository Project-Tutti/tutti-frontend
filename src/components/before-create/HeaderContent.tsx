interface HeaderContentProps {
  trackCount: number;
  onReupload?: () => void;
}

const HeaderContent = ({ trackCount, onReupload }: HeaderContentProps) => {
  return (
    <div className="flex items-center gap-4">
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0f1218] border border-[#1e293b]">
        <span className="material-symbols-outlined text-gray-400 text-sm">analytics</span>
        <span className="text-xs font-medium text-gray-300">
          {trackCount} Tracks Found
        </span>
      </div>
      <button 
        onClick={onReupload}
        className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white transition-colors"
      >
        <span className="material-symbols-outlined text-base md:text-lg">history</span>
        <span className="hidden md:inline">Re-upload</span>
      </button>
    </div>
  );
};

export default HeaderContent;
