'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import FormInput from './FormInput';
import GoogleSignInButton from './GoogleSignInButton';
import { signUpSchema, signUpFields, SignUpFormData } from '@/schemas/authSchema';
import { useSignupMutation } from '@api/user/hooks/mutations/useSignupMutation';
import { useCheckEmailDuplicationQuery } from '@api/user/hooks/queries/useCheckEmailDuplicationQuery';

type SignUpField = keyof SignUpFormData;
type SignUpErrors = Partial<Record<SignUpField, string>>;

const getErrorMessage = (error: unknown) =>
  typeof (error as { message?: unknown })?.message === 'string'
    ? ((error as { message: string }).message)
    : null;

const getErrorStatus = (error: unknown) =>
  typeof (error as { status?: unknown })?.status === 'number'
    ? ((error as { status: number }).status)
    : null;

const SignUpForm = () => {
  const [formData, setFormData] = useState<SignUpFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<SignUpErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isEmailAvailable, setIsEmailAvailable] = useState(false);
  const { mutateAsync: signupMutation, isPending } = useSignupMutation();
  const normalizedEmail = formData.email.trim().toLowerCase();
  const { refetch: refetchEmailDuplication, isFetching: isCheckingEmail } =
    useCheckEmailDuplicationQuery(normalizedEmail, false);

  const setFieldError = (field: SignUpField, message?: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  };

  const validateField = (field: SignUpField) => {
    if (field === 'confirmPassword') {
      if (!formData.confirmPassword) {
        setFieldError('confirmPassword', '비밀번호 확인을 입력해주세요');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setFieldError('confirmPassword', '비밀번호가 일치하지 않습니다');
        return false;
      }

      setFieldError('confirmPassword');
      return true;
    }

    const parsed = signUpFields[field].safeParse(formData[field]);
    if (!parsed.success) {
      setFieldError(field, parsed.error.errors[0]?.message);
      return false;
    }

    setFieldError(field);
    return true;
  };

  const handleChange = (field: SignUpField) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'email') {
      setIsEmailAvailable(false);
    }

    if (submitError) {
      setSubmitError(null);
    }
    // 입력 시 해당 필드 에러 제거
    if (errors[field]) setFieldError(field);
  };

  const handleBlur = (field: SignUpField) => () => {
    validateField(field);
  };

  const handleCheckEmailDuplication = async () => {
    const emailValidation = signUpFields.email.safeParse(formData.email);

    if (!emailValidation.success) {
      const errorMessage = emailValidation.error.errors[0]?.message;
      if (errorMessage) setFieldError('email', errorMessage);
      setIsEmailAvailable(false);
      return;
    }

    setFieldError('email');

    const result = await refetchEmailDuplication();
    const status = getErrorStatus(result.error);

    if (status === 409) {
      setFieldError('email', '이미 사용 중인 이메일입니다');
      setIsEmailAvailable(false);
      return;
    }

    if (result.isSuccess) {
      setIsEmailAvailable(true);
      return;
    }

    setFieldError('email', '이메일 중복 확인에 실패했습니다');
    setIsEmailAvailable(false);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    // 전체 폼 유효성 검사
    const result = signUpSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: SignUpErrors = {};
      result.error.errors.forEach((error) => {
        const field = error.path[0] as SignUpField;
        fieldErrors[field] = error.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!isEmailAvailable) {
      setFieldError('email', '이메일 중복 확인을 해주세요');
      return;
    }

    try {
      await signupMutation({
        email: result.data.email,
        name: result.data.name,
        password: result.data.password,
      });
    } catch (error) {
      const status = getErrorStatus(error);
      if (status === 409) {
        setFieldError('email', '이미 사용 중인 이메일입니다');
        return;
      }

      setSubmitError(getErrorMessage(error) ?? '회원가입에 실패했습니다');
    }
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
        {/* 이름 */}
        <FormInput
          id="name"
          label="Name"
          type="text"
          placeholder="e.g. Tutti User"
          value={formData.name}
          onChange={handleChange('name')}
          onBlur={handleBlur('name')}
          error={errors.name}
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
          rightLabel={
            <button
              type="button"
              onClick={handleCheckEmailDuplication}
              disabled={isCheckingEmail}
              className="text-xs font-semibold text-[#3b82f6] hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCheckingEmail ? '확인 중...' : '중복 확인'}
            </button>
          }
          error={errors.email}
        />
        {isEmailAvailable && !errors.email ? (
          <p className="-mt-3 text-xs text-emerald-400">사용 가능한 이메일입니다</p>
        ) : null}

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
          disabled={isPending}
          className={`
            w-full bg-[#3b82f6] hover:bg-blue-600 text-white font-bold py-4 rounded-xl 
            shadow-lg transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] 
            transform hover:-translate-y-0.5 mt-2
            ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isPending ? 'Creating Account...' : 'Sign Up'}
        </button>

        {submitError ? <p className="text-sm text-red-400">{submitError}</p> : null}
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
