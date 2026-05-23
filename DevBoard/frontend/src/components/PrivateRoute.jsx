import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <div className="relative flex flex-col items-center">
          {/* Elegant premium spinner */}
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-800 border-t-brand-500"></div>
          <div className="absolute top-1/2 left-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-950"></div>
          <span className="mt-4 font-outfit text-sm font-medium tracking-wider text-slate-400">Loading DevBoard...</span>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
