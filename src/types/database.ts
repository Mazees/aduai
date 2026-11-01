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

export type EvaluationStatus = 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';

export interface Database {
  public: {
    Tables: {
      configuration: {
        Row: {
          id: string;
          ai_endpoint: string | null;
          ai_model: string | null;
          ai_api_key_ciphertext: string | null;
          main_knowledge: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ai_endpoint?: string | null;
          ai_model?: string | null;
          ai_api_key_ciphertext?: string | null;
          main_knowledge?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ai_endpoint?: string | null;
          ai_model?: string | null;
          ai_api_key_ciphertext?: string | null;
          main_knowledge?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
      complaint: {
        Row: {
          id: string;
          ticket_number: string;
          idempotency_key: string | null;
          request_hash: string | null;
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
          idempotency_key?: string | null;
          request_hash?: string | null;
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
          idempotency_key?: string | null;
          request_hash?: string | null;
          reporter_whatsapp?: string;
          description?: string;
          category?: string | null;
          ai_summary?: string;
          status?: ComplaintStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      knowledge: {
        Row: {
          id: string;
          title: string;
          content: string;
          source_url: string | null;
          status: 'draft' | 'published';
          embedding: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          source_url?: string | null;
          status?: 'draft' | 'published';
          embedding: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          source_url?: string | null;
          status?: 'draft' | 'published';
          embedding?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      ai_evaluation: {
        Row: {
          id: string;
          complaint_id: string;
          status: EvaluationStatus;
          summary: string | null;
          has_new_learning: boolean;
          positive_prompts: Json;
          negative_prompts: Json;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          complaint_id: string;
          status?: EvaluationStatus;
          summary?: string | null;
          has_new_learning?: boolean;
          positive_prompts?: Json;
          negative_prompts?: Json;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          complaint_id?: string;
          status?: EvaluationStatus;
          summary?: string | null;
          has_new_learning?: boolean;
          positive_prompts?: Json;
          negative_prompts?: Json;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      evidence: {
        Row: {
          id: string;
          complaint_id: string;
          status: ComplaintStatus;
          note: string | null;
          storage_path: string;
          file_name: string;
          mime_type: string;
          size_bytes: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          complaint_id: string;
          status: ComplaintStatus;
          note?: string | null;
          storage_path: string;
          file_name: string;
          mime_type: string;
          size_bytes: number;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          complaint_id?: string;
          status?: ComplaintStatus;
          note?: string | null;
          storage_path?: string;
          file_name?: string;
          mime_type?: string;
          size_bytes?: number;
          created_by?: string | null;
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
          id: string;
          title: string;
          content: string;
          source_url: string | null;
          similarity: number;
        }[];
      };
    };
  };
}
