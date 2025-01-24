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
      accounts: {
        Row: {
          id: string
          name: string
          slug: string
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          current_account_id: string | null
          created_at?: string
        }
        Insert: {
          id: string
          email: string
          first_name: string
          last_name: string
          current_account_id?: string | null
          created_at?: string
        }
      }
      accounts_users: {
        Row: {
          account_id: string
          user_id: string
          role: string
          created_at?: string
        }
        Insert: {
          account_id: string
          user_id: string
          role: string
          created_at?: string
        }
      }
    }
  }
} 