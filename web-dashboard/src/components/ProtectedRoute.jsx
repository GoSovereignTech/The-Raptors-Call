// src/components/ProtectedRoute.jsx
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const SESSION_KEY = 'raptor:admin-session';
const SESSION_HOURS = 8;

export function ProtectedRoute({ children, requiredRole = 'admin' }) {
  const [status, setStatus] = useState('checking');
  const location = useLocation();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) { setStatus('unauthorized'); return; }
      const session = JSON.parse(raw);
      if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
        localStorage.removeItem(SESSION_KEY);
        setStatus('unauthorized');
        return;
      }
      if (session.role === requiredRole || session.role === 'superadmin') {
        setStatus('authorized');
      } else {
        setStatus('unauthorized');
      }
    } catch {
      setStatus('unauthorized');
    }
  }, [requiredRole]);

  if (status === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-raptor-void text-sm text-slate-400">
        Verifying access…
      </div>
    );
  }
  if (status === 'unauthorized') {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  return children;
}

export function createAdminSession() {
  const session = {
    role: 'admin',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000).toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearAdminSession() {
  localStorage.removeItem(SESSION_KEY);
}