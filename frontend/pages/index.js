import Link from 'next/link';
import Head from 'next/head';

export default function Home() {
  return (
    <div>
      <Head>
        <title>Grievance Redressal Portal</title>
        <meta name="description" content="A platform to address and resolve your concerns efficiently" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Welcome to Grievance Redressal Portal of Guru Nanak Dev Engineering College
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              A platform to address and resolve your concerns efficiently
            </p>
            <div className="space-x-4">
              <Link 
                href="/login"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Login
              </Link>
              <Link 
                href="/file-grievance"
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                File a Grievance
              </Link>
            </div>
          </div>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Easy to Use</h3>
              <p className="text-gray-600">Simple and intuitive interface for filing grievances</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Track Status</h3>
              <p className="text-gray-600">Real-time tracking of your grievance status</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Quick Resolution</h3>
              <p className="text-gray-600">Efficient handling and resolution of complaints</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 