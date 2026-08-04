import { z } from 'zod';

const trimmedString = z.string().trim().min(1);

export const authRegisterSchema = z.object({
  username: trimmedString,
  nickname: trimmedString,
  password: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  captchaToken: trimmedString,
});

export const articleSubmitSchema = z.object({
  title: trimmedString,
  category: trimmedString,
  content: trimmedString,
  character_id: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  contributionTermsAccepted: z.literal(true),
});

export const articleEditPendingSchema = z.object({
  title: trimmedString,
  category: trimmedString,
  content: trimmedString,
});

export const COMMENT_SCOPES = [
  'articles',
  'characters',
  'knowledge_cards',
  'entities',
  'items',
  'buffs',
  'maps',
  'fixtures',
  'modes',
  'achievements',
  'special_skills',
  'list_pages',
] as const;

export type CommentScope = (typeof COMMENT_SCOPES)[number];

export const commentsListQuerySchema = z.object({
  scope: z.enum(COMMENT_SCOPES),
  targetId: z.string().trim().min(1),
  topicsOnly: z
    .string()
    .trim()
    .transform((val) => val === 'true')
    .optional(),
  limit: z
    .string()
    .trim()
    .transform((val) => Number.parseInt(val, 10))
    .pipe(z.number().int().min(1).max(200))
    .catch(50)
    .optional(),
});

export const createCommentSchema = z.object({
  scope: z.enum(COMMENT_SCOPES),
  targetId: z.string().trim().min(1),
  parentId: z
    .string()
    .uuid()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  content: z.string().trim().min(1).max(2000),
  title: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  communityRulesAccepted: z.literal(true),
});

export const patchCommentSchema = z.object({
  commentId: z.string().uuid().trim(),
  status: z.enum(['visible', 'hidden', 'deleted']),
});

export const feedbackSchema = z.object({
  type: z.enum(['suggestion', 'bug', 'data', 'other']).default('other'),
  content: trimmedString,
  contact: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
});

const actionSchema = z.object({
  op: z.enum(['set', 'add', 'delete']),
  path: trimmedString,
  oldValue: z.any().optional(),
  newValue: z.any().optional(),
});

export const actionHistoryEntrySchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([actionSchema, z.array(actionSchema)])
);

export const actionHistorySchema = z.array(actionHistoryEntrySchema);

const intFromString = (fallback: number, max: number) =>
  z
    .string()
    .trim()
    .transform((val) => Number.parseInt(val, 10))
    .pipe(z.number().int().min(1).max(max))
    .catch(fallback);

export const rteImageListQuerySchema = z.object({
  limit: intFromString(30, 60).optional(),
  scope: z.enum(['all', 'mine']).default('mine'),
  search: z
    .string()
    .trim()
    .transform((value) => (value && value.length > 0 ? value : undefined))
    .optional(),
});

export const articleRecordSchema = z.object({
  id: trimmedString,
  title: trimmedString,
  category_id: trimmedString,
  author_id: trimmedString,
  created_at: trimmedString,
  view_count: z.number().int().nonnegative().nullable().optional(),
  categories: z.object({
    name: trimmedString,
  }),
  users_public_view: z.object({
    nickname: trimmedString,
  }),
});

export const articleVersionSchema = z.object({
  id: trimmedString,
  content: trimmedString,
  created_at: trimmedString,
  editor_id: trimmedString,
  users_public_view: z.object({
    nickname: trimmedString.optional(),
  }),
});

export const formatZodError = (error: z.ZodError) =>
  error.issues.map((issue) => ({
    path: issue.path.join('.') || 'root',
    message: issue.message,
  }));
