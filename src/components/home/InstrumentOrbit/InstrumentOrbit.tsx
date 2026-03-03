'use client';

import InstrumentNode from './InstrumentNode'
import UploadCenter from '../upload/UploadCenter';

export interface Instrument {
  id: string;
  name: string;
  icon: string;
  position: 'top' | 'right' | 'left';
}

interface InstrumentOrbitProps {
  instruments: Instrument[];
  selectedInstrument: string | null;
  onInstrumentToggle: (id: string) => void;
  onFileUpload?: (file: File) => void;
}

const InstrumentOrbit = ({ 
  instruments, 
  selectedInstrument,
  onInstrumentToggle,
  onFileUpload 
}: InstrumentOrbitProps) => {
  return (
    <div className="relative w-[280px] h-[280px] md:w-[420px] md:h-[420px] flex items-center justify-center">
      {/* 궤도 원 */}
      <div className="absolute inset-0 rounded-full border border-dashed border-[#1e293b] scale-90"></div>

      {/* 중앙 업로드 영역 */}
      <UploadCenter onFileUpload={onFileUpload} />

      {/* 악기 노드들 */}
      {instruments.map((instrument) => (
        <InstrumentNode
          key={instrument.id}
          name={instrument.name}
          icon={instrument.icon}
          position={instrument.position}
          isSelected={selectedInstrument === instrument.id}
          onClick={() => onInstrumentToggle(instrument.id)}
        />
      ))}
    </div>
  );
};

export default InstrumentOrbit;
