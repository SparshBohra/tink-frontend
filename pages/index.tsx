import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>Squareft - Property Management Made Simple</title>
        <meta name="description" content="Streamline your property management with Squareft. Built for landlords, managers, and tenants." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-indigo-600">Squareft</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Link 
                  href="https://app.squareft.ai/login" 
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Landlord Login
                </Link>
                <Link 
                  href="https://portal.squareft.ai/tenant-login" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Tenant Portal
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Property Management
              <span className="text-indigo-600"> Made Simple</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Streamline your property operations with our comprehensive platform. 
              Built for landlords, property managers, and tenants.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="https://app.squareft.ai/signup"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg text-lg font-medium"
              >
                Get Started as Landlord
              </Link>
              <Link 
                href="https://portal.squareft.ai/tenant-login"
                className="bg-white hover:bg-gray-50 text-indigo-600 border border-indigo-600 px-8 py-3 rounded-lg text-lg font-medium"
              >
                Access Tenant Portal
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Properties
            </h2>
            <p className="text-lg text-gray-600">
              From listing to lease management, we've got you covered
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Property Management</h3>
              <p className="text-gray-600">
                Manage multiple properties, rooms, and listings from a single dashboard.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Tenant Management</h3>
              <p className="text-gray-600">
                Handle applications, leases, and tenant communications seamlessly.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Processing</h3>
              <p className="text-gray-600">
                Integrated payment processing with Stripe for rent collection and management.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-indigo-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-indigo-100 mb-8">
                Join thousands of property managers who trust Squareft
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="https://app.squareft.ai/signup"
                  className="bg-white hover:bg-gray-100 text-indigo-600 px-8 py-3 rounded-lg text-lg font-medium"
                >
                  Start Free Trial
                </Link>
                <Link 
                  href="https://app.squareft.ai/login"
                  className="border border-white text-white hover:bg-white hover:text-indigo-600 px-8 py-3 rounded-lg text-lg font-medium"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-white text-lg font-semibold mb-4">Squareft</h3>
                <p className="text-gray-400">
                  Property management made simple for landlords, managers, and tenants.
                </p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">For Landlords</h4>
                <ul className="space-y-2">
                  <li><Link href="https://app.squareft.ai/login" className="text-gray-400 hover:text-white">Login</Link></li>
                  <li><Link href="https://app.squareft.ai/signup" className="text-gray-400 hover:text-white">Sign Up</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">For Tenants</h4>
                <ul className="space-y-2">
                  <li><Link href="https://portal.squareft.ai/tenant-login" className="text-gray-400 hover:text-white">Portal Login</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Support</h4>
                <ul className="space-y-2">
                  <li><span className="text-gray-400">Contact Us</span></li>
                  <li><span className="text-gray-400">Help Center</span></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center">
              <p className="text-gray-400">&copy; 2024 Squareft. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}