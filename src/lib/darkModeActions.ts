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

/**
 * Server action to set the dark mode state in cookies
 * @param isDarkMode - The dark mode state to set
 */
export async function setDarkModeInCookie(isDarkMode: boolean): Promise<void> {
  const cookieStore = await cookies();

  // Get the root domain by removing subdomain (matching client-side logic)
  const hostname = process.env.VERCEL_URL || 'localhost';
  const rootDomain = hostname.split('.').slice(-2).join('.');

  cookieStore.set('darkMode', String(isDarkMode), {
    path: '/',
    domain: hostname === 'localhost' ? undefined : `.${rootDomain}`,
    sameSite: 'lax',
  });
}
