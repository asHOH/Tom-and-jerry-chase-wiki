export type PublicNotice = {
  id: string;
  title: string;
  contentHtml: string;
  startsAt: string;
  endsAt: string | null;
};

export type AdminNotice = PublicNotice & {
  isPublished: boolean;
  createdBy: string;
  createdByNickname: string | null;
  updatedBy: string;
  updatedByNickname: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NoticeStatus = 'active' | 'scheduled' | 'expired' | 'unpublished';

export const getNoticeStatus = (
  notice: Pick<AdminNotice, 'isPublished' | 'startsAt' | 'endsAt'>,
  now = Date.now()
): NoticeStatus => {
  if (!notice.isPublished) return 'unpublished';
  if (new Date(notice.startsAt).getTime() > now) return 'scheduled';
  if (notice.endsAt && new Date(notice.endsAt).getTime() <= now) return 'expired';
  return 'active';
};
