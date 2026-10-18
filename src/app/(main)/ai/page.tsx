import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getChatHistorySecret } from '@/lib/ai/chatHistorySignature';
import { generatePageMetadata, getCanonicalUrl } from '@/lib/metadataUtils';
import { createOptionalClient } from '@/lib/supabase/server';
import { env } from '@/env';

import ChatClient from './ChatClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = generatePageMetadata({
  title: 'AI 助手',
  description: '与百科 AI 助手对话，查询猫和老鼠手游资料',
  canonicalUrl: getCanonicalUrl('/ai'),
  robots: { index: false, follow: false },
});

export default async function AiPage() {
  const client = await createOptionalClient();
  const identity = client ? await client.auth.getClaims() : null;
  const userId = identity?.error ? null : identity?.data?.claims.sub;
  if (!userId) redirect('/');

  return (
    <ChatClient
      userId={userId}
      available={Boolean(
        env.OPENAI_API_KEY && env.NEXT_PUBLIC_AI_CHAT_MODEL && getChatHistorySecret()
      )}
    />
  );
}
