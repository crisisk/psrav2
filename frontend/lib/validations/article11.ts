export interface ValidationResult {
  isValid: boolean;
  requirements: {
    id: string;
    description: string;
    isValid: boolean;
    error?: string;
  }[];
}
