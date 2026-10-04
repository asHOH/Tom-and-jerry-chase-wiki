'use client';

import { usePreparedComponent } from '@/hooks/usePreparedComponent';
import { editToolbarModule } from '@/components/panelModules';

import Button from './Button';
import type { EditModeToolbarProps } from './EditModeToolbar';

export default function PreparedEditModeToolbar(props: EditModeToolbarProps) {
  const { Component: Toolbar, error, retry } = usePreparedComponent(editToolbarModule, true);
  if (Toolbar) return <Toolbar {...props} />;

  return (
    <div className='bg-surface-raised text-foreground fixed inset-x-0 bottom-4 z-50 mx-4 flex flex-wrap items-center justify-center gap-2 rounded-lg p-3 shadow-lg md:mx-auto md:w-fit'>
      <span role='status'>{error ? '编辑工具加载失败' : '正在准备编辑工具…'}</span>
      {error && <Button onClick={retry}>重试</Button>}
      <Button variant='secondary' onClick={props.onExitEditMode}>
        退出编辑
      </Button>
    </div>
  );
}
