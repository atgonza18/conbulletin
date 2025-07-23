'use client';

import Link from 'next/link';

export default function ConfirmationPendingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We sent a confirmation link to your email address.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Almost there!
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Please check your email and click the confirmation link to activate your account. 
              You may need to check your spam folder.
            </p>
            
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p>After confirming your email, you can:</p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>Create daily construction bulletins</li>
                  <li>Track action items and progress</li>
                  <li>Collaborate with your team</li>
                </ul>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 