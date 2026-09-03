import type { Database as GeneratedDatabase } from './database.generated';

export { Constants } from './database.generated';
export type { Json } from './database.generated';

type IsAny<T> = 0 extends 1 & T ? true : false;
type IsUnknown<T> =
  IsAny<T> extends true
    ? false
    : unknown extends T
      ? keyof T extends never
        ? true
        : false
      : false;

// Supabase currently emits PostgreSQL inet and cidr arguments as `unknown`.
type NormalizeNetworkArgs<FunctionType> = FunctionType extends { Args: infer Args }
  ? Omit<FunctionType, 'Args'> & {
      Args: { [Key in keyof Args]: IsUnknown<Args[Key]> extends true ? string | null : Args[Key] };
    }
  : FunctionType;

type PublicSchema = GeneratedDatabase['public'];
type GeneratedFunctions = PublicSchema['Functions'];
type PublicFunctions = {
  [Name in keyof GeneratedFunctions]: NormalizeNetworkArgs<GeneratedFunctions[Name]>;
};
type PublicTables = PublicSchema['Tables'];

type OverrideFunctionArgs<FunctionType, ArgsOverride> = FunctionType extends {
  Args: infer Args;
}
  ? Omit<FunctionType, 'Args'> & { Args: Omit<Args, keyof ArgsOverride> & ArgsOverride }
  : never;

type FunctionOverrides = {
  create_autoblock_for_request: Omit<PublicFunctions['create_autoblock_for_request'], 'Returns'> & {
    Returns: string | null;
  };
  create_block: OverrideFunctionArgs<
    PublicFunctions['create_block'],
    {
      p_expires_at: string | null;
      p_target_user_id: string | null;
    }
  >;
  create_permission_group_v2: OverrideFunctionArgs<
    PublicFunctions['create_permission_group_v2'],
    { p_parent_group_id: string | null }
  >;
  get_game_data_action_notification_recipients: OverrideFunctionArgs<
    PublicFunctions['get_game_data_action_notification_recipients'],
    { p_actor_id?: string | null }
  >;
  modify_block: OverrideFunctionArgs<
    PublicFunctions['modify_block'],
    { p_expires_at: string | null }
  >;
  prepared_article_version_moderation: OverrideFunctionArgs<
    PublicFunctions['prepared_article_version_moderation'],
    { p_feedback?: string | null }
  >;
  prepared_create_article: OverrideFunctionArgs<
    PublicFunctions['prepared_create_article'],
    { p_character_id?: string | null; p_commit_message?: string | null }
  >;
  prepared_publish_anonymous_game_data_actions: OverrideFunctionArgs<
    PublicFunctions['prepared_publish_anonymous_game_data_actions'],
    { p_message: string | null }
  >;
  prepared_publish_game_data_actions_request: OverrideFunctionArgs<
    PublicFunctions['prepared_publish_game_data_actions_request'],
    { p_actor_id: string | null; p_message: string | null }
  >;
  prepared_publish_game_data_actions: OverrideFunctionArgs<
    PublicFunctions['prepared_publish_game_data_actions'],
    { p_message: string | null }
  >;
  prepared_submit_article: OverrideFunctionArgs<
    PublicFunctions['prepared_submit_article'],
    { p_character_id?: string | null; p_commit_message?: string | null }
  >;
  prepared_update_pending_article: OverrideFunctionArgs<
    PublicFunctions['prepared_update_pending_article'],
    { p_character_id?: string | null }
  >;
  save_permission_group_v2: OverrideFunctionArgs<
    PublicFunctions['save_permission_group_v2'],
    { p_parent_group_id: string | null }
  >;
};

type BlocksTable = PublicTables['blocks'];
type UserLastIpsTable = PublicTables['user_last_ips'];
type TableOverrides = {
  blocks: Omit<BlocksTable, 'Row' | 'Insert' | 'Update'> & {
    Row: Omit<BlocksTable['Row'], 'target_cidr'> & { target_cidr: string | null };
    Insert: Omit<BlocksTable['Insert'], 'target_cidr'> & { target_cidr?: string | null };
    Update: Omit<BlocksTable['Update'], 'target_cidr'> & { target_cidr?: string | null };
  };
  user_last_ips: Omit<UserLastIpsTable, 'Row' | 'Insert' | 'Update'> & {
    Row: Omit<UserLastIpsTable['Row'], 'last_ip'> & { last_ip: string };
    Insert: Omit<UserLastIpsTable['Insert'], 'last_ip'> & { last_ip: string };
    Update: Omit<UserLastIpsTable['Update'], 'last_ip'> & { last_ip?: string };
  };
};

export type Database = Omit<GeneratedDatabase, 'public'> & {
  public: Omit<PublicSchema, 'Functions' | 'Tables'> & {
    Functions: Omit<PublicFunctions, keyof FunctionOverrides> & FunctionOverrides;
    Tables: Omit<PublicTables, keyof TableOverrides> & TableOverrides;
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer Row;
    }
    ? Row
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer Row;
      }
      ? Row
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer Insert;
    }
    ? Insert
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer Insert;
      }
      ? Insert
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer Update;
    }
    ? Update
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer Update;
      }
      ? Update
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;
