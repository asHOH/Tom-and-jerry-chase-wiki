'use client';

import BaseCard from '@/components/ui/BaseCard';
import Tag from '@/components/ui/Tag';
import { useDarkMode } from '@/context/DarkModeContext';
import { Buff } from '@/data/types';
import {
  designTokens,
  componentTokens,
  getBuffGlobalColors,
  getBuffIsBuffColors,
} from '@/lib/design-tokens';
import GameImage from '@/components/ui/GameImage';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import { useMobile } from '@/hooks/useMediaQuery';
import {} from '@/lib/design-tokens';
import TextWithHoverTooltips from '../../characters/shared/TextWithHoverTooltips';

export default function BuffAttributesCard({ buff }: { buff: Buff }) {
  const [isDarkMode] = useDarkMode();
  const isMobile = useMobile();
  const spacing = designTokens.spacing;
  if (!buff) return null;

  const avilableAliases = (buff.aliases ?? [])
    .filter((i) => i[0] !== '#')
    .map((i) => {
      return i[0] === '%' ? i.replace(/[%\^\$\.\*\+\?\[\]\(\)\{\}\\]/g, '') : i; //移除"%"和部分常用元字符
    });

  const avilableRelate = (buff.relate ?? []).filter(Boolean);

  return (
    <BaseCard variant='details'>
      {/*------Image ,Name and Type------*/}
      {isMobile && (
        <div>
          <div
            className={`auto-fit-grid grid-container grid`}
            style={{
              gridTemplateColumns: `5rem repeat(auto-fit, minmax(1px,1fr))`,
            }}
          >
            <GameImage
              src={buff.imageUrl}
              alt={buff.name}
              size={'CARD_DETAILS'}
              style={{
                height: isMobile ? '6rem' : undefined,
                borderRadius: componentTokens.image.container.borderRadius.replace(/ .*? /, ' 0 '),
              }}
            />
            <div>
              <h1
                className='text-2xl font-bold dark:text-white'
                style={{
                  paddingTop: spacing.xs,
                }}
              >
                {buff.name}{' '}
              </h1>
              {/* 删除 buffclass 显示 */}
              {avilableAliases.length > 0 && (
                <h1
                  className={`text-xs text-gray-400 dark:text-gray-500 ${isMobile ? '' : 'mt-2'}`}
                >
                  别名: {avilableAliases.filter(Boolean).join('、')}
                </h1>
              )}
            </div>
          </div>
        </div>
      )}
      {!isMobile && (
        <div
          style={{
            paddingBottom: spacing.xxxxxs,
          }}
        >
          <GameImage src={buff.imageUrl} alt={buff.name} size={'CARD_DETAILS'} />
          <div
            style={{
              paddingLeft: spacing.md,
              paddingRight: spacing.md,
              paddingTop: spacing.xs,
            }}
          >
            <h1 className='text-3xl font-bold dark:text-white'>{buff.name} </h1>
          </div>
          {avilableAliases.length > 0 && (
            <div
              className='text-sm text-gray-400 dark:text-gray-500'
              style={{
                marginLeft: spacing.md,
                marginRight: spacing.md,
              }}
            >
              别名: {avilableAliases.filter(Boolean).join('、')}
            </div>
          )}
        </div>
      )}
      {/*------Item Attributes------*/}
      <div
        className='grid items-center border-t border-gray-300 dark:border-gray-600 gap-1'
        style={{
          marginLeft: spacing.md,
          marginRight: spacing.md,
          paddingTop: spacing.xxxxxs,
          paddingBottom: spacing.xxxxxs,
        }}
      >
        <div className='text-sm font-normal gap-1 flex flex-wrap items-center'>
          <span className={`text-sm whitespace-pre`}>类型: </span>
          {/* 使用 isbuff 属性 */}
          {buff.isbuff !== undefined && (
            <Tag
              size='sm'
              margin='compact'
              colorStyles={getBuffIsBuffColors(buff.isbuff, isDarkMode)}
            >
              {buff.isbuff ? '正面' : '负面'}
            </Tag>
          )}
          {/* 使用 global 属性 */}
          {buff.global === true && (
            <Tag
              size='sm'
              margin='compact'
              colorStyles={getBuffGlobalColors(buff.global || false, isDarkMode)}
            >
              全局
            </Tag>
          )}
        </div>

        {(buff.duration !== undefined ||
          buff.failure !== undefined ||
          buff.relate !== undefined) && (
          <div className='border-t border-gray-300 dark:border-gray-600 pt-1'>
            <span className='text-lg font-bold whitespace-pre'>基础信息</span>
            <div
              className='auto-fill-grid grid-container grid text-sm font-normal gap-1 items-center justify-center'
              style={{
                gridTemplateColumns: `repeat(1, minmax(80px, 1fr))`,
              }}
            >
              {buff.duration !== undefined && (
                <span className={`text-sm whitespace-pre`}>
                  {buff.duration === 'disposable' ? (
                    <>
                      该效果为
                      <span className={`text-fuchsia-600 dark:text-fuchsia-400`}>一次性效果</span>
                    </>
                  ) : (
                    <>
                      持续时间：
                      <span className={`text-indigo-700 dark:text-indigo-400`}>
                        {buff.duration === 'infinite' ? '无限' : `${buff.duration}秒`}
                      </span>
                    </>
                  )}
                </span>
              )}
              {buff.failure !== undefined && (
                <span className={`text-sm`}>
                  中止条件：
                  <span className={`text-orange-600 dark:text-orange-400`}>{buff.failure}</span>
                </span>
              )}
              {avilableRelate.length > 0 && (
                <span className={`text-sm`}>
                  相关效果：
                  {avilableRelate.map((name, index) => (
                    <span className={`text-indigo-700 dark:text-indigo-400`} key={index}>
                      <TextWithHoverTooltips text={`{${name}}`} />
                      {index === avilableRelate.length - 1 ? '' : '、'}
                    </span>
                  ))}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/*Navigation */}
      <div
        className='flex items-center flex-wrap border-t text-sm border-gray-300 dark:border-gray-600'
        style={{
          gap: spacing.sm,
          marginLeft: spacing.md,
          marginRight: spacing.md,
          paddingTop: spacing.xs,
          paddingBottom: spacing.md,
        }}
      >
        <SpecifyTypeNavigationButtons currentId={buff.name} specifyType='buff' />
      </div>
    </BaseCard>
  );
}
