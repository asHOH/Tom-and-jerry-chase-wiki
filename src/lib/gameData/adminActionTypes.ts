import type { Database } from '@/data/database.types';

type ActionStatus = Database['public']['Enums']['game_data_action_status'];

export type GameDataActionStatusFilter = 'all' | ActionStatus;

export type GameDataActionSummary = {
  action_id: string;
  created_at: string;
  created_by: string;
  created_by_nickname: string;
  entity_type: string;
  is_public: boolean;
  message: string | null;
  rejection_reason: string;
  reviewed_at: string;
  reviewed_by: string;
  reviewed_by_nickname: string;
  status: ActionStatus;
};

export type GameDataActionDetail = {
  action_id: string;
  entry: Database['public']['Tables']['game_data_actions']['Row']['entry'];
};

export type AdminGameDataActionsResponse = {
  submissions: GameDataActionSummary[];
  nextCursor: string | null;
};
