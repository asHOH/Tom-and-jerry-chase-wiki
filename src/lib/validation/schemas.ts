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

export const formatZodError = (error: z.ZodError) =>
  error.issues.map((issue) => ({
    path: issue.path.join('.') || 'root',
    message: issue.message,
  }));

export type AuthRegisterInput = z.infer<typeof authRegisterSchema>;
export type ArticleSubmitInput = z.infer<typeof articleSubmitSchema>;
export type ArticleEditPendingInput = z.infer<typeof articleEditPendingSchema>;
