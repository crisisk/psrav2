export type User = {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

export type SessionUser = Pick<User, 'id' | 'email'>;

export type AuthResponse = {
  user: SessionUser | null;
  error?: string;
};
