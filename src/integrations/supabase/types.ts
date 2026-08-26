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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          code: string
          description: string
          icon: string
          name: string
        }
        Insert: {
          code: string
          description: string
          icon: string
          name: string
        }
        Update: {
          code?: string
          description?: string
          icon?: string
          name?: string
        }
        Relationships: []
      }
      assessment_questions: {
        Row: {
          assessment_id: string
          correct_index: number
          created_at: string
          explanation: string
          id: string
          options: Json
          position: number
          scenario: string
          updated_at: string
        }
        Insert: {
          assessment_id: string
          correct_index: number
          created_at?: string
          explanation?: string
          id?: string
          options: Json
          position: number
          scenario: string
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          correct_index?: number
          created_at?: string
          explanation?: string
          id?: string
          options?: Json
          position?: number
          scenario?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_responses: {
        Row: {
          answers: Json
          assessment_id: string
          completed_at: string
          id: string
          score: number
          user_id: string
          xp_earned: number
        }
        Insert: {
          answers: Json
          assessment_id: string
          completed_at?: string
          id?: string
          score: number
          user_id: string
          xp_earned?: number
        }
        Update: {
          answers?: Json
          assessment_id?: string
          completed_at?: string
          id?: string
          score?: number
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessment_responses_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          created_at: string
          created_by: string
          description: string
          estimated_minutes: number
          group_id: string
          id: string
          source: string
          status: string
          target_questions: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string
          estimated_minutes?: number
          group_id: string
          id?: string
          source?: string
          status?: string
          target_questions?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          estimated_minutes?: number
          group_id?: string
          id?: string
          source?: string
          status?: string
          target_questions?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_weeks: {
        Row: {
          created_at: string
          fact: string
          quarter: number
          status: string
          topic: string
          week_number: number
        }
        Insert: {
          created_at?: string
          fact: string
          quarter: number
          status?: string
          topic: string
          week_number: number
        }
        Update: {
          created_at?: string
          fact?: string
          quarter?: number
          status?: string
          topic?: string
          week_number?: number
        }
        Relationships: []
      }
      groups: {
        Row: {
          created_at: string
          id: string
          member_limit: number
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_limit?: number
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          member_limit?: number
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      invites: {
        Row: {
          created_at: string
          email: string
          group_id: string
          id: string
          invited_by: string | null
          status: string
          token: string
        }
        Insert: {
          created_at?: string
          email: string
          group_id: string
          id?: string
          invited_by?: string | null
          status?: string
          token?: string
        }
        Update: {
          created_at?: string
          email?: string
          group_id?: string
          id?: string
          invited_by?: string | null
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      org_settings: {
        Row: {
          company_name: string
          current_week: number
          id: number
          release_day: string
          release_time: string
          setup_complete: boolean
        }
        Insert: {
          company_name?: string
          current_week?: number
          id?: number
          release_day?: string
          release_time?: string
          setup_complete?: boolean
        }
        Update: {
          company_name?: string
          current_week?: number
          id?: number
          release_day?: string
          release_time?: string
          setup_complete?: boolean
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          current_streak: number
          display_name: string | null
          email: string
          full_name: string | null
          group_id: string | null
          id: string
          last_completed_at: string | null
          last_completed_week: number | null
          level: number
          longest_streak: number
          total_xp: number
        }
        Insert: {
          created_at?: string
          current_streak?: number
          display_name?: string | null
          email: string
          full_name?: string | null
          group_id?: string | null
          id: string
          last_completed_at?: string | null
          last_completed_week?: number | null
          level?: number
          longest_streak?: number
          total_xp?: number
        }
        Update: {
          created_at?: string
          current_streak?: number
          display_name?: string | null
          email?: string
          full_name?: string | null
          group_id?: string | null
          id?: string
          last_completed_at?: string | null
          last_completed_week?: number | null
          level?: number
          longest_streak?: number
          total_xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      question_overrides: {
        Row: {
          correct_index: number
          explanation: string
          id: string
          options: Json
          question_index: number
          scenario: string
          updated_at: string
          week_number: number
        }
        Insert: {
          correct_index: number
          explanation: string
          id?: string
          options: Json
          question_index: number
          scenario: string
          updated_at?: string
          week_number: number
        }
        Update: {
          correct_index?: number
          explanation?: string
          id?: string
          options?: Json
          question_index?: number
          scenario?: string
          updated_at?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_overrides_week_number_fkey"
            columns: ["week_number"]
            isOneToOne: false
            referencedRelation: "curriculum_weeks"
            referencedColumns: ["week_number"]
          },
        ]
      }
      responses: {
        Row: {
          answers: Json
          completed_at: string
          id: string
          score: number
          streak_bonus: number
          user_id: string
          week_number: number
          xp_earned: number
        }
        Insert: {
          answers: Json
          completed_at?: string
          id?: string
          score: number
          streak_bonus?: number
          user_id: string
          week_number: number
          xp_earned: number
        }
        Update: {
          answers?: Json
          completed_at?: string
          id?: string
          score?: number
          streak_bonus?: number
          user_id?: string
          week_number?: number
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "responses_week_number_fkey"
            columns: ["week_number"]
            isOneToOne: false
            referencedRelation: "curriculum_weeks"
            referencedColumns: ["week_number"]
          },
        ]
      }
      upgrade_interest: {
        Row: {
          created_at: string
          group_id: string | null
          id: string
          seats_wanted: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id?: string | null
          id?: string
          seats_wanted?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string | null
          id?: string
          seats_wanted?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "upgrade_interest_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_code: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_code: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_code?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_code_fkey"
            columns: ["achievement_code"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["code"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_leaderboard: {
        Row: {
          current_streak: number | null
          display_name: string | null
          id: string | null
          last_completed_week: number | null
          level: number | null
          total_xp: number | null
        }
        Insert: {
          current_streak?: number | null
          display_name?: never
          id?: string | null
          last_completed_week?: number | null
          level?: number | null
          total_xp?: number | null
        }
        Update: {
          current_streak?: number | null
          display_name?: never
          id?: string | null
          last_completed_week?: number | null
          level?: number | null
          total_xp?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_invite: { Args: { _invite_id: string }; Returns: string }
      create_group: { Args: { _name: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
      leave_group: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "ta_admin" | "hiring_manager"
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
      app_role: ["ta_admin", "hiring_manager"],
    },
  },
} as const
