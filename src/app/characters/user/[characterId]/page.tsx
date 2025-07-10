import React from 'react';
import { AppProvider } from '@/context/AppContext';
import UserCharacterPageClient from './UserCharacterPageClient';

// Generate static params for user character pages
// Since this is for user-generated content, we return empty array
// to indicate this should be handled dynamically
export async function generateStaticParams() {
  return [];
}

/**
 * This is the main page component, responsible for setting up the context providers.
 */
export default function UserCharacterPage() {
  return (
    <AppProvider>
      <UserCharacterPageClient />
    </AppProvider>
  );
}
