import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, verifying } = useAuth();

  if (verifying) return null; // Wait for server token validation

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}
