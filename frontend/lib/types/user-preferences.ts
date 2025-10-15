// Type definitions for user preferences
export interface UserPreferences {
  pageSize: number;
  theme: 'light' | 'dark';
  columnVisibility: Record<string, boolean>;
}
