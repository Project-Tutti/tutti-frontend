import LoginHero from '@/components/login/LoginHero';
import SignUpForm from '@/components/login/SignUpForm';

const RegisterPage = () => {
  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* 왼쪽: 브랜딩 영역 (25%) */}
      <LoginHero />

      {/* 오른쪽: 회원가입 폼 (75%) */}
      <div className="w-full lg:w-[75%] flex items-center justify-center p-6 md:p-10 overflow-y-auto">
        <SignUpForm />
      </div>
    </div>
  );
};

export default RegisterPage;
