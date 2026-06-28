import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'var(--bg)' }}>
      <div className="spinner" style={{ width:28, height:28, borderWidth:3 }} />
    </div>
  );

  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role && user.role !== 'admin')
    return <Navigate to="/" replace />;

  return children;
}
