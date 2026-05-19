import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validate active session token on initialization
  useEffect(() => {
    const verifyUserSession = async () => {
      const sessionToken = localStorage.getItem('token');
      if (sessionToken) {
        try {
          const response = await API.get('/auth/me');
          if (response.data.success) {
            setUser(response.data.user);
          } else {
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('[AuthContext]: Invalid or expired token session:', error.message);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    verifyUserSession();
  }, []);

  // Login handler
  const login = async (email, password) => {
    try {
      const response = await API.post('/auth/login', { email, password });
      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
      }
      return response.data;
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Login failed.';
      throw new Error(errMsg);
    }
  };

  // Sign up handler
  const signup = async (name, email, password, role) => {
    try {
      const response = await API.post('/auth/register', { name, email, password, role });
      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
      }
      return response.data;
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Registration failed.';
      throw new Error(errMsg);
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom React hook to consume AuthContext properties
export const useAuth = () => useContext(AuthContext);
export default AuthContext;
