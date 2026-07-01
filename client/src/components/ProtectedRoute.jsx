import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  // Still checking auth — show nothing yet, don't redirect
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg, #F8F9FC)',
        flexDirection: 'column',
        gap: 16,
      }}>
        <div style={{
          fontFamily: 'sans-serif',
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: -1,
        }}>
          <span style={{ color: 'var(--purple-lt, #9D5FF5)' }}>Alz</span>
          <span style={{ color: 'var(--text, #0D0D1A)' }}>Media</span>
        </div>
        <div style={{
          width: 24,
          height: 24,
          border: '2px solid var(--border, #E2E4EE)',
          borderTopColor: 'var(--purple, #7C3AED)',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Not logged in → home
  if (!user) return <Navigate to="/" replace />;

  // Wrong role — but admin can access everything
  if (role && user.role !== role && user.role !== 'admin') {
    // Redirect to their own dashboard
    return <Navigate to={`/${user.role}`} replace />;
  }

  return children;
}
