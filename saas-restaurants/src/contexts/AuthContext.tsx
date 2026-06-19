import { createContext, useState, useEffect, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../app/store';
import { loginRequest, logoutRequest } from '../features/auth/authSilce';
import { User } from '../features/auth/types';
import { tokenStorage } from '../utils/token';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const dispatch = useDispatch<AppDispatch>();

  const { user: logUser, loading: isLoading, logoutMessage } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (!logUser) return;
    setUser(logUser);
    localStorage.setItem('currentUser', JSON.stringify(logUser));
  }, [logUser])

  useEffect(() => {
    if (logoutMessage) {
      setUser(null);
      tokenStorage.remove();
    }
  }, [logoutMessage])

  const login = async (email: string, password: string) => {
    dispatch(loginRequest({ email, password }))
  };

  const logout = () => {
    dispatch(logoutRequest())
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};