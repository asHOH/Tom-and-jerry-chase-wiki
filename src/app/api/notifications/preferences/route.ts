import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { loadPermissionGrants } from '@/lib/auth/requirePermission';
import {
  getNotificationSubscriptionAvailability,
  toNotificationSubscriptionRowUpdate,
  toNotificationSubscriptionSettings,
  type NotificationSubscriptionAvailability,
  type NotificationSubscriptionKey,
  type NotificationSubscriptionResponse,
} from '@/lib/notifications/subscriptionSettings';
import { createClient } from '@/lib/supabase/server';

const preferenceSchema = z
  .object({
    articleVersionPendingEnabled: z.boolean().optional(),
    gameDataActionPendingEnabled: z.boolean().optional(),
    discussionCommentEnabled: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one preference is required',
  });

const preferenceSelect =
  'article_version_pending_enabled, game_data_action_pending_enabled, discussion_comment_enabled';

const AVAILABILITY_BY_KEY: Record<
  NotificationSubscriptionKey,
  keyof NotificationSubscriptionAvailability
> = {
  articleVersionPendingEnabled: 'articleVersionPendingAvailable',
  gameDataActionPendingEnabled: 'gameDataActionPendingAvailable',
  discussionCommentEnabled: 'discussionCommentAvailable',
};

async function getAuthenticatedUserContext() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    } as const;
  }

  const grants = await loadPermissionGrants(supabase);
  const availability = getNotificationSubscriptionAvailability(grants);

  return { supabase, userId, availability } as const;
}

function buildResponse(
  row:
    | {
        article_version_pending_enabled?: boolean | null;
        game_data_action_pending_enabled?: boolean | null;
        discussion_comment_enabled?: boolean | null;
      }
    | null
    | undefined,
  availability: NotificationSubscriptionAvailability
): NotificationSubscriptionResponse {
  return {
    ...toNotificationSubscriptionSettings(row),
    availability,
  };
}

export async function GET() {
  const context = await getAuthenticatedUserContext();
  if ('error' in context) return context.error;

  const { data, error } = await context.supabase
    .from('notification_subscription_settings')
    .select(preferenceSelect)
    .eq('user_id', context.userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to load notification subscription settings:', error);
    return NextResponse.json({ error: 'Failed to load notification preferences' }, { status: 500 });
  }

  return NextResponse.json(buildResponse(data, context.availability));
}

export async function PATCH(request: NextRequest) {
  const context = await getAuthenticatedUserContext();
  if ('error' in context) return context.error;

  const parsed = preferenceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const forbiddenKey = (Object.keys(parsed.data) as NotificationSubscriptionKey[]).find(
    (key) => !context.availability[AVAILABILITY_BY_KEY[key]]
  );

  if (forbiddenKey) {
    return NextResponse.json(
      { error: 'Insufficient permissions to update this notification preference' },
      { status: 403 }
    );
  }

  const { data, error } = await context.supabase
    .from('notification_subscription_settings')
    .upsert(
      {
        user_id: context.userId,
        ...toNotificationSubscriptionRowUpdate(parsed.data),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select(preferenceSelect)
    .single();

  if (error) {
    console.error('Failed to update notification subscription settings:', error);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }

  return NextResponse.json(buildResponse(data, context.availability));
}
