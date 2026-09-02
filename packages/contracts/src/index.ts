import { z } from 'zod';

export type MissionRating = {
  stars: number;
  cleared: boolean;
  noHint: boolean;
  firstTry: boolean;
};

export function missionRating(attempts: number, highestHint: number): MissionRating {
  const cleared = attempts > 0;
  const noHint = cleared && highestHint === 0;
  const firstTry = cleared && attempts === 1;
  return {
    stars: Number(cleared) + Number(noHint) + Number(firstTry),
    cleared,
    noHint,
    firstTry,
  };
}

export const USER_ROLES = ['USER', 'ADMIN'] as const;
export const EXECUTION_STATUSES = [
  'QUEUED',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
  'ERROR',
  'TIMED_OUT',
] as const;
export const EXECUTION_KINDS = ['RUN', 'SUBMIT'] as const;
export const EXECUTION_ERROR_KINDS = [
  'NONE',
  'SYNTAX_ERROR',
  'RUNTIME_ERROR',
  'TIMEOUT',
  'OUTPUT_LIMIT',
  'INTERNAL_ERROR',
] as const;
export const EXECUTION_DIAGNOSTIC_KINDS = [
  'SYNTAX_ERROR',
  'RUNTIME_ERROR',
  'TIMEOUT',
  'OUTPUT_LIMIT',
  'INTERNAL_ERROR',
] as const;
export const SUBMISSION_STATUSES = [
  'QUEUED',
  'RUNNING',
  'PASSED',
  'FAILED',
  'ERROR',
  'TIMED_OUT',
] as const;

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string().min(2).max(32),
  bio: z.string(),
  role: z.enum(USER_ROLES),
  totalXp: z.number().int().nonnegative(),
});

export const LoginInputSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('올바른 이메일 주소를 입력해주세요.')
    .max(254, '이메일 주소가 너무 깁니다.'),
  password: z
    .string()
    .min(8, '비밀번호는 8자 이상이어야 합니다.')
    .max(128, '비밀번호는 128자 이하여야 합니다.'),
});

export const UsernameSchema = z
  .string()
  .trim()
  .min(2, '닉네임은 2자 이상이어야 합니다.')
  .max(32, '닉네임은 32자 이하여야 합니다.')
  .regex(/^[가-힣a-zA-Z0-9_ -]+$/, '닉네임에는 한글, 영문, 숫자, 공백, _, -만 사용할 수 있습니다.');

export const RegisterInputSchema = LoginInputSchema.extend({
  username: UsernameSchema,
});

export const ProfileUpdateSchema = z.object({
  username: UsernameSchema,
  bio: z.string().trim().max(160, '자기소개는 160자 이하여야 합니다.'),
});

export const ProfileSummarySchema = z.object({
  joinedAt: z.string().datetime(),
  activityDays: z.array(
    z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), count: z.number().int().positive() }),
  ),
  recentActivity: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      detail: z.string(),
      xp: z.number().int().nonnegative(),
      occurredAt: z.string().datetime(),
    }),
  ),
  solvedCount: z.number().int().nonnegative(),
  totalSubmissions: z.number().int().nonnegative(),
  averageAttempts: z.number().nonnegative(),
  averageExecutionTimeMs: z.number().int().nonnegative(),
});

export const CommunityUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  totalXp: z.number().int().nonnegative(),
  level: z.number().int().positive(),
  solvedCount: z.number().int().nonnegative(),
  isSelf: z.boolean(),
  isFollowing: z.boolean(),
  followsMe: z.boolean(),
});

export const PublicProfileSchema = CommunityUserSchema.extend({
  bio: z.string(),
  joinedAt: z.string().datetime(),
  followerCount: z.number().int().nonnegative(),
  followingCount: z.number().int().nonnegative(),
  recentActivity: ProfileSummarySchema.shape.recentActivity,
  featuredAchievements: z.array(
    z.object({
      code: z.string(),
      group: z.string(),
      title: z.string(),
      description: z.string(),
      secret: z.boolean(),
      rarity: z.enum(['COMMON', 'RARE', 'EPIC', 'LEGENDARY']),
    }),
  ),
});

export const FollowOverviewSchema = z.object({
  followers: z.array(CommunityUserSchema),
  following: z.array(CommunityUserSchema),
});

export const RankingEntrySchema = CommunityUserSchema.extend({ rank: z.number().int().positive() });

export const RankingResponseSchema = z.object({
  entries: z.array(RankingEntrySchema),
  me: RankingEntrySchema,
});

export const TestCaseSchema = z.object({
  id: z.string(),
  order: z.number().int().positive(),
  input: z.string(),
  expectedOutput: z.string(),
  isHidden: z.boolean(),
});

export const PublicTestCaseSchema = TestCaseSchema.pick({
  id: true,
  order: true,
  input: true,
  expectedOutput: true,
});

export const HintSchema = z.object({
  id: z.string(),
  level: z.number().int().min(1).max(3),
  content: z.string(),
});

