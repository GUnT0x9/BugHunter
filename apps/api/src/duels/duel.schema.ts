import { z } from 'zod';

export const CreateDuelSchema = z.object({ difficulty: z.number().int().min(1).max(5) });
export const JoinDuelSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-F0-9]{6}$/, '참가 코드는 영문 A-F와 숫자 6자리입니다.'),
});
