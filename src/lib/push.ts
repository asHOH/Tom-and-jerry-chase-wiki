import webpush from 'web-push';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { env } from '@/env';

// Initialize web-push only if keys are available
if (env.VAPID_SUBJECT && env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    env.VAPID_SUBJECT,
    env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  );
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
}

export async function sendPushNotification(userId: string, payload: PushPayload) {
  if (!env.VAPID_SUBJECT || !env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    console.warn('Web push VAPID keys are incomplete, skipping push notification.');
    return;
  }

  // Fetch all user's push subscriptions
  const { data: subscriptions, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('id, endpoint, keys_p256dh, keys_auth')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching push subscriptions:', error);
    return;
  }

  if (!subscriptions || subscriptions.length === 0) {
    return;
  }

  const payloadString = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || '/',
    icon: payload.icon || '/icon-192x192.png',
    badge: payload.badge || '/icon-192x192.png',
  });

  const removePromises: PromiseLike<unknown>[] = [];
  const pushPromises = subscriptions.map((sub) => {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.keys_p256dh,
        auth: sub.keys_auth,
      },
    };

    return webpush.sendNotification(pushSubscription, payloadString).catch((err: unknown) => {
      const statusCode =
        typeof err === 'object' && err !== null && 'statusCode' in err ? err.statusCode : undefined;

      // Clean up subscriptions manually on 410 Gone / 404 Not Found errors
      if (statusCode === 410 || statusCode === 404) {
        removePromises.push(supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id));
      } else {
        console.error('Error sending push notification:', err);
      }
    });
  });

  await Promise.allSettled(pushPromises);
  if (removePromises.length > 0) {
    await Promise.allSettled(removePromises);
  }
}
