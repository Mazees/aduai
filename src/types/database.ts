export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ComplaintStatus =
  | 'NEW'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REJECTED';

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

export type EvaluationStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type PersonaType = 'POSITIVE' | 'NEGATIVE';

export interface Database {
  public: {
    Tables: {
      complaints: {
        Row: {
          id: string;
          ticket_number: string;
          reporter_whatsapp: string;
          description: string;
          category: string | null;
          ai_summary: string;
          status: ComplaintStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ticket_number: string;
          reporter_whatsapp: string;
          description: string;
          category?: string | null;
          ai_summary: string;
          status?: ComplaintStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ticket_number?: string;
          reporter_whatsapp?: string;
          description?: string;
          category?: string | null;
          ai_summary?: string;
          status?: ComplaintStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      complaint_updates: {
        Row: {
          id: string;
          complaint_id: string;
          admin_id: string | null;
          status: ComplaintStatus;
          note: string | null;
          rejection_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          complaint_id: string;
          admin_id?: string | null;
          status: ComplaintStatus;
          note?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          complaint_id?: string;
          admin_id?: string | null;
          status?: ComplaintStatus;
          note?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
        };
      };
      update_evidence: {
        Row: {
          id: string;
          complaint_update_id: string;
          storage_key: string;
          file_name: string;
          mime_type: string;
          size_bytes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          complaint_update_id: string;
          storage_key: string;
          file_name: string;
          mime_type: string;
          size_bytes: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          complaint_update_id?: string;
          storage_key?: string;
          file_name?: string;
          mime_type?: string;
          size_bytes?: number;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          complaint_update_id: string;
          status: NotificationStatus;
          attempt_count: number;
          provider_message_id: string | null;
          created_at: string;
          sent_at: string | null;
        };
        Insert: {
          id?: string;
          complaint_update_id: string;
          status?: NotificationStatus;
          attempt_count?: number;
          provider_message_id?: string | null;
          created_at?: string;
          sent_at?: string | null;
        };
        Update: {
          id?: string;
          complaint_update_id?: string;
          status?: NotificationStatus;
          attempt_count?: number;
          provider_message_id?: string | null;
          created_at?: string;
          sent_at?: string | null;
        };
      };
      ai_evaluations: {
        Row: {
          id: string;
          complaint_id: string;
          summary: string;
          has_new_learning: boolean;
          status: EvaluationStatus;
          lock_token: string | null;
          locked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          complaint_id: string;
          summary: string;
          has_new_learning?: boolean;
          status?: EvaluationStatus;
          lock_token?: string | null;
          locked_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          complaint_id?: string;
          summary?: string;
          has_new_learning?: boolean;
          status?: EvaluationStatus;
          lock_token?: string | null;
          locked_at?: string | null;
          created_at?: string;
        };
      };
      persona_prompts: {
        Row: {
          id: string;
          evaluation_id: string | null;
          type: PersonaType;
          content: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          evaluation_id?: string | null;
          type: PersonaType;
          content: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          evaluation_id?: string | null;
          type?: PersonaType;
          content?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      ai_provider_settings: {
        Row: {
          id: string;
          endpoint: string;
          model: string;
          api_key_ciphertext: string;
          main_knowledge: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          endpoint: string;
          model: string;
          api_key_ciphertext: string;
          main_knowledge?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          endpoint?: string;
          model?: string;
          api_key_ciphertext?: string;
          main_knowledge?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
      idempotency_keys: {
        Row: {
          key: string;
          operation: string;
          request_hash: string;
          response_data: Json | null;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          key: string;
          operation: string;
          request_hash: string;
          response_data?: Json | null;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          key?: string;
          operation?: string;
          request_hash?: string;
          response_data?: Json | null;
          expires_at?: string;
          created_at?: string;
        };
      };
      knowledge_documents: {
        Row: {
          id: string;
          title: string;
          source_url: string | null;
          status: 'draft' | 'published';
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          source_url?: string | null;
          status?: 'draft' | 'published';
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          source_url?: string | null;
          status?: 'draft' | 'published';
          updated_at?: string;
        };
      };
      knowledge_chunks: {
        Row: {
          id: string;
          document_id: string;
          content: string;
          embedding: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          content: string;
          embedding: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          content?: string;
          embedding?: string;
          created_at?: string;
        };
      };
    };
    Functions: {
      match_knowledge: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
        };
        Returns: {
          chunk_id: string;
          document_id: string;
          title: string;
          content: string;
          source_url: string | null;
          similarity: number;
        }[];
      };
    };
  };
}
