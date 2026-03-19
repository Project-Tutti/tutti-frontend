import { z } from 'zod';

// 로그인 스키마
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요')
    .email('올바른 이메일 형식이 아닙니다'),
  password: z
    .string()
    .min(1, '비밀번호를 입력해주세요')
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
});

// 회원가입 기본 스키마
const signUpBaseSchema = z.object({
  nickname: z
    .string()
    .min(1, '닉네임을 입력해주세요')
    .min(2, '닉네임은 최소 2자 이상이어야 합니다')
    .max(20, '닉네임은 최대 20자까지 가능합니다')
    .regex(/^[a-zA-Z0-9가-힣_]+$/, '닉네임은 영문, 숫자, 한글, 언더스코어만 사용 가능합니다'),
  email: z
    .string()
    .min(1, '이메일을 입력해주세요')
    .email('올바른 이메일 형식이 아닙니다'),
  password: z
    .string()
    .min(1, '비밀번호를 입력해주세요')
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      '비밀번호는 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다'
    ),
  confirmPassword: z
    .string()
    .min(1, '비밀번호 확인을 입력해주세요'),
});

// 회원가입 스키마 (비밀번호 일치 검증 포함)
export const signUpSchema = signUpBaseSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  }
);

// 개별 필드 검증용 export
export const signUpFields = signUpBaseSchema.shape;

// TypeScript 타입 추출
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
