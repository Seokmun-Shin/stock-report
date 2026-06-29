import type { AppData } from "@/lib/types";

/** Supabase portfolios 테이블 (schema.sql) */
export type Database = {
  public: {
    Tables: {
      portfolios: {
        Row: {
          user_id: string;
          data: AppData;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          data: AppData;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          data?: AppData;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
