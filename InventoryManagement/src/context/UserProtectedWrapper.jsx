import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const UserProtectedWrapper = ({ children }) => {
  const { user, validateToken, loading } = useAuth();
  const location = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const check = async () => {
      await validateToken();
      setChecked(true);
    };
    check();
  }, []);

  if (loading || !checked) {
    return null;
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

export default UserProtectedWrapper; 