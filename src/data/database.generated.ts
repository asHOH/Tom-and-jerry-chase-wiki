export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      article_versions: {
        Row: {
          article_id: string;
          commit_message: string | null;
          content: string;
          created_at: string;
          editor_id: string;
          id: string;
          metadata_snapshot_complete: boolean | null;
          preview_token: string;
          proposed_category_id: string | null;
          proposed_character_id: string | null;
          proposed_title: string | null;
          publication_revision: number | null;
          review_feedback: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: Database['public']['Enums']['version_status'];
        };
        Insert: {
          article_id: string;
          commit_message?: string | null;
          content: string;
          created_at?: string;
          editor_id: string;
          id?: string;
          metadata_snapshot_complete?: boolean | null;
          preview_token: string;
          proposed_category_id?: string | null;
          proposed_character_id?: string | null;
          proposed_title?: string | null;
          publication_revision?: number | null;
          review_feedback?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status: Database['public']['Enums']['version_status'];
        };
        Update: {
          article_id?: string;
          commit_message?: string | null;
          content?: string;
          created_at?: string;
          editor_id?: string;
          id?: string;
          metadata_snapshot_complete?: boolean | null;
          preview_token?: string;
          proposed_category_id?: string | null;
          proposed_character_id?: string | null;
          proposed_title?: string | null;
          publication_revision?: number | null;
          review_feedback?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database['public']['Enums']['version_status'];
        };
        Relationships: [
          {
            foreignKeyName: 'article_versions_article_id_fkey';
            columns: ['article_id'];
            isOneToOne: false;
            referencedRelation: 'articles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'article_versions_editor_id_fkey';
            columns: ['editor_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'article_versions_editor_id_fkey';
            columns: ['editor_id'];
            isOneToOne: false;
            referencedRelation: 'users_public_view';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'article_versions_proposed_category_id_fkey';
            columns: ['proposed_category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'article_versions_reviewed_by_fkey';
            columns: ['reviewed_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'article_versions_reviewed_by_fkey';
            columns: ['reviewed_by'];
            isOneToOne: false;
            referencedRelation: 'users_public_view';
            referencedColumns: ['id'];
          },
        ];
      };
      articles: {
        Row: {
          author_id: string;
          category_id: string;
          character_id: string | null;
          created_at: string;
          current_version_id: string | null;
          id: string;
          title: string;
          view_count: number;
        };
        Insert: {
          author_id: string;
          category_id: string;
          character_id?: string | null;
          created_at?: string;
          current_version_id?: string | null;
          id?: string;
          title: string;
          view_count?: number;
        };
        Update: {
          author_id?: string;
          category_id?: string;
          character_id?: string | null;
          created_at?: string;
          current_version_id?: string | null;
          id?: string;
          title?: string;
          view_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'articles_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'articles_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'users_public_view';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'articles_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'articles_current_version_id_fkey';
            columns: ['id', 'current_version_id'];
            isOneToOne: false;
            referencedRelation: 'article_versions';
            referencedColumns: ['article_id', 'id'];
          },
          {
            foreignKeyName: 'articles_current_version_id_fkey';
            columns: ['id', 'current_version_id'];
            isOneToOne: false;
            referencedRelation: 'article_versions_public_view';
            referencedColumns: ['article_id', 'id'];
          },
        ];
      };
      block_log: {
        Row: {
          actor_id: string | null;
          block_id: string | null;
          created_at: string;
          event_type: string;
          id: string;
          reason: string | null;
          snapshot: Json;
        };
        Insert: {
          actor_id?: string | null;
          block_id?: string | null;
          created_at?: string;
          event_type: string;
          id?: string;
          reason?: string | null;
          snapshot: Json;
        };
        Update: {
          actor_id?: string | null;
          block_id?: string | null;
          created_at?: string;
          event_type?: string;
          id?: string;
          reason?: string | null;
          snapshot?: Json;
        };
        Relationships: [
          {
            foreignKeyName: 'block_log_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'block_log_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'users_public_view';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'block_log_block_id_fkey';
            columns: ['block_id'];
            isOneToOne: false;
            referencedRelation: 'blocks';
            referencedColumns: ['id'];
          },
        ];
      };
      block_restrictions: {
        Row: {
          action: string;
          block_id: string;
          id: string;
          resource_id: string | null;
          resource_type: string | null;
        };
        Insert: {
          action: string;
          block_id: string;
          id?: string;
          resource_id?: string | null;
          resource_type?: string | null;
        };
        Update: {
          action?: string;
          block_id?: string;
          id?: string;
          resource_id?: string | null;
          resource_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'block_restrictions_block_id_fkey';
            columns: ['block_id'];
            isOneToOne: false;
            referencedRelation: 'blocks';
            referencedColumns: ['id'];
          },
        ];
      };
      blocks: {
        Row: {
          autoblock_enabled: boolean;
          created_at: string;
          created_by: string;
          expires_at: string | null;
          hard_block: boolean;
          id: string;
          is_autoblock: boolean;
          parent_block_id: string | null;
          reason: string;
          revoked_at: string | null;
          revoked_by: string | null;
          target_cidr: unknown;
          target_type: string;
          target_user_id: string | null;
        };
        Insert: {
          autoblock_enabled?: boolean;
          created_at?: string;
          created_by: string;
          expires_at?: string | null;
          hard_block?: boolean;
          id?: string;
          is_autoblock?: boolean;
          parent_block_id?: string | null;
          reason: string;
          revoked_at?: string | null;
          revoked_by?: string | null;
          target_cidr?: unknown;
          target_type: string;
          target_user_id?: string | null;
        };
        Update: {
          autoblock_enabled?: boolean;
          created_at?: string;
          created_by?: string;
          expires_at?: string | null;
          hard_block?: boolean;
          id?: string;
          is_autoblock?: boolean;
          parent_block_id?: string | null;
          reason?: string;
          revoked_at?: string | null;
          revoked_by?: string | null;
          target_cidr?: unknown;
          target_type?: string;
          target_user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'blocks_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blocks_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users_public_view';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blocks_parent_block_id_fkey';
            columns: ['parent_block_id'];
            isOneToOne: false;
            referencedRelation: 'blocks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blocks_revoked_by_fkey';
            columns: ['revoked_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blocks_revoked_by_fkey';
            columns: ['revoked_by'];
            isOneToOne: false;
            referencedRelation: 'users_public_view';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blocks_target_user_id_fkey';
            columns: ['target_user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blocks_target_user_id_fkey';
            columns: ['target_user_id'];
            isOneToOne: false;
            referencedRelation: 'users_public_view';
            referencedColumns: ['id'];
          },
        ];
      };
      categories: {
        Row: {
          default_visibility: Database['public']['Enums']['version_status'] | null;
          id: string;
          name: string;
          parent_category_id: string | null;
          requires_character: boolean;
        };
        Insert: {
          default_visibility?: Database['public']['Enums']['version_status'] | null;
          id?: string;
          name: string;
          parent_category_id?: string | null;
          requires_character?: boolean;
        };
        Update: {
          default_visibility?: Database['public']['Enums']['version_status'] | null;
          id?: string;
          name?: string;
          parent_category_id?: string | null;
          requires_character?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'categories_parent_category_id_fkey';
            columns: ['parent_category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      comments: {
        Row: {
          author_id: string;
          content: string;
          created_at: string;
          id: string;
          parent_id: string | null;
          scope: Database['public']['Enums']['comment_scope'];
          status: Database['public']['Enums']['comment_status'];
          target_id: string;
          title: string | null;
        };
        Insert: {
          author_id: string;
          content: string;
          created_at?: string;
          id?: string;
          parent_id?: string | null;
          scope: Database['public']['Enums']['comment_scope'];
          status?: Database['public']['Enums']['comment_status'];
          target_id: string;
          title?: string | null;
        };
        Update: {
          author_id?: string;
          content?: string;
          created_at?: string;
          id?: string;
          parent_id?: string | null;
          scope?: Database['public']['Enums']['comment_scope'];
          status?: Database['public']['Enums']['comment_status'];
          target_id?: string;
          title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'comments_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comments_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'users_public_view';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comments_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'comments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comments_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'comments_public_view';
            referencedColumns: ['id'];
          },
        ];
      };
      feedback: {
        Row: {
          contact: string | null;
          content: string;
          created_at: string;
          id: string;
          ip_address: string | null;
          status: string;
          type: string;
          user_agent: string | null;
        };
        Insert: {
          contact?: string | null;
          content: string;
          created_at?: string;
          id?: string;
          ip_address?: string | null;
          status?: string;
          type: string;
          user_agent?: string | null;
        };
        Update: {
          contact?: string | null;
          content?: string;
          created_at?: string;
          id?: string;
          ip_address?: string | null;
          status?: string;
          type?: string;
          user_agent?: string | null;
        };
        Relationships: [];
      };
      game_data_actions: {
        Row: {
          created_at: string;
          created_by: string | null;
          entity_type: string;
          entry: Json;
          id: string;
          is_public: boolean;
          message: string | null;
          rejection_reason: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: Database['public']['Enums']['game_data_action_status'];
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          entity_type: string;
          entry: Json;
          id?: string;
          is_public?: boolean;
          message?: string | null;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status: Database['public']['Enums']['game_data_action_status'];
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          entity_type?: string;
          entry?: Json;
          id?: string;
          is_public?: boolean;
          message?: string | null;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database['public']['Enums']['game_data_action_status'];
        };
        Relationships: [
          {
            foreignKeyName: 'game_data_actions_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'game_data_actions_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users_public_view';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'game_data_actions_reviewed_by_fkey';
            columns: ['reviewed_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'game_data_actions_reviewed_by_fkey';
            columns: ['reviewed_by'];
            isOneToOne: false;
            referencedRelation: 'users_public_view';
            referencedColumns: ['id'];
          },
        ];
      };
      game_data_approved_replay_epoch: {
        Row: {
          epoch: number;
          singleton: boolean;
          updated_at: string;
        };
        Insert: {
          epoch?: number;
          singleton?: boolean;
          updated_at?: string;
        };
        Update: {
          epoch?: number;
          singleton?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      group_permission_grants: {
        Row: {
          created_at: string;
          group_id: string;
          permission_key: string;
          resource_id: string;
          resource_type: string;
          scope: Database['public']['Enums']['permission_scope'];
        };
        Insert: {
          created_at?: string;
          group_id: string;
          permission_key: string;
          resource_id: string;
          resource_type: string;
          scope?: Database['public']['Enums']['permission_scope'];
        };
        Update: {
          created_at?: string;
          group_id?: string;
          permission_key?: string;
          resource_id?: string;
          resource_type?: string;
          scope?: Database['public']['Enums']['permission_scope'];
        };
        Relationships: [
          {
            foreignKeyName: 'group_permission_grants_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'user_groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_permission_grants_permission_key_fkey';
            columns: ['permission_key'];
            isOneToOne: false;
            referencedRelation: 'permission_catalog';
            referencedColumns: ['key'];
          },
        ];
      };
      notification_email_settings: {
        Row: {
          email: string | null;
          email_enabled: boolean;
          email_verified_at: string | null;
          pending_email: string | null;
          updated_at: string;
          user_id: string;
          verification_expires_at: string | null;
          verification_sent_at: string | null;
          verification_token_hash: string | null;
        };
        Insert: {
          email?: string | null;
          email_enabled?: boolean;
          email_verified_at?: string | null;
          pending_email?: string | null;
          updated_at?: string;
          user_id: string;
          verification_expires_at?: string | null;
          verification_sent_at?: string | null;
          verification_token_hash?: string | null;
        };
        Update: {
          email?: string | null;
          email_enabled?: boolean;
          email_verified_at?: string | null;
          pending_email?: string | null;
          updated_at?: string;
          user_id?: string;
          verification_expires_at?: string | null;
          verification_sent_at?: string | null;
          verification_token_hash?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_email_settings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notification_email_settings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users_public_view';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_subscription_settings: {
        Row: {
          article_version_pending_enabled: boolean;
          discussion_comment_enabled: boolean;
          game_data_action_pending_enabled: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          article_version_pending_enabled?: boolean;
          discussion_comment_enabled?: boolean;
          game_data_action_pending_enabled?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          article_version_pending_enabled?: boolean;
          discussion_comment_enabled?: boolean;
          game_data_action_pending_enabled?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_subscription_settings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notification_subscription_settings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users_public_view';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          body: string;
          created_at: string;
          dedupe_key: string;
          href: string | null;
          id: string;
          kind: string;
          read_at: string | null;
          source_ids: string[];
          title: string;
          user_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          dedupe_key: string;
          href?: string | null;
          id?: string;
          kind: string;
          read_at?: string | null;
          source_ids?: string[];
          title: string;
          user_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          dedupe_key?: string;
          href?: string | null;
          id?: string;
          kind?: string;
          read_at?: string | null;
          source_ids?: string[];
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users_public_view';
            referencedColumns: ['id'];
          },
        ];
      };
      permission_catalog: {
        Row: {
          category: string;
          global_only: boolean;
          key: string;
          label_zh: string;
          sort_order: number;
        };
        Insert: {
          category: string;
          global_only?: boolean;
          key: string;
          label_zh: string;
          sort_order?: number;
        };
        Update: {
          category?: string;
          global_only?: boolean;
          key?: string;
          label_zh?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      site_notices: {
        Row: {
          content_html: string;
          created_at: string;
          created_by: string;
          ends_at: string | null;
          id: string;
          is_published: boolean;
          starts_at: string;
          title: string;
          updated_at: string;
          updated_by: string;
        };
        Insert: {
          content_html: string;
          created_at?: string;
          created_by: string;
          ends_at?: string | null;
          id?: string;
          is_published?: boolean;
          starts_at?: string;
          title: string;
          updated_at?: string;
          updated_by: string;
        };
        Update: {
          content_html?: string;
          created_at?: string;
          created_by?: string;
          ends_at?: string | null;
          id?: string;
          is_published?: boolean;
          starts_at?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'site_notices_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'site_notices_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users_public_view';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'site_notices_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'site_notices_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'users_public_view';
            referencedColumns: ['id'];
          },
        ];
      };
      user_group_memberships: {
        Row: {
          created_at: string;
          group_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          group_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          group_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_group_memberships_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'user_groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_group_memberships_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_group_memberships_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users_public_view';
            referencedColumns: ['id'];
          },
        ];
      };
      user_groups: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          is_default: boolean;
          name: string;
          parent_group_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string;
          id?: string;
          is_default?: boolean;
          name: string;
          parent_group_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          is_default?: boolean;
          name?: string;
          parent_group_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_groups_parent_group_id_fkey';
            columns: ['parent_group_id'];
            isOneToOne: false;
            referencedRelation: 'user_groups';
            referencedColumns: ['id'];
          },
        ];
      };
      user_last_ips: {
        Row: {
          last_ip: unknown;
          last_seen_at: string;
          user_id: string;
        };
        Insert: {
          last_ip: unknown;
          last_seen_at?: string;
          user_id: string;
        };
        Update: {
          last_ip?: unknown;
          last_seen_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_last_ips_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_last_ips_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users_public_view';
            referencedColumns: ['id'];
          },
        ];
      };
      users: {
        Row: {
          id: string;
          nickname: string;
          password_hash: string | null;
          salt: string;
          username_hash: string;
        };
        Insert: {
          id: string;
          nickname: string;
          password_hash?: string | null;
          salt: string;
          username_hash: string;
        };
        Update: {
          id?: string;
          nickname?: string;
          password_hash?: string | null;
          salt?: string;
          username_hash?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      article_versions_public_view: {
        Row: {
          article_id: string | null;
          commit_message: string | null;
          content: string | null;
          created_at: string | null;
          editor_id: string | null;
          excerpt: string | null;
          id: string | null;
          publication_revision: number | null;
          status: Database['public']['Enums']['version_status'] | null;
        };
        Insert: {
          article_id?: string | null;
          commit_message?: string | null;
          content?: string | null;
          created_at?: string | null;
          editor_id?: string | null;
          excerpt?: never;
          id?: string | null;
          publication_revision?: number | null;
          status?: Database['public']['Enums']['version_status'] | null;
        };
        Update: {
          article_id?: string | null;
          commit_message?: string | null;
          content?: string | null;
          created_at?: string | null;
          editor_id?: string | null;
          excerpt?: never;
          id?: string | null;
          publication_revision?: number | null;
          status?: Database['public']['Enums']['version_status'] | null;
        };
        Relationships: [
          {
            foreignKeyName: 'article_versions_article_id_fkey';
            columns: ['article_id'];
            isOneToOne: false;
            referencedRelation: 'articles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'article_versions_editor_id_fkey';
            columns: ['editor_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'article_versions_editor_id_fkey';
            columns: ['editor_id'];
            isOneToOne: false;
            referencedRelation: 'users_public_view';
            referencedColumns: ['id'];
          },
        ];
      };
      comments_public_view: {
        Row: {
          author_id: string | null;
          content: string | null;
          created_at: string | null;
          id: string | null;
          parent_id: string | null;
          scope: Database['public']['Enums']['comment_scope'] | null;
          status: Database['public']['Enums']['comment_status'] | null;
          target_id: string | null;
          title: string | null;
        };
        Insert: {
          author_id?: string | null;
          content?: string | null;
          created_at?: string | null;
          id?: string | null;
          parent_id?: string | null;
          scope?: Database['public']['Enums']['comment_scope'] | null;
          status?: Database['public']['Enums']['comment_status'] | null;
          target_id?: string | null;
          title?: string | null;
        };
        Update: {
          author_id?: string | null;
          content?: string | null;
          created_at?: string | null;
          id?: string | null;
          parent_id?: string | null;
          scope?: Database['public']['Enums']['comment_scope'] | null;
          status?: Database['public']['Enums']['comment_status'] | null;
          target_id?: string | null;
          title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'comments_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comments_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'users_public_view';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comments_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'comments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comments_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'comments_public_view';
            referencedColumns: ['id'];
          },
        ];
      };
      users_public_view: {
        Row: {
          id: string | null;
          nickname: string | null;
        };
        Insert: {
          id?: string | null;
          nickname?: string | null;
        };
        Update: {
          id?: string | null;
          nickname?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      approve_article_version: {
        Args: { p_version_id: string };
        Returns: undefined;
      };
      approve_game_data_action: {
        Args: { p_action_id: string };
        Returns: undefined;
      };
      assert_actor_not_blocked: {
        Args: {
          p_action: string;
          p_ip: unknown;
          p_resource_id?: string;
          p_resource_type?: string;
          p_user_id: string;
        };
        Returns: undefined;
      };
      assert_game_data_entry_not_blocked: {
        Args: {
          p_entity_type: string;
          p_entry: Json;
          p_ip: unknown;
          p_user_id: string;
        };
        Returns: undefined;
      };
      auth_email_exists: { Args: { p_email: string }; Returns: boolean };
      block_snapshot: { Args: { p_block_id: string }; Returns: Json };
      can_access_article: {
        Args: {
          p_article_id: string;
          p_category_id: string;
          p_permission_key: string;
          p_user_id: string;
        };
        Returns: boolean;
      };
      can_access_game_action: {
        Args: {
          p_entity_type: string;
          p_entry: Json;
          p_permission_key: string;
          p_user_id: string;
        };
        Returns: boolean;
      };
      can_moderate_article: {
        Args: { p_article_id: string; p_user_id: string };
        Returns: boolean;
      };
      can_moderate_article_version: {
        Args: {
          p_article_id: string;
          p_proposed_category_id: string;
          p_user_id: string;
        };
        Returns: boolean;
      };
      can_view_article: {
        Args: { p_article_id: string; p_user_id: string };
        Returns: boolean;
      };
      create_autoblock_for_request: {
        Args: { p_action: string; p_ip: unknown; p_user_id: string };
        Returns: string;
      };
      create_block: {
        Args: {
          p_autoblock: boolean;
          p_expires_at: string;
          p_hard_block: boolean;
          p_reason: string;
          p_restrictions: Json;
          p_target_cidr: unknown;
          p_target_type: string;
          p_target_user_id: string;
        };
        Returns: string;
      };
      create_category: {
        Args: {
          _default_visibility?: Database['public']['Enums']['version_status'];
          _name: string;
          _parent_category_id?: string;
        };
        Returns: string;
      };
      create_comment: {
        Args: {
          p_content: string;
          p_parent_id?: string;
          p_scope: Database['public']['Enums']['comment_scope'];
          p_target_id: string;
          p_title?: string;
        };
        Returns: string;
      };
      create_permission_group: {
        Args: {
          p_description?: string;
          p_grants?: Json;
          p_is_default?: boolean;
          p_name: string;
        };
        Returns: string;
      };
      create_permission_group_v2: {
        Args: {
          p_description: string;
          p_grants: Json;
          p_is_default: boolean;
          p_name: string;
          p_parent_group_id: string;
        };
        Returns: string;
      };
      delete_category: { Args: { _id: string }; Returns: undefined };
      delete_permission_group: {
        Args: { p_group_id: string };
        Returns: undefined;
      };
      find_effective_block: {
        Args: {
          p_action?: string;
          p_ip?: unknown;
          p_resource_id?: string;
          p_resource_type?: string;
          p_user_id?: string;
        };
        Returns: {
          expires_at: string;
          hard_block: boolean;
          id: string;
          is_autoblock: boolean;
          parent_block_id: string;
          reason: string;
          target_type: string;
        }[];
      };
      game_action_resource_id: {
        Args: { p_entity_type: string; p_entry: Json };
        Returns: string;
      };
      game_action_resource_ids: {
        Args: { p_entity_type: string; p_entry: Json };
        Returns: string[];
      };
      game_data_character_ids_from_entry: {
        Args: { p_entry: Json };
        Returns: {
          character_id: string;
        }[];
      };
      game_data_history_actions_from_entry: {
        Args: { p_entry: Json };
        Returns: {
          action_op: string;
          action_ordinal: number;
          action_path: string;
        }[];
      };
      generate_salt: { Args: never; Returns: string };
      get_article_version_by_preview: {
        Args: { p_token: string };
        Returns: {
          article_id: string;
          commit_message: string | null;
          content: string;
          created_at: string;
          editor_id: string;
          id: string;
          metadata_snapshot_complete: boolean | null;
          preview_token: string;
          proposed_category_id: string | null;
          proposed_character_id: string | null;
          proposed_title: string | null;
          publication_revision: number | null;
          review_feedback: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: Database['public']['Enums']['version_status'];
        }[];
        SetofOptions: {
          from: '*';
          to: 'article_versions';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      get_article_version_notification_recipients: {
        Args: {
          p_actor_id?: string;
          p_article_id: string;
          p_proposed_category_id?: string;
        };
        Returns: {
          user_id: string;
        }[];
      };
      get_categories: {
        Args: never;
        Returns: {
          default_visibility: Database['public']['Enums']['version_status'];
          id: string;
          name: string;
          parent_category_id: string;
        }[];
      };
      get_game_data_action_notification_recipients: {
        Args: { p_action_id: string; p_actor_id?: string };
        Returns: {
          user_id: string;
        }[];
      };
      get_my_permission_grants: {
        Args: never;
        Returns: {
          permission_key: string;
          resource_id: string;
          resource_type: string;
          scope: Database['public']['Enums']['permission_scope'];
        }[];
      };
      get_pending_game_data_actions: {
        Args: never;
        Returns: {
          action_id: string;
          created_at: string;
          created_by: string;
          created_by_nickname: string;
          entity_type: string;
          entry: Json;
          is_public: boolean;
          message: string;
          rejection_reason: string;
          reviewed_at: string;
          reviewed_by: string;
          reviewed_by_nickname: string;
          status: Database['public']['Enums']['game_data_action_status'];
        }[];
      };
      get_pending_versions_for_moderation: {
        Args: never;
        Returns: {
          article_id: string;
          article_title: string;
          category_name: string;
          commit_message: string;
          content: string;
          created_at: string;
          editor_id: string;
          editor_nickname: string;
          original_category_name: string;
          original_character_id: string;
          original_title: string;
          preview_token: string;
          proposed_category_name: string;
          proposed_character_id: string;
          proposed_title: string;
          status: Database['public']['Enums']['version_status'];
          version_id: string;
        }[];
      };
      get_public_contribution_activity: {
        Args: {
          p_filter?: string;
          p_limit?: number;
          p_offset?: number;
          p_user_id: string;
        };
        Returns: {
          actor_id: string;
          article_id: string;
          article_title: string;
          created_at: string;
          description: string;
          entity_type: string;
          entry: Json;
          id: string;
          kind: string;
          total_count: number;
        }[];
      };
      get_public_contribution_breakdown: {
        Args: { p_end_date: string; p_start_date: string; p_user_id: string };
        Returns: {
          category: string;
          contribution_count: number;
        }[];
      };
      get_public_contribution_calendar: {
        Args: { p_end_date: string; p_start_date: string; p_user_id: string };
        Returns: {
          activity_date: string;
          article_count: number;
          game_data_count: number;
          total_count: number;
        }[];
      };
      has_permission: {
        Args: {
          p_permission_key: string;
          p_resource_id?: string;
          p_resource_type?: string;
        };
        Returns: boolean;
      };
      hash_credential: {
        Args: { credential: string; salt: string };
        Returns: string;
      };
      increment_article_view_count: {
        Args: { p_article_id: string };
        Returns: undefined;
      };
      is_game_strategy_category: {
        Args: { p_category_id: string };
        Returns: boolean;
      };
      modify_block: {
        Args: {
          p_block_id: string;
          p_expires_at: string;
          p_hard_block: boolean;
          p_reason: string;
          p_restrictions: Json;
        };
        Returns: undefined;
      };
      permission_resource_type_allowed: {
        Args: { p_permission_key: string; p_resource_type: string };
        Returns: boolean;
      };
      prepared_approve_game_data_action:
        | {
            Args: {
              p_action_id: string;
              p_actor_id: string;
              p_expected_entity_type: string;
              p_expected_entry: Json;
              p_expected_replay_epoch: number;
            };
            Returns: undefined;
          }
        | {
            Args: {
              p_action_id: string;
              p_actor_id: string;
              p_expected_entity_type: string;
              p_expected_entry: Json;
              p_expected_replay_epoch: number;
              p_ip: unknown;
            };
            Returns: undefined;
          };
      prepared_article_version_moderation: {
        Args: {
          p_action: string;
          p_actor_id: string;
          p_feedback?: string;
          p_ip: unknown;
          p_version_id: string;
        };
        Returns: undefined;
      };
      prepared_create_article: {
        Args: {
          p_actor_id: string;
          p_category_id: string;
          p_character_id?: string;
          p_commit_message?: string;
          p_content: string;
          p_ip: unknown;
          p_title: string;
        };
        Returns: {
          article_id: string;
          submitted_status: Database['public']['Enums']['version_status'];
          submitted_version_id: string;
        }[];
      };
      prepared_create_category: {
        Args: {
          p_actor_id: string;
          p_default_visibility?: Database['public']['Enums']['version_status'];
          p_ip: unknown;
          p_name: string;
          p_parent_category_id?: string;
        };
        Returns: string;
      };
      prepared_create_comment: {
        Args: {
          p_actor_id: string;
          p_content: string;
          p_ip: unknown;
          p_parent_id?: string;
          p_scope: Database['public']['Enums']['comment_scope'];
          p_target_id: string;
          p_title?: string;
        };
        Returns: string;
      };
      prepared_delete_category: {
        Args: { p_actor_id: string; p_id: string; p_ip: unknown };
        Returns: undefined;
      };
      prepared_mark_game_data_action_synced:
        | {
            Args: {
              p_action_id: string;
              p_actor_id: string;
              p_expected_entity_type: string;
              p_expected_entry: Json;
              p_expected_replay_epoch: number;
            };
            Returns: undefined;
          }
        | {
            Args: {
              p_action_id: string;
              p_actor_id: string;
              p_expected_entity_type: string;
              p_expected_entry: Json;
              p_expected_replay_epoch: number;
              p_ip: unknown;
            };
            Returns: undefined;
          };
      prepared_publish_anonymous_game_data_actions:
        | {
            Args: {
              p_entity_type: string;
              p_entries: Json;
              p_expected_replay_epoch: number;
              p_message?: string;
            };
            Returns: {
              id: string;
              is_public: boolean;
              status: Database['public']['Enums']['game_data_action_status'];
            }[];
          }
        | {
            Args: {
              p_entity_type: string;
              p_entries: Json;
              p_expected_replay_epoch: number;
              p_ip: unknown;
              p_message: string;
            };
            Returns: {
              id: string;
              is_public: boolean;
              status: Database['public']['Enums']['game_data_action_status'];
            }[];
          };
      prepared_publish_game_data_actions:
        | {
            Args: {
              p_actor_id: string;
              p_entity_type: string;
              p_entries: Json;
              p_expected_replay_epoch: number;
              p_ip: unknown;
              p_message: string;
              p_permission_key: string;
              p_submit_mode?: string;
            };
            Returns: {
              id: string;
              is_public: boolean;
              status: Database['public']['Enums']['game_data_action_status'];
            }[];
          }
        | {
            Args: {
              p_actor_id: string;
              p_entity_type: string;
              p_entries: Json;
              p_expected_replay_epoch: number;
              p_message: string;
              p_permission_key: string;
              p_submit_mode?: string;
            };
            Returns: {
              id: string;
              is_public: boolean;
              status: Database['public']['Enums']['game_data_action_status'];
            }[];
          };
      prepared_reject_game_data_action: {
        Args: {
          p_action_id: string;
          p_actor_id: string;
          p_ip: unknown;
          p_reason: string;
        };
        Returns: undefined;
      };
      prepared_revoke_game_data_action:
        | {
            Args: {
              p_action_id: string;
              p_actor_id: string;
              p_expected_entity_type: string;
              p_expected_entry: Json;
              p_expected_replay_epoch: number;
            };
            Returns: undefined;
          }
        | {
            Args: {
              p_action_id: string;
              p_actor_id: string;
              p_expected_entity_type: string;
              p_expected_entry: Json;
              p_expected_replay_epoch: number;
              p_ip: unknown;
            };
            Returns: undefined;
          };
      prepared_set_comment_status: {
        Args: {
          p_actor_id: string;
          p_comment_id: string;
          p_ip: unknown;
          p_status: Database['public']['Enums']['comment_status'];
        };
        Returns: undefined;
      };
      prepared_submit_article: {
        Args: {
          p_actor_id: string;
          p_article_id: string;
          p_category_id: string;
          p_character_id?: string;
          p_commit_message?: string;
          p_content: string;
          p_ip: unknown;
          p_title: string;
        };
        Returns: {
          submitted_status: Database['public']['Enums']['version_status'];
          submitted_version_id: string;
        }[];
      };
      prepared_update_category: {
        Args: {
          p_actor_id: string;
          p_default_visibility?: Database['public']['Enums']['version_status'];
          p_id: string;
          p_ip: unknown;
          p_name: string;
          p_parent_category_id?: string;
        };
        Returns: undefined;
      };
      prepared_update_pending_article: {
        Args: {
          p_actor_id: string;
          p_article_id: string;
          p_category_id: string;
          p_character_id?: string;
          p_content: string;
          p_ip: unknown;
          p_title: string;
          p_update_character?: boolean;
          p_version_id: string;
        };
        Returns: undefined;
      };
      prune_redundant_group_grants: {
        Args: { p_group_id: string };
        Returns: undefined;
      };
      publish_game_data_actions: {
        Args: { p_entity_type: string; p_entries: Json; p_message?: string };
        Returns: {
          id: string;
          is_public: boolean;
          status: Database['public']['Enums']['game_data_action_status'];
        }[];
      };
      read_game_data_approved_replay_epoch: { Args: never; Returns: number };
      read_game_data_approved_replay_snapshot: {
        Args: never;
        Returns: {
          action_rows: Json;
          replay_epoch: number;
        }[];
      };
      read_game_data_character_contributor_source: {
        Args: never;
        Returns: Json;
      };
      read_game_data_synced_history_source: { Args: never; Returns: Json };
      record_user_last_ip: {
        Args: { p_ip: unknown; p_user_id: string };
        Returns: undefined;
      };
      reject_article_version: {
        Args: { p_version_id: string };
        Returns: undefined;
      };
      reject_game_data_action: {
        Args: { p_action_id: string; p_reason?: string };
        Returns: undefined;
      };
      revoke_article_version: {
        Args: { p_version_id: string };
        Returns: undefined;
      };
      save_permission_group: {
        Args: {
          p_description: string;
          p_grants: Json;
          p_group_id: string;
          p_is_default: boolean;
          p_name: string;
        };
        Returns: undefined;
      };
      save_permission_group_v2: {
        Args: {
          p_description: string;
          p_grants: Json;
          p_group_id: string;
          p_is_default: boolean;
          p_name: string;
          p_parent_group_id: string;
        };
        Returns: undefined;
      };
      set_comment_status: {
        Args: {
          p_comment_id: string;
          p_status: Database['public']['Enums']['comment_status'];
        };
        Returns: undefined;
      };
      set_group_grants: {
        Args: { p_grants: Json; p_group_id: string };
        Returns: undefined;
      };
      set_group_parent: {
        Args: { p_group_id: string; p_parent_group_id: string };
        Returns: undefined;
      };
      set_user_groups: {
        Args: { p_group_ids: string[]; p_user_id: string };
        Returns: undefined;
      };
      submit_article: {
        Args: {
          p_article_id: string;
          p_category_id: string;
          p_character_id?: string;
          p_commit_message?: string;
          p_content: string;
          p_title: string;
        };
        Returns: {
          submitted_status: Database['public']['Enums']['version_status'];
          submitted_version_id: string;
        }[];
      };
      unblock: {
        Args: { p_block_id: string; p_reason: string };
        Returns: undefined;
      };
      update_category: {
        Args: {
          _default_visibility?: Database['public']['Enums']['version_status'];
          _id: string;
          _name: string;
          _parent_category_id?: string;
        };
        Returns: undefined;
      };
      update_pending_article: {
        Args: {
          p_article_id: string;
          p_category_id: string;
          p_character_id: string;
          p_content: string;
          p_title: string;
          p_update_character: boolean;
          p_version_id: string;
        };
        Returns: undefined;
      };
      update_permission_group: {
        Args: {
          p_description: string;
          p_group_id: string;
          p_is_default: boolean;
          p_name: string;
        };
        Returns: undefined;
      };
      user_has_permission: {
        Args: {
          p_permission_key: string;
          p_resource_id?: string;
          p_resource_type?: string;
          p_user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      comment_scope:
        | 'articles'
        | 'characters'
        | 'knowledge_cards'
        | 'entities'
        | 'items'
        | 'buffs'
        | 'maps'
        | 'fixtures'
        | 'modes'
        | 'achievements'
        | 'special_skills'
        | 'list_pages';
      comment_status: 'visible' | 'hidden' | 'deleted';
      game_data_action_status: 'pending' | 'approved' | 'rejected' | 'synced' | 'revoked';
      permission_scope: 'global' | 'resource_type' | 'resource';
      version_status: 'pending' | 'approved' | 'rejected' | 'revoked';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
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
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
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
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
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
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
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

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      comment_scope: [
        'articles',
        'characters',
        'knowledge_cards',
        'entities',
        'items',
        'buffs',
        'maps',
        'fixtures',
        'modes',
        'achievements',
        'special_skills',
        'list_pages',
      ],
      comment_status: ['visible', 'hidden', 'deleted'],
      game_data_action_status: ['pending', 'approved', 'rejected', 'synced', 'revoked'],
      permission_scope: ['global', 'resource_type', 'resource'],
      version_status: ['pending', 'approved', 'rejected', 'revoked'],
    },
  },
} as const;
