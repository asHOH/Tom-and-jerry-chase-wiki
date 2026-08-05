import { z } from 'zod';

import { hasNoticeText, sanitizeNoticeHTML } from './sanitize';

const noticeFields = {
  title: z.string().trim().min(1).max(120),
  contentHtml: z.string().min(1).max(50000),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }).nullable(),
};

const hasValidSchedule = ({ startsAt, endsAt }: { startsAt: string; endsAt: string | null }) =>
  !endsAt || new Date(endsAt).getTime() > new Date(startsAt).getTime();

export const noticeMutationSchema = z.object(noticeFields).refine(hasValidSchedule, {
  message: 'End time must be after start time',
  path: ['endsAt'],
});

export const noticePatchSchema = z.union([
  z.object({ ...noticeFields, operation: z.literal('save') }).refine(hasValidSchedule, {
    message: 'End time must be after start time',
    path: ['endsAt'],
  }),
  z.object({ operation: z.literal('unpublish') }),
]);

export type ValidatedNoticeInput = z.infer<typeof noticeMutationSchema>;

export const sanitizeNoticeInput = (
  input: ValidatedNoticeInput
): (ValidatedNoticeInput & { contentHtml: string }) | null => {
  const contentHtml = sanitizeNoticeHTML(input.contentHtml);
  if (!hasNoticeText(contentHtml) || contentHtml.length > 50000) return null;
  return { ...input, contentHtml };
};
