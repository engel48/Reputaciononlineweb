export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          action: string
          created_at: string
          description: string
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          description: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          created_at: string
          frequency: string
          id: string
          is_active: boolean
          keywords: string
          last_triggered: string | null
          name: string
          platforms: string
          sentiment: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean
          keywords: string
          last_triggered?: string | null
          name: string
          platforms: string
          sentiment?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean
          keywords?: string
          last_triggered?: string | null
          name?: string
          platforms?: string
          sentiment?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      media_sources: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_default: boolean
          logo_url: string | null
          name: string
          updated_at: string
          url: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          logo_url?: string | null
          name: string
          updated_at?: string
          url: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          logo_url?: string | null
          name?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      monitoring_sources: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_default: boolean
          logo_url: string | null
          name: string
          updated_at: string
          url: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          logo_url?: string | null
          name: string
          updated_at?: string
          url: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          logo_url?: string | null
          name?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          priority: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          priority?: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          priority?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          data: string
          date_range: string
          file_url: string | null
          id: string
          name: string
          status: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data: string
          date_range: string
          file_url?: string | null
          id?: string
          name: string
          status?: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          date_range?: string
          file_url?: string | null
          id?: string
          name?: string
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media: {
        Row: {
          access_token: string | null
          connected: boolean
          created_at: string
          engagement: number
          followers: number
          following: number
          id: string
          last_sync: string | null
          platform: string
          posts: number
          profile_url: string | null
          refresh_token: string | null
          token_expiry: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          access_token?: string | null
          connected?: boolean
          created_at?: string
          engagement?: number
          followers?: number
          following?: number
          id?: string
          last_sync?: string | null
          platform: string
          posts?: number
          profile_url?: string | null
          refresh_token?: string | null
          token_expiry?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          access_token?: string | null
          connected?: boolean
          created_at?: string
          engagement?: number
          followers?: number
          following?: number
          id?: string
          last_sync?: string | null
          platform?: string
          posts?: number
          profile_url?: string | null
          refresh_token?: string | null
          token_expiry?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_media_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      social_platforms: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          oauth_config: Json | null
          platform: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          oauth_config?: Json | null
          platform: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          oauth_config?: Json | null
          platform?: string
        }
        Relationships: []
      }
      user_media_sources: {
        Row: {
          added_at: string
          id: string
          is_selected: boolean
          media_source_id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          is_selected?: boolean
          media_source_id: string
          user_id: string
        }
        Update: {
          added_at?: string
          id?: string
          is_selected?: boolean
          media_source_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_media_sources_media_source_id_fkey"
            columns: ["media_source_id"]
            isOneToOne: false
            referencedRelation: "media_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_media_sources_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          engagement_rate: number
          id: string
          influence_score: number
          last_calculated: string
          monthly_growth: number
          negative_mentions: number
          neutral_mentions: number
          positive_mentions: number
          reach_estimate: number
          sentiment_score: number
          total_mentions: number
          trending_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          engagement_rate?: number
          id?: string
          influence_score?: number
          last_calculated?: string
          monthly_growth?: number
          negative_mentions?: number
          neutral_mentions?: number
          positive_mentions?: number
          reach_estimate?: number
          sentiment_score?: number
          total_mentions?: number
          trending_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          engagement_rate?: number
          id?: string
          influence_score?: number
          last_calculated?: string
          monthly_growth?: number
          negative_mentions?: number
          neutral_mentions?: number
          positive_mentions?: number
          reach_estimate?: number
          sentiment_score?: number
          total_mentions?: number
          trending_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          additional_sources: string | null
          avatar_url: string | null
          bio: string | null
          brand_name: string | null
          category: string | null
          company: string | null
          created_at: string
          credits: number
          email: string
          id: string
          last_login: string | null
          name: string | null
          next_billing_date: string | null
          onboarding_completed: boolean
          other_category: string | null
          password: string
          phone: string | null
          plan: string
          profile_type: string | null
          role: string
          updated_at: string
        }
        Insert: {
          additional_sources?: string | null
          avatar_url?: string | null
          bio?: string | null
          brand_name?: string | null
          category?: string | null
          company?: string | null
          created_at?: string
          credits?: number
          email: string
          id?: string
          last_login?: string | null
          name?: string | null
          next_billing_date?: string | null
          onboarding_completed?: boolean
          other_category?: string | null
          password: string
          phone?: string | null
          plan?: string
          profile_type?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          additional_sources?: string | null
          avatar_url?: string | null
          bio?: string | null
          brand_name?: string | null
          category?: string | null
          company?: string | null
          created_at?: string
          credits?: number
          email?: string
          id?: string
          last_login?: string | null
          name?: string | null
          next_billing_date?: string | null
          onboarding_completed?: boolean
          other_category?: string | null
          password?: string
          phone?: string | null
          plan?: string
          profile_type?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
