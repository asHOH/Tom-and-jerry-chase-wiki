import { Buff } from '@/data/types';
import Tag from '@/components/ui/Tag';
import { useDarkMode } from '@/context/DarkModeContext';
import { useMobile } from '@/hooks/useMediaQuery';
import BaseCard from '@/components/ui/BaseCard';
import { designTokens, getBuffGlobalColors, getBuffIsBuffColors } from '@/lib/design-tokens';
import Image from '@/components/Image';

export default function BuffCardDisplay({ buff }: { buff: Buff }) {
  const [isDarkMode] = useDarkMode();
  const isMobile = useMobile();

  return (
    <BaseCard variant='item' aria-label={`查看${buff.name}效果详情`}>
      <div
        className={`${isMobile ? 'pb-1.5' : 'pb-3'} pt-1 flex justify-center items-center text-center w-full border border-dashed border-blue-500`}
      >
        {!buff.unuseImage && (
          <Image
            src={buff.imageUrl}
            alt={`${buff.name}效果图标`}
            className='w-12 h-12 object-contain'
            width={90}
            height={90}
          />
        )}
        <div className={`ml-1.5 justify-center items-center text-center`}>
          <h3
            className={`${buff.name.length >= 6 ? 'text-md' : 'text-lg'} font-bold text-gray-800 dark:text-white mb-1`}
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
            {buff.isbuff !== undefined && (
              <Tag
                size='xs'
                margin='compact'
                colorStyles={getBuffIsBuffColors(buff.isbuff, isDarkMode)}
                className='whitespace-nowrap'
              >
                {buff.isbuff ? '正面' : '负面'}
              </Tag>
            )}
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
