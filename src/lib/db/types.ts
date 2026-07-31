export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tenant: {
        Row: {
          tenant_id: string
          tenant_name: string
          code: string
          description: string | null
          status: string
          created_date: string
          created_by: string | null
        }
        Insert: {
          tenant_id?: string
          tenant_name: string
          code: string
          description?: string | null
          status?: string
          created_date?: string
          created_by?: string | null
        }
        Update: {
          tenant_id?: string
          tenant_name?: string
          code?: string
          description?: string | null
          status?: string
          created_date?: string
          created_by?: string | null
        }
      }
      users: {
        Row: {
          user_id: string
          tenant_id: string | null
          first_name: string
          last_name: string
          email: string
          phone_number: string | null
          password_hash: string
          status: string
          email_verified: boolean
          last_login: string | null
          created_date: string
        }
        Insert: {
          user_id?: string
          tenant_id?: string | null
          first_name: string
          last_name: string
          email: string
          phone_number?: string | null
          password_hash: string
          status?: string
          email_verified?: boolean
          last_login?: string | null
          created_date?: string
        }
        Update: {
          user_id?: string
          tenant_id?: string | null
          first_name?: string
          last_name?: string
          email?: string
          phone_number?: string | null
          password_hash?: string
          status?: string
          email_verified?: boolean
          last_login?: string | null
          created_date?: string
        }
      }
      // Add other tables as needed based on migrations
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
  }
}
