// shared/lib/auth.ts
import { useEffect, useState } from 'react';

export type Role = 'ADMIN' | 'COMPLIANCE_MANAGER' | 'CFO' | 'SUPPLIER';

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'admin@sevensa.nl',
    name: 'Admin User',
    role: 'ADMIN'
  },
  {
    id: '2',
    email: 'suus@sevensa.nl',
    name: 'Suus Manager',
    role: 'COMPLIANCE_MANAGER'
  },
  {
    id: '3',
    email: 'cfo@sevensa.nl',
    name: 'CFO User',
    role: 'CFO'
  },
  {
    id: '4',
    email: 'supplier@sevensa.nl',
    name: 'Supplier User',
    role: 'SUPPLIER'
  }
];

const STORAGE_KEY = 'sevensa_auth_user';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

class AuthService {
  private currentUser: User | null = null;
  private keycloak: any = null; // Keycloak instance would go here

  constructor() {
    if (isBrowser) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          this.currentUser = JSON.parse(stored);
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }
    }
  }

  async getCurrentUser(): Promise<User | null> {
    // Mock mode always enabled for now
    return this.currentUser;
  }

  async login(email: string, password: string): Promise<User> {
    const user = MOCK_USERS.find(u => u.email === email);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    this.currentUser = user;
    if (isBrowser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }
    return user;
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    if (isBrowser) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  checkRole(role: Role): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.role === role || this.currentUser.role === 'ADMIN';
  }

  hasAnyRole(roles: Role[]): boolean {
    if (!this.currentUser) return false;
    if (this.currentUser.role === 'ADMIN') return true;
    return roles.includes(this.currentUser.role);
  }
}

const authService = new AuthService();

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  return {
    user,
    loading,
    login: authService.login.bind(authService),
    logout: authService.logout.bind(authService),
    checkRole: authService.checkRole.bind(authService)
  };
};

export const getCurrentUser = () => authService.getCurrentUser();
export const login = (email: string, password: string) => authService.login(email, password);
export const logout = () => authService.logout();
export const checkRole = (role: Role) => authService.checkRole(role);
export const hasAnyRole = (roles: Role[]) => authService.hasAnyRole(roles);
