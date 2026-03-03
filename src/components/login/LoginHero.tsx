import Visualizer from './Visualizer';

const LoginHero = () => {
  return (
    <div className="hidden lg:flex lg:w-[25%] relative items-center justify-center overflow-hidden border-r border-[#1e293b]" style={{ background: 'radial-gradient(circle at center, #0a111f 0%, #05070a 100%)' }}>
      {/* Visualizer 애니메이션 */}
      <Visualizer />

      {/* 브랜딩 텍스트 */}
      <div className="relative z-10 text-center px-12">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="bg-[#3b82f6] p-2 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.5)]">
            <span className="material-symbols-outlined text-white text-3xl">graphic_eq</span>
          </div>
          <span className="text-4xl font-bold tracking-tighter text-white">Tutti</span>
        </div>
        <h2 className="text-3xl font-light text-gray-300 tracking-wide leading-tight">
          AI-Powered <span className="text-white font-semibold">Orchestration</span> for the Modern Composer.
        </h2>
      </div>

      {/* 배경 그라데이션 */}
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px]"></div>
    </div>
  );
};

export default LoginHero;
