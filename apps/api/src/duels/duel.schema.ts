import { z } from 'zod';

export const CreateDuelSchema = z.object({ missionId: z.string().min(1) });
export const JoinDuelSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-F0-9]{6}$/, '참가 코드는 영문 A-F와 숫자 6자리입니다.'),
});
