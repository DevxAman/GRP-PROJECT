import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { AuthContext } from './_app';

export default function TrackGrievance() {
  const router = useRouter();
  const { isLoggedIn } = useContext(AuthContext);
  const [trackingId, setTrackingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [grievance, setGrievance] = useState(null);
  const [userGrievances, setUserGrievances] = useState([]);
  const [loadingUserGrievances, setLoadingUserGrievances] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('');
  const [reminderStatus, setReminderStatus] = useState({ success: false, message: '' });
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [redirectingToLogin, setRedirectingToLogin] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  // Status steps for the progress bar
  const statusSteps = ['pending', 'in-progress', 'resolved', 'rejected'];

  useEffect(() => {
    // Check if user is logged in
    if (!isLoggedIn) {
      if (router.query.trackingId) {
        // If they have a tracking ID, show login message and redirect
        setRedirectingToLogin(true);
        setError('Please log in to track your grievance');
        
        // Redirect to login page after 3 seconds
        const redirectTimer = setTimeout(() => {
          router.push(`/login?redirect=/track-grievance?trackingId=${router.query.trackingId}`);
        }, 3000);
        
        return () => clearTimeout(redirectTimer);
      }
    } else {
      // User is logged in, load their grievances
      fetchUserGrievances();
      
      // Check if tracking ID is provided in URL
      if (router.query.trackingId) {
        setTrackingId(router.query.trackingId);
        handleTrack({ preventDefault: () => {} });
      }
    }
  }, [isLoggedIn, router.query.trackingId]);

  const fetchUserGrievances = async () => {
    try {
      setLoadingUserGrievances(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) return;

      // Create a controller for timeout functionality
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      try {
        const response = await fetch('http://localhost:5000/api/grievances/my-grievances', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setUserGrievances(data);
            
            // If we have no data, make sure it's not an error
            if (data.length === 0) {
              console.log('No grievances found for user');
            }
          } else {
            console.error('Unexpected data format:', data);
            setError('Received unexpected data format from server');
          }
        } else {
          if (response.status === 401) {
            // Authentication error
            console.error('Authentication error while fetching grievances');
            setError('Your session has expired. Please log in again.');
            setTimeout(() => {
              localStorage.removeItem('token');
              router.push('/login?redirect=/track-grievance');
            }, 2000);
          } else {
            // Other server errors
            const errorText = await response.text();
            let errorMessage = 'Failed to fetch grievances';
            
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.message || errorMessage;
            } catch (e) {
              console.error('Error parsing error response:', e);
            }
            
            console.error('Failed to fetch user grievances:', errorMessage);
            setError(errorMessage);
          }
        }
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        
        if (fetchErr.name === 'AbortError') {
          console.error('Request timed out while fetching grievances');
          setError('Request timed out. Please try again later.');
        } else {
          console.error('Error fetching user grievances:', fetchErr);
          setError('Failed to fetch grievances. Please check your connection and try again.');
        }
      }
    } catch (err) {
      console.error('Outer error fetching user grievances:', err);
      setError('An unexpected error occurred while fetching grievances.');
    } finally {
      setLoadingUserGrievances(false);
    }
  };

  // Add a retry function for grievance fetching
  const retryFetchGrievances = () => {
    fetchUserGrievances();
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingId) {
      setError('Please enter a tracking ID');
      return;
    }

    // Require login for tracking
    if (!isLoggedIn) {
      setError('You must be logged in to track grievances');
      setRedirectingToLogin(true);
      setTimeout(() => {
        router.push(`/login?redirect=/track-grievance?trackingId=${trackingId}`);
      }, 3000);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setGrievance(null);
      setPermissionError(false); // Reset permission error state
      setErrorDetails(''); // Reset error details

      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      const response = await fetch(`http://localhost:5000/api/grievances/track/${trackingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setGrievance(data);
      } else {
        const errorData = await response.json();
        if (response.status === 403) {
          // Special handling for permission errors
          setError('Access denied: You can only track grievances that you have submitted.');
          setPermissionError(true);
          // Set error details if available
          if (errorData.details) {
            setErrorDetails(errorData.details);
          }
        } else if (response.status === 404) {
          setError('Grievance not found. Please check the tracking ID and try again.');
        } else if (response.status === 401) {
          // Handle authentication errors
          setError('Your session has expired. Please log in again.');
          setTimeout(() => {
            localStorage.removeItem('token');
            router.push('/login?redirect=/track-grievance');
          }, 2000);
        } else {
          setError(errorData.message || 'Failed to find grievance with the provided tracking ID');
        }
      }
    } catch (err) {
      setError('An error occurred while tracking the grievance. Please try again later.');
      console.error('Track grievance error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };

  const handleSendReminder = async () => {
    if (!isLoggedIn) {
      setError('You must be logged in to send reminders');
      router.push('/login?redirect=/track-grievance');
      return;
    }
    
    if (!grievance?.trackingId || !reminderMessage.trim()) {
      setReminderStatus({
        success: false,
        message: 'Please provide a message for the reminder'
      });
      return;
    }
    
    setIsSendingReminder(true);
    setReminderStatus({ success: false, message: '' });
    
    try {
      console.log(`Sending reminder for tracking ID: ${grievance.trackingId}`);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      const response = await fetch('http://localhost:5000/api/grievances/send-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          trackingId: grievance.trackingId,
          message: reminderMessage
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reminder');
      }
      
      setReminderStatus({
        success: true,
        message: 'Reminder sent successfully! The administration has been notified.'
      });
      setReminderMessage('');
    } catch (err) {
      console.error('Error sending reminder:', err);
      setReminderStatus({
        success: false,
        message: err.message || 'Failed to send reminder. Please try again later.'
      });
    } finally {
      setIsSendingReminder(false);
    }
  };

  // Add this function to visualize the grievance status progress
  const StatusProgress = ({ currentStatus }) => {
    const statuses = ['pending', 'in-progress', 'resolved', 'rejected'];
    const currentIndex = statuses.indexOf(currentStatus);
    
    // For rejected status, we handle it separately since it's not part of the normal flow
    const isRejected = currentStatus === 'rejected';
    
    return (
      <div className="mb-6">
        <div className="text-xs text-gray-500 flex justify-between mb-1">
          <span>Submitted</span>
          <span>In Progress</span>
          <span>Resolved</span>
        </div>
        <div className="relative">
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
            {isRejected ? (
              <div className="w-full flex flex-col text-center text-white justify-center bg-red-500 rounded"></div>
            ) : (
              <>
                <div 
                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                    currentIndex >= 0 ? 'bg-blue-500' : 'bg-gray-300'
                  }`} 
                  style={{ width: '33%' }}
                ></div>
                <div 
                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                    currentIndex >= 1 ? 'bg-blue-500' : 'bg-gray-300'
                  }`} 
                  style={{ width: '33%' }}
                ></div>
                <div 
                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                    currentIndex >= 2 ? 'bg-green-500' : 'bg-gray-300'
                  }`} 
                  style={{ width: '34%' }}
                ></div>
              </>
            )}
          </div>
          
          {isRejected && (
            <div className="text-center text-sm text-red-600 font-medium mt-2">
              This grievance has been rejected by the administration.
            </div>
          )}
        </div>
      </div>
    );
  };

  // Add this function to display a dashboard summary of grievances by status
  const GrievanceSummary = ({ grievances }) => {
    // Count grievances by status
    const statusCounts = grievances.reduce((counts, grievance) => {
      const status = grievance.status || 'pending';
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    }, {});

    const totalCount = grievances.length;
    
    const statusCards = [
      { status: 'pending', label: 'Pending', color: 'bg-yellow-100 border-yellow-400 text-yellow-800' },
      { status: 'in-progress', label: 'In Progress', color: 'bg-blue-100 border-blue-400 text-blue-800' },
      { status: 'resolved', label: 'Resolved', color: 'bg-green-100 border-green-400 text-green-800' },
      { status: 'rejected', label: 'Rejected', color: 'bg-red-100 border-red-400 text-red-800' }
    ];

    return (
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Grievance Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statusCards.map(({ status, label, color }) => (
            <div key={status} className={`border-l-4 rounded-md p-4 ${color}`}>
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-2xl font-bold">{statusCounts[status] || 0}</p>
              </div>
              <p className="text-xs mt-1">
                {statusCounts[status] ? 
                  `${Math.round((statusCounts[status] / totalCount) * 100)}% of total` : 
                  'None yet'}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render login required message
  if (redirectingToLogin) {
    return (
      <div>
        <Head>
          <title>Login Required - GNDEC Grievance Portal</title>
        </Head>
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      You need to be logged in to track grievances. Redirecting to login page...
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
              </div>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => router.push('/login?redirect=/track-grievance')}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Go to Login Page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Head>
        <title>Track Grievance - GNDEC Grievance Portal</title>
        <meta name="description" content="Track the status of your submitted grievances" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Track Your Grievance
            </h1>
            <p className="mt-4 text-xl text-gray-500">
              Enter your grievance tracking ID or view your submitted grievances
            </p>
          </div>

          {/* Security information notice */}
          <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Security Information</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    For privacy and security reasons, grievances can only be tracked by the user who submitted them.
                    You must be logged in with the same account that was used to file the grievance to view its details.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg mb-10">
            {!isLoggedIn ? (
              <div className="text-center py-8">
                <svg className="h-12 w-12 text-blue-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Login Required</h2>
                <p className="text-gray-600 mb-6">
                  You need to be logged in to track grievances. Only the user who filed a grievance can track it.
                </p>
                <Link
                  href="/login?redirect=/track-grievance"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Login to Your Account
                </Link>
              </div>
            ) : (
              <form onSubmit={handleTrack} className="space-y-6">
                <div>
                  <label htmlFor="trackingId" className="block text-sm font-medium text-gray-700 mb-1">
                    Grievance Tracking ID
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      name="trackingId"
                      id="trackingId"
                      className="flex-1 min-w-0 block w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-md"
                      placeholder="Enter your tracking ID (e.g., GR-1234)"
                      value={trackingId}
                      onChange={(e) => setTrackingId(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="ml-3 inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-md font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Tracking...
                        </span>
                      ) : (
                        'Track Grievance'
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    You can only track grievances that you have submitted.
                  </p>
                </div>
              </form>
            )}

            {error && (
              <div className={`mt-6 ${permissionError ? 'bg-yellow-50 border-l-4 border-yellow-400' : 'bg-red-50 border-l-4 border-red-400'} p-4 rounded-md`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className={`h-5 w-5 ${permissionError ? 'text-yellow-400' : 'text-red-400'}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm ${permissionError ? 'text-yellow-700' : 'text-red-700'}`}>{error}</p>
                    
                    {permissionError && (
                      <div className="mt-2">
                        <p className="text-sm text-yellow-700">
                          {errorDetails || 'For security reasons, grievances can only be tracked by the user who submitted them. Please check your own grievances below or make sure you\'re logged in with the correct account.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {grievance && (
              <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-5 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Grievance Details</h3>
                </div>
                <div className="p-6">
                  {/* Status Progress Bar */}
                  <StatusProgress currentStatus={grievance.status} />
                  
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Tracking ID</dt>
                      <dd className="mt-1 text-lg font-semibold text-gray-900">{grievance.trackingId}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="mt-1">
                        <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${getStatusColor(grievance.status)}`}>
                          {grievance.status.charAt(0).toUpperCase() + grievance.status.slice(1)}
                        </span>
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Submitted On</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(grievance.createdAt)}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(grievance.updatedAt)}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Category</dt>
                      <dd className="mt-1 text-sm text-gray-900">{grievance.category}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Subject</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-medium">{grievance.subject}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Description</dt>
                      <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded border border-gray-100">{grievance.description}</dd>
                    </div>
                    {grievance.response && (
                      <div className="sm:col-span-2 bg-blue-50 p-4 rounded-md border border-blue-100">
                        <dt className="text-sm font-medium text-blue-700">Administrative Response</dt>
                        <dd className="mt-1 text-sm text-blue-900 whitespace-pre-wrap">{grievance.response}</dd>
                      </div>
                    )}
                  </dl>
                  
                  {/* Action buttons based on status */}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      onClick={() => router.push(`/file-grievance`)}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      File Another Grievance
                    </button>
                    
                    {grievance.status === 'pending' && (
                      <button
                        onClick={() => window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'})}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                      >
                        Send Reminder
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section for listing user's grievances */}
          {isLoggedIn && (
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Your Submitted Grievances</h2>
                <Link
                  href="/file-grievance"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  File New Grievance
                </Link>
              </div>

              {/* Show the summary dashboard if we have grievances and no error */}
              {!loadingUserGrievances && userGrievances.length > 0 && !error && (
                <GrievanceSummary grievances={userGrievances} />
              )}

              {error && error.includes('Failed to fetch grievances') && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                    <div className="flex items-center mb-3 sm:mb-0">
                      <svg className="h-6 w-6 mr-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <h3 className="text-sm font-medium text-red-800">Error Loading Grievances</h3>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                      </div>
                    </div>
                    <button 
                      onClick={retryFetchGrievances} 
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150"
                    >
                      <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Retry Loading
                    </button>
                  </div>
                </div>
              )}

              {loadingUserGrievances ? (
                <div className="py-12 flex justify-center">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-3"></div>
                    <p className="text-gray-500">Loading your grievances...</p>
                  </div>
                </div>
              ) : userGrievances.length > 0 ? (
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tracking ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subject
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {userGrievances.map((item) => (
                        <tr key={item._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.trackingId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">
                            {item.subject}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(item.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => {
                                setTrackingId(item.trackingId);
                                handleTrack({ preventDefault: () => {} });
                              }}
                              className="text-blue-600 hover:text-blue-900 font-medium"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : !error ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No grievances found</h3>
                  <p className="mt-1 text-sm text-gray-500">You haven't submitted any grievances yet.</p>
                  <div className="mt-6">
                    <Link
                      href="/file-grievance"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      File Your First Grievance
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Reminder Section */}
          {grievance && ['pending', 'in-progress'].includes(grievance.status) && isLoggedIn && (
            <div className="bg-white shadow-md rounded-lg overflow-hidden mt-10">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Send a Reminder
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  If your grievance has been pending for a while, you can send a reminder to the admin.
                </p>
              </div>
              
              <div className="px-4 py-5 sm:p-6">
                {reminderStatus.message && (
                  <div className={`mb-4 p-3 ${reminderStatus.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'} rounded-md`}>
                    {reminderStatus.message}
                  </div>
                )}
                
                <div className="mt-1">
                  <textarea
                    rows="3"
                    name="reminderMessage"
                    id="reminderMessage"
                    value={reminderMessage}
                    onChange={(e) => setReminderMessage(e.target.value)}
                    placeholder="Type your reminder message here..."
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  ></textarea>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Please be polite and specific in your reminder to get a better response.
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleSendReminder}
                    disabled={isSendingReminder || !reminderMessage.trim()}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${(isSendingReminder || !reminderMessage.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSendingReminder ? 'Sending...' : 'Send Reminder'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 