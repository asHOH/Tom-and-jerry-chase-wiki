'use client';

import BaseCard from '@/components/ui/BaseCard';
import Tag from '@/components/ui/Tag';
import { useAppContext } from '@/context/AppContext';
import { useDarkMode } from '@/context/DarkModeContext';
import { Item } from '@/data/types';
import { designTokens } from '@/lib/design-tokens';
import Image from '@/components/Image';

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
                <span className='text-xl font-normal text-gray-400 dark:text-gray-500'>
                  ({item.itemtype}
                  {item.itemsource})
                </span>
              </h1>
              <div
                className='flex items-center flex-wrap'
                style={{
                  marginTop: designTokens.spacing.lg,
                  gap: designTokens.spacing.sm,
                }}
              >
                {item.factionId != undefined && (
                  <Tag
                    colorStyles={
                      isDarkMode
                        ? { background: '#334155', color: '#e0e7ef' }
                        : { background: '#e0e7ef', color: '#1e293b' }
                    }
                    size='md'
                  >
                    {item.factionId == 'cat' ? '只能被猫咪使用' : '只能被老鼠使用'}
                  </Tag>
                )}
                {item.damage != undefined && (
                  <Tag
                    colorStyles={
                      isDarkMode
                        ? { background: '#334155', color: '#e0e7ef' }
                        : { background: '#e0e7ef', color: '#1e293b' }
                    }
                    size='md'
                  >
                    伤害： {item.damage}
                  </Tag>
                )}
                {item.walldamage != undefined && (
                  <Tag
                    colorStyles={
                      isDarkMode
                        ? { background: '#334155', color: '#e0e7ef' }
                        : { background: '#e0e7ef', color: '#1e293b' }
                    }
                    size='md'
                  >
                    对墙缝伤害： {item.walldamage}
                  </Tag>
                )}
                {item.exp != undefined && (
                  <Tag
                    colorStyles={
                      isDarkMode
                        ? { background: '#334155', color: '#e0e7ef' }
                        : { background: '#e0e7ef', color: '#1e293b' }
                    }
                    size='md'
                  >
                    {item.exp == 0
                      ? '（猫）命中时不会获得经验'
                      : `（猫）命中时获得经验：${item.exp}`}
                  </Tag>
                )}
                {item.store != undefined && (
                  <Tag
                    colorStyles={
                      isDarkMode
                        ? { background: '#334155', color: '#e0e7ef' }
                        : { background: '#e0e7ef', color: '#1e293b' }
                    }
                    size='md'
                  >
                    {item.store == true ? '可从局内商店购买' : '无法从局内商店购买'}
                  </Tag>
                )}
                {!!item.price && (
                  <Tag
                    colorStyles={
                      isDarkMode
                        ? { background: '#334155', color: '#e0e7ef' }
                        : { background: '#e0e7ef', color: '#1e293b' }
                    }
                    size='md'
                  >
                    商店价格： {item.price}
                  </Tag>
                )}
                {!!item.storeCD && (
                  <Tag
                    colorStyles={
                      isDarkMode
                        ? { background: '#334155', color: '#e0e7ef' }
                        : { background: '#e0e7ef', color: '#1e293b' }
                    }
                    size='md'
                  >
                    购买CD： {item.storeCD}秒
                  </Tag>
                )}
                {item.teamCD != undefined && (
                  <Tag
                    colorStyles={
                      isDarkMode
                        ? { background: '#334155', color: '#e0e7ef' }
                        : { background: '#e0e7ef', color: '#1e293b' }
                    }
                    size='md'
                  >
                    {item.teamCD == true ? '团队共享购买冷却' : '单独计算购买冷却'}
                  </Tag>
                )}
                {item.unlocktime != undefined && (
                  <Tag
                    colorStyles={
                      isDarkMode
                        ? { background: '#334155', color: '#e0e7ef' }
                        : { background: '#e0e7ef', color: '#1e293b' }
                    }
                    size='md'
                  >
                    商店解锁时间：{item.unlocktime}
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
              生成方式
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
                  {isDetailedView && item.detailedCreate ? item.detailedCreate : item.create}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
