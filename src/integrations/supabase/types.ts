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
    PostgrestVersion: "14.5"
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
      app_user_connections: {
        Row: {
          connection_key_ciphertext: string
          connector_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_key_ciphertext: string
          connector_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_key_ciphertext?: string
          connector_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
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
      calendar_attachment_content: {
        Row: {
          attachment_id: string
          created_at: string
          extracted_text: string
          retention_expires_at: string
        }
        Insert: {
          attachment_id: string
          created_at?: string
          extracted_text: string
          retention_expires_at: string
        }
        Update: {
          attachment_id?: string
          created_at?: string
          extracted_text?: string
          retention_expires_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_attachment_content_attachment_id_fkey"
            columns: ["attachment_id"]
            isOneToOne: true
            referencedRelation: "calendar_event_attachments"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_connections: {
        Row: {
          connected_at: string
          created_at: string
          id: string
          last_error_at: string | null
          last_error_code: string | null
          last_successful_sync_at: string | null
          last_sync_attempt_at: string | null
          provider: string
          provider_account_id: string | null
          provider_email: string | null
          scopes: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          connected_at?: string
          created_at?: string
          id?: string
          last_error_at?: string | null
          last_error_code?: string | null
          last_successful_sync_at?: string | null
          last_sync_attempt_at?: string | null
          provider: string
          provider_account_id?: string | null
          provider_email?: string | null
          scopes?: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          connected_at?: string
          created_at?: string
          id?: string
          last_error_at?: string | null
          last_error_code?: string | null
          last_successful_sync_at?: string | null
          last_sync_attempt_at?: string | null
          provider?: string
          provider_account_id?: string | null
          provider_email?: string | null
          scopes?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_event_attachments: {
        Row: {
          approved_for_generation: boolean
          attachment_type: string
          byte_size: number | null
          created_at: string
          document_classification: string | null
          external_attachment_id: string
          extraction_metadata: Json
          filename: string
          gmail_message_id: string | null
          id: string
          mime_type: string | null
          normalized_calendar_event_id: string
          processing_error_code: string | null
          processing_status: string
          retention_expires_at: string | null
          source_kind: string
          updated_at: string
        }
        Insert: {
          approved_for_generation?: boolean
          attachment_type: string
          byte_size?: number | null
          created_at?: string
          document_classification?: string | null
          external_attachment_id: string
          extraction_metadata?: Json
          filename: string
          gmail_message_id?: string | null
          id?: string
          mime_type?: string | null
          normalized_calendar_event_id: string
          processing_error_code?: string | null
          processing_status?: string
          retention_expires_at?: string | null
          source_kind?: string
          updated_at?: string
        }
        Update: {
          approved_for_generation?: boolean
          attachment_type?: string
          byte_size?: number | null
          created_at?: string
          document_classification?: string | null
          external_attachment_id?: string
          extraction_metadata?: Json
          filename?: string
          gmail_message_id?: string | null
          id?: string
          mime_type?: string | null
          normalized_calendar_event_id?: string
          processing_error_code?: string | null
          processing_status?: string
          retention_expires_at?: string | null
          source_kind?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_event_attachments_normalized_calendar_event_id_fkey"
            columns: ["normalized_calendar_event_id"]
            isOneToOne: false
            referencedRelation: "normalized_calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_sync_state: {
        Row: {
          calendar_connection_id: string
          created_at: string
          delta_token: string | null
          external_calendar_id: string
          id: string
          last_successful_sync_at: string | null
          last_window_end: string | null
          last_window_start: string | null
          updated_at: string
        }
        Insert: {
          calendar_connection_id: string
          created_at?: string
          delta_token?: string | null
          external_calendar_id?: string
          id?: string
          last_successful_sync_at?: string | null
          last_window_end?: string | null
          last_window_start?: string | null
          updated_at?: string
        }
        Update: {
          calendar_connection_id?: string
          created_at?: string
          delta_token?: string | null
          external_calendar_id?: string
          id?: string
          last_successful_sync_at?: string | null
          last_window_end?: string | null
          last_window_start?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_sync_state_calendar_connection_id_fkey"
            columns: ["calendar_connection_id"]
            isOneToOne: false
            referencedRelation: "calendar_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      capability_evidence: {
        Row: {
          capability_area: string
          difficulty: string
          evidence_weight: number
          id: string
          is_correct: boolean
          prep_question_id: string | null
          prep_session_id: string | null
          recorded_at: string
          sub_skill: string
          user_id: string
        }
        Insert: {
          capability_area: string
          difficulty?: string
          evidence_weight?: number
          id?: string
          is_correct: boolean
          prep_question_id?: string | null
          prep_session_id?: string | null
          recorded_at?: string
          sub_skill: string
          user_id: string
        }
        Update: {
          capability_area?: string
          difficulty?: string
          evidence_weight?: number
          id?: string
          is_correct?: boolean
          prep_question_id?: string | null
          prep_session_id?: string | null
          recorded_at?: string
          sub_skill?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "capability_evidence_prep_question_id_fkey"
            columns: ["prep_question_id"]
            isOneToOne: true
            referencedRelation: "prep_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capability_evidence_prep_session_id_fkey"
            columns: ["prep_session_id"]
            isOneToOne: false
            referencedRelation: "prep_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_tokens: {
        Row: {
          created_at: string
          name: string
          token: string
        }
        Insert: {
          created_at?: string
          name: string
          token?: string
        }
        Update: {
          created_at?: string
          name?: string
          token?: string
        }
        Relationships: []
      }
      curriculum_weeks: {
        Row: {
          created_at: string
          fact: string
          focus: string
          quarter: number
          status: string
          topic: string
          week_number: number
        }
        Insert: {
          created_at?: string
          fact: string
          focus?: string
          quarter: number
          status?: string
          topic: string
          week_number: number
        }
        Update: {
          created_at?: string
          fact?: string
          focus?: string
          quarter?: number
          status?: string
          topic?: string
          week_number?: number
        }
        Relationships: []
      }
      elective_responses: {
        Row: {
          answers: Json
          completed_at: string
          id: string
          lesson_slug: string
          module_slug: string
          score: number
          user_id: string
          xp_earned: number
        }
        Insert: {
          answers: Json
          completed_at?: string
          id?: string
          lesson_slug: string
          module_slug: string
          score: number
          user_id: string
          xp_earned?: number
        }
        Update: {
          answers?: Json
          completed_at?: string
          id?: string
          lesson_slug?: string
          module_slug?: string
          score?: number
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      group_electives: {
        Row: {
          created_at: string
          enabled_by: string | null
          group_id: string
          module_slug: string
        }
        Insert: {
          created_at?: string
          enabled_by?: string | null
          group_id: string
          module_slug: string
        }
        Update: {
          created_at?: string
          enabled_by?: string | null
          group_id?: string
          module_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_electives_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          id: string
          member_limit: number
          name: string
          owner_id: string
          track: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_limit?: number
          name: string
          owner_id: string
          track?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          member_limit?: number
          name?: string
          owner_id?: string
          track?: string
          updated_at?: string
        }
        Relationships: []
      }
      interview_classifications: {
        Row: {
          classification: string
          classifier_version: string
          confidence_score: number
          confirmed_at: string | null
          confirmed_by_user: boolean
          created_at: string
          detected_candidate_display_name: string | null
          detected_competencies: Json
          detected_interview_stage: string | null
          detected_role_title: string | null
          detection_reasons: Json
          id: string
          normalized_calendar_event_id: string
          updated_at: string
        }
        Insert: {
          classification: string
          classifier_version: string
          confidence_score?: number
          confirmed_at?: string | null
          confirmed_by_user?: boolean
          created_at?: string
          detected_candidate_display_name?: string | null
          detected_competencies?: Json
          detected_interview_stage?: string | null
          detected_role_title?: string | null
          detection_reasons?: Json
          id?: string
          normalized_calendar_event_id: string
          updated_at?: string
        }
        Update: {
          classification?: string
          classifier_version?: string
          confidence_score?: number
          confirmed_at?: string | null
          confirmed_by_user?: boolean
          created_at?: string
          detected_candidate_display_name?: string | null
          detected_competencies?: Json
          detected_interview_stage?: string | null
          detected_role_title?: string | null
          detection_reasons?: Json
          id?: string
          normalized_calendar_event_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_classifications_normalized_calendar_event_id_fkey"
            columns: ["normalized_calendar_event_id"]
            isOneToOne: true
            referencedRelation: "normalized_calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_contexts: {
        Row: {
          candidate_profile_text: string | null
          company_principles: Json
          competencies: Json
          context_completeness_score: number
          context_sources: Json
          created_at: string
          id: string
          interview_event_id: string
          interviewer_responsibility: string | null
          job_description_text: string | null
          updated_at: string
        }
        Insert: {
          candidate_profile_text?: string | null
          company_principles?: Json
          competencies?: Json
          context_completeness_score?: number
          context_sources?: Json
          created_at?: string
          id?: string
          interview_event_id: string
          interviewer_responsibility?: string | null
          job_description_text?: string | null
          updated_at?: string
        }
        Update: {
          candidate_profile_text?: string | null
          company_principles?: Json
          competencies?: Json
          context_completeness_score?: number
          context_sources?: Json
          created_at?: string
          id?: string
          interview_event_id?: string
          interviewer_responsibility?: string | null
          job_description_text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_contexts_interview_event_id_fkey"
            columns: ["interview_event_id"]
            isOneToOne: true
            referencedRelation: "interview_events"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_events: {
        Row: {
          candidate_display_name: string
          confirmation_status: string
          created_at: string
          created_by: string
          duration_minutes: number | null
          external_ats_id: string | null
          external_event_id: string | null
          group_id: string | null
          id: string
          interview_stage: string
          interviewer_id: string
          role_title: string
          source: string
          source_calendar_event_id: string | null
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          candidate_display_name: string
          confirmation_status?: string
          created_at?: string
          created_by: string
          duration_minutes?: number | null
          external_ats_id?: string | null
          external_event_id?: string | null
          group_id?: string | null
          id?: string
          interview_stage: string
          interviewer_id: string
          role_title: string
          source?: string
          source_calendar_event_id?: string | null
          starts_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          candidate_display_name?: string
          confirmation_status?: string
          created_at?: string
          created_by?: string
          duration_minutes?: number | null
          external_ats_id?: string | null
          external_event_id?: string | null
          group_id?: string | null
          id?: string
          interview_stage?: string
          interviewer_id?: string
          role_title?: string
          source?: string
          source_calendar_event_id?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_events_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_events_source_calendar_event_id_fkey"
            columns: ["source_calendar_event_id"]
            isOneToOne: false
            referencedRelation: "normalized_calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_matches: {
        Row: {
          gmail_message_id: string | null
          matched_at: string
          normalized_calendar_event_id: string
          status: string
          user_id: string
        }
        Insert: {
          gmail_message_id?: string | null
          matched_at?: string
          normalized_calendar_event_id: string
          status: string
          user_id: string
        }
        Update: {
          gmail_message_id?: string | null
          matched_at?: string
          normalized_calendar_event_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_matches_normalized_calendar_event_id_fkey"
            columns: ["normalized_calendar_event_id"]
            isOneToOne: true
            referencedRelation: "normalized_calendar_events"
            referencedColumns: ["id"]
          },
        ]
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
          track: string
        }
        Insert: {
          created_at?: string
          email: string
          group_id: string
          id?: string
          invited_by?: string | null
          status?: string
          token?: string
          track?: string
        }
        Update: {
          created_at?: string
          email?: string
          group_id?: string
          id?: string
          invited_by?: string | null
          status?: string
          token?: string
          track?: string
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
      normalized_calendar_events: {
        Row: {
          attendee_count: number | null
          calendar_connection_id: string
          classification_status: string
          created_at: string
          ends_at: string
          external_calendar_id: string
          external_event_id: string
          ical_uid: string | null
          id: string
          is_cancelled: boolean
          is_recurring: boolean
          linked_interview_event_id: string | null
          meeting_url: string | null
          organizer_identifier: string | null
          provider_last_modified_at: string | null
          sanitized_description: string | null
          starts_at: string
          subject: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attendee_count?: number | null
          calendar_connection_id: string
          classification_status?: string
          created_at?: string
          ends_at: string
          external_calendar_id?: string
          external_event_id: string
          ical_uid?: string | null
          id?: string
          is_cancelled?: boolean
          is_recurring?: boolean
          linked_interview_event_id?: string | null
          meeting_url?: string | null
          organizer_identifier?: string | null
          provider_last_modified_at?: string | null
          sanitized_description?: string | null
          starts_at: string
          subject?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attendee_count?: number | null
          calendar_connection_id?: string
          classification_status?: string
          created_at?: string
          ends_at?: string
          external_calendar_id?: string
          external_event_id?: string
          ical_uid?: string | null
          id?: string
          is_cancelled?: boolean
          is_recurring?: boolean
          linked_interview_event_id?: string | null
          meeting_url?: string | null
          organizer_identifier?: string | null
          provider_last_modified_at?: string | null
          sanitized_description?: string | null
          starts_at?: string
          subject?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "normalized_calendar_events_calendar_connection_id_fkey"
            columns: ["calendar_connection_id"]
            isOneToOne: false
            referencedRelation: "calendar_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "normalized_calendar_events_linked_interview_event_id_fkey"
            columns: ["linked_interview_event_id"]
            isOneToOne: false
            referencedRelation: "interview_events"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_deliveries: {
        Row: {
          attempted_at: string | null
          channel: string
          created_at: string
          delivered_at: string | null
          error_code: string | null
          failed_at: string | null
          id: string
          idempotency_key: string
          interview_event_id: string
          notification_type: string
          prep_session_id: string | null
          provider_message_id: string | null
          retry_count: number
          scheduled_for: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempted_at?: string | null
          channel?: string
          created_at?: string
          delivered_at?: string | null
          error_code?: string | null
          failed_at?: string | null
          id?: string
          idempotency_key: string
          interview_event_id: string
          notification_type: string
          prep_session_id?: string | null
          provider_message_id?: string | null
          retry_count?: number
          scheduled_for: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempted_at?: string | null
          channel?: string
          created_at?: string
          delivered_at?: string | null
          error_code?: string | null
          failed_at?: string | null
          id?: string
          idempotency_key?: string
          interview_event_id?: string
          notification_type?: string
          prep_session_id?: string | null
          provider_message_id?: string | null
          retry_count?: number
          scheduled_for?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_interview_event_id_fkey"
            columns: ["interview_event_id"]
            isOneToOne: false
            referencedRelation: "interview_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_deliveries_prep_session_id_fkey"
            columns: ["prep_session_id"]
            isOneToOne: false
            referencedRelation: "prep_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          calendar_detection_enabled: boolean
          created_at: string
          email_preparation_enabled: boolean
          email_refresher_enabled: boolean
          preparation_lead_minutes: number
          quiet_hours_end: number | null
          quiet_hours_start: number | null
          refresher_lead_minutes: number
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          calendar_detection_enabled?: boolean
          created_at?: string
          email_preparation_enabled?: boolean
          email_refresher_enabled?: boolean
          preparation_lead_minutes?: number
          quiet_hours_end?: number | null
          quiet_hours_start?: number | null
          refresher_lead_minutes?: number
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          calendar_detection_enabled?: boolean
          created_at?: string
          email_preparation_enabled?: boolean
          email_refresher_enabled?: boolean
          preparation_lead_minutes?: number
          quiet_hours_end?: number | null
          quiet_hours_start?: number | null
          refresher_lead_minutes?: number
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      prep_questions: {
        Row: {
          capability_area: string
          context_source: string
          correct_index: number
          created_at: string
          difficulty: string
          explanation: string
          id: string
          interview_stage: string | null
          options: Json
          position: number
          prep_session_id: string
          scenario: string
          sub_skill: string
        }
        Insert: {
          capability_area: string
          context_source?: string
          correct_index: number
          created_at?: string
          difficulty?: string
          explanation: string
          id?: string
          interview_stage?: string | null
          options: Json
          position: number
          prep_session_id: string
          scenario: string
          sub_skill: string
        }
        Update: {
          capability_area?: string
          context_source?: string
          correct_index?: number
          created_at?: string
          difficulty?: string
          explanation?: string
          id?: string
          interview_stage?: string | null
          options?: Json
          position?: number
          prep_session_id?: string
          scenario?: string
          sub_skill?: string
        }
        Relationships: [
          {
            foreignKeyName: "prep_questions_prep_session_id_fkey"
            columns: ["prep_session_id"]
            isOneToOne: false
            referencedRelation: "prep_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      prep_responses: {
        Row: {
          answered_at: string
          id: string
          is_correct: boolean
          prep_question_id: string
          prep_session_id: string
          response_time_seconds: number | null
          selected_index: number
          user_id: string
        }
        Insert: {
          answered_at?: string
          id?: string
          is_correct: boolean
          prep_question_id: string
          prep_session_id: string
          response_time_seconds?: number | null
          selected_index: number
          user_id: string
        }
        Update: {
          answered_at?: string
          id?: string
          is_correct?: boolean
          prep_question_id?: string
          prep_session_id?: string
          response_time_seconds?: number | null
          selected_index?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prep_responses_prep_question_id_fkey"
            columns: ["prep_question_id"]
            isOneToOne: true
            referencedRelation: "prep_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prep_responses_prep_session_id_fkey"
            columns: ["prep_session_id"]
            isOneToOne: false
            referencedRelation: "prep_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      prep_sessions: {
        Row: {
          completed_at: string | null
          correct_answers: number | null
          estimated_minutes: number
          generated_at: string
          generation_version: string
          id: string
          interview_event_id: string
          interviewer_id: string
          overall_score: number | null
          reminder_at: string | null
          scheduled_delivery_at: string | null
          started_at: string | null
          status: string
          total_questions: number
          used_fallback: boolean
        }
        Insert: {
          completed_at?: string | null
          correct_answers?: number | null
          estimated_minutes?: number
          generated_at?: string
          generation_version?: string
          id?: string
          interview_event_id: string
          interviewer_id: string
          overall_score?: number | null
          reminder_at?: string | null
          scheduled_delivery_at?: string | null
          started_at?: string | null
          status?: string
          total_questions: number
          used_fallback?: boolean
        }
        Update: {
          completed_at?: string | null
          correct_answers?: number | null
          estimated_minutes?: number
          generated_at?: string
          generation_version?: string
          id?: string
          interview_event_id?: string
          interviewer_id?: string
          overall_score?: number | null
          reminder_at?: string | null
          scheduled_delivery_at?: string | null
          started_at?: string | null
          status?: string
          total_questions?: number
          used_fallback?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "prep_sessions_interview_event_id_fkey"
            columns: ["interview_event_id"]
            isOneToOne: false
            referencedRelation: "interview_events"
            referencedColumns: ["id"]
          },
        ]
      }
      preparation_schedules: {
        Row: {
          created_at: string
          id: string
          interview_event_id: string
          prep_session_id: string | null
          preparation_delivery_at: string
          preparation_status: string
          refresher_delivery_at: string | null
          refresher_status: string
          source_timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          interview_event_id: string
          prep_session_id?: string | null
          preparation_delivery_at: string
          preparation_status?: string
          refresher_delivery_at?: string | null
          refresher_status?: string
          source_timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          interview_event_id?: string
          prep_session_id?: string | null
          preparation_delivery_at?: string
          preparation_status?: string
          refresher_delivery_at?: string | null
          refresher_status?: string
          source_timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "preparation_schedules_interview_event_id_fkey"
            columns: ["interview_event_id"]
            isOneToOne: true
            referencedRelation: "interview_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preparation_schedules_prep_session_id_fkey"
            columns: ["prep_session_id"]
            isOneToOne: false
            referencedRelation: "prep_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_track: string
          allowed_tracks: string[]
          created_at: string
          current_streak: number
          display_name: string | null
          email: string
          full_name: string | null
          group_id: string | null
          id: string
          last_completed_at: string | null
          last_completed_week: number | null
          last_sprint_date: string | null
          level: number
          longest_sprint_streak: number
          longest_streak: number
          share_bonus_awarded: boolean
          share_bonus_recruiter: boolean
          share_card_url: string | null
          share_slug: string | null
          sprint_streak: number
          total_xp: number
        }
        Insert: {
          active_track?: string
          allowed_tracks?: string[]
          created_at?: string
          current_streak?: number
          display_name?: string | null
          email: string
          full_name?: string | null
          group_id?: string | null
          id: string
          last_completed_at?: string | null
          last_completed_week?: number | null
          last_sprint_date?: string | null
          level?: number
          longest_sprint_streak?: number
          longest_streak?: number
          share_bonus_awarded?: boolean
          share_bonus_recruiter?: boolean
          share_card_url?: string | null
          share_slug?: string | null
          sprint_streak?: number
          total_xp?: number
        }
        Update: {
          active_track?: string
          allowed_tracks?: string[]
          created_at?: string
          current_streak?: number
          display_name?: string | null
          email?: string
          full_name?: string | null
          group_id?: string | null
          id?: string
          last_completed_at?: string | null
          last_completed_week?: number | null
          last_sprint_date?: string | null
          level?: number
          longest_sprint_streak?: number
          longest_streak?: number
          share_bonus_awarded?: boolean
          share_bonus_recruiter?: boolean
          share_card_url?: string | null
          share_slug?: string | null
          sprint_streak?: number
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
      recruiter_responses: {
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
          answers?: Json
          completed_at?: string
          id?: string
          score?: number
          streak_bonus?: number
          user_id: string
          week_number: number
          xp_earned?: number
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
            foreignKeyName: "recruiter_responses_week_number_fkey"
            columns: ["week_number"]
            isOneToOne: false
            referencedRelation: "recruiter_weeks"
            referencedColumns: ["week_number"]
          },
        ]
      }
      recruiter_weeks: {
        Row: {
          created_at: string
          fact: string
          focus: string
          quarter: number
          topic: string
          week_number: number
        }
        Insert: {
          created_at?: string
          fact?: string
          focus?: string
          quarter: number
          topic: string
          week_number: number
        }
        Update: {
          created_at?: string
          fact?: string
          focus?: string
          quarter?: number
          topic?: string
          week_number?: number
        }
        Relationships: []
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
      share_cards: {
        Row: {
          png_base64: string
          track: string
          updated_at: string
          user_id: string
        }
        Insert: {
          png_base64: string
          track?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          png_base64?: string
          track?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sprint_sessions: {
        Row: {
          answers: Json
          completed_at: string | null
          difficulty: string
          id: string
          questions: Json
          score: number
          started_at: string
          status: string
          total: number
          user_id: string
          xp_earned: number
        }
        Insert: {
          answers?: Json
          completed_at?: string | null
          difficulty?: string
          id?: string
          questions: Json
          score?: number
          started_at?: string
          status?: string
          total: number
          user_id: string
          xp_earned?: number
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          difficulty?: string
          id?: string
          questions?: Json
          score?: number
          started_at?: string
          status?: string
          total?: number
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      track_progress: {
        Row: {
          current_streak: number
          last_completed_at: string | null
          last_completed_week: number | null
          level: number
          longest_streak: number
          started_at: string
          total_xp: number
          track: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          last_completed_at?: string | null
          last_completed_week?: number | null
          level?: number
          longest_streak?: number
          started_at?: string
          total_xp?: number
          track: string
          user_id: string
        }
        Update: {
          current_streak?: number
          last_completed_at?: string | null
          last_completed_week?: number | null
          level?: number
          longest_streak?: number
          started_at?: string
          total_xp?: number
          track?: string
          user_id?: string
        }
        Relationships: []
      }
      upgrade_interest: {
        Row: {
          created_at: string
          email: string | null
          group_id: string | null
          id: string
          seats_wanted: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          group_id?: string | null
          id?: string
          seats_wanted?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
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
          capability_area: string | null
          earned_at: string
          evidence_snapshot: Json | null
          id: string
          user_id: string
        }
        Insert: {
          achievement_code: string
          capability_area?: string | null
          earned_at?: string
          evidence_snapshot?: Json | null
          id?: string
          user_id: string
        }
        Update: {
          achievement_code?: string
          capability_area?: string | null
          earned_at?: string
          evidence_snapshot?: Json | null
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
      user_capability_progress: {
        Row: {
          capability_area: string
          correct_answers: number
          evidence_confidence: string
          last_evidence_at: string | null
          mastery_stage: string
          recent_direction: string
          total_questions: number
          updated_at: string
          user_id: string
          weighted_score: number
        }
        Insert: {
          capability_area: string
          correct_answers?: number
          evidence_confidence?: string
          last_evidence_at?: string | null
          mastery_stage?: string
          recent_direction?: string
          total_questions?: number
          updated_at?: string
          user_id: string
          weighted_score?: number
        }
        Update: {
          capability_area?: string
          correct_answers?: number
          evidence_confidence?: string
          last_evidence_at?: string | null
          mastery_stage?: string
          recent_direction?: string
          total_questions?: number
          updated_at?: string
          user_id?: string
          weighted_score?: number
        }
        Relationships: []
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
      weekly_unlock_emails: {
        Row: {
          id: string
          sent_at: string
          track: string
          user_id: string
          week_number: number
        }
        Insert: {
          id?: string
          sent_at?: string
          track?: string
          user_id: string
          week_number: number
        }
        Update: {
          id?: string
          sent_at?: string
          track?: string
          user_id?: string
          week_number?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invite: {
        Args: { _actor: string; _invite_id: string }
        Returns: string
      }
      create_group: { Args: { _actor: string; _name: string }; Returns: string }
      create_group_tracked: {
        Args: { _actor: string; _name: string; _track: string }
        Returns: string
      }
      get_group_leaderboard: {
        Args: { _actor: string }
        Returns: {
          current_streak: number
          group_id: string
          group_name: string
          id: string
          level: number
          member_limit: number
          name: string
          owner_id: string
          total_xp: number
        }[]
      }
      get_group_recruiter_leaderboard: {
        Args: { _actor: string }
        Returns: {
          current_streak: number
          group_id: string
          group_name: string
          id: string
          level: number
          member_limit: number
          name: string
          owner_id: string
          total_xp: number
        }[]
      }
      get_public_leaderboard: {
        Args: never
        Returns: {
          current_streak: number
          display_name: string
          id: string
          last_completed_week: number
          level: number
          total_xp: number
        }[]
      }
      get_public_profile: {
        Args: { p_slug: string }
        Returns: {
          current_streak: number
          display_name: string
          level: number
          longest_streak: number
          rank: number
          share_card_url: string
          total_players: number
          total_xp: number
        }[]
      }
      get_public_recruiter_leaderboard: {
        Args: never
        Returns: {
          current_streak: number
          display_name: string
          id: string
          last_completed_week: number
          level: number
          total_xp: number
        }[]
      }
      get_public_recruiter_profile: {
        Args: { p_slug: string }
        Returns: {
          current_streak: number
          display_name: string
          level: number
          longest_streak: number
          rank: number
          total_players: number
          total_xp: number
        }[]
      }
      get_recruiter_share_stats: {
        Args: { _user: string }
        Returns: {
          current_streak: number
          display_name: string
          level: number
          longest_streak: number
          rank: number
          total_players: number
          total_xp: number
        }[]
      }
      get_share_card: { Args: { p_slug: string }; Returns: string }
      get_share_card_tracked: {
        Args: { p_slug: string; p_track: string }
        Returns: string
      }
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
      leave_group: { Args: { _actor: string }; Returns: undefined }
      make_share_slug: { Args: { _seed: string }; Returns: string }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
