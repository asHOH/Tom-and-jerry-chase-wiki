'use server';

import { cookies } from 'next/headers';

/**
 * Server action to read the dark mode state from cookies
 * @returns Promise<boolean> - The dark mode state, defaults to false if not set
 */
export async function getDarkModeFromCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  const darkModeCookie = cookieStore.get('darkMode');

  if (!darkModeCookie) {
    return false;
  }

  return darkModeCookie.value === 'true';
}
