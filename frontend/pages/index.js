import Link from 'next/link';
import Head from 'next/head';
import { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from './_app';

export default function Home() {
  const { isLoggedIn } = useContext(AuthContext);
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef(null);

  // Auto-scroll for testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  
  // Types of grievances that can be addressed
  const grievanceTypes = [
    {
      title: "Academic Issues",
      description: "Problems related to courses, grading, examinations, or academic policies",
      icon: (
        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      title: "Infrastructure",
      description: "Issues with classrooms, laboratories, hostel facilities, or other physical infrastructure",
      icon: (
        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      title: "Administrative",
      description: "Concerns about administrative processes, documentation, or staff responsiveness",
      icon: (
        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: "Financial Matters",
      description: "Issues related to fees, scholarships, refunds, or any financial transactions",
      icon: (
        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: "Discrimination",
      description: "Complaints related to discrimination based on gender, caste, religion, or any other basis",
      icon: (
        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
        </svg>
      )
    },
    {
      title: "Harassment",
      description: "Reports of any form of harassment, bullying, or ragging incidents",
      icon: (
        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    }
  ];

  const testimonials = [
    {
      quote: "I had an issue with my lab equipment, and it was resolved within 3 days after filing my grievance. The system works great!",
      author: "Manpreet Singh",
      role: "3rd Year, CSE"
    },
    {
      quote: "The scholarship reimbursement was delayed for months. After reporting through the portal, it was processed within a week.",
      author: "Anjali Sharma",
      role: "2nd Year, ECE"
    },
    {
      quote: "Had a concern about attendance marking. The grievance portal made it easy to get my issue addressed by the right department.",
      author: "Rahul Verma",
      role: "4th Year, ME"
    }
  ];

  const scrollToTypes = () => {
    scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      <Head>
        <title>GNDEC Grievance Portal - Home</title>
        <meta name="description" content="GNDEC's official portal for submitting and tracking grievances for students and staff" />
      </Head>

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-12 md:py-20">
            <div className="text-center">
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">
                  Welcome to
                </span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-800 via-blue-600 to-blue-800 mt-1">
                  Grievance Redressal Portal GNDEC
                </span>
              </h1>
              <p className="mt-6 max-w-lg mx-auto text-xl text-gray-500 md:text-xl md:max-w-3xl">
                A streamlined platform to address and resolve concerns of students and staff at Guru Nanak Dev Engineering College.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Link 
                  href="/file-grievance" 
                  className="px-6 py-3 text-base font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 md:py-3 md:text-lg md:px-8 shadow-md transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
                >
                  File Grievance
                </Link>
                {!isLoggedIn && (
                  <Link 
                    href="/login" 
                    className="px-6 py-3 text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-3 md:text-lg md:px-8 shadow-md transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
                  >
                    Login
                  </Link>
                )}
                {isLoggedIn && (
                  <Link 
                    href="/dashboard" 
                    className="px-6 py-3 text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-3 md:text-lg md:px-8 shadow-md transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
                  >
                    My Dashboard
                  </Link>
                )}
                <Link 
                  href="/track-grievance" 
                  className="px-6 py-3 text-base font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 md:py-3 md:text-lg md:px-8 shadow-md transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
                >
                  Track Grievance
                </Link>
                <Link 
                  href="/send-reminder" 
                  className="px-6 py-3 text-base font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 md:py-3 md:text-lg md:px-8 shadow-md transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
                >
                  Send Reminder
                </Link>
              </div>
              <div className="mt-10">
                <button
                  onClick={scrollToTypes}
                  className="flex items-center mx-auto text-blue-600 hover:text-blue-800 transition-all duration-300"
                >
                  <span className="mr-2">Explore Grievance Types</span>
                  <svg className="h-5 w-5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Process Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">How It Works</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Simple and Transparent Process
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Our grievance redressal system ensures that your concerns are addressed promptly and effectively.
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-800 mb-4">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900">Submit Your Grievance</h3>
                <p className="mt-2 text-base text-gray-500 text-center">
                  Fill out the grievance form with all necessary details and submit it through our portal.
                </p>
              </div>

              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-800 mb-4">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900">Track Progress</h3>
                <p className="mt-2 text-base text-gray-500 text-center">
                  Monitor the status of your grievance through your personalized dashboard.
                </p>
              </div>

              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-800 mb-4">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900">Get Resolution</h3>
                <p className="mt-2 text-base text-gray-500 text-center">
                  Receive updates and resolutions from the administration directly through the portal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grievance Types Scrollable Section */}
      <div ref={scrollRef} className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-12">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Types of Grievances</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              What Issues Can We Help With?
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Our portal handles a wide range of concerns to ensure all students and staff receive appropriate support.
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center z-10">
              <button 
                onClick={() => {
                  const container = document.getElementById('scrollContainer');
                  container.scrollBy({ left: -300, behavior: 'smooth' });
                }}
                className="bg-white rounded-full shadow-md p-2 text-blue-600 hover:text-blue-800 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
            
            <div 
              id="scrollContainer"
              className="flex overflow-x-auto py-4 hide-scrollbar snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <div className="flex space-x-6 px-8">
                {grievanceTypes.map((type, index) => (
                  <div 
                    key={index}
                    className="flex-shrink-0 w-80 bg-white p-6 rounded-xl shadow-md snap-start transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  >
                    <div className="text-blue-600 mb-4">
                      {type.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{type.title}</h3>
                    <p className="text-gray-600">{type.description}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="absolute inset-y-0 right-0 flex items-center z-10">
              <button 
                onClick={() => {
                  const container = document.getElementById('scrollContainer');
                  container.scrollBy({ left: 300, behavior: 'smooth' });
                }}
                className="bg-white rounded-full shadow-md p-2 text-blue-600 hover:text-blue-800 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-8">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Testimonials</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Success Stories
            </p>
          </div>

          <div className="relative h-72 overflow-hidden">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 transform ${
                  index === activeSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
              >
                <div className="bg-blue-50 p-8 rounded-xl shadow-md max-w-3xl mx-auto">
                  <svg className="h-10 w-10 text-blue-400 mb-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                  <p className="text-lg text-gray-700 italic mb-6">{testimonial.quote}</p>
                  <div>
                    <p className="text-blue-700 font-semibold">{testimonial.author}</p>
                    <p className="text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-6 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveSlide(index)}
                className={`h-3 w-3 rounded-full transition-colors duration-300 ${
                  index === activeSlide ? 'bg-blue-600' : 'bg-blue-200'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-blue-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to get your concerns addressed?</span>
            <span className="block text-blue-200">Submit your grievance today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                href="/file-grievance"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 transition-colors duration-300"
              >
                File a Grievance
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link
                href="/track-grievance"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-800 hover:bg-blue-900 transition-colors duration-300"
              >
                Track Existing Grievance
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
} 