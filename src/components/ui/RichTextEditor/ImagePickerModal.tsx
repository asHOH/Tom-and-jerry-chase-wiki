'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

import { LoadingSpinnerIcon } from '../RichTextEditorIcons';
import { RTE_IMAGE_ALLOWED_MIME_TYPES, RTE_IMAGE_MAX_BYTES } from '@/lib/richtext/imagePolicy';

const TABS = [
  { id: 'upload', label: '上传新图片' },
  { id: 'library', label: 'Supabase 图库' },
  { id: 'site', label: '站内图片' },
] as const;

type TabId = (typeof TABS)[number]['id'];

type SupabaseImageItem = {
  name: string;
  path: string;
  publicUrl: string;
  createdAt: string | null;
  size: number | null;
  mimeType?: string | null;
};

type SiteEntry = {
  name: string;
  type: 'directory' | 'file';
  path: string;
  publicPath: string | null;
};

interface SiteImageResponse {
  basePath: string;
  currentPath: string;
  parentPath: string | null;
  entries: SiteEntry[];
}

interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  onUpload: (file: File) => Promise<string>;
  isUploading: boolean;
  allowedSourcesDescription: string;
  refreshLibraryKey: number;
}

function formatBytesForDisplay(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
}

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const IMAGE_EXT_HINT = '支持 PNG、JPEG、WEBP、AVIF、GIF';

const portalElement = typeof document !== 'undefined' ? document.body : null;

