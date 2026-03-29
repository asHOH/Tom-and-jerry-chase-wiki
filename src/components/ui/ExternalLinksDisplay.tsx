import { EXTERNAL_LINK_GROUPS } from '@/data/externalLinks';
import ActionTile from '@/components/ui/ActionTile';
import { HOME_ACTION_TILE_PROPS } from '@/components/ui/homeActionTileStyles';

const LinkIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    fill='none'
    viewBox='0 0 24 24'
    strokeWidth={1.5}
    stroke='currentColor'
    className={className}
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25'
    />
  </svg>
);

export default function ExternalLinksDisplay() {
  return (
    <div className='space-y-6'>
      {EXTERNAL_LINK_GROUPS.map((group) => (
        <section key={group.title} className='space-y-3'>
          <h3 className='text-lg font-semibold text-gray-700 dark:text-gray-200'>{group.title}</h3>
          <div className='flex flex-wrap justify-center gap-4'>
            {group.items.map((item) => {
              const isLinked = item.href !== undefined;

              return (
                <ActionTile
                  key={item.title}
                  ariaLabel={item.ariaLabel}
                  {...(!group.hideDescriptions ? { description: item.description } : {})}
                  icon={<LinkIcon className='h-8 w-8' />}
                  interaction={isLinked ? 'normal' : 'disabled'}
                  layout='stacked'
                  title={item.title}
                  {...HOME_ACTION_TILE_PROPS}
                  {...(isLinked ? { href: item.href, external: true } : {})}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
