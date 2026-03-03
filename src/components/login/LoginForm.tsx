"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import FormInput from "./FormInput";
import GoogleSignInButton from "./GoogleSignInButton";
import { loginSchema, LoginFormData } from "@/schemas/authSchema";

const LoginForm = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof LoginFormData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange =
    (field: keyof LoginFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      // 입력 시 해당 필드 에러 제거
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  const handleBlur = (field: keyof LoginFormData) => () => {
    // 개별 필드 유효성 검사
    try {
      loginSchema.shape[field].parse(formData[field]);
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    } catch (error: any) {
      setErrors((prev) => ({ ...prev, [field]: error.errors[0]?.message }));
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 전체 폼 유효성 검사
    const result = loginSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {};
      result.error.errors.forEach((error) => {
        const field = error.path[0] as keyof LoginFormData;
        fieldErrors[field] = error.message;
      });
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    // TODO: 로그인 로직 구현
    console.log("Login submitted:", result.data);
    setIsSubmitting(false);
  };

  return (
    <div className="w-full max-w-md space-y-8">
      {/* 모바일 로고 */}
      <div className="lg:hidden flex items-center gap-3 mb-12">
        <div className="bg-[#3b82f6] p-1.5 rounded-lg">
          <span className="material-symbols-outlined text-white text-xl">
            graphic_eq
          </span>
        </div>
        <span className="text-2xl font-bold tracking-tight text-white">
          Tutti
        </span>
      </div>

      {/* 타이틀 */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Welcome Back
        </h1>
        <p className="text-gray-400 mt-2">
          Sign in to your professional workspace
        </p>
      </div>

      {/* 로그인 폼 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 이메일 */}
        <FormInput
          id="email"
          label="Email Address"
          type="email"
          placeholder="name@company.com"
          value={formData.email}
          onChange={handleChange("email")}
          onBlur={handleBlur("email")}
          error={errors.email}
        />

        {/* 비밀번호 */}
        <FormInput
          id="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange("password")}
          onBlur={handleBlur("password")}
          error={errors.password}
          rightLabel={
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-[#3b82f6] hover:text-blue-400"
            >
              Forgot Password?
            </Link>
          }
        />

        {/* 로그인 유지 체크박스 */}
        <div className="flex items-center">
          <input
            id="remember"
            type="checkbox"
            className="w-4 h-4 bg-[#0f1218] border-[#1e293b] rounded text-[#3b82f6] focus:ring-[#3b82f6]"
          />
          <label htmlFor="remember" className="ml-2 text-sm text-gray-400">
            Keep me signed in
          </label>
        </div>

        {/* 로그인 버튼 */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`
            w-full bg-[#3b82f6] hover:bg-blue-600 text-white font-bold py-4 rounded-xl 
            shadow-lg transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] 
            transform hover:-translate-y-0.5
            ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          {isSubmitting ? "Signing In..." : "Sign In"}
        </button>
      </form>

      {/* 구분선 */}
      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#1e293b]"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
          <span className="bg-[#05070a] px-4 text-gray-500">
            Or continue with
          </span>
        </div>
      </div>

      {/* Google 로그인 */}
      <GoogleSignInButton />

      {/* 회원가입 링크 */}
      <p className="text-center text-sm text-gray-500 pt-4">
        Don't have an account?{" "}
        <Link
          href="/register"
          className="font-bold text-[#3b82f6] hover:text-blue-400"
        >
          Start free trial
        </Link>
      </p>
    </div>
  );
};

export default LoginForm;
