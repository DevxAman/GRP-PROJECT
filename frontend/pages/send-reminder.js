import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { AuthContext, fetchAPI } from './_app';

export default function SendReminder() {
  const router = useRouter();
  const { isLoggedIn } = useContext(AuthContext);
  const [trackingId, setTrackingId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [pendingGrievances, setPendingGrievances] = useState([]);
  const [loadingGrievances, setLoadingGrievances] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState(null);

  useEffect(() => {
    if (isLoggedIn) {
      fetchPendingGrievances();
    }

    // Pre-populate tracking ID from URL if provided
    if (router.query.trackingId) {
      setTrackingId(router.query.trackingId);
      handleCheckGrievance(router.query.trackingId);
    }
  }, [isLoggedIn, router.query]);

  const fetchPendingGrievances = async () => {
    setLoading(true);
    try {
      const response = await fetchAPI('/grievances/my-pending-grievances');
      const data = await response.json();
      setPendingGrievances(data);
    } catch (err) {
      console.error('Error fetching pending grievances:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckGrievance = async (id) => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError('');
      setSelectedGrievance(null);

      const response = await fetchAPI(`/grievances/check/${id}`);
      const data = await response.json();
      
      if (data.status !== 'Pending' && data.status !== 'In Progress') {
        setError(`This grievance is marked as "${data.status}" and doesn't need a reminder.`);
        return;
      }
      
      setSelectedGrievance(data);
      // Pre-populate reminder message
      setMessage(`Regarding my grievance (${id}): I would like to request an update on the status of my grievance submitted on ${formatDate(data.createdAt)}. Thank you.`);
    } catch (err) {
      setError('An error occurred while checking the grievance');
      console.error('Check grievance error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!trackingId) {
      setError('Please enter a tracking ID');
      return;
    }

    if (!message) {
      setError('Please enter a reminder message');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await fetchAPI('/grievances/send-reminder', {
        method: 'POST',
        body: JSON.stringify({
          trackingId,
          message
        })
      });
      
      if (response.ok) {
        setSuccess('Reminder sent successfully! The administration has been notified about your request.');
        // Clear form after successful submission
        if (!isLoggedIn) {
          setTrackingId('');
        }
        setMessage('');
        setSelectedGrievance(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to send reminder');
      }
    } catch (err) {
      setError('An error occurred while sending the reminder');
      console.error('Send reminder error:', err);
    } finally {
      setLoading(false);
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

  const handleSelectGrievance = (grievance) => {
    setTrackingId(grievance.trackingId);
    setSelectedGrievance(grievance);
    setMessage(`Regarding my grievance (${grievance.trackingId}): I would like to request an update on the status of my grievance submitted on ${formatDate(grievance.createdAt)}. Thank you.`);
  };

  return (
    <div>
      <Head>
        <title>Send Reminder - GNDEC Grievance Portal</title>
        <meta name="description" content="Send a reminder for your pending grievance" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Send a Reminder
            </h1>
            <p className="mt-4 text-xl text-gray-500">
              Follow up on your pending grievance by sending a reminder to the administration
            </p>
          </div>

          {isLoggedIn && pendingGrievances.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8 mb-10">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Your Pending Grievances</h2>
              
              {loadingGrievances ? (
                <div className="py-8 flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : (
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
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingGrievances.map((grievance) => (
                        <tr 
                          key={grievance._id} 
                          className={`hover:bg-gray-50 ${selectedGrievance && selectedGrievance._id === grievance._id ? 'bg-blue-50' : ''}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {grievance.trackingId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">
                            {grievance.subject}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {grievance.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(grievance.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => handleSelectGrievance(grievance)}
                              className="text-blue-600 hover:text-blue-900 font-medium"
                            >
                              Send Reminder
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="trackingId" className="block text-sm font-medium text-gray-700 mb-1">
                  Grievance Tracking ID*
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="trackingId"
                    id="trackingId"
                    className="block w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-md"
                    placeholder="Enter your tracking ID (e.g., GR-1234)"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    readOnly={!!selectedGrievance}
                    required
                  />
                </div>
                {!selectedGrievance && (
                  <div className="mt-2 flex items-center">
                    <button
                      type="button"
                      onClick={() => handleCheckGrievance(trackingId)}
                      className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-700 hover:text-blue-900 focus:outline-none"
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Verify Grievance
                    </button>
                    <span className="text-xs text-gray-500 ml-2">
                      Verify before sending a reminder
                    </span>
                  </div>
                )}
              </div>

              {selectedGrievance && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-md font-medium text-blue-700 mb-2">Grievance Information</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Subject: </span>
                      <span className="text-gray-900">{selectedGrievance.subject}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Status: </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {selectedGrievance.status}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Submitted: </span>
                      <span className="text-gray-900">{formatDate(selectedGrievance.createdAt)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Category: </span>
                      <span className="text-gray-900">{selectedGrievance.category}</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Reminder Message*
                </label>
                <div className="mt-1">
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    className="block w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-md"
                    placeholder="Please provide details about your reminder..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Be specific and provide any additional information that might help in addressing your concern.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">{success}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-md font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
                  disabled={loading || !trackingId || !message}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    'Send Reminder'
                  )}
                </button>
              </div>
            </form>

            {!isLoggedIn && (
              <div className="mt-8 bg-blue-50 rounded-lg p-6 text-center">
                <svg className="h-12 w-12 text-blue-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-blue-900 mb-2">Want to track all your grievances?</h3>
                <p className="text-blue-700 mb-4">
                  Login to your account to see a complete list of your pending grievances and send reminders more easily.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Login to Your Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 