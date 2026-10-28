import type { ArticleEditInfoResponse } from '@/lib/articles/editSources';
import Button from '@/components/ui/Button';
import Notice from '@/components/ui/Notice';
import RichTextDisplay from '@/components/ui/RichTextDisplay';

type ArticleConflictNoticeProps = {
  snapshot: ArticleEditInfoResponse | null;
  categories: readonly { id: string; name: string }[];
  busy: boolean;
  onLoad: () => void;
  onConfirm: () => void;
};

export default function ArticleConflictNotice({
  snapshot,
  categories,
  busy,
  onLoad,
  onConfirm,
}: ArticleConflictNoticeProps) {
  return (
    <Notice variant='warning' className='mx-auto max-w-4xl space-y-4 p-4'>
      <p>
        当前草稿需要核对编辑起点。请对照最新公开内容和待审核内容，在下方草稿中手动合并需要保留的修改。
      </p>
      <Button disabled={busy} onClick={onLoad}>
        获取最新版本用于核对
      </Button>
      {snapshot && (
        <>
          {!snapshot.edit_sources.approved && <p>这篇文章当前尚未公开。</p>}
          {(['approved', 'pending_mine'] as const).map((source) => {
            const version = snapshot.edit_sources[source];
            return (
              version && (
                <details key={source} open className='rounded border p-3'>
                  <summary className='cursor-pointer font-semibold'>
                    {source === 'approved' ? '当前公开版本' : '当前待审核版本'}：{version.title}
                  </summary>
                  <p className='my-2 text-sm'>
                    分类：
                    {categories.find((category) => category.id === version.category_id)?.name ??
                      '未知分类'}
                    ；角色：{version.character_id ?? '无角色绑定'}
                  </p>
                  <RichTextDisplay content={version.content} />
                </details>
              )
            );
          })}
          <Button disabled={busy} onClick={onConfirm}>
            已核对并合并，保留草稿更新编辑起点
          </Button>
        </>
      )}
    </Notice>
  );
}
