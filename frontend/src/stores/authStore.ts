import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (email: string, password: string) => {
        // TODO: Implement actual login logic
        const mockUser: User = {
          id: '1',
          email,
          name: 'Demo User',
          role: 'admin',
        }
        set({ user: mockUser, token: 'mock-token', isAuthenticated: true })
      },
      logout: () => {
        localStorage.removeItem('auth_token')
        set({ user: null, token: null, isAuthenticated: false })
      },
      setUser: (user: User) => set({ user }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
