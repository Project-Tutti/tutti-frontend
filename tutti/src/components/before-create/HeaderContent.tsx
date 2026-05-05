import { BarChart2 } from "lucide-react";

interface HeaderContentProps {
  trackCount: number;
}

const HeaderContent = ({ trackCount }: HeaderContentProps) => {
  return (
    <div className="flex items-center">
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0f1218] border border-[#2d4a6a]">
        <BarChart2 className="size-3 text-gray-400" strokeWidth={2} />
        <span className="text-[12px] font-medium text-gray-300">
          {trackCount} Tracks Found
        </span>
      </div>
    </div>
  );
};

export default HeaderContent;
