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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      idea_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          idea_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          idea_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          idea_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_notes_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas: {
        Row: {
          ai_reasoning: string | null
          ai_score: number | null
          category: string | null
          check_clear_problem: boolean | null
          check_deployable_mvp: boolean | null
          check_simple_loop: boolean | null
          core_loop: string | null
          core_problem: string
          core_value_proposition: string
          created_at: string
          description: string | null
          difficulty: number | null
          id: string
          is_template: boolean
          main_idea: string | null
          mvp_shape: string | null
          priority: number | null
          sort_order: number | null
          sprint_fit: number | null
          status: Database["public"]["Enums"]["idea_status"]
          target_user: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_reasoning?: string | null
          ai_score?: number | null
          category?: string | null
          check_clear_problem?: boolean | null
          check_deployable_mvp?: boolean | null
          check_simple_loop?: boolean | null
          core_loop?: string | null
          core_problem: string
          core_value_proposition: string
          created_at?: string
          description?: string | null
          difficulty?: number | null
          id?: string
          is_template?: boolean
          main_idea?: string | null
          mvp_shape?: string | null
          priority?: number | null
          sort_order?: number | null
          sprint_fit?: number | null
          status?: Database["public"]["Enums"]["idea_status"]
          target_user?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_reasoning?: string | null
          ai_score?: number | null
          category?: string | null
          check_clear_problem?: boolean | null
          check_deployable_mvp?: boolean | null
          check_simple_loop?: boolean | null
          core_loop?: string | null
          core_problem?: string
          core_value_proposition?: string
          created_at?: string
          description?: string | null
          difficulty?: number | null
          id?: string
          is_template?: boolean
          main_idea?: string | null
          mvp_shape?: string | null
          priority?: number | null
          sort_order?: number | null
          sprint_fit?: number | null
          status?: Database["public"]["Enums"]["idea_status"]
          target_user?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          building_experience: string | null
          created_at: string
          display_name: string | null
          email: string | null
          goals: string[] | null
          id: string
          location: string | null
          notifications_enabled: boolean | null
          onboarding_completed_at: string | null
          phone: string | null
          subscription_status: string | null
          subscription_tier: string | null
          tools_used: string[] | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
          user_type: string | null
          weekly_hours: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          building_experience?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          goals?: string[] | null
          id?: string
          location?: string | null
          notifications_enabled?: boolean | null
          onboarding_completed_at?: string | null
          phone?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          tools_used?: string[] | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
          user_type?: string | null
          weekly_hours?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          building_experience?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          goals?: string[] | null
          id?: string
          location?: string | null
          notifications_enabled?: boolean | null
          onboarding_completed_at?: string | null
          phone?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          tools_used?: string[] | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
          user_type?: string | null
          weekly_hours?: string | null
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
      idea_status:
        | "idea"
        | "shortlisted"
        | "building"
        | "paused"
        | "shipped"
        | "archived"
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
    Enums: {
      idea_status: [
        "idea",
        "shortlisted",
        "building",
        "paused",
        "shipped",
        "archived",
      ],
    },
  },
} as const
