'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

import { useMobile } from '@/hooks/useMediaQuery';

type LandscapeOrientationPromptProps = {
  fullscreenTargetRef: RefObject<HTMLElement | null>;
};

export default function LandscapeOrientationPrompt({
  fullscreenTargetRef,
}: LandscapeOrientationPromptProps) {
  const isMobile = useMobile();
  const [isPortrait, setIsPortrait] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [lockMessage, setLockMessage] = useState('');
  const [isOrientationIgnored, setIsOrientationIgnored] = useState(false);
  const orientationWasLocked = useRef(false);

  useEffect(() => {
    const query = window.matchMedia('(orientation: portrait)');
    const updateOrientation = () => setIsPortrait(query.matches);

    updateOrientation();
    query.addEventListener('change', updateOrientation);
    return () => query.removeEventListener('change', updateOrientation);
  }, []);

  const lockLandscape = useCallback(async () => {
    if (typeof screen.orientation?.lock !== 'function') return false;

    try {
      await screen.orientation.lock('landscape');
      orientationWasLocked.current = true;
      return true;
    } catch (error) {
      console.warn('无法锁定交互地图横屏方向：', error);
      return false;
    }
  }, []);

  useEffect(() => {
    if (!isMobile || !isPortrait) return;
    void lockLandscape();
  }, [isMobile, isPortrait, lockLandscape]);

  useEffect(() => {
    const target = fullscreenTargetRef.current;

    return () => {
      if (orientationWasLocked.current) screen.orientation.unlock();

      if (target && document.fullscreenElement === target) {
        void document.exitFullscreen().catch((error: unknown) => {
          console.warn('退出交互地图全屏失败：', error);
        });
      }
    };
  }, [fullscreenTargetRef]);

  const handleLockRequest = async () => {
    setIsLocking(true);
    setLockMessage('');

    const target = fullscreenTargetRef.current;
    if (target && !document.fullscreenElement && typeof target.requestFullscreen === 'function') {
      try {
        await target.requestFullscreen({ navigationUI: 'hide' });
      } catch (error) {
        console.warn('无法进入交互地图全屏：', error);
      }
    }

    const locked = await lockLandscape();
    if (!locked) {
      setLockMessage('当前浏览器不支持自动锁定，请关闭系统方向锁定后将设备横置。');
    }
    setIsLocking(false);
  };

  const handleIgnoreOrientation = () => {
    if (orientationWasLocked.current) {
      screen.orientation.unlock();
      orientationWasLocked.current = false;
    }
    setIsOrientationIgnored(true);
  };

  if (!isMobile || !isPortrait || isOrientationIgnored) return null;

  return (
    <div
      className='absolute inset-0 z-[1200] flex items-center justify-center bg-slate-950/98 p-6 text-center text-white'
      role='dialog'
      aria-modal='true'
      aria-labelledby='interactive-map-orientation-title'
    >
      <div className='max-w-sm space-y-4'>
        <div className='mx-auto flex size-16 items-center justify-center rounded-2xl border border-cyan-300/40 bg-cyan-400/10 text-3xl text-cyan-200'>
          ↔
        </div>
        <div className='space-y-2'>
          <h1 id='interactive-map-orientation-title' className='text-xl font-semibold'>
            建议横屏使用交互地图
          </h1>
          <p className='text-sm leading-6 text-slate-300'>
            地图内容较宽，横屏后可以看到更完整的地图和点位。
          </p>
        </div>
        <button
          type='button'
          className='w-full rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950 shadow-lg shadow-cyan-950/40 transition hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-70'
          onClick={handleLockRequest}
          disabled={isLocking}
        >
          {isLocking ? '正在尝试切换横屏…' : '尝试锁定横屏'}
        </button>
        <p className='text-xs leading-5 text-slate-400' aria-live='polite'>
          {lockMessage || '如果设备未自动旋转，请关闭系统方向锁定后将设备横置。'}
        </p>
        <button
          type='button'
          className='text-sm text-slate-300 underline decoration-slate-500 underline-offset-4 hover:text-white'
          onClick={handleIgnoreOrientation}
          disabled={isLocking}
        >
          忽略提示，继续使用
        </button>
      </div>
    </div>
  );
}