const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  onUpload,
  isUploading,
  allowedSourcesDescription,
  refreshLibraryKey,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('upload');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');

  const [libraryItems, setLibraryItems] = useState<SupabaseImageItem[]>([]);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [librarySearchTerm, setLibrarySearchTerm] = useState('');

  const [sitePath, setSitePath] = useState('');
  const [siteEntries, setSiteEntries] = useState<SiteEntry[]>([]);
  const [siteParentPath, setSiteParentPath] = useState<string | null>(null);
  const [siteError, setSiteError] = useState<string | null>(null);
  const [siteLoading, setSiteLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('upload');
      setUploadError(null);
      setManualInput('');
      setLibrarySearchTerm('');
      setSiteError(null);
      setSitePath('');
      setSiteEntries([]);
      setSiteParentPath(null);
    }
  }, [isOpen]);

  const filteredLibraryItems = useMemo(() => {
    const keyword = librarySearchTerm.trim().toLowerCase();
    if (!keyword) return libraryItems;
    return libraryItems.filter((item) => item.name.toLowerCase().includes(keyword));
  }, [libraryItems, librarySearchTerm]);

  const fetchLibraryItems = useCallback(async () => {
    setLibraryLoading(true);
    setLibraryError(null);
    try {
      const response = await fetch(`/api/uploads/rte-image?limit=60`);
      if (!response.ok) {
        throw new Error('加载失败');
      }
      const payload = (await response.json()) as { items?: SupabaseImageItem[] };
      setLibraryItems(payload.items ?? []);
    } catch (error) {
      console.error('Failed to load Supabase library', error);
      setLibraryError('加载图片列表失败，请稍后再试');
    } finally {
      setLibraryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || activeTab !== 'library') return;
    fetchLibraryItems();
  }, [isOpen, activeTab, fetchLibraryItems, refreshLibraryKey]);

  const fetchSiteEntries = useCallback(async (pathParam: string) => {
    setSiteLoading(true);
    setSiteError(null);
    try {
      const url = pathParam
        ? `/api/site-images?path=${encodeURIComponent(pathParam)}`
        : '/api/site-images';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('加载失败');
      }
      const payload = (await response.json()) as SiteImageResponse;
      setSiteEntries(payload.entries);
      setSiteParentPath(payload.parentPath);
      setSitePath(payload.currentPath);
    } catch (error) {
      console.error('Failed to load site images', error);
      setSiteError('加载站内图片失败，请稍后再试');
    } finally {
      setSiteLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || activeTab !== 'site') return;
    fetchSiteEntries(sitePath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeTab, fetchSiteEntries]);

  const handleOverlayClick = useCallback(() => {
    if (!isUploading) {
      onClose();
    }
  }, [isUploading, onClose]);

  const handleUploadInputChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setUploadError(null);
      try {
        const url = await onUpload(file);
        onSelect(url);
      } catch (error) {
        console.error('Image upload failed', error);
        setUploadError(error instanceof Error ? error.message : '上传失败，请稍后重试');
      } finally {
        event.target.value = '';
      }
    },
    [onUpload, onSelect]
  );

  const handleManualSubmit = useCallback(() => {
    const value = manualInput.trim();
    if (!value) return;
    onSelect(value);
    setManualInput('');
  }, [manualInput, onSelect]);

  const handleSupabaseSelect = useCallback(
    (item: SupabaseImageItem) => {
      onSelect(item.publicUrl);
    },
    [onSelect]
  );

  const handleSiteEntryClick = useCallback(
    (entry: SiteEntry) => {
      if (entry.type === 'directory') {
        fetchSiteEntries(entry.path);
        return;
      }
      if (entry.publicPath) {
        onSelect(entry.publicPath);
      }
    },
    [fetchSiteEntries, onSelect]
  );

  const handleNavigateUp = useCallback(() => {
    if (!siteParentPath) return;
    fetchSiteEntries(siteParentPath === '' ? '' : siteParentPath);
  }, [fetchSiteEntries, siteParentPath]);

  if (!isOpen || !portalElement) {
    return null;
  }

  const TabButton = ({ id, label }: { id: TabId; label: string }) => (
    <button
      type='button'
      onClick={() => setActiveTab(id)}
      className={clsx(
        'px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150',
        activeTab === id
          ? 'bg-blue-600 text-white shadow-sm'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
      )}
      aria-pressed={activeTab === id}
    >
      {label}
    </button>
  );

  const renderUploadTab = () => (
    <div className='space-y-4'>
      <div className='rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 p-6 text-center'>
        <p className='text-base font-semibold text-gray-900 dark:text-gray-100 mb-2'>上传新图片</p>
        <p className='text-sm text-gray-600 dark:text-gray-400 mb-4'>
          {IMAGE_EXT_HINT}，单张不超过 {formatBytesForDisplay(RTE_IMAGE_MAX_BYTES)}。
        </p>
        <label className='inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed'>
          {isUploading ? (
            <>
              <LoadingSpinnerIcon className='animate-spin mr-2 size-4' /> 上传中...
            </>
          ) : (
            '选择文件上传'
          )}
          <input
            type='file'
            accept={RTE_IMAGE_ALLOWED_MIME_TYPES.join(',')}
            className='hidden'
            onChange={handleUploadInputChange}
            disabled={isUploading}
          />
        </label>
        {uploadError && (
          <p className='mt-3 text-sm text-red-600 dark:text-red-400'>{uploadError}</p>
        )}
      </div>
      <div className='rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900'>
        <p className='text-sm text-gray-700 dark:text-gray-300'>如果已知图片 URL，可直接粘贴：</p>
        <div className='mt-2 flex gap-2'>
          <input
            type='text'
            className='flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            placeholder={allowedSourcesDescription}
            value={manualInput}
            onChange={(event) => setManualInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleManualSubmit();
              }
            }}
          />
          <button
            type='button'
            className='px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-60'
            onClick={handleManualSubmit}
            disabled={!manualInput.trim()}
          >
            插入
          </button>
        </div>
      </div>
    </div>
  );

  const renderLibraryTab = () => (
    <div className='space-y-4'>
      <div className='flex items-center justify-between gap-2'>
        <input
          type='search'
          className='flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          placeholder='搜索文件名'
          value={librarySearchTerm}
          onChange={(event) => setLibrarySearchTerm(event.target.value)}
        />
        <button
          type='button'
          onClick={fetchLibraryItems}
          className='px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        >
          刷新
        </button>
      </div>
      {libraryError && <p className='text-sm text-red-600 dark:text-red-400'>{libraryError}</p>}
      {libraryLoading ? (
        <div className='flex items-center justify-center py-10 text-gray-500 dark:text-gray-400'>
          <LoadingSpinnerIcon className='animate-spin mr-2 size-5' /> 加载中...
        </div>
      ) : filteredLibraryItems.length === 0 ? (
        <div className='py-10 text-center text-sm text-gray-500 dark:text-gray-400'>
          暂无图片，请先上传。
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[360px] overflow-y-auto pr-1'>
          {filteredLibraryItems.map((item) => (
            <button
              type='button'
              key={item.path}
              className='group rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden text-left hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
              onClick={() => handleSupabaseSelect(item)}
            >
              <div className='relative w-full aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden'>
                <img
                  src={item.publicUrl}
                  alt={item.name}
                  className='w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]'
                  loading='lazy'
                  referrerPolicy='no-referrer'
                />
              </div>
              <div className='p-3 space-y-1'>
                <p className='text-sm font-medium text-gray-900 dark:text-gray-100 truncate'>
                  {item.name}
                </p>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  {item.createdAt ? dateFormatter.format(new Date(item.createdAt)) : '未知时间'}
                </p>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  {formatBytesForDisplay(item.size)}
                  {item.mimeType ? ` · ${item.mimeType}` : ''}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderSiteTab = () => (
    <div className='space-y-4'>
      <div className='flex items-center justify-between text-sm text-gray-600 dark:text-gray-400'>
        <div>
          当前路径：
          <span className='font-mono text-gray-800 dark:text-gray-200'>
            /images{sitePath ? `/${sitePath}` : ''}
          </span>
        </div>
        <div className='space-x-2'>
          <button
            type='button'
            onClick={() => fetchSiteEntries('')}
            className='px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
          >
            回到根目录
          </button>
          <button
            type='button'
            onClick={handleNavigateUp}
            disabled={!siteParentPath && siteParentPath !== ''}
            className='px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            返回上一级
          </button>
        </div>
      </div>
      {siteError && <p className='text-sm text-red-600 dark:text-red-400'>{siteError}</p>}
      {siteLoading ? (
        <div className='flex items-center justify-center py-10 text-gray-500 dark:text-gray-400'>
          <LoadingSpinnerIcon className='animate-spin mr-2 size-5' /> 加载中...
        </div>
      ) : siteEntries.length === 0 ? (
        <div className='py-10 text-center text-sm text-gray-500 dark:text-gray-400'>
          该目录下暂无可用图片。
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto pr-1'>
          {siteEntries.map((entry) => (
            <button
              type='button'
              key={entry.path}
              onClick={() => handleSiteEntryClick(entry)}
              className='flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-left hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              {entry.type === 'directory' ? (
                <div className='flex h-12 w-12 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300'>
                  📁
                </div>
              ) : (
                <div className='h-12 w-12 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center'>
                  <img
                    src={entry.publicPath ?? ''}
                    alt={entry.name}
                    className='max-h-full max-w-full object-contain'
                    loading='lazy'
                  />
                </div>
              )}
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-medium text-gray-900 dark:text-gray-100 truncate'>
                  {entry.name}
                </p>
                <p className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                  {entry.type === 'directory'
                    ? '目录'
                    : (entry.publicPath?.replace(/^\//, '') ?? '文件')}
                </p>
              </div>
              <span className='text-xs text-gray-400 dark:text-gray-500'>
                {entry.type === 'directory' ? '打开' : '插入'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return createPortal(
    <div className='fixed inset-0 z-[120] flex items-center justify-center p-4'>
      <div className='absolute inset-0 bg-black/60' onClick={handleOverlayClick} />
      <div
        role='dialog'
        aria-modal='true'
        className='relative z-10 w-full max-w-4xl rounded-lg bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700'
        onClick={(event) => event.stopPropagation()}
      >
        <div className='flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4'>
          <div>
            <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>插入图片</h2>
            <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
              {allowedSourcesDescription}
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            aria-label='关闭图片选择器'
          >
            ✕
          </button>
        </div>
        <div className='px-6 py-4 space-y-4'>
          <div className='flex flex-wrap gap-2'>
            {TABS.map((tab) => (
              <TabButton key={tab.id} id={tab.id} label={tab.label} />
            ))}
          </div>
          {activeTab === 'upload' && renderUploadTab()}
          {activeTab === 'library' && renderLibraryTab()}
          {activeTab === 'site' && renderSiteTab()}
        </div>
        <div className='border-t border-gray-200 dark:border-gray-700 px-6 py-3 flex justify-end'>
          <button
            type='button'
            onClick={onClose}
            className='px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          >
            关闭
          </button>
        </div>
      </div>
    </div>,
    portalElement
  );
};

export default ImagePickerModal;
