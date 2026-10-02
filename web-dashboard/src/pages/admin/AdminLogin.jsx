import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import RaptorMark from '../../components/RaptorMark.jsx';
import { createAdminSession } from '../../components/ProtectedRoute.jsx';

// TODO: Replace with Supabase Auth in production.
// For now, hard-coded local admin credentials.
const DEV_ADMIN = {
  username: 'admin',
  password: 'change-me-before-shipping',
};

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/admin';

  function handleSubmit(e) {
    e.preventDefault();
    if (username === DEV_ADMIN.username && password === DEV_ADMIN.password) {
      createAdminSession();
      navigate(from, { replace: true });
    } else {
      setError('Invalid credentials');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-raptor-void px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-xl border border-raptor-line bg-slate-900/40 p-6">
        <div className="flex items-center gap-2">
          <RaptorMark className="h-6 w-6" />
          <h1 className="text-lg font-semibold text-slate-100">Admin access</h1>
        </div>
        <p className="text-xs text-slate-500">
          Vetted staff only. Unauthorized attempts are logged.
        </p>
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <input
          type="text" placeholder="Username"
          value={username} onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-lg border border-raptor-line bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-raptor-cyan"
        />
        <input
          type="password" placeholder="Password"
          value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-raptor-line bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-raptor-cyan"
        />
        <button type="submit" className="w-full rounded-lg bg-raptor-cyan py-2 text-sm font-bold text-raptor-void">
          Sign in
        </button>
      </form>
    </div>
  );
}