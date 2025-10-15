export interface PasswordStrengthRequest {
  password: string;
}

export interface PasswordStrengthResponse {
  score: number;
  feedback: string[];
  isValid: boolean;
}
