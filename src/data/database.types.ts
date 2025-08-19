export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.4';
  };
  public: {
    Tables: {
      article_versions: {
        Row: {
          article_id: string;
          content: string;
          created_at: string;
          editor_id: string;
          id: string;
          preview_token: string;
          status: Database['public']['Enums']['version_status'];
        };
        Insert: {
          article_id: string;
          content: string;
          created_at?: string;
          editor_id: string;
          id?: string;
          preview_token: string;
          status: Database['public']['Enums']['version_status'];
        };
        Update: {
          article_id?: string;
          content?: string;
          created_at?: string;
          editor_id?: string;
          id?: string;
          preview_token?: string;
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
        ];
      };
      articles: {
        Row: {
          author_id: string;
          category_id: string;
          created_at: string;
          id: string;
          title: string;
        };
        Insert: {
          author_id: string;
          category_id: string;
          created_at?: string;
          id?: string;
          title: string;
        };
        Update: {
          author_id?: string;
          category_id?: string;
          created_at?: string;
          id?: string;
          title?: string;
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
        ];
      };
      categories: {
        Row: {
          default_visibility: Database['public']['Enums']['version_status'] | null;
          id: string;
          name: string;
          parent_category_id: string | null;
        };
        Insert: {
          default_visibility?: Database['public']['Enums']['version_status'] | null;
          id?: string;
          name: string;
          parent_category_id?: string | null;
        };
        Update: {
          default_visibility?: Database['public']['Enums']['version_status'] | null;
          id?: string;
          name?: string;
          parent_category_id?: string | null;
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
      users: {
        Row: {
          id: string;
          nickname: string;
          password_hash: string | null;
          role: Database['public']['Enums']['role_type'];
          salt: string;
          username_hash: string;
        };
        Insert: {
          id: string;
          nickname: string;
          password_hash?: string | null;
          role?: Database['public']['Enums']['role_type'];
          salt: string;
          username_hash: string;
        };
        Update: {
          id?: string;
          nickname?: string;
          password_hash?: string | null;
          role?: Database['public']['Enums']['role_type'];
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
          content: string | null;
          created_at: string | null;
          editor_id: string | null;
          id: string | null;
          status: Database['public']['Enums']['version_status'] | null;
        };
        Insert: {
          article_id?: string | null;
          content?: string | null;
          created_at?: string | null;
          editor_id?: string | null;
          id?: string | null;
          status?: Database['public']['Enums']['version_status'] | null;
        };
        Update: {
          article_id?: string | null;
          content?: string | null;
          created_at?: string | null;
          editor_id?: string | null;
          id?: string | null;
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
        Args: { p_reviewer_id: string; p_version_id: string };
        Returns: undefined;
      };
      create_category: {
        Args: {
          _default_visibility?: Database['public']['Enums']['version_status'];
          _name: string;
          _parent_category_id?: string;
        };
        Returns: string;
      };
      delete_category: {
        Args: { _id: string };
        Returns: undefined;
      };
      generate_salt: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_article_version_by_preview: {
        Args: { p_token: string };
        Returns: {
          article_id: string;
          content: string;
          created_at: string;
          editor_id: string;
          id: string;
          preview_token: string;
          status: Database['public']['Enums']['version_status'];
        }[];
      };
      get_categories: {
        Args: Record<PropertyKey, never>;
        Returns: {
          default_visibility: Database['public']['Enums']['version_status'];
          id: string;
          name: string;
          parent_category_id: string;
        }[];
      };
      get_pending_versions_for_moderation: {
        Args: { p_requester_id: string };
        Returns: {
          article_id: string;
          article_title: string;
          category_name: string;
          content: string;
          created_at: string;
          editor_id: string;
          editor_nickname: string;
          preview_token: string;
          status: Database['public']['Enums']['version_status'];
          version_id: string;
        }[];
      };
      get_user_role: {
        Args: { p_user_id: string };
        Returns: Database['public']['Enums']['role_type'];
      };
      hash_credential: {
        Args: { credential: string; salt: string };
        Returns: string;
      };
      reject_article_version: {
        Args: { p_reviewer_id: string; p_version_id: string };
        Returns: undefined;
      };
      revoke_article_version: {
        Args: { p_reviewer_id: string; p_version_id: string };
        Returns: undefined;
      };
      submit_article: {
        Args: {
          p_article_id: string;
          p_category_id: string;
          p_content: string;
          p_editor_id: string;
          p_title: string;
        };
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
    };
    Enums: {
      role_type: 'Contributor' | 'Reviewer' | 'Coordinator';
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
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
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
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
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
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
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      role_type: ['Contributor', 'Reviewer', 'Coordinator'],
      version_status: ['pending', 'approved', 'rejected', 'revoked'],
    },
  },
} as const;
