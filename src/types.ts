export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface MealEntry {
  id: string;
  user_id: string;
  date: string;
  type: MealType;
  name: string;
  created_at: string;
}

export interface DayMeals {
  date: string;
  breakfast?: MealEntry;
  lunch?: MealEntry;
  dinner?: MealEntry;
}

export type Database = {
  public: {
    Tables: {
      meal_entries: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          type: MealType;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          type: MealType;
          name: string;
          created_at?: string;
        };
        Update: {
          date?: string;
          type?: MealType;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
