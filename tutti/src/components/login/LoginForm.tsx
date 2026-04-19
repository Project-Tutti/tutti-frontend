"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import FormInput from "./FormInput";
import { BrandGraphicEqIcon } from "./BrandGraphicEqIcon";
import GoogleSignInButton from "./GoogleSignInButton";
import { loginSchema, LoginFormData } from "@/schemas/authSchema";
import { useLoginMutation } from "@api/user/hooks/mutations/useLoginMutation";
import { ZodError } from "zod";

import { safeInternalRedirectPath } from "@common/utils/safe-internal-path.utils";

const getErrorMessage = (error: unknown) =>
  typeof (error as { message?: unknown })?.message === "string"
    ? (error as { message: string }).message
    : null;

const LoginForm = () => {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof LoginFormData, string>>
  >({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { mutateAsync: loginMutation, isPending } = useLoginMutation();

  const oauthBanner = useMemo(() => {
    const err = searchParams.get("error");
    const detail = searchParams.get("message");
    if (!err) return null;
    if (err === "oauth_failed") {
      return "Google 로그인에 실패했습니다. 다시 시도해 주세요.";
    }
    if (err === "oauth_invalid") {
      return "로그인 요청이 유효하지 않습니다. 다시 시도해 주세요.";
    }
    if (err === "oauth_denied") {
      return detail ?? "Google 로그인이 취소되었습니다.";
    }
    return null;
  }, [searchParams]);

  const handleChange =
    (field: keyof LoginFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      if (submitError) {
        setSubmitError(null);
      }
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
    } catch (error: unknown) {
      const message =
        error instanceof ZodError
          ? error.errors?.[0]?.message
          : "유효하지 않은 값입니다.";
      setErrors((prev) => ({ ...prev, [field]: message }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    // 전체 폼 유효성 검사
    const result = loginSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {};
      result.error.errors.forEach((error) => {
        const field = error.path[0] as keyof LoginFormData;
        fieldErrors[field] = error.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      await loginMutation(result.data);
    } catch (error) {
      setSubmitError(getErrorMessage(error) ?? "로그인에 실패했습니다");
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* 모바일 로고 */}
      <div className="lg:hidden flex items-center gap-3 mb-9">
        <div className="bg-[#3b82f6] rounded-lg px-2 pt-2 pb-[2px]">
          <BrandGraphicEqIcon className="text-[24px]" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">
          Tutti
        </span>
      </div>

      {/* 타이틀 */}
      <div>
        <h1 className="text-[26px] font-bold text-white tracking-tight">
          Welcome Back
        </h1>
        <p className="text-gray-400 mt-1.5 text-[13px]">
          Sign in to your professional workspace
        </p>
      </div>

      {/* 로그인 폼 */}
      <form onSubmit={handleSubmit} className="space-y-5">
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
          /*rightLabel={
            <Link
              href="/forgot-password"
              className="text-[11px] font-semibold text-[#3b82f6] hover:text-blue-400"
            >
              Forgot Password?
            </Link
            */ // 구현하지 않았음
        />

        {/* 로그인 버튼 */}
        <button
          type="submit"
          disabled={isPending}
          className={`
            w-full bg-[#3b82f6] hover:bg-blue-600 text-white font-bold py-3 rounded-xl text-[13px]
            shadow-lg transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] 
            transform hover:-translate-y-0.5
            ${isPending ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          {isPending ? "Signing In..." : "Sign In"}
        </button>

        {submitError ? (
          <p className="text-[13px] text-red-400">{submitError}</p>
        ) : null}
        {oauthBanner ? (
          <p className="text-[13px] text-red-400">{oauthBanner}</p>
        ) : null}
      </form>

      {/* 구분선 */}
      <div className="relative py-3">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#1e293b]"></div>
        </div>
        <div className="relative flex justify-center text-[11px] uppercase tracking-widest font-bold">
          <span className="bg-[#05070a] px-4 text-gray-500">
            Or continue with
          </span>
        </div>
      </div>

      {/* Google 로그인 */}
      <GoogleSignInButton
        postAuthRedirect={safeInternalRedirectPath(
          searchParams.get("redirect"),
        )}
        disabled={isPending}
      />

      {/* 회원가입 링크 */}
      <p className="text-center text-[13px] text-gray-500 pt-3">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-bold text-[#3b82f6] hover:text-blue-400"
        >
          Let&apos;s Go Sign Up
        </Link>
      </p>
    </div>
  );
};

export default LoginForm;
