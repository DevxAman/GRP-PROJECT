import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function GrievanceDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [grievance, setGrievance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (!id) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchGrievance(token, id);
  }, [id, router]);

  const fetchGrievance = async (token, grievanceId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/grievances/${grievanceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setGrievance(data);
        setComments(data.comments || []);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch grievance details');
      }
    } catch (err) {
      setError('An error occurred while fetching the grievance');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/grievances/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const updatedGrievance = { ...grievance, status: newStatus };
        setGrievance(updatedGrievance);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update status');
      }
    } catch (err) {
      setError('An error occurred while updating the status');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/grievances/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: comment })
      });

      if (response.ok) {
        const newComment = await response.json();
        setComments([...comments, newComment]);
        setComment('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to add comment');
      }
    } catch (err) {
      setError('An error occurred while adding the comment');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4 max-w-md w-full">
          {error}
        </div>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => router.push('/dashboard')}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!grievance) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-600 px-4 py-3 rounded mb-4 max-w-md w-full">
          Grievance not found
        </div>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => router.push('/dashboard')}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div>
      <Head>
        <title>Grievance #{grievance._id} - Grievance Redressal Portal</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Link href="/dashboard" className="text-blue-600 mr-2 hover:text-blue-800">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              Grievance Details
            </h1>
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(grievance.status)}`}>
              {grievance.status.charAt(0).toUpperCase() + grievance.status.slice(1)}
            </span>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {grievance.title}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {grievance.subject}
              </p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{grievance.name}</dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{grievance.email}</dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">University Roll Number</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{grievance.universityRollNumber}</dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Branch</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{grievance.branch}</dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Year</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{grievance.year}</dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Mobile Number</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{grievance.mobileNumber}</dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Type</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{grievance.type}</dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-line">{grievance.description}</dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Created At</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {new Date(grievance.createdAt).toLocaleString()}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Attachments</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {grievance.attachments && grievance.attachments.length > 0 ? (
                      <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                        {grievance.attachments.map((attachment, index) => (
                          <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                            <div className="w-0 flex-1 flex items-center">
                              <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                              </svg>
                              <span className="ml-2 flex-1 w-0 truncate">{attachment.originalname || attachment}</span>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <a href={`/api/grievances/${grievance._id}/attachments/${attachment.filename || attachment}`} download className="font-medium text-blue-600 hover:text-blue-500">
                                Download
                              </a>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No attachments</p>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Status update for staff */}
          {localStorage.getItem('userRole') === 'staff' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Update Status
                </h3>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleStatusChange('pending')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      grievance.status === 'pending' 
                        ? 'bg-yellow-200 text-yellow-800 cursor-default' 
                        : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    }`}
                    disabled={grievance.status === 'pending'}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => handleStatusChange('in-progress')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      grievance.status === 'in-progress' 
                        ? 'bg-blue-200 text-blue-800 cursor-default' 
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    }`}
                    disabled={grievance.status === 'in-progress'}
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => handleStatusChange('resolved')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      grievance.status === 'resolved' 
                        ? 'bg-green-200 text-green-800 cursor-default' 
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                    disabled={grievance.status === 'resolved'}
                  >
                    Resolved
                  </button>
                  <button
                    onClick={() => handleStatusChange('rejected')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      grievance.status === 'rejected' 
                        ? 'bg-red-200 text-red-800 cursor-default' 
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                    disabled={grievance.status === 'rejected'}
                  >
                    Rejected
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Comments section */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Comments
              </h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-sm">No comments yet</p>
              ) : (
                <ul className="space-y-4">
                  {comments.map((comment, index) => (
                    <li key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-900">{comment.user?.name || 'User'}</span>
                        <span className="text-sm text-gray-500">{new Date(comment.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-700">{comment.text}</p>
                    </li>
                  ))}
                </ul>
              )}

              <form onSubmit={handleAddComment} className="mt-6">
                <div>
                  <label htmlFor="comment" className="sr-only">
                    Add a comment
                  </label>
                  <textarea
                    id="comment"
                    rows={3}
                    className="shadow-sm block w-full focus:ring-blue-500 focus:border-blue-500 sm:text-sm border border-gray-300 rounded-md"
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Add Comment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 