import { Navigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    if (userRole === 'doctor') {
      return <Navigate to="/doctor-dashboard" replace />;
    } else {
      return <Navigate to="/patient-dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