export const MissionPublicSchema = z.object({
  id: z.string(),
  slug: z.string(),
  chapterOrder: z.number().int().positive(),
  order: z.number().int().positive(),
  title: z.string(),
  description: z.string(),
  language: z.literal('python'),
  difficulty: z.number().int().min(1).max(5),
  isBoss: z.boolean(),
  bugType: z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    description: z.string(),
  }),
  initialCode: z.string(),
  explanation: z.string().nullable(),
  hints: z.array(HintSchema),
  concepts: z.array(z.string()),
  visibleTests: z.array(PublicTestCaseSchema),
  totalTestCount: z.number().int().positive(),
  baseXp: z.number().int().positive(),
  isCompleted: z.boolean(),
  isLocked: z.boolean(),
});

export const MissionCodeSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(64 * 1024)
    .refine((code) => !code.includes('\0'), '코드에는 null 문자를 포함할 수 없습니다.'),
});

export const MAX_MISSION_RUN_INPUT_LENGTH = 64 * 1024;

export const MissionRunSchema = MissionCodeSchema.extend({
  input: z
    .string({ required_error: '표준 입력을 입력해주세요.' })
    .max(MAX_MISSION_RUN_INPUT_LENGTH, '표준 입력은 64KB 이하여야 합니다.')
    .refine((input) => !input.includes('\0'), '표준 입력에는 null 문자를 포함할 수 없습니다.'),
});

export const ExecutionDiagnosticSchema = z.object({
  kind: z.enum(EXECUTION_DIAGNOSTIC_KINDS),
  message: z.string(),
  line: z.number().int().positive().nullable(),
  column: z.number().int().positive().nullable(),
});

export const TestResultSchema = z.object({
  order: z.number().int().positive(),
  passed: z.boolean(),
  input: z.string().optional(),
  expectedOutput: z.string().optional(),
  actualOutput: z.string().optional(),
  isHidden: z.boolean(),
});

export const MissionRatingSchema = z.object({
  stars: z.number().int().min(1).max(3),
  cleared: z.boolean(),
  noHint: z.boolean(),
  firstTry: z.boolean(),
});

export const ExecutionResultSchema = z.object({
  id: z.string(),
  kind: z.enum(EXECUTION_KINDS),
  customInput: z.string().nullable(),
  status: z.enum(EXECUTION_STATUSES),
  stdout: z.string(),
  stderr: z.string(),
  exitCode: z.number().int().nullable(),
  executionTimeMs: z.number().int().nonnegative().nullable(),
  errorKind: z.enum(EXECUTION_ERROR_KINDS),
  diagnostic: ExecutionDiagnosticSchema.nullable(),
  tests: z.array(TestResultSchema),
  awardedXp: z.number().int().nonnegative(),
  completed: z.boolean(),
  rating: MissionRatingSchema.nullable(),
});

export const SubmissionResultSchema = z.object({
  id: z.string(),
  status: z.enum(SUBMISSION_STATUSES),
  stdout: z.string(),
  stderr: z.string(),
  executionTimeMs: z.number().int().nonnegative().nullable(),
  errorKind: z.enum(EXECUTION_ERROR_KINDS),
  diagnostic: ExecutionDiagnosticSchema.nullable(),
  tests: z.array(TestResultSchema),
  awardedXp: z.number().int().nonnegative(),
  completed: z.boolean(),
  rating: MissionRatingSchema.nullable(),
});

export const ChapterSchema = z.object({
  id: z.string(),
  order: z.number().int().positive(),
  title: z.string(),
  description: z.string(),
  missionCount: z.number().int().nonnegative(),
  completedCount: z.number().int().nonnegative(),
  isLocked: z.boolean(),
});

export type User = z.infer<typeof UserSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;
export type ProfileSummary = z.infer<typeof ProfileSummarySchema>;
export type CommunityUser = z.infer<typeof CommunityUserSchema>;
export type RankingEntry = z.infer<typeof RankingEntrySchema>;
export type RankingResponse = z.infer<typeof RankingResponseSchema>;
export type PublicProfile = z.infer<typeof PublicProfileSchema>;
export type FollowOverview = z.infer<typeof FollowOverviewSchema>;
export type TestCase = z.infer<typeof TestCaseSchema>;
export type Hint = z.infer<typeof HintSchema>;
export type MissionPublic = z.infer<typeof MissionPublicSchema>;
export type MissionCode = z.infer<typeof MissionCodeSchema>;
export type MissionRun = z.infer<typeof MissionRunSchema>;
export type ExecutionResult = z.infer<typeof ExecutionResultSchema>;
export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];
export type ExecutionKind = (typeof EXECUTION_KINDS)[number];
export type ExecutionErrorKind = (typeof EXECUTION_ERROR_KINDS)[number];
export type ExecutionDiagnostic = z.infer<typeof ExecutionDiagnosticSchema>;
export type SubmissionResult = z.infer<typeof SubmissionResultSchema>;
export type Chapter = z.infer<typeof ChapterSchema>;

export function normalizeOutput(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .trimEnd();
}

export function redactHiddenTests(
  results: z.infer<typeof TestResultSchema>[],
): z.infer<typeof TestResultSchema>[] {
  return results.map((result) =>
    result.isHidden ? { order: result.order, passed: result.passed, isHidden: true } : result,
  );
}
