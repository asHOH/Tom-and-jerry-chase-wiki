import { designTokens, getBuffGlobalColors, getBuffTypeColors } from '@/lib/design-tokens';
import { useMobile } from '@/hooks/useMediaQuery';
import { useDarkMode } from '@/context/DarkModeContext';
import { Buff } from '@/data/types';
import BaseCard from '@/components/ui/BaseCard';
import Tag from '@/components/ui/Tag';
import Image from '@/components/Image';

export default function BuffCardDisplay({ buff }: { buff: Buff }) {
  const [isDarkMode] = useDarkMode();
  const isMobile = useMobile();

  return (
    <BaseCard variant='item' aria-label={`查看${buff.name}效果详情`}>
      <div
        className={`${isMobile ? 'pb-1.5' : 'pb-3'} flex w-full items-center justify-center border border-dotted pt-1 text-center ${
          buff.type === '正面'
            ? 'border-green-300 dark:border-green-800'
            : buff.type === '负面'
              ? 'border-red-300 dark:border-red-800'
              : 'border-yellow-300 dark:border-yellow-800'
        }`}
      >
        {!buff.unuseImage && (
          <Image
            src={buff.imageUrl}
            alt={`${buff.name}效果图标`}
            className='h-12 w-12 object-contain'
            width={90}
            height={90}
          />
        )}
        <div className={`ml-1.5 items-center justify-center text-center`}>
          <h3
            className={`${buff.name.length >= 6 ? 'text-md' : 'text-lg'} mb-1 font-bold text-gray-800 dark:text-white`}
            style={{ whiteSpace: 'pre', height: designTokens.spacing.lg }}
          >
            {buff.name}
          </h3>
          <div
            className={`flex ${buff.unuseImage && 'justify-center'} items-center gap-0.5 text-sm text-gray-600 dark:text-gray-300`}
            role='group'
            aria-label='状态属性'
          >
            {/* 正面/负面标签 */}
            <Tag
              size='xs'
              margin='compact'
              colorStyles={getBuffTypeColors(buff.type, isDarkMode)}
              className='whitespace-nowrap'
            >
              {buff.type}
            </Tag>
            {/* 全局标签 */}
            {buff.global === true && (
              <Tag
                size='xs'
                margin='compact'
                colorStyles={getBuffGlobalColors(buff.global || false, isDarkMode)}
                className='whitespace-nowrap'
              >
                全局
              </Tag>
            )}
          </div>
        </div>
      </div>
    </BaseCard>
  );
}
