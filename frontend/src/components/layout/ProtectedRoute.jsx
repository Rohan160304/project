import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, initializing, user, logout } = useAuth();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (isAuthenticated && allowedRoles && allowedRoles.length > 0 && user) {
      const role = user.primaryRoleKey || user.role || user.userRole;
      if (!allowedRoles.includes(role)) {
        if (role === "MEMBER") {
          setIsLoggingOut(true);
          logout().then(() => {
            window.location.href = "/login";
          });
        }
      }
    }
  }, [isAuthenticated, allowedRoles, user, logout]);

  if (initializing || isLoggingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const loginPath = location.pathname.startsWith("/member") ? "/member/login" : "/login";
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && user) {
    const role = user.primaryRoleKey || user.role || user.userRole;
    if (!allowedRoles.includes(role)) {
      if (role === "MEMBER") {
         return (
            <div className="min-h-screen flex items-center justify-center">
              <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
          );
      }
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}
