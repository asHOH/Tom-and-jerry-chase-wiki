import 'server-only';

import { cached } from '@/lib/serverCache';
import { supabaseServerPublic } from '@/lib/supabase/public';
import { env } from '@/env';

import type { PublicActionRow } from './publicActionsTypes';

export async function getPublicGameDataActions(): Promise<PublicActionRow[]> {
  if (env.NEXT_PUBLIC_DISABLE_ARTICLES === '1' || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return [];
  }

  return cached(
    ['public-game-data-actions'],
    async () => {
      const { data, error } = await supabaseServerPublic
        .from('game_data_actions')
        .select('id, entity_type, entry, created_at')
        .eq('is_public', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching public game data actions:', error);
        return [];
      }

      return data ?? [];
    },
    {
      revalidate: 60,
      tags: ['public-game-data-actions'],
    }
  );
}
