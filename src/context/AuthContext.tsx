import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { mockCurrentUser } from '../data/mockData';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      // In production, use Amplify Auth
      // const currentUser = await Auth.currentAuthenticatedUser();
      
      // For development, use mock data
      const savedUser = localStorage.getItem('gamesphere_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.log('No authenticated user');
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, _password: string) => {
    setIsLoading(true);
    try {
      // In production, use Amplify Auth
      // await Auth.signIn(email, password);
      // const currentUser = await Auth.currentAuthenticatedUser();
      
      // For development, simulate login with mock user
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockUser = { ...mockCurrentUser, email };
      setUser(mockUser);
      localStorage.setItem('gamesphere_user', JSON.stringify(mockUser));
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // In production, use Amplify Auth
      // await Auth.signOut();
      
      setUser(null);
      localStorage.removeItem('gamesphere_user');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }, []);

  const signUp = useCallback(async (email: string, _password: string, username: string) => {
    setIsLoading(true);
    try {
      // In production, use Amplify Auth
      // await Auth.signUp({ username: email, password, attributes: { preferred_username: username } });
      
      // For development, simulate signup
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newUser: User = {
        ...mockCurrentUser,
        id: `user_${Date.now()}`,
        email,
        username,
      };
      setUser(newUser);
      localStorage.setItem('gamesphere_user', JSON.stringify(newUser));
    } catch (error) {
      console.error('SignUp error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        signUp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
