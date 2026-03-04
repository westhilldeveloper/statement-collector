// app/collect/[token]/success/page.js
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function SuccessPage({ params }) {
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    // Fetch customer details for personalized message
    fetch(`/api/verify-token?token=${params.token}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCustomer(data.customer);
        }
      })
      .catch(console.error);
  }, [params.token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Success Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 bg-green-100 rounded-full mb-6">
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Success Message */}
        <h1 className="text-2xl font-bold text-gray-800 mb-3">
          Thank You, {customer?.name || 'Customer'}!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Your bank statement(s) have been successfully uploaded and received.
        </p>

        {/* Status Card */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-blue-800 mb-2">What happens next?</h3>
          <ul className="text-sm text-blue-700 space-y-2">
            <li className="flex items-start">
              <span className="mr-2">1️⃣</span>
              Our team will review your documents
            </li>
            <li className="flex items-start">
              <span className="mr-2">2️⃣</span>
              You'll receive a confirmation via WhatsApp/Email
            </li>
            <li className="flex items-start">
              <span className="mr-2">3️⃣</span>
              If any issues, we'll contact you for resubmission
            </li>
          </ul>
        </div>

        {/* Reference Number */}
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-1">Your Reference Number</p>
          <p className="font-mono text-lg font-bold text-gray-700 bg-gray-100 py-2 px-4 rounded">
            {params.token?.slice(0, 8).toUpperCase()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Go to Homepage
          </Link>
          
          <button
            onClick={() => window.location.reload()}
            className="block w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            Upload More Documents
          </button>
        </div>

        {/* Security Note */}
        <p className="text-xs text-gray-400 mt-6">
          🔒 This is a secure submission. Your documents are encrypted and stored safely.
        </p>
      </div>
    </div>
  );
}