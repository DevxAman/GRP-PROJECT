import { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { AuthContext } from '../pages/_app';

const Navbar = () => {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isLoggedIn, userRole, logout } = useContext(AuthContext);

  useEffect(() => {
    // Add scroll event listener
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [router.pathname]);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  const isAdmin = userRole === 'staff' || userRole === 'admin';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
      scrolled ? 'bg-white shadow-md py-2' : 'bg-white/95 backdrop-blur-sm py-4'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent transition-all duration-300 hover:from-blue-700 hover:to-blue-900">
                GNDEC
              </span>
              <span className="ml-2 text-lg font-semibold text-gray-700 bg-gradient-to-r from-gray-700 to-gray-600 bg-clip-text">
                <span className="hidden md:inline">Grievance Portal</span>
                <span className="inline md:hidden">Portal</span>
              </span>
            </Link>
            <div className="hidden md:flex ml-10 space-x-8">
              <Link
                href="/"
                className={`relative px-2 py-1 text-sm font-medium transition-all duration-300 ease-in-out group ${
                  router.pathname === '/'
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <span>HOME</span>
                <span className={`absolute bottom-0 left-0 w-full h-0.5 transform scale-x-0 transition-transform duration-300 ${
                  router.pathname === '/' ? 'bg-blue-600 scale-x-100' : 'bg-blue-600 group-hover:scale-x-100'
                }`}></span>
              </Link>
              <Link
                href="/file-grievance"
                className={`relative px-2 py-1 text-sm font-medium transition-all duration-300 ease-in-out group ${
                  router.pathname === '/file-grievance'
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <span>FILE GRIEVANCE</span>
                <span className={`absolute bottom-0 left-0 w-full h-0.5 transform scale-x-0 transition-transform duration-300 ${
                  router.pathname === '/file-grievance' ? 'bg-blue-600 scale-x-100' : 'bg-blue-600 group-hover:scale-x-100'
                }`}></span>
              </Link>
              {isLoggedIn && (
                <Link
                  href="/dashboard"
                  className={`relative px-2 py-1 text-sm font-medium transition-all duration-300 ease-in-out group ${
                    router.pathname === '/dashboard'
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  <span>DASHBOARD</span>
                  <span className={`absolute bottom-0 left-0 w-full h-0.5 transform scale-x-0 transition-transform duration-300 ${
                    router.pathname === '/dashboard' ? 'bg-blue-600 scale-x-100' : 'bg-blue-600 group-hover:scale-x-100'
                  }`}></span>
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  className={`relative px-2 py-1 text-sm font-medium transition-all duration-300 ease-in-out group ${
                    router.pathname === '/admin/dashboard'
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  <span>ADMIN</span>
                  <span className={`absolute bottom-0 left-0 w-full h-0.5 transform scale-x-0 transition-transform duration-300 ${
                    router.pathname === '/admin/dashboard' ? 'bg-blue-600 scale-x-100' : 'bg-blue-600 group-hover:scale-x-100'
                  }`}></span>
                </Link>
              )}
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/profile"
                  className={`flex items-center text-sm font-medium transition-colors duration-300 ${
                    router.pathname === '/profile'
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 mr-1" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                    />
                  </svg>
                  PROFILE
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:from-red-600 hover:to-red-700 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  LOGOUT
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:from-blue-600 hover:to-blue-700 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  LOGIN
                </Link>
                <Link
                  href="/signup"
                  className="border border-gray-300 text-gray-700 px-5 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:bg-gray-100 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  SIGN UP
                </Link>
              </div>
            )}
          </div>
          <div className="md:hidden flex items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-300"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
        isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg rounded-b-lg">
          <Link
            href="/"
            className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-300 ${
              router.pathname === '/'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-50 hover:text-blue-700'
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            HOME
          </Link>
          <Link
            href="/file-grievance"
            className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-300 ${
              router.pathname === '/file-grievance'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-50 hover:text-blue-700'
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            FILE GRIEVANCE
          </Link>
          {isLoggedIn && (
            <Link
              href="/dashboard"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-300 ${
                router.pathname === '/dashboard'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-blue-700'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              DASHBOARD
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin/dashboard"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-300 ${
                router.pathname === '/admin/dashboard'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-blue-700'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              ADMIN DASHBOARD
            </Link>
          )}
          {isLoggedIn ? (
            <>
              <Link
                href="/profile"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-300 ${
                  router.pathname === '/profile'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-blue-700'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                PROFILE
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 transition-colors duration-300"
              >
                LOGOUT
              </button>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2 mt-4 px-3 py-2">
              <Link
                href="/login"
                className="text-center bg-blue-600 text-white py-2 rounded-md text-base font-medium hover:bg-blue-700 transition-colors duration-300"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                LOGIN
              </Link>
              <Link
                href="/signup"
                className="text-center bg-gray-100 text-gray-800 py-2 rounded-md text-base font-medium hover:bg-gray-200 transition-colors duration-300"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                SIGN UP
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 