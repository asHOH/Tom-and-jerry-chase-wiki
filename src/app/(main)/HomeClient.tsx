'use client';

import { useRef, useState } from 'react';

import { useMobile } from '@/hooks/useMediaQuery';
import { useUser } from '@/hooks/useUser';
import { SITE_NAME } from '@/constants/brand';
import { QQ_GROUP_NUMBER, QQ_GROUP_URL } from '@/constants/community';
import { isNavGroup, NAV_ITEMS, NavItem } from '@/constants/navigation';
import ChangeLogs, { ChangeLogsRef } from '@/components/ui/ChangeLogs';
import ExternalLinksDisplay from '@/components/ui/ExternalLinksDisplay';
import FactionButton from '@/components/ui/FactionButton';
import FeedbackSection, { FeedbackSectionRef } from '@/components/ui/FeedbackSection';
import HomePageSection from '@/components/ui/NavSection';
import OfficialSitesDisplay from '@/components/ui/OfficialSitesDisplay';
import PageHeader from '@/components/ui/PageHeader';
import PageShell from '@/components/ui/PageShell';
import HomepageNotices from '@/components/HomepageNotices';
import { ChatBubbleIcon } from '@/components/icons/CommonIcons';
import LoginDialog from '@/components/LoginDialog';
import { ProjectStatement } from '@/components/ProjectStatement';
import { VersionDisplay } from '@/components/VersionDisplay';
import { env } from '@/env';

type Props = { description: string; hasServiceKey: boolean };

export default function HomeContentClient({ description, hasServiceKey }: Props) {
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const feedbackSectionRef = useRef<FeedbackSectionRef>(null);
  const changeLogsRef = useRef<ChangeLogsRef>(null);
  const { nickname } = useUser();
  const isMobile = useMobile();
  const isFeedbackEnabled = env.NEXT_PUBLIC_DISABLE_FEEDBACK_EMAIL !== '1';

  // Double-click on 网站说明 now only triggers login dialog if not logged in
  // Edit mode is now controlled via ?edit=1 URL param on individual pages
  const handleDoubleClick = () => {
    if (feedbackSectionRef.current?.isOpen?.() || changeLogsRef.current?.isOpen?.()) {
      return; // Do nothing if feedback or changelog modal is open
    }

    // Show login dialog if not logged in (for user convenience)
    if (!nickname && env.NEXT_PUBLIC_DISABLE_ARTICLES !== '1' && hasServiceKey) {
      setShowLoginDialog(true);
    }
  };

  const getSectionButtons = (items: readonly NavItem[]) => {
    const allNavItems = NAV_ITEMS.flatMap((entry) =>
      isNavGroup(entry) ? entry.children : [entry]
    );
    return items
      .map((item) => {
        const navItem = allNavItems.find((n) => n.id === item.id);
        if (!navItem) return null;
        return {
          imageSrc: navItem.iconSrc,
          imageAlt: navItem.iconAlt,
          title: navItem.label,
          description: navItem.description,
          href: navItem.href,
          ariaLabel: `${navItem.label}：${navItem.description}`,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  };

  return (
    <PageShell width='wide' className='space-y-6'>
      <PageHeader title={SITE_NAME} description={description} descriptionVisibility='desktop' />

      <HomepageNotices />

      {NAV_ITEMS.map((section, index) => {
        const buttons = getSectionButtons(section.children);
        if (buttons.length === 0) return null;
        return <HomePageSection key={index} title={section.label} buttons={buttons} />;
      })}

      {/* Division line before 网站说明 */}
      <div className='mt-12 px-2 sm:mt-18 sm:px-4 md:mt-24'>
        <div className='mx-auto max-w-4xl'>
          <div className='h-px w-full bg-gray-300 dark:bg-gray-700'></div>
        </div>
      </div>

      <div className='mt-6 px-2 text-center sm:mt-8 sm:px-4'>
        <h2
          className='mb-2 py-2 text-3xl font-bold dark:text-white'
          onDoubleClick={handleDoubleClick}
        >
          网站说明
        </h2>
        <div className='mx-auto max-w-2xl px-2 py-3 text-gray-600 sm:px-4 dark:text-gray-300'>
          <ProjectStatement
            {...(isFeedbackEnabled
              ? { onFeedbackClick: () => feedbackSectionRef.current?.openFeedback() }
              : {})}
          />
          <a
            href={QQ_GROUP_URL}
            target='_blank'
            rel='noopener noreferrer'
            className='mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 underline-offset-4 transition-colors hover:text-blue-700 hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none dark:text-blue-400 dark:hover:text-blue-300 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-gray-900'
            aria-label={`加入QQ交流群 ${QQ_GROUP_NUMBER}（在新窗口打开）`}
          >
            <ChatBubbleIcon className='size-4' strokeWidth={2} />
            <span>加入QQ交流群 {QQ_GROUP_NUMBER}</span>
            <span aria-hidden='true'>↗</span>
          </a>
        </div>
        <VersionDisplay />
        <div className='mt-4 flex flex-wrap justify-center gap-4 sm:mt-6'>
          <FeedbackSection ref={feedbackSectionRef} />
          <ChangeLogs ref={changeLogsRef} />
          <div>
            <FactionButton
              title='使用指南'
              description='百科功能简介'
              ariaLabel='使用指南：百科功能简介'
              imageSrc='/images/mouseSkills/%E8%8E%B1%E6%81%A91-%E8%93%9D%E5%9B%BE.png'
              href='/usages/use'
              className='px-2'
            />
          </div>
        </div>

        <div className='mt-8 px-2 sm:mt-10 sm:px-4 md:mt-12'>
          <div className='mx-auto max-w-4xl'>
            <div className='h-px w-full bg-gray-300 dark:bg-gray-700'></div>
          </div>
        </div>

        <div className='mt-6 sm:mt-8'>
          <h2 className='mb-6 text-3xl font-bold dark:text-white'>站点列表</h2>
          <OfficialSitesDisplay />
          <div className='mt-10'>
            <ExternalLinksDisplay />
          </div>
        </div>
      </div>

      <LoginDialog
        open={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
        isMobile={isMobile}
      />
    </PageShell>
  );
}
