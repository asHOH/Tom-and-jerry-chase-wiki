import { supabase } from '@/lib/supabase/client';
import { env } from '@/env';

/**
 * Checks if the user is already subscribed (locally cached)
 */
export function isPushSubscribedLocally(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    localStorage.getItem('tjwiki_push_subscribed') === '1' ||
    Notification.permission === 'denied' ||
    env.NEXT_PUBLIC_VAPID_PUBLIC_KEY === undefined
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Requests notification permission, subscribes to pushManager, and saves the subscription to Supabase.
 */
export async function subscribeToPushNotifications(): Promise<boolean> {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window)
  ) {
    console.warn('Push notifications are not supported in this browser.');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied.');
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      if (!env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        console.error('VAPID public key is missing.');
        return false;
      }
      const applicationServerKey = urlBase64ToUint8Array(env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    const sb = subscription.toJSON();
    if (!sb.endpoint || !sb.keys?.p256dh || !sb.keys?.auth) {
      console.error('Failed to get valid subscription keys.');
      return false;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return false;

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userData.user.id,
        endpoint: sb.endpoint,
        keys_p256dh: sb.keys.p256dh,
        keys_auth: sb.keys.auth,
      },
      { onConflict: 'user_id,endpoint' }
    );

    if (error) {
      console.error('Failed to save push subscription to DB:', error);
      return false;
    }

    localStorage.setItem('tjwiki_push_subscribed', '1');
    return true;
  } catch (err) {
    console.error('Error during push subscription:', err);
    return false;
  }
}
