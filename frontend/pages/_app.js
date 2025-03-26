import '../styles/globals.css';
import { useRouter } from 'next/router';
import { useEffect, useState, createContext } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Head from 'next/head';

// API utility to standardize API calls
export const API_BASE_URL = '/api';

export const fetchAPI = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  // Add token to headers if available
  if (localStorage && localStorage.getItem('token')) {
    defaultHeaders['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
  }
  
  const fetchOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };
  
  return fetch(url, fetchOptions);
};

// Create auth context for global state management
export const AuthContext = createContext({
  isLoggedIn: false,
  userRole: '',
  login: () => {},
  logout: () => {}
});

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [authState, setAuthState] = useState({
    isLoggedIn: false,
    userRole: ''
  });

  useEffect(() => {
    // Handle page transition loading states
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    // Check auth state on initial load
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    setAuthState({
      isLoggedIn: !!token,
      userRole: role || ''
    });

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  // Auth context methods
  const login = (token, role) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userRole', role || '');
    setAuthState({
      isLoggedIn: true,
      userRole: role || ''
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    setAuthState({
      isLoggedIn: false,
      userRole: ''
    });
    router.push('/');
  };

  const authContextValue = {
    ...authState,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      <Head>
        <title>GNDEC Grievance Redressal Portal</title>
        <meta name="description" content="A platform for addressing and resolving concerns of students and staff at Guru Nanak Dev Engineering College" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-16 md:pt-20">
          {loading ? (
            <div className="flex items-center justify-center min-h-screen">
              <div className="relative w-24 h-24">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 rounded-full animate-ping opacity-75"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-t-blue-600 border-b-blue-600 border-l-transparent border-r-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          ) : (
            <Component {...pageProps} />
          )}
        </main>
        <Footer />
      </div>
    </AuthContext.Provider>
  );
}

export default MyApp; 