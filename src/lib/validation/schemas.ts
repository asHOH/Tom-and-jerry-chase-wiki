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
});

export const articleEditPendingSchema = z.object({
  title: trimmedString,
  category: trimmedString,
  content: trimmedString,
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

const functionCallSchema = z.object({
  name: trimmedString,
  args: z.record(z.string(), z.any()).default({}),
});

const functionResponseSchema = z.object({
  name: trimmedString,
  response: z.object({
    name: trimmedString,
    content: z.any(),
  }),
});

const partSchema = z
  .object({
    text: z.string().optional(),
    functionCall: functionCallSchema.optional(),
    functionResponse: functionResponseSchema.optional(),
  })
  .refine(
    (part) => part.text || part.functionCall || part.functionResponse,
    'Part must include text or function data'
  );

const contentSchema = z.object({
  role: z.enum(['user', 'model']),
  parts: z.array(partSchema).min(1),
});

export const chatMessagesSchema = z.object({
  messages: z.array(contentSchema).min(1),
});

export const entitySnapshotSchema = z.record(z.string(), z.unknown());

const actionSchema = z.object({
  op: z.enum(['set', 'add', 'delete']),
  path: trimmedString,
  oldValue: z.any(),
  newValue: z.any(),
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

export type AuthRegisterInput = z.infer<typeof authRegisterSchema>;
export type ArticleSubmitInput = z.infer<typeof articleSubmitSchema>;
export type ArticleEditPendingInput = z.infer<typeof articleEditPendingSchema>;
