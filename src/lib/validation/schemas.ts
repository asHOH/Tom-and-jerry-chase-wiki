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

export const formatZodError = (error: z.ZodError) =>
  error.issues.map((issue) => ({
    path: issue.path.join('.') || 'root',
    message: issue.message,
  }));

export type AuthRegisterInput = z.infer<typeof authRegisterSchema>;
export type ArticleSubmitInput = z.infer<typeof articleSubmitSchema>;
export type ArticleEditPendingInput = z.infer<typeof articleEditPendingSchema>;
