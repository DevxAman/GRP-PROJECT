import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { AuthContext } from './_app';

export default function FileGrievance() {
  const router = useRouter();
  const { isLoggedIn } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    year: '',
    universityRollNumber: '',
    branch: '',
    mobileNumber: '',
    type: '',
    subject: '',
    title: '',
    description: ''
  });
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [redirectingToLogin, setRedirectingToLogin] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    if (!isLoggedIn) {
      setRedirectingToLogin(true);
      setError('Please log in to file a grievance');
      
      // Redirect to login page after 3 seconds
      const redirectTimer = setTimeout(() => {
        router.push('/login?redirect=/file-grievance');
      }, 3000);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [isLoggedIn, router]);

  // Fetch user profile data if logged in
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isLoggedIn) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('http://localhost:5000/api/users/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            // Pre-fill form with user data
            setFormData(prevData => ({
              ...prevData,
              name: userData.name || '',
              email: userData.email || '',
              universityRollNumber: userData.universityRollNumber || '',
              branch: userData.branch || '',
              mobileNumber: userData.mobileNumber || '',
              year: userData.year?.toString() || ''
            }));
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      }
    };
    
    fetchUserProfile();
  }, [isLoggedIn]);

  const handleFileChange = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      
      // Validate file size (max 10MB per file)
      const invalidFiles = selectedFiles.filter(file => file.size > 10 * 1024 * 1024);
      if (invalidFiles.length > 0) {
        setError(`Some files exceed the 10MB limit: ${invalidFiles.map(f => f.name).join(', ')}`);
        return;
      }
      
      // Limit to 5 files maximum
      if (files.length + selectedFiles.length > 5) {
        setError('You can upload a maximum of 5 files');
        return;
      }
      
      setFiles([...files, ...selectedFiles]);
      setError('');
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      setError('You must be logged in to file a grievance');
      router.push('/login?redirect=/file-grievance');
      return;
    }
    
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      console.log('Starting grievance submission...');
      const formDataToSend = new FormData();
      
      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
        console.log(`Appending field: ${key} = ${value}`);
      });

      // Append files
      files.forEach((file) => {
        formDataToSend.append('attachments', file);
        console.log(`Appending file: ${file.name}`);
      });

      // Get auth token - required for submission
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      console.log('Sending request to backend...');
      const response = await fetch('http://localhost:5000/api/grievances', {
        method: 'POST',
        body: formDataToSend,
        headers
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        setSuccess(`Grievance filed successfully! Your tracking ID is: ${data.trackingId}`);
        setFormData({
          name: '',
          email: '',
          year: '',
          universityRollNumber: '',
          branch: '',
          mobileNumber: '',
          type: '',
          subject: '',
          title: '',
          description: ''
        });
        setFiles([]);
        setStep(1);
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/track-grievance?trackingId=' + data.trackingId);
        }, 2000);
      } else {
        setError(data.message || 'Failed to file grievance');
        console.error('Error response:', data);
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError('An error occurred while filing the grievance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    const requiredFields = {
      1: ['name', 'email', 'year', 'universityRollNumber', 'branch', 'mobileNumber'],
      2: ['type', 'subject', 'title']
    }[step];

    const isValid = requiredFields.every(field => formData[field].trim() !== '');
    
    if (!isValid) {
      setError('Please fill all required fields before proceeding');
      return;
    }
    
    setError('');
    setStep(step + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(step - 1);
  };

  // Render login required message if not logged in
  if (redirectingToLogin) {
    return (
      <div>
        <Head>
          <title>Login Required - GNDEC Grievance Redressal Portal</title>
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
                      You need to be logged in to file a grievance. Redirecting to login page...
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
                  onClick={() => router.push('/login?redirect=/file-grievance')}
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
        <title>File Grievance - GNDEC Grievance Redressal Portal</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              <span className="block">File a New Grievance</span>
            </h1>
            <p className="mt-4 text-lg text-gray-500">
              Your concerns matter to us. Please fill out the form below to submit your grievance.
            </p>
          </div>

          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div 
                className={`flex-1 h-2 rounded-full ${
                  step >= 1 ? 'bg-blue-500' : 'bg-gray-200'
                } transition-all duration-300`}
              ></div>
              <div className="w-3"></div>
              <div 
                className={`flex-1 h-2 rounded-full ${
                  step >= 2 ? 'bg-blue-500' : 'bg-gray-200'
                } transition-all duration-300`}
              ></div>
              <div className="w-3"></div>
              <div 
                className={`flex-1 h-2 rounded-full ${
                  step >= 3 ? 'bg-blue-500' : 'bg-gray-200'
                } transition-all duration-300`}
              ></div>
            </div>
            <div className="flex justify-between text-sm font-medium text-gray-500">
              <div className={`${step === 1 ? 'text-blue-600' : ''}`}>Personal Information</div>
              <div className={`${step === 2 ? 'text-blue-600' : ''}`}>Grievance Details</div>
              <div className={`${step === 3 ? 'text-blue-600' : ''}`}>Attachments</div>
            </div>
          </div>

          <div className="bg-white shadow-xl rounded-lg overflow-hidden">
            <div className="px-6 py-8 sm:px-10">
              {error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-600 p-4 rounded-md flex items-center" role="alert">
                  <svg className="h-5 w-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-600 p-4 rounded-md flex items-center" role="alert">
                  <svg className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {step === 1 && (
                  <div className="space-y-6 transition-all duration-300">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Personal Information</h2>
                    
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="group relative">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <input
                            type="text"
                            id="name"
                            required
                            className="form-input w-full px-4 py-2"
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400 group-hover:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="group relative">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <input
                            type="email"
                            id="email"
                            required
                            className="form-input w-full px-4 py-2"
                            placeholder="your.email@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400 group-hover:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                          Year <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="year"
                          required
                          className="form-input w-full mt-1 px-4 py-2"
                          value={formData.year}
                          onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        >
                          <option value="">Select Year</option>
                          <option value="1">1st Year</option>
                          <option value="2">2nd Year</option>
                          <option value="3">3rd Year</option>
                          <option value="4">4th Year</option>
                        </select>
                      </div>

                      <div className="group relative">
                        <label htmlFor="universityRollNumber" className="block text-sm font-medium text-gray-700">
                          University Roll Number <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <input
                            type="text"
                            id="universityRollNumber"
                            required
                            className="form-input w-full px-4 py-2"
                            placeholder="e.g., 1901234"
                            value={formData.universityRollNumber}
                            onChange={(e) => setFormData({ ...formData, universityRollNumber: e.target.value })}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400 group-hover:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="branch" className="block text-sm font-medium text-gray-700">
                          Branch <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="branch"
                          required
                          className="form-input w-full mt-1 px-4 py-2"
                          value={formData.branch}
                          onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                        >
                          <option value="">Select Branch</option>
                          <option value="CSE">Computer Science</option>
                          <option value="ECE">Electronics & Communication</option>
                          <option value="ME">Mechanical Engineering</option>
                          <option value="CE">Civil Engineering</option>
                          <option value="EE">Electrical Engineering</option>
                          <option value="IT">Information Technology</option>
                          <option value="PT">Production Engineering</option>
                        </select>
                      </div>

                      <div className="group relative">
                        <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700">
                          Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <input
                            type="tel"
                            id="mobileNumber"
                            required
                            className="form-input w-full px-4 py-2"
                            placeholder="e.g., 9876543210"
                            value={formData.mobileNumber}
                            onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400 group-hover:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6 transition-all duration-300">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Grievance Details</h2>
                    
                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                        Grievance Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="type"
                        required
                        className="form-input w-full mt-1 px-4 py-2"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      >
                        <option value="">Select a type</option>
                        <option value="academic">Academic</option>
                        <option value="hostel">Hostel</option>
                        <option value="infrastructure">Infrastructure</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                        Subject <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="subject"
                        required
                        className="form-input w-full mt-1 px-4 py-2"
                        placeholder="Brief subject of your grievance"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      />
                    </div>

                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="title"
                        required
                        className="form-input w-full mt-1 px-4 py-2"
                        placeholder="Title for your grievance"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="description"
                          required
                          rows={5}
                          className="form-input w-full px-4 py-2"
                          placeholder="Please provide a detailed description of your grievance"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          maxLength={5000}
                        />
                        <p className="mt-1 text-sm text-gray-500 text-right">
                          {formData.description.length}/5000 characters
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6 transition-all duration-300">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Attachments and Review</h2>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Supporting Documents (Optional)
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition-colors duration-200">
                        <div className="space-y-1 text-center">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                            aria-hidden="true"
                          >
                            <path
                              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <div className="flex text-sm text-gray-600 justify-center">
                            <label
                              htmlFor="file-upload"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                            >
                              <span>Upload files</span>
                              <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                multiple
                                className="sr-only"
                                onChange={handleFileChange}
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, PDF up to 10MB each
                          </p>
                        </div>
                      </div>
                    </div>

                    {files.length > 0 && (
                      <div className="mt-2">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Selected files:</h3>
                        <ul className="border rounded-md divide-y">
                          {files.map((file, index) => (
                            <li key={index} className="px-4 py-3 flex items-center justify-between text-sm">
                              <div className="flex items-center">
                                <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                <span className="truncate">{file.name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-6 bg-gray-50 p-4 rounded-md">
                      <h3 className="text-md font-medium text-gray-800 mb-2">Summary of Your Grievance</h3>
                      <div className="grid grid-cols-1 gap-y-2 text-sm">
                        <div className="grid grid-cols-3">
                          <div className="font-medium text-gray-500">Name:</div>
                          <div className="col-span-2">{formData.name}</div>
                        </div>
                        <div className="grid grid-cols-3">
                          <div className="font-medium text-gray-500">Email:</div>
                          <div className="col-span-2">{formData.email}</div>
                        </div>
                        <div className="grid grid-cols-3">
                          <div className="font-medium text-gray-500">Roll Number:</div>
                          <div className="col-span-2">{formData.universityRollNumber}</div>
                        </div>
                        <div className="grid grid-cols-3">
                          <div className="font-medium text-gray-500">Type:</div>
                          <div className="col-span-2">{formData.type}</div>
                        </div>
                        <div className="grid grid-cols-3">
                          <div className="font-medium text-gray-500">Subject:</div>
                          <div className="col-span-2">{formData.subject}</div>
                        </div>
                        <div className="grid grid-cols-3">
                          <div className="font-medium text-gray-500">Title:</div>
                          <div className="col-span-2">{formData.title}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-8 flex justify-between">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="btn-secondary flex items-center"
                    >
                      <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back
                    </button>
                  ) : (
                    <div></div>
                  )}
                  
                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="btn-primary flex items-center"
                    >
                      Next
                      <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`btn-primary flex items-center ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting...
                        </>
                      ) : (
                        <>
                          Submit Grievance
                          <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 