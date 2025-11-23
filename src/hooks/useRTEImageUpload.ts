import { useCallback, useState } from 'react';
import { useToast } from '@/context/ToastContext';

import {
  normalizeHostedImageUrl,
  RTE_IMAGE_ALLOWED_MIME_TYPES,
  RTE_IMAGE_MAX_BYTES,
} from '@/lib/richtext/imagePolicy';

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
}

export function useRTEImageUpload() {
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [libraryRefreshKey, setLibraryRefreshKey] = useState(0);
  const { error: showError } = useToast();

  const uploadImageFile = useCallback(
    async (file: File) => {
      if (!RTE_IMAGE_ALLOWED_MIME_TYPES.includes(file.type)) {
        showError('仅支持上传 PNG、JPEG、WEBP、AVIF 或 GIF 图片');
        throw new Error('Invalid file type');
      }
      if (file.size > RTE_IMAGE_MAX_BYTES) {
        const msg = `图片大小需小于 ${formatBytes(RTE_IMAGE_MAX_BYTES)}，当前为 ${formatBytes(file.size)}`;
        showError(msg);
        throw new Error(msg);
      }

      const formData = new FormData();
      formData.append('file', file, file.name);
      setIsUploadingImage(true);

      try {
        const response = await fetch('/api/uploads/rte-image', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          const text = await response.text();
          try {
            const payload = JSON.parse(text) as { error?: string };
            throw new Error(payload.error || '上传失败');
          } catch (error) {
            if (error instanceof SyntaxError) {
              throw new Error(text || '上传失败');
            }
            throw error;
          }
        }
        const result = (await response.json()) as { publicUrl?: string };
        if (!result?.publicUrl) {
          throw new Error('上传失败，未返回图片地址');
        }
        const normalized = normalizeHostedImageUrl(result.publicUrl);
        if (!normalized) {
          throw new Error('上传的图片地址未通过安全校验');
        }
        setLibraryRefreshKey((key) => key + 1);
        return normalized;
      } catch (err) {
        const msg = err instanceof Error ? err.message : '上传失败';
        if (msg !== 'Invalid file type' && !msg.includes('图片大小需小于')) {
          showError(msg);
        }
        throw err;
      } finally {
        setIsUploadingImage(false);
      }
    },
    [showError]
  );

  return {
    isUploadingImage,
    libraryRefreshKey,
    uploadImageFile,
  };
}
