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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      client_profiles: {
        Row: {
          communication_energy: number | null
          created_at: string
          decision_making_style: number | null
          formality_communication_style: number | null
          id: string
          interaction_focus: number | null
          pace_and_structure: number | null
          personality_notes: string | null
          updated_at: string
        }
        Insert: {
          communication_energy?: number | null
          created_at?: string
          decision_making_style?: number | null
          formality_communication_style?: number | null
          id: string
          interaction_focus?: number | null
          pace_and_structure?: number | null
          personality_notes?: string | null
          updated_at?: string
        }
        Update: {
          communication_energy?: number | null
          created_at?: string
          decision_making_style?: number | null
          formality_communication_style?: number | null
          id?: string
          interaction_focus?: number | null
          pace_and_structure?: number | null
          personality_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_quiz_answers: {
        Row: {
          answers: Json | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_entries: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          date: string
          habit_id: string
          id: string
          notes: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          date: string
          habit_id: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          date?: string
          habit_id?: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "habit_entries_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          description: string | null
          icon: string
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          icon: string
          id: string
          name: string
        }
        Update: {
          description?: string | null
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      magic_items: {
        Row: {
          attunement: boolean | null
          description: string
          id: string
          image_path: string | null
          name: string
          rarity: string
          rules: string | null
          theme: string | null
          type: string
        }
        Insert: {
          attunement?: boolean | null
          description: string
          id?: string
          image_path?: string | null
          name: string
          rarity: string
          rules?: string | null
          theme?: string | null
          type: string
        }
        Update: {
          attunement?: boolean | null
          description?: string
          id?: string
          image_path?: string | null
          name?: string
          rarity?: string
          rules?: string | null
          theme?: string | null
          type?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          client_id: string
          created_at: string
          id: string
          match_percentage: number
          salesperson_id: string | null
          sample_salesperson_id: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          match_percentage: number
          salesperson_id?: string | null
          sample_salesperson_id?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          match_percentage?: number
          salesperson_id?: string | null
          sample_salesperson_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_sample_salesperson_id_fkey"
            columns: ["sample_salesperson_id"]
            isOneToOne: false
            referencedRelation: "sample_salespeople"
            referencedColumns: ["id"]
          },
        ]
      }
      player_characters: {
        Row: {
          ac: number | null
          character_name: string
          con_save: number | null
          created_at: string
          dex_save: number | null
          id: string
          max_hp: number | null
          passive_perception: number | null
          player_name: string
          updated_at: string
          wis_save: number | null
        }
        Insert: {
          ac?: number | null
          character_name: string
          con_save?: number | null
          created_at?: string
          dex_save?: number | null
          id?: string
          max_hp?: number | null
          passive_perception?: number | null
          player_name: string
          updated_at?: string
          wis_save?: number | null
        }
        Update: {
          ac?: number | null
          character_name?: string
          con_save?: number | null
          created_at?: string
          dex_save?: number | null
          id?: string
          max_hp?: number | null
          passive_perception?: number | null
          player_name?: string
          updated_at?: string
          wis_save?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      salesperson_profiles: {
        Row: {
          communication_energy: number | null
          created_at: string
          decision_making_style: number | null
          formality_communication_style: number | null
          id: string
          interaction_focus: number | null
          pace_and_structure: number | null
          personality_notes: string | null
          updated_at: string
        }
        Insert: {
          communication_energy?: number | null
          created_at?: string
          decision_making_style?: number | null
          formality_communication_style?: number | null
          id: string
          interaction_focus?: number | null
          pace_and_structure?: number | null
          personality_notes?: string | null
          updated_at?: string
        }
        Update: {
          communication_energy?: number | null
          created_at?: string
          decision_making_style?: number | null
          formality_communication_style?: number | null
          id?: string
          interaction_focus?: number | null
          pace_and_structure?: number | null
          personality_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salesperson_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sample_salespeople: {
        Row: {
          created_at: string
          full_name: string
          headshot_url: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          headshot_url?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          headshot_url?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sample_salesperson_profiles: {
        Row: {
          communication_energy: number | null
          created_at: string
          decision_making_style: number | null
          formality_communication_style: number | null
          id: string
          interaction_focus: number | null
          pace_and_structure: number | null
          personality_notes: string | null
          updated_at: string
        }
        Insert: {
          communication_energy?: number | null
          created_at?: string
          decision_making_style?: number | null
          formality_communication_style?: number | null
          id: string
          interaction_focus?: number | null
          pace_and_structure?: number | null
          personality_notes?: string | null
          updated_at?: string
        }
        Update: {
          communication_energy?: number | null
          created_at?: string
          decision_making_style?: number | null
          formality_communication_style?: number | null
          id?: string
          interaction_focus?: number | null
          pace_and_structure?: number | null
          personality_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sample_salesperson_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "sample_salespeople"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestions: {
        Row: {
          created_at: string
          downvotes: number
          id: string
          text: string
          upvotes: number
        }
        Insert: {
          created_at?: string
          downvotes?: number
          id?: string
          text: string
          upvotes?: number
        }
        Update: {
          created_at?: string
          downvotes?: number
          id?: string
          text?: string
          upvotes?: number
        }
        Relationships: []
      }
      votes: {
        Row: {
          created_at: string
          id: string
          suggestion_id: string
          vote_value: number
          voter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          suggestion_id: string
          vote_value: number
          voter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          suggestion_id?: string
          vote_value?: number
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          created_at: string
          exercise_name: string
          id: string
          order_index: number
          reps: number
          sets: number
          updated_at: string
          workout_plan_id: string
        }
        Insert: {
          created_at?: string
          exercise_name: string
          id?: string
          order_index?: number
          reps: number
          sets: number
          updated_at?: string
          workout_plan_id: string
        }
        Update: {
          created_at?: string
          exercise_name?: string
          id?: string
          order_index?: number
          reps?: number
          sets?: number
          updated_at?: string
          workout_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plans: {
        Row: {
          created_at: string
          day_name: string
          day_number: number
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_name: string
          day_number: number
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_name?: string
          day_number?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      workout_records: {
        Row: {
          created_at: string
          current_weight: number
          date_recorded: string
          exercise_name: string
          id: string
          previous_best: number | null
          updated_at: string
          user_id: string | null
          workout_plan_id: string
        }
        Insert: {
          created_at?: string
          current_weight: number
          date_recorded?: string
          exercise_name: string
          id?: string
          previous_best?: number | null
          updated_at?: string
          user_id?: string | null
          workout_plan_id: string
        }
        Update: {
          created_at?: string
          current_weight?: number
          date_recorded?: string
          exercise_name?: string
          id?: string
          previous_best?: number | null
          updated_at?: string
          user_id?: string | null
          workout_plan_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_user_profile: {
        Args: {
          user_full_name: string
          user_id: string
          user_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: undefined
      }
    }
    Enums: {
      user_role: "client" | "salesperson"
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
      user_role: ["client", "salesperson"],
    },
  },
} as const
