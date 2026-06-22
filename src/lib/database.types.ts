export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          allow_latecomers: boolean;
          attendees: Json;
          chat_messages: Json;
          closed_at: string | null;
          created_at: string;
          cuisine_type: string | null;
          date_time: string | null;
          description: string | null;
          duration_minutes: number;
          duration_type: string | null;
          host_avatar: string | null;
          host_bio: string | null;
          host_id: string;
          host_intent_tags: string[];
          host_name: string | null;
          host_reputation_tags: Json;
          host_table_note: string | null;
          icebreaker: string | null;
          id: string;
          image_url: string | null;
          is_private: boolean;
          latitude: number | null;
          lgbtq_friendly: boolean;
          lgbtq_only: boolean;
          longitude: number | null;
          map_link: string | null;
          max_seats: number;
          min_seats: number;
          photos: Json;
          price_range: string | null;
          rating: number | null;
          rating_count: number | null;
          review_link: string | null;
          seats_taken: number;
          status: string;
          title: string;
          topics_to_avoid: string | null;
          updated_at: string;
          venue_address: string | null;
          venue_name: string | null;
          venue_type: string;
          vibe: string[];
          waitlist: Json;
          wrap_up_responses: Json;
        };
        Insert: {
          allow_latecomers?: boolean;
          attendees?: Json;
          chat_messages?: Json;
          closed_at?: string | null;
          created_at?: string;
          cuisine_type?: string | null;
          date_time?: string | null;
          description?: string | null;
          duration_minutes?: number;
          duration_type?: string | null;
          host_avatar?: string | null;
          host_bio?: string | null;
          host_id: string;
          host_intent_tags?: string[];
          host_name?: string | null;
          host_reputation_tags?: Json;
          host_table_note?: string | null;
          icebreaker?: string | null;
          id?: string;
          image_url?: string | null;
          is_private?: boolean;
          latitude?: number | null;
          lgbtq_friendly?: boolean;
          lgbtq_only?: boolean;
          longitude?: number | null;
          map_link?: string | null;
          max_seats?: number;
          min_seats?: number;
          photos?: Json;
          price_range?: string | null;
          rating?: number | null;
          rating_count?: number | null;
          review_link?: string | null;
          seats_taken?: number;
          status?: string;
          title: string;
          topics_to_avoid?: string | null;
          updated_at?: string;
          venue_address?: string | null;
          venue_name?: string | null;
          venue_type?: string;
          vibe?: string[];
          waitlist?: Json;
          wrap_up_responses?: Json;
        };
        Update: {
          allow_latecomers?: boolean;
          attendees?: Json;
          chat_messages?: Json;
          closed_at?: string | null;
          created_at?: string;
          cuisine_type?: string | null;
          date_time?: string | null;
          description?: string | null;
          duration_minutes?: number;
          duration_type?: string | null;
          host_avatar?: string | null;
          host_bio?: string | null;
          host_id?: string;
          host_intent_tags?: string[];
          host_name?: string | null;
          host_reputation_tags?: Json;
          host_table_note?: string | null;
          icebreaker?: string | null;
          id?: string;
          image_url?: string | null;
          is_private?: boolean;
          latitude?: number | null;
          lgbtq_friendly?: boolean;
          lgbtq_only?: boolean;
          longitude?: number | null;
          map_link?: string | null;
          max_seats?: number;
          min_seats?: number;
          photos?: Json;
          price_range?: string | null;
          rating?: number | null;
          rating_count?: number | null;
          review_link?: string | null;
          seats_taken?: number;
          status?: string;
          title?: string;
          topics_to_avoid?: string | null;
          updated_at?: string;
          venue_address?: string | null;
          venue_name?: string | null;
          venue_type?: string;
          vibe?: string[];
          waitlist?: Json;
          wrap_up_responses?: Json;
        };
        Relationships: [
          {
            foreignKeyName: 'events_host_id_fkey';
            columns: ['host_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          blocked_users: string[];
          connection_requests: string[];
          connections: string[];
          created_at: string;
          email: string | null;
          favorite_cuisines: string[];
          full_name: string | null;
          home_area: string | null;
          id: string;
          muted_users: string[];
          notification_preferences: Json;
          reputation_score: number;
          reputation_tags: Json;
          sent_requests: string[];
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          blocked_users?: string[];
          connection_requests?: string[];
          connections?: string[];
          created_at?: string;
          email?: string | null;
          favorite_cuisines?: string[];
          full_name?: string | null;
          home_area?: string | null;
          id: string;
          muted_users?: string[];
          notification_preferences?: Json;
          reputation_score?: number;
          reputation_tags?: Json;
          sent_requests?: string[];
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          blocked_users?: string[];
          connection_requests?: string[];
          connections?: string[];
          created_at?: string;
          email?: string | null;
          favorite_cuisines?: string[];
          full_name?: string | null;
          home_area?: string | null;
          id?: string;
          muted_users?: string[];
          notification_preferences?: Json;
          reputation_score?: number;
          reputation_tags?: Json;
          sent_requests?: string[];
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      approve_waitlist: {
        Args: { p_event_id: string; p_user_id: string };
        Returns: {
          allow_latecomers: boolean;
          attendees: Json;
          chat_messages: Json;
          closed_at: string | null;
          created_at: string;
          cuisine_type: string | null;
          date_time: string | null;
          description: string | null;
          duration_minutes: number;
          duration_type: string | null;
          host_avatar: string | null;
          host_bio: string | null;
          host_id: string;
          host_intent_tags: string[];
          host_name: string | null;
          host_reputation_tags: Json;
          host_table_note: string | null;
          icebreaker: string | null;
          id: string;
          image_url: string | null;
          is_private: boolean;
          latitude: number | null;
          lgbtq_friendly: boolean;
          lgbtq_only: boolean;
          longitude: number | null;
          map_link: string | null;
          max_seats: number;
          min_seats: number;
          photos: Json;
          price_range: string | null;
          rating: number | null;
          rating_count: number | null;
          review_link: string | null;
          seats_taken: number;
          status: string;
          title: string;
          topics_to_avoid: string | null;
          updated_at: string;
          venue_address: string | null;
          venue_name: string | null;
          venue_type: string;
          vibe: string[];
          waitlist: Json;
          wrap_up_responses: Json;
        };
        SetofOptions: {
          from: '*';
          to: 'events';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      join_event: {
        Args: { p_event_id: string };
        Returns: {
          allow_latecomers: boolean;
          attendees: Json;
          chat_messages: Json;
          closed_at: string | null;
          created_at: string;
          cuisine_type: string | null;
          date_time: string | null;
          description: string | null;
          duration_minutes: number;
          duration_type: string | null;
          host_avatar: string | null;
          host_bio: string | null;
          host_id: string;
          host_intent_tags: string[];
          host_name: string | null;
          host_reputation_tags: Json;
          host_table_note: string | null;
          icebreaker: string | null;
          id: string;
          image_url: string | null;
          is_private: boolean;
          latitude: number | null;
          lgbtq_friendly: boolean;
          lgbtq_only: boolean;
          longitude: number | null;
          map_link: string | null;
          max_seats: number;
          min_seats: number;
          photos: Json;
          price_range: string | null;
          rating: number | null;
          rating_count: number | null;
          review_link: string | null;
          seats_taken: number;
          status: string;
          title: string;
          topics_to_avoid: string | null;
          updated_at: string;
          venue_address: string | null;
          venue_name: string | null;
          venue_type: string;
          vibe: string[];
          waitlist: Json;
          wrap_up_responses: Json;
        };
        SetofOptions: {
          from: '*';
          to: 'events';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      join_waitlist: {
        Args: { p_event_id: string };
        Returns: {
          allow_latecomers: boolean;
          attendees: Json;
          chat_messages: Json;
          closed_at: string | null;
          created_at: string;
          cuisine_type: string | null;
          date_time: string | null;
          description: string | null;
          duration_minutes: number;
          duration_type: string | null;
          host_avatar: string | null;
          host_bio: string | null;
          host_id: string;
          host_intent_tags: string[];
          host_name: string | null;
          host_reputation_tags: Json;
          host_table_note: string | null;
          icebreaker: string | null;
          id: string;
          image_url: string | null;
          is_private: boolean;
          latitude: number | null;
          lgbtq_friendly: boolean;
          lgbtq_only: boolean;
          longitude: number | null;
          map_link: string | null;
          max_seats: number;
          min_seats: number;
          photos: Json;
          price_range: string | null;
          rating: number | null;
          rating_count: number | null;
          review_link: string | null;
          seats_taken: number;
          status: string;
          title: string;
          topics_to_avoid: string | null;
          updated_at: string;
          venue_address: string | null;
          venue_name: string | null;
          venue_type: string;
          vibe: string[];
          waitlist: Json;
          wrap_up_responses: Json;
        };
        SetofOptions: {
          from: '*';
          to: 'events';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      leave_event: {
        Args: { p_event_id: string };
        Returns: {
          allow_latecomers: boolean;
          attendees: Json;
          chat_messages: Json;
          closed_at: string | null;
          created_at: string;
          cuisine_type: string | null;
          date_time: string | null;
          description: string | null;
          duration_minutes: number;
          duration_type: string | null;
          host_avatar: string | null;
          host_bio: string | null;
          host_id: string;
          host_intent_tags: string[];
          host_name: string | null;
          host_reputation_tags: Json;
          host_table_note: string | null;
          icebreaker: string | null;
          id: string;
          image_url: string | null;
          is_private: boolean;
          latitude: number | null;
          lgbtq_friendly: boolean;
          lgbtq_only: boolean;
          longitude: number | null;
          map_link: string | null;
          max_seats: number;
          min_seats: number;
          photos: Json;
          price_range: string | null;
          rating: number | null;
          rating_count: number | null;
          review_link: string | null;
          seats_taken: number;
          status: string;
          title: string;
          topics_to_avoid: string | null;
          updated_at: string;
          venue_address: string | null;
          venue_name: string | null;
          venue_type: string;
          vibe: string[];
          waitlist: Json;
          wrap_up_responses: Json;
        };
        SetofOptions: {
          from: '*';
          to: 'events';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      manage_connection: {
        Args: { p_action: string; p_target_user_id: string };
        Returns: undefined;
      };
      process_reputation: { Args: { p_user_id: string }; Returns: undefined };
      reject_waitlist: {
        Args: { p_event_id: string; p_user_id: string };
        Returns: {
          allow_latecomers: boolean;
          attendees: Json;
          chat_messages: Json;
          closed_at: string | null;
          created_at: string;
          cuisine_type: string | null;
          date_time: string | null;
          description: string | null;
          duration_minutes: number;
          duration_type: string | null;
          host_avatar: string | null;
          host_bio: string | null;
          host_id: string;
          host_intent_tags: string[];
          host_name: string | null;
          host_reputation_tags: Json;
          host_table_note: string | null;
          icebreaker: string | null;
          id: string;
          image_url: string | null;
          is_private: boolean;
          latitude: number | null;
          lgbtq_friendly: boolean;
          lgbtq_only: boolean;
          longitude: number | null;
          map_link: string | null;
          max_seats: number;
          min_seats: number;
          photos: Json;
          price_range: string | null;
          rating: number | null;
          rating_count: number | null;
          review_link: string | null;
          seats_taken: number;
          status: string;
          title: string;
          topics_to_avoid: string | null;
          updated_at: string;
          venue_address: string | null;
          venue_name: string | null;
          venue_type: string;
          vibe: string[];
          waitlist: Json;
          wrap_up_responses: Json;
        };
        SetofOptions: {
          from: '*';
          to: 'events';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      send_chat_message: {
        Args: {
          p_event_id: string;
          p_is_announcement?: boolean;
          p_message: string;
        };
        Returns: {
          allow_latecomers: boolean;
          attendees: Json;
          chat_messages: Json;
          closed_at: string | null;
          created_at: string;
          cuisine_type: string | null;
          date_time: string | null;
          description: string | null;
          duration_minutes: number;
          duration_type: string | null;
          host_avatar: string | null;
          host_bio: string | null;
          host_id: string;
          host_intent_tags: string[];
          host_name: string | null;
          host_reputation_tags: Json;
          host_table_note: string | null;
          icebreaker: string | null;
          id: string;
          image_url: string | null;
          is_private: boolean;
          latitude: number | null;
          lgbtq_friendly: boolean;
          lgbtq_only: boolean;
          longitude: number | null;
          map_link: string | null;
          max_seats: number;
          min_seats: number;
          photos: Json;
          price_range: string | null;
          rating: number | null;
          rating_count: number | null;
          review_link: string | null;
          seats_taken: number;
          status: string;
          title: string;
          topics_to_avoid: string | null;
          updated_at: string;
          venue_address: string | null;
          venue_name: string | null;
          venue_type: string;
          vibe: string[];
          waitlist: Json;
          wrap_up_responses: Json;
        };
        SetofOptions: {
          from: '*';
          to: 'events';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      set_arrival_status: {
        Args: { p_event_id: string; p_status: string; p_user_id: string };
        Returns: {
          allow_latecomers: boolean;
          attendees: Json;
          chat_messages: Json;
          closed_at: string | null;
          created_at: string;
          cuisine_type: string | null;
          date_time: string | null;
          description: string | null;
          duration_minutes: number;
          duration_type: string | null;
          host_avatar: string | null;
          host_bio: string | null;
          host_id: string;
          host_intent_tags: string[];
          host_name: string | null;
          host_reputation_tags: Json;
          host_table_note: string | null;
          icebreaker: string | null;
          id: string;
          image_url: string | null;
          is_private: boolean;
          latitude: number | null;
          lgbtq_friendly: boolean;
          lgbtq_only: boolean;
          longitude: number | null;
          map_link: string | null;
          max_seats: number;
          min_seats: number;
          photos: Json;
          price_range: string | null;
          rating: number | null;
          rating_count: number | null;
          review_link: string | null;
          seats_taken: number;
          status: string;
          title: string;
          topics_to_avoid: string | null;
          updated_at: string;
          venue_address: string | null;
          venue_name: string | null;
          venue_type: string;
          vibe: string[];
          waitlist: Json;
          wrap_up_responses: Json;
        };
        SetofOptions: {
          from: '*';
          to: 'events';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      submit_wrap_up: {
        Args: {
          p_event_id: string;
          p_tags_given: Json;
          p_would_dine_again: boolean;
        };
        Returns: {
          allow_latecomers: boolean;
          attendees: Json;
          chat_messages: Json;
          closed_at: string | null;
          created_at: string;
          cuisine_type: string | null;
          date_time: string | null;
          description: string | null;
          duration_minutes: number;
          duration_type: string | null;
          host_avatar: string | null;
          host_bio: string | null;
          host_id: string;
          host_intent_tags: string[];
          host_name: string | null;
          host_reputation_tags: Json;
          host_table_note: string | null;
          icebreaker: string | null;
          id: string;
          image_url: string | null;
          is_private: boolean;
          latitude: number | null;
          lgbtq_friendly: boolean;
          lgbtq_only: boolean;
          longitude: number | null;
          map_link: string | null;
          max_seats: number;
          min_seats: number;
          photos: Json;
          price_range: string | null;
          rating: number | null;
          rating_count: number | null;
          review_link: string | null;
          seats_taken: number;
          status: string;
          title: string;
          topics_to_avoid: string | null;
          updated_at: string;
          venue_address: string | null;
          venue_name: string | null;
          venue_type: string;
          vibe: string[];
          waitlist: Json;
          wrap_up_responses: Json;
        };
        SetofOptions: {
          from: '*';
          to: 'events';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
    };
    Enums: {
      [_ in never]: never;
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
    Enums: {},
  },
} as const;
