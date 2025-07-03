import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Authentication context for managing user state
interface User {
  id: string;
  name: string;
  role: 'surgeon' | 'nurse' | 'admin';
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auto-login as Dr. Smith for demo purposes
    const autoLogin = async () => {
      setLoading(true);
      
      // Simulate loading delay for realistic experience
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Set demo user - Dr. Smith (surgeon)
      const demoUser: User = {
        id: '1',
        name: 'Dr. Smith',
        role: 'surgeon',
        email: 'dr.smith@hospital.com'
      };
      
      setUser(demoUser);
      setLoading(false);
    };

    autoLogin();
  }, []);

  const login = async (email: string, password: string) => {
    // Simulate login process
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo, always login as Dr. Smith
    const demoUser: User = {
      id: '1',
      name: 'Dr. Smith',
      role: 'surgeon',
      email: email
    };
    
    setUser(demoUser);
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};