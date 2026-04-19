import Visualizer from "./Visualizer";
import { BrandGraphicEqIcon } from "./BrandGraphicEqIcon";

const LoginHero = () => {
  return (
    <div
      className="hidden lg:flex lg:w-[25%] relative items-center justify-center overflow-hidden border-r border-[#1e293b]"
      style={{
        background:
          "radial-gradient(circle at center, #0a111f 0%, #05070a 100%)",
      }}
    >
      {/* Visualizer 애니메이션 */}
      <Visualizer />

      {/* 브랜딩 텍스트 */}
      <div className="relative z-10 text-center px-10">
        <div className="flex items-center justify-center gap-3 mb-5">
          <div className="bg-[#3b82f6] rounded-lg px-2 pt-2 pb-[2px] shadow-[0_0_18px_rgba(59,130,246,0.45)]">
            <BrandGraphicEqIcon className="text-[28px]" />
          </div>
          <span className="text-3xl font-bold tracking-tighter text-white">
            Tutti
          </span>
        </div>
        <h2 className="text-[26px] font-light text-gray-300 tracking-wide leading-tight">
          AI-Powered{" "}
          <span className="text-white font-semibold">Orchestration</span> for
          the Modern Composer.
        </h2>
      </div>

      {/* 배경 그라데이션 */}
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px]"></div>
    </div>
  );
};

export default LoginHero;
