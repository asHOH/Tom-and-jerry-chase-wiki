'use client';

import BaseCard from '@/components/ui/BaseCard';
import Tag from '@/components/ui/Tag';
import { useAppContext } from '@/context/AppContext';
import { useDarkMode } from '@/context/DarkModeContext';
import { Item } from '@/data/types';
import { designTokens } from '@/lib/design-tokens';
import Image from 'next/image';

export default function ItemDetailClient({ item }: { item: Item }) {
  const { isDetailedView } = useAppContext();
  const [isDarkMode] = useDarkMode();

  if (!item) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: designTokens.spacing.xl }}>
      <div className='flex flex-col md:flex-row' style={{ gap: designTokens.spacing.xl }}>
        <div className='md:w-1/3'>
          <BaseCard variant='details'>
            <div className='w-full h-64 bg-gray-200 dark:bg-slate-700 rounded-t-lg relative overflow-hidden mb-4 image-container'>
              <div className='flex items-center justify-center h-full p-3'>
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  width={200}
                  height={200}
                  style={{
                    objectFit: 'contain',
                    maxHeight: '100%',
                    maxWidth: '100%',
                    width: 'auto',
                    height: 'auto',
                  }}
                />
              </div>
            </div>
            <div style={{ padding: designTokens.spacing.md }}>
              <h1
                className='text-3xl font-bold dark:text-white'
                style={{ paddingBottom: designTokens.spacing.sm }}
              >
                {item.name}
              </h1>
              <div
                className='flex items-center flex-wrap'
                style={{
                  marginTop: designTokens.spacing.lg,
                  gap: designTokens.spacing.sm,
                }}
              >
                <Tag
                  colorStyles={
                    isDarkMode
                      ? { background: '#334155', color: '#e0e7ef' }
                      : { background: '#e0e7ef', color: '#1e293b' }
                  }
                  size='md'
                >
                  伤害: {item.damage}
                </Tag>
                {!!item.factionId && (
                  <Tag
                    colorStyles={
                      isDarkMode
                        ? { background: '#334155', color: '#e0e7ef' }
                        : { background: '#e0e7ef', color: '#1e293b' }
                    }
                    size='md'
                  >
                    道具类型: {item.factionId === 'cat' ? '猫' : '鼠'}道具
                  </Tag>
                )}
                {(item.aliases ?? []).map((alias) => (
                  <Tag
                    colorStyles={
                      isDarkMode
                        ? { background: '#334155', color: '#e0e7ef' }
                        : { background: '#e0e7ef', color: '#1e293b' }
                    }
                    size='md'
                    key={alias}
                  >
                    别名: {alias}
                  </Tag>
                ))}
              </div>
            </div>
          </BaseCard>
        </div>
        <div className='md:w-2/3'>
          <div
            className='flex items-center'
            style={{
              marginBottom: designTokens.spacing.lg,
              paddingLeft: designTokens.spacing.sm,
              paddingRight: designTokens.spacing.sm,
            }}
          >
            <h2
              className='text-2xl font-bold dark:text-white'
              style={{
                paddingTop: designTokens.spacing.sm,
                paddingBottom: designTokens.spacing.sm,
              }}
            >
              道具描述
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: designTokens.spacing.lg }}>
            <div
              className='card dark:bg-slate-800 dark:border-slate-700'
              style={{ padding: designTokens.spacing.lg }}
            >
              <div>
                <p
                  className='text-black dark:text-gray-200 text-lg'
                  style={{
                    paddingTop: designTokens.spacing.sm,
                    paddingBottom: designTokens.spacing.sm,
                  }}
                >
                  {isDetailedView && item.detailedDescription
                    ? item.detailedDescription
                    : item.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
