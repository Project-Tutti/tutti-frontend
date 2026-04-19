import LoginHero from '@/components/login/LoginHero';
import LoginForm from '@/components/login/LoginForm';
import { Suspense } from 'react';

const LoginPage = () => {
  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* 왼쪽: 브랜딩 영역 */}
      <LoginHero />

      {/* 오른쪽: 로그인 폼 */}
      <div className="w-full lg:w-[75%] flex items-center justify-center p-6 md:p-12">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
};

export default LoginPage;
