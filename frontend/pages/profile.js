import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { AuthContext } from './_app';

export default function Profile() {
  const router = useRouter();
  const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    role: '',
    studentDetails: {
      year: '',
      universityRollNumber: '',
      branch: '',
      mobileNumber: ''
    }
  });
  const [editData, setEditData] = useState({
    name: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    mobileNumber: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [retryCount, setRetryCount] = useState(0);
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const MAX_RETRIES = 3;

  useEffect(() => {
    const checkAuthAndFetchProfile = async () => {
      try {
        // Clear any existing errors on retry
        setError('');
        
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.log('No token found, redirecting to login');
          setIsLoggedIn(false);
          router.push('/login?message=Please log in to view your profile');
          return;
        }
        
        // First verify if the token is valid
        try {
          const verifyResponse = await fetch('/api/users/verify-token', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!verifyResponse.ok) {
            console.error('Token verification failed:', verifyResponse.status);
            
            if (verifyResponse.status === 401) {
              handleTokenExpiration();
              return;
            }
            
            throw new Error('Failed to verify authentication token');
          }
          
          // Token is valid, proceed with fetching profile
          await fetchProfile(token);
        } catch (verifyErr) {
          console.error('Token verification error:', verifyErr);
          
          // If this is a network error, try fetching the profile directly
          if (verifyErr.message.includes('fetch') || verifyErr.message.includes('network')) {
            console.log('Network error during token verification, trying profile fetch directly');
            await fetchProfile(token);
          } else {
            setError('Authentication error. Please try logging in again.');
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Authentication check error:', err);
        setError('Authentication error. Please try logging in again.');
        setLoading(false);
      }
    };

    checkAuthAndFetchProfile();
  }, [router, retryCount, setIsLoggedIn]);

  const handleTokenExpiration = () => {
    console.log('Token expired or invalid, redirecting to login');
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setIsTokenExpired(true);
    setError('Your session has expired. Please log in again.');
    setLoading(false);
  };

  const fetchProfile = async (token) => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching user profile...');
      
      // Create a controller for timeout functionality
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        // Try to ping the server first to see if it's available
        try {
          const pingResponse = await fetch('/api/users/ping', {
            method: 'GET',
            signal: controller.signal,
            cache: 'no-store'
          });
          
          if (!pingResponse.ok) {
            console.log('Server ping failed, server might be down');
          } else {
            console.log('Server is available');
          }
        } catch (pingErr) {
          console.log('Could not reach the server:', pingErr.message);
        }
        
        // Now try the actual profile request
        const response = await fetch('/api/users/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log('Profile response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Profile data received:', data);
          
          if (!data) {
            throw new Error('Received empty data from server');
          }
          
          setUserData(data);
          setEditData({
            name: data.name || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
            mobileNumber: data.studentDetails?.mobileNumber || ''
          });
          setIsLoggedIn(true);
          setError('');
        } else {
          let errorMessage = 'Failed to fetch profile';
          try {
            const errorData = await response.json();
            console.error('Profile fetch error:', errorData);
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            console.error('Error parsing error response:', e);
          }
          
          if (response.status === 401) {
            handleTokenExpiration();
            return;
          }
          
          setError(errorMessage);
          
          // Retry logic for server issues
          if (retryCount < MAX_RETRIES && (response.status >= 500 || response.status === 0)) {
            console.log(`Retrying profile fetch (${retryCount + 1}/${MAX_RETRIES})...`);
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 1000 * Math.pow(2, retryCount)); // Exponential backoff: 1s, 2s, 4s
          }
        }
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        
        if (fetchErr.name === 'AbortError') {
          console.error('Request timed out');
          setError('Request timed out. The server took too long to respond.');
        } else {
          console.error('Fetch error:', fetchErr);
          setError('Network error while fetching profile. Please check your connection.');
        }
        
        // Retry for network errors
        if (retryCount < MAX_RETRIES) {
          console.log(`Retrying profile fetch (${retryCount + 1}/${MAX_RETRIES})...`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 1000 * Math.pow(2, retryCount)); // Exponential backoff
        }
      }
    } catch (err) {
      console.error('Profile fetch outer error:', err);
      setError('Network error while fetching profile. Please check your connection.');
      
      // Retry for any errors
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying profile fetch (${retryCount + 1}/${MAX_RETRIES})...`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 1000 * Math.pow(2, retryCount)); // Exponential backoff
      }
    } finally {
      setLoading(false);
    }
  };

  const retryFetchProfile = () => {
    setRetryCount(prev => prev + 1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate form
    if (editData.newPassword && editData.newPassword !== editData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      console.log('Updating profile...');
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Not authenticated. Please log in again.');
        router.push('/login');
        return;
      }
      
      const updateData = {
        name: editData.name
      };

      if (editData.currentPassword && editData.newPassword) {
        updateData.currentPassword = editData.currentPassword;
        updateData.newPassword = editData.newPassword;
      }

      if (editData.mobileNumber) {
        updateData.studentDetails = {
          ...userData.studentDetails,
          mobileNumber: editData.mobileNumber
        };
      }

      console.log('Sending update request with data:', updateData);
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      console.log('Update response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Profile updated successfully:', data);
        setUserData(data);
        setSuccess('Profile updated successfully');
        setIsEditing(false);
        setEditData({
          name: data.name,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          mobileNumber: data.studentDetails?.mobileNumber || ''
        });
      } else {
        let errorMessage = 'Failed to update profile';
        try {
          const errorData = await response.json();
          console.error('Profile update error:', errorData);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        
        if (response.status === 401) {
          localStorage.removeItem('token');
          setIsLoggedIn(false);
          router.push('/login?expired=true');
          return;
        }
        
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setError('Network error while updating profile. Please check your connection.');
    }
  };

  if (isTokenExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    Your session has expired. Please log in again to access your profile.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => router.push('/login?redirect=/profile')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Login Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="relative w-24 h-24">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 rounded-full animate-ping opacity-75"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-t-blue-600 border-b-blue-600 border-l-transparent border-r-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Head>
        <title>My Profile - GNDEC Grievance Portal</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {error && error.includes('Network error') && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md" role="alert">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div className="flex items-center mb-3 sm:mb-0">
                  <svg className="h-6 w-6 mr-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
                <button 
                  onClick={retryFetchProfile} 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150"
                >
                  <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Retry Connection
                </button>
              </div>
              <div className="mt-3 text-sm text-red-700">
                <p>Troubleshooting tips:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Check if the backend server is running</li>
                  <li>Verify your internet connection</li>
                  <li>Try refreshing the page</li>
                  <li>Log out and log back in</li>
                </ul>
              </div>
            </div>
          )}

          {error && !error.includes('Network error') && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-600 p-4 rounded-md flex items-center" role="alert">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-600 p-4 rounded-md flex items-center" role="alert">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="md:flex">
              {/* Sidebar */}
              <div className="bg-gradient-to-b from-blue-700 to-blue-900 text-white p-6 md:w-64 flex flex-col items-center">
                <div className="mb-8 text-center">
                  <div className="h-32 w-32 rounded-full bg-white flex items-center justify-center text-blue-800 text-5xl font-bold mb-4 shadow-lg border-4 border-white">
                    {userData.name ? userData.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <h2 className="text-xl font-bold">{userData.name}</h2>
                  <p className="text-blue-200 capitalize">{userData.role || 'Student'}</p>
                </div>
                
                <nav className="w-full">
                  <button 
                    onClick={() => setActiveTab('profile')}
                    className={`w-full text-left py-3 px-4 rounded-lg mb-2 flex items-center transition-all duration-200 ${
                      activeTab === 'profile' 
                        ? 'bg-white text-blue-800 font-medium shadow-md' 
                        : 'hover:bg-blue-800 text-blue-100'
                    }`}
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile Information
                  </button>
                  
                  <button 
                    onClick={() => {
                      setActiveTab('security');
                      if (isEditing) setIsEditing(true);
                    }}
                    className={`w-full text-left py-3 px-4 rounded-lg mb-2 flex items-center transition-all duration-200 ${
                      activeTab === 'security' 
                        ? 'bg-white text-blue-800 font-medium shadow-md' 
                        : 'hover:bg-blue-800 text-blue-100'
                    }`}
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Security
                  </button>
                </nav>
              </div>

              {/* Main content */}
              <div className="flex-1 p-8">
                <div className="flex justify-between items-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {activeTab === 'profile' ? 'Profile Information' : 'Security Settings'}
                  </h1>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-md shadow hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Edit Profile
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(false)}
                      className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md shadow hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all duration-200"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel
                    </button>
                  )}
                </div>

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <>
                    {!isEditing ? (
                      <div className="bg-white rounded-lg border border-gray-200">
                        <dl className="divide-y divide-gray-200">
                          <div className="px-6 py-4 grid grid-cols-3 gap-4">
                            <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                            <dd className="text-sm text-gray-900 col-span-2">{userData.name}</dd>
                          </div>
                          <div className="px-6 py-4 grid grid-cols-3 gap-4">
                            <dt className="text-sm font-medium text-gray-500">Email Address</dt>
                            <dd className="text-sm text-gray-900 col-span-2">{userData.email}</dd>
                          </div>
                          <div className="px-6 py-4 grid grid-cols-3 gap-4">
                            <dt className="text-sm font-medium text-gray-500">Role</dt>
                            <dd className="text-sm capitalize text-gray-900 col-span-2">
                              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                {userData.role || 'Student'}
                              </span>
                            </dd>
                          </div>
                          {userData.studentDetails?.universityRollNumber && (
                            <div className="px-6 py-4 grid grid-cols-3 gap-4">
                              <dt className="text-sm font-medium text-gray-500">University Roll No.</dt>
                              <dd className="text-sm text-gray-900 col-span-2">{userData.studentDetails.universityRollNumber}</dd>
                            </div>
                          )}
                          {userData.studentDetails?.branch && (
                            <div className="px-6 py-4 grid grid-cols-3 gap-4">
                              <dt className="text-sm font-medium text-gray-500">Branch</dt>
                              <dd className="text-sm text-gray-900 col-span-2">{userData.studentDetails.branch}</dd>
                            </div>
                          )}
                          {userData.studentDetails?.year && (
                            <div className="px-6 py-4 grid grid-cols-3 gap-4">
                              <dt className="text-sm font-medium text-gray-500">Year</dt>
                              <dd className="text-sm text-gray-900 col-span-2">{userData.studentDetails.year}</dd>
                            </div>
                          )}
                          <div className="px-6 py-4 grid grid-cols-3 gap-4">
                            <dt className="text-sm font-medium text-gray-500">Mobile Number</dt>
                            <dd className="text-sm text-gray-900 col-span-2">{userData.studentDetails?.mobileNumber || 'Not provided'}</dd>
                          </div>
                        </dl>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                          <div className="mb-5">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                              Full Name
                            </label>
                            <input
                              type="text"
                              name="name"
                              id="name"
                              value={editData.name}
                              onChange={handleChange}
                              required
                              className="form-input w-full px-4 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div className="mb-5">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                              Email Address (cannot be changed)
                            </label>
                            <input
                              type="email"
                              id="email"
                              value={userData.email}
                              disabled
                              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                            />
                          </div>

                          <div className="mb-5">
                            <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 mb-1">
                              Mobile Number
                            </label>
                            <input
                              type="text"
                              name="mobileNumber"
                              id="mobileNumber"
                              value={editData.mobileNumber}
                              onChange={handleChange}
                              className="form-input w-full px-4 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter your mobile number"
                            />
                          </div>

                          <div className="flex justify-end">
                            <button
                              type="submit"
                              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      </form>
                    )}
                  </>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>

                      <div className="mb-5">
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          name="currentPassword"
                          id="currentPassword"
                          value={editData.currentPassword}
                          onChange={handleChange}
                          className="form-input w-full px-4 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter your current password"
                          required={!!editData.newPassword}
                        />
                      </div>

                      <div className="mb-5">
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          name="newPassword"
                          id="newPassword"
                          value={editData.newPassword}
                          onChange={handleChange}
                          className="form-input w-full px-4 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter new password"
                          required={!!editData.currentPassword}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Password should be at least 8 characters long
                        </p>
                      </div>

                      <div className="mb-5">
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          name="confirmPassword"
                          id="confirmPassword"
                          value={editData.confirmPassword}
                          onChange={handleChange}
                          className="form-input w-full px-4 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Confirm new password"
                          required={!!editData.newPassword}
                        />
                      </div>

                      <div className="pt-4 border-t border-gray-200 mt-6">
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                          >
                            Update Password
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 