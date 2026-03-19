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
  name: z
    .string()
    .min(1, '이름을 입력해주세요')
    .min(2, '이름은 최소 2자 이상이어야 합니다')
    .max(50, '이름은 최대 50자까지 가능합니다')
    .regex(/^[A-Za-z가-힣0-9 ]+$/, '이름은 영문, 한글, 숫자, 공백만 사용 가능합니다'),
  email: z
    .string()
    .min(1, '이메일을 입력해주세요')
    .max(255, '이메일은 최대 255자까지 가능합니다')
    .email('올바른 이메일 형식이 아닙니다'),
  password: z
    .string()
    .min(1, '비밀번호를 입력해주세요')
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .max(20, '비밀번호는 최대 20자까지 가능합니다')
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,20}$/,
      '비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다'
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
