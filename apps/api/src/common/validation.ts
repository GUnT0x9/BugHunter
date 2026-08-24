import { BadRequestException } from '@nestjs/common';
import type { ZodType } from 'zod';

export function parseBody<T>(schema: ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new BadRequestException(parsed.error.issues.map((issue) => issue.message).join(', '));
  }
  return parsed.data;
}
