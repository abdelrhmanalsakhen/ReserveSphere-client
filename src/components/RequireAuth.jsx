import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUser } from '../features/authSlice';

/** Route guard: `roles` restricts a branch of the router to those roles. */
export default function RequireAuth({ roles }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
