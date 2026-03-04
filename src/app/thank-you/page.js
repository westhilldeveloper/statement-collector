// app/thank-you/page.js
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ThankYouPage() {
  const [referenceNumber, setReferenceNumber] = useState('');

  // Generate a random reference number on component mount
  useEffect(() => {
    const ref = 'REF-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    setReferenceNumber(ref);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Success Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Success Header */}
          <div className="bg-emerald-50 px-6 py-8 text-center border-b border-emerald-100">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-light text-gray-900 mb-2">
              Thank You!
            </h1>
            <p className="text-emerald-700">
              Your bank statement has been successfully uploaded
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Reference Number */}
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Reference Number</p>
              <p className="text-xl font-mono font-medium text-gray-900">
                {referenceNumber}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Please save this reference for future correspondence
              </p>
            </div>

            {/* Next Steps */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900">What happens next?</h2>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">1</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Our team will review your statement within <span className="font-medium">24-48 hours</span>
                  </p>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">2</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    You'll receive an email confirmation once the review is complete
                  </p>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">3</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    If additional information is needed, we'll contact you directly
                  </p>
                </div>
              </div>
            </div>

            {/* Email Confirmation */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-600">Confirmation sent to your email</span>
                </div>
                <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                  Sent
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              <Link
                href="/"
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Return to Homepage
              </Link>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Confirmation
              </button>
            </div>
          </div>

          {/* Footer Note */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              If you have any questions, please contact our support team at{' '}
              <a href="mailto:support@example.com" className="text-blue-600 hover:underline">
                support@example.com
              </a>
            </p>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 text-xs text-gray-500">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Your data is protected by 256-bit SSL encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
}