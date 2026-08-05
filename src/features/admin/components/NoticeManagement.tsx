'use client';

import { useState } from 'react';

import { sanitizeNoticeHTML } from '@/lib/notices/sanitize';
import { getNoticeStatus, type AdminNotice, type NoticeStatus } from '@/lib/notices/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { FormInput } from '@/components/ui/FormControls';
import Notice from '@/components/ui/Notice';
import { renderRichTextContent } from '@/components/ui/RichTextContent';
import RichTextEditor from '@/components/ui/RichTextEditor';

type Props = {
  notices: AdminNotice[];
  mutateNotices: () => Promise<unknown> | unknown;
};

type FormState = {
  title: string;
  contentHtml: string;
  startsAt: string;
  endsAt: string;
};

const pad = (value: number) => String(value).padStart(2, '0');

const toLocalDateTime = (iso?: string | null) => {
  const date = iso ? new Date(iso) : new Date();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const emptyForm = (): FormState => ({
  title: '',
  contentHtml: '',
  startsAt: toLocalDateTime(),
  endsAt: '',
});

const statusLabels: Record<NoticeStatus, string> = {
  active: '展示中',
  scheduled: '待展示',
  expired: '已过期',
  unpublished: '未发布',
};

const statusClasses: Record<NoticeStatus, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  expired: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  unpublished: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

const formatDateTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('zh-CN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    : '不限';

export default function NoticeManagement({ notices, mutateNotices }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const reset = () => {
    setEditingId(null);
    setForm(emptyForm());
  };

  const startEdit = (notice: AdminNotice) => {
    const status = getNoticeStatus(notice);
    setEditingId(notice.id);
    setForm({
      title: notice.title,
      contentHtml: notice.contentHtml,
      startsAt:
        status === 'unpublished' || status === 'expired'
          ? toLocalDateTime()
          : toLocalDateTime(notice.startsAt),
      endsAt:
        status === 'unpublished' || status === 'expired'
          ? ''
          : notice.endsAt
            ? toLocalDateTime(notice.endsAt)
            : '',
    });
    setMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const request = async (url: string, method: string, body?: unknown) => {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) throw new Error(result?.error ?? '操作失败');
  };

  const save = async () => {
    if (!form.title.trim() || !form.contentHtml.trim() || !form.startsAt) {
      setMessage({ text: '请填写标题、内容和开始时间。', error: true });
      return;
    }
    const startsAt = new Date(form.startsAt);
    const endsAt = form.endsAt ? new Date(form.endsAt) : null;
    if (Number.isNaN(startsAt.getTime()) || (endsAt && endsAt <= startsAt)) {
      setMessage({ text: '结束时间必须晚于开始时间。', error: true });
      return;
    }

    setIsSaving(true);
    try {
      const body = {
        title: form.title.trim(),
        contentHtml: form.contentHtml,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt?.toISOString() ?? null,
      };
      await request(
        editingId ? `/api/admin/notices/${editingId}` : '/api/admin/notices',
        editingId ? 'PATCH' : 'POST',
        editingId ? { operation: 'save', ...body } : body
      );
      setMessage({ text: editingId ? '公告已保存并发布。' : '公告已创建并发布。' });
      reset();
      await mutateNotices();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : '保存公告失败', error: true });
    } finally {
      setIsSaving(false);
    }
  };

  const unpublish = async (notice: AdminNotice) => {
    if (!window.confirm(`确认取消发布“${notice.title}”？`)) return;
    try {
      await request(`/api/admin/notices/${notice.id}`, 'PATCH', { operation: 'unpublish' });
      if (editingId === notice.id) reset();
      setMessage({ text: '公告已取消发布。' });
      await mutateNotices();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : '取消发布失败', error: true });
    }
  };

  const deleteNotice = async (notice: AdminNotice) => {
    if (!window.confirm(`确认永久删除“${notice.title}”？此操作无法恢复。`)) return;
    try {
      await request(`/api/admin/notices/${notice.id}`, 'DELETE');
      if (editingId === notice.id) reset();
      setMessage({ text: '公告已删除。' });
      await mutateNotices();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : '删除公告失败', error: true });
    }
  };

  return (
    <div className='grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(22rem,0.75fr)]'>
      <Card className='h-fit space-y-4'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <h2 className='text-xl font-semibold text-slate-900 dark:text-white'>
              {editingId ? '编辑公告' : '发布公告'}
            </h2>
            <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
              保存后立即发布，未来的开始时间会自动排期。
            </p>
          </div>
          {editingId && (
            <Button variant='secondary' size='sm' onClick={reset}>
              取消编辑
            </Button>
          )}
        </div>

        {message && <Notice variant={message.error ? 'error' : 'success'}>{message.text}</Notice>}

        <label className='block space-y-1.5 text-sm font-medium'>
          <span>标题</span>
          <FormInput
            value={form.title}
            maxLength={120}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder='公告标题'
          />
        </label>

        <div className='grid gap-3 sm:grid-cols-2'>
          <label className='block space-y-1.5 text-sm font-medium'>
            <span>开始时间</span>
            <FormInput
              type='datetime-local'
              value={form.startsAt}
              onChange={(event) =>
                setForm((current) => ({ ...current, startsAt: event.target.value }))
              }
            />
          </label>
          <label className='block space-y-1.5 text-sm font-medium'>
            <span>结束时间（可选）</span>
            <FormInput
              type='datetime-local'
              value={form.endsAt}
              onChange={(event) =>
                setForm((current) => ({ ...current, endsAt: event.target.value }))
              }
            />
          </label>
        </div>

        <div className='space-y-1.5'>
          <span className='text-sm font-medium'>内容</span>
          <RichTextEditor
            preset='notice'
            content={form.contentHtml}
            onChange={(contentHtml) => setForm((current) => ({ ...current, contentHtml }))}
            placeholder='<p>请输入公告内容</p>'
          />
        </div>

        {form.contentHtml && (
          <div className='rounded-lg border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900/60 dark:bg-blue-950/20'>
            <p className='mb-2 text-xs font-semibold tracking-wide text-blue-600 uppercase dark:text-blue-300'>
              首页预览
            </p>
            <h3 className='font-semibold text-slate-900 dark:text-white'>
              {form.title || '公告标题'}
            </h3>
            <div className='prose prose-sm dark:prose-invert mt-2 max-w-none'>
              {renderRichTextContent(sanitizeNoticeHTML(form.contentHtml))}
            </div>
          </div>
        )}

        <Button onClick={save} loading={isSaving}>
          {editingId ? '保存并发布' : '发布公告'}
        </Button>
      </Card>

      <div className='space-y-3'>
        <div className='flex items-end justify-between gap-3'>
          <div>
            <h2 className='text-xl font-semibold text-slate-900 dark:text-white'>全部公告</h2>
            <p className='text-sm text-slate-500 dark:text-slate-400'>{notices.length} 条记录</p>
          </div>
        </div>
        {notices.length === 0 ? (
          <Card className='text-center text-sm text-slate-500 dark:text-slate-400'>暂无公告</Card>
        ) : (
          notices.map((notice) => {
            const status = getNoticeStatus(notice);
            return (
              <Card key={notice.id} bordered className='space-y-3'>
                <div className='flex items-start justify-between gap-3'>
                  <h3 className='font-semibold text-slate-900 dark:text-white'>{notice.title}</h3>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses[status]}`}
                  >
                    {statusLabels[status]}
                  </span>
                </div>
                <dl className='grid gap-1 text-xs text-slate-500 dark:text-slate-400'>
                  <div>
                    <dt className='inline'>开始：</dt>
                    <dd className='inline'>{formatDateTime(notice.startsAt)}</dd>
                  </div>
                  <div>
                    <dt className='inline'>结束：</dt>
                    <dd className='inline'>{formatDateTime(notice.endsAt)}</dd>
                  </div>
                  <div>
                    <dt className='inline'>最后修改：</dt>
                    <dd className='inline'>
                      {notice.updatedByNickname ?? notice.updatedBy} ·{' '}
                      {formatDateTime(notice.updatedAt)}
                    </dd>
                  </div>
                </dl>
                <div className='flex flex-wrap gap-2'>
                  <Button size='sm' variant='secondary' onClick={() => startEdit(notice)}>
                    {status === 'unpublished' || status === 'expired' ? '编辑并重新发布' : '编辑'}
                  </Button>
                  {notice.isPublished ? (
                    <Button size='sm' variant='danger' onClick={() => unpublish(notice)}>
                      取消发布
                    </Button>
                  ) : (
                    <Button size='sm' variant='danger' onClick={() => deleteNotice(notice)}>
                      永久删除
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
