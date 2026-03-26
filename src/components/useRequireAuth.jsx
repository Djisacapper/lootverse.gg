import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

/**
 * useRequireAuth
 * --------------
 * Drop this into any page that requires the user to be logged in.
 * If they aren't authenticated, they get redirected to /Authpage instantly.
 *
 * Usage — add these 2 lines to the top of any protected page component:
 *
 *   import { useRequireAuth } from '@/components/useRequireAuth';
 *
 *   export default function Home() {
 *     useRequireAuth();
 *     // ... rest of your page
 *   }
 */
export function useRequireAuth() {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait until auth check is complete before redirecting
    if (!isLoadingAuth && !isAuthenticated) {
      navigate('/Authpage');
    }
  }, [isAuthenticated, isLoadingAuth]);
}