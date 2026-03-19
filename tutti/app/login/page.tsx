import LoginHero from '@/components/login/LoginHero';
import LoginForm from '@/components/login/LoginForm';

const LoginPage = () => {
  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* 왼쪽: 브랜딩 영역 */}
      <LoginHero />

      {/* 오른쪽: 로그인 폼 */}
      <div className="w-full lg:w-[75%] flex items-center justify-center p-8 md:p-16">
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
