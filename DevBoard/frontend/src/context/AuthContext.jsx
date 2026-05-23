import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, refreshSession, logoutUser } from '../services/authService';
import { setAccessToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Background token check on startup
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await refreshSession();
        if (token) {
          // Re-fetch user details using another request or decodes
          // For simplicity, we can do a call to fetch own profile or store simple details in jwt
          // Since our refresh returns access token, let's login by retrieving projects or a profile
          // Since we want this MERN app to be robust, let's decode the JWT or have standard endpoint
          // But wait, our login returns {user, accessToken}. Let's make refresh return user as well,
          // OR decode the user info from JWT access token!
          // JWT payload contains user id and role. Let's decode or simply fetch user
          // Actually, let's fetch projects as a sanity check or decode the JWT!
          // Let's decode the JWT client-side safely without third-party package:
          const payload = JSON.parse(atob(token.split('.')[1]));
          // Let's create a minimal user object from JWT payload:
          setUser({
            _id: payload.id,
            role: payload.role,
            name: payload.name || 'Developer', // Fallback, let's query projects to fill, or register
          });
        }
      } catch (err) {
        console.log('No active session found on startup');
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen to global force-logout events (e.g. from axios interceptor)
    const handleForceLogout = () => {
      setUser(null);
      setAccessToken('');
    };

    window.addEventListener('auth:force-logout', handleForceLogout);
    return () => {
      window.removeEventListener('auth:force-logout', handleForceLogout);
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await loginUser(email, password);
      setUser(data.user);
      return data.user;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, role) => {
    setLoading(true);
    try {
      const data = await registerUser(name, email, password, role);
      setUser(data.user);
      return data.user;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Logout error:', err.message);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
