import '../styles/globals.css';
import { useState, useEffect, createContext } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

// Create auth context
export const AuthContext = createContext();

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Check authentication status on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setIsLoggedIn(false);
          setUser(null);
          setLoading(false);
          return;
        }
        
        // Verify token with backend
        const response = await fetch('/api/users/verify-token', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsLoggedIn(true);
          setUser(data.user);
        } else {
          // Token invalid, clear it
          localStorage.removeItem('token');
          setIsLoggedIn(false);
          setUser(null);
          
          // If on a protected page, redirect to login
          if (isProtectedRoute(router.pathname)) {
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setApiError({
          message: 'Unable to connect to the server. Please check your internet connection.',
          retryFn: checkAuth
        });
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

  // Login function
  const login = async (token, userData) => {
    localStorage.setItem('token', token);
    setIsLoggedIn(true);
    setUser(userData);
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUser(null);
    router.push('/login');
  };

  // Check if route is protected
  const isProtectedRoute = (path) => {
    const protectedRoutes = [
      '/dashboard', 
      '/profile', 
      '/admin', 
      '/file-grievance', 
      '/track-grievance'
    ];
    
    return protectedRoutes.some(route => path.startsWith(route));
  };

  // Utility function for API calls
  const fetchAPI = async (url, options = {}) => {
    try {
      const token = localStorage.getItem('token');
      
      // Add auth header if token exists
      if (token) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${token}`
        };
      }
      
      const response = await fetch(url, options);
      
      // Handle 401 Unauthorized
      if (response.status === 401) {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setUser(null);
        router.push('/login');
        throw new Error('Session expired. Please log in again.');
      }
      
      return response;
    } catch (error) {
      console.error('API Error:', error);
      setApiError({
        message: error.message || 'Network error. Please check your connection.',
        retryFn: () => fetchAPI(url, options)
      });
      throw error;
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-blue-600" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  // Show API error with retry option
  if (apiError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-600 text-center mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-semibold mt-2">Connection Error</h2>
          </div>
          <p className="mb-4 text-gray-700">{apiError.message}</p>
          <button
            onClick={() => {
              setApiError(null);
              apiError.retryFn && apiError.retryFn();
            }}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout, fetchAPI }}>
      <Head>
        <title>GNDEC Grievance Portal</title>
        <meta name="description" content="GNDEC Grievance Redressal Portal" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </AuthContext.Provider>
  );
}

export default MyApp; 