'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import FormInput from './FormInput';
import GoogleSignInButton from './GoogleSignInButton';
import { signUpSchema, signUpFields, SignUpFormData } from '@/schemas/authSchema';

const SignUpForm = () => {
  const [formData, setFormData] = useState<SignUpFormData>({
    nickname: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SignUpFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof SignUpFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // 입력 시 해당 필드 에러 제거
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBlur = (field: keyof SignUpFormData) => () => {
    // 개별 필드 유효성 검사
    try {
      if (field === 'confirmPassword') {
        // confirmPassword는 전체 스키마로 검증 (비밀번호 일치 확인)
        signUpSchema.parse(formData);
        setErrors(prev => ({ ...prev, confirmPassword: undefined }));
      } else {
        signUpFields[field].parse(formData[field]);
        setErrors(prev => ({ ...prev, [field]: undefined }));
      }
    } catch (error: any) {
      const errorMessage = error.errors?.[0]?.message;
      if (errorMessage) {
        setErrors(prev => ({ ...prev, [field]: errorMessage }));
      }
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 전체 폼 유효성 검사
    const result = signUpSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof SignUpFormData, string>> = {};
      result.error.errors.forEach((error) => {
        const field = error.path[0] as keyof SignUpFormData;
        fieldErrors[field] = error.message;
      });
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    // TODO: 회원가입 로직 구현
    console.log('Sign up submitted:', result.data);
    setIsSubmitting(false);
  };

  return (
    <div className="w-full max-w-md space-y-8 py-8">
      {/* 모바일 로고 */}
      <div className="lg:hidden flex items-center gap-3 mb-8">
        <div className="bg-[#3b82f6] p-1.5 rounded-lg">
          <span className="material-symbols-outlined text-white text-xl">graphic_eq</span>
        </div>
        <span className="text-2xl font-bold tracking-tight text-white">Tutti</span>
      </div>

      {/* 타이틀 */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Create Account</h1>
        <p className="text-gray-400 mt-2">Join the future of orchestral composition</p>
      </div>

      {/* 회원가입 폼 */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 닉네임 */}
        <FormInput
          id="nickname"
          label="Nickname"
          type="text"
          placeholder="e.g. Maestro"
          value={formData.nickname}
          onChange={handleChange('nickname')}
          onBlur={handleBlur('nickname')}
          error={errors.nickname}
        />

        {/* 이메일 */}
        <FormInput
          id="email"
          label="Email Address"
          type="email"
          placeholder="name@company.com"
          value={formData.email}
          onChange={handleChange('email')}
          onBlur={handleBlur('email')}
          error={errors.email}
        />

        {/* 비밀번호 */}
        <FormInput
          id="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange('password')}
          onBlur={handleBlur('password')}
          error={errors.password}
        />

        {/* 비밀번호 확인 */}
        <FormInput
          id="confirm-password"
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={handleChange('confirmPassword')}
          onBlur={handleBlur('confirmPassword')}
          error={errors.confirmPassword}
        />

        {/* 회원가입 버튼 */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`
            w-full bg-[#3b82f6] hover:bg-blue-600 text-white font-bold py-4 rounded-xl 
            shadow-lg transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] 
            transform hover:-translate-y-0.5 mt-2
            ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isSubmitting ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>

      {/* 구분선 */}
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#1e293b]"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
          <span className="bg-[#05070a] px-4 text-gray-500">Or continue with</span>
        </div>
      </div>

      {/* Google 회원가입 */}
      <GoogleSignInButton text="Sign up with Google" />

      {/* 로그인 링크 */}
      <p className="text-center text-sm text-gray-500 pt-2">
        Already have an account?{' '}
        <Link href="/login" className="font-bold text-[#3b82f6] hover:text-blue-400">
          Sign In
        </Link>
      </p>
    </div>
  );
};

export default SignUpForm;
