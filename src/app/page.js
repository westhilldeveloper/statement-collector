// app/page.js
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSocket } from './context/SocketContext';
import Image from 'next/image';

export default function HomePage() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0
  });

  const showNotification =(message)=>{{
    console.log(message);
  }}

   const { on, isConnected } = useSocket();
  // Load stats on homepage

  // useEffect(() => {
  //   fetch('/api/stats')
  //     .then(res => res.json())
  //     .then(data => setStats(data))
  //     .catch(err => console.error('Failed to load stats:', err));
  // }, []);

  useEffect(() => {
  const fetchStats = async () => {
    try {
      const baseUrl = window.location.origin;
      const res = await fetch(`${baseUrl}/api/stats`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  fetchStats();
}, []);

 // Listen for real-time updates via socket
  useEffect(() => {
    if (!isConnected) return;

    console.log('📡 Setting up socket listeners on homepage');

    // Listen for new customer creation
    const unsubscribeNewCustomer = on('new-customer-created', (data) => {
      console.log('📡 Received new-customer-created event:', data);
      
      // Update stats optimistically
      setStats(prevStats => ({
        ...prevStats,
        total: prevStats.total + 1,
        pending: prevStats.pending + 1 // New customers start with pending
      }));

      // Optionally show a toast/notification
      showNotification('New collection request created!');
    });

    // Listen for statement status changes
    const unsubscribeStatusChange = on('statement-status-update', (data) => {
      console.log('📡 Received statement-status-changed event:', data);
      
      setStats(prevStats => {
        if (data.status === 'approved') {
          return {
            ...prevStats,
            pending: Math.max(0, prevStats.pending - 1),
            completed: prevStats.completed + 1
          };
        } else if (data.status === 'rejected') {
          // Rejected statements go back to pending for re-upload
          return {
            ...prevStats,
            pending: prevStats.pending + 0,
            completed: Math.max(0, prevStats.completed - 0)
          };
        }
        return prevStats;
      });

      // Show notification based on status
      if (data.status === 'approved') {
        showNotification('Statement approved!');
      } else if (data.status === 'rejected') {
        showNotification('Statement rejected - pending re-upload');
      }
    });

    // Listen for batch updates (multiple changes at once)
    const unsubscribeBatchUpdate = on('stats-batch-update', (data) => {
      console.log('📡 Received stats batch update:', data);
      setStats(data.stats);
    });

    // Cleanup listeners
    return () => {
      unsubscribeNewCustomer?.();
      unsubscribeStatusChange?.();
      unsubscribeBatchUpdate?.();
    };
  }, [on, isConnected]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-pink-600 to-purple-600 text-white overflow-hidden">
  {/* Background image – placed on left, blended with gradient */}
  <div className="absolute inset-0 opacity-30 mix-blend-overlay md:opacity-40">
    <Image
      src="/images/bankStatement.jpg"
      alt=""
      fill
      className="object-cover object-left"
      priority
    />
  </div>

  {/* Content */}
  <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
    <div className="text-center">
      <h1 className="text-4xl md:text-5xl font-bold mb-4">
        Bank Statement Collection Portal
      </h1>
      <p className="text-lg md:text-xl mb-8 opacity-90">
        Secure, fast, and reliable statement collection for your customers
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Link
          href="/dashboard"
          className="bg-white text-pink-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition shadow-lg"
        >
          Go to Dashboard
        </Link>
        <a
          href="#how-it-works"
          className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-pink-600 transition"
        >
          How It Works
        </a>
      </div>
    </div>
  </div>
</div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
  <div className="grid grid-cols-1 shadow-md md:grid-cols-3 gap-6">
    {/* Total Requests */}
    <div className="bg-white rounded-lg shadow-lg p-6 text-center">
      <div className="flex justify-center mb-3">
        <Image src="/images/book.gif" alt="Book" width={48} height={48} unoptimized />
      </div>
      <div className="text-4xl font-bold text-blue-600 mb-2">{stats.total}</div>
      <div className="text-gray-600">Total Requests</div>
    </div>
    {/* Pending Uploads */}
    <div className="bg-white rounded-lg shadow-lg p-6 text-center">
      <div className="flex justify-center mb-3">
        <Image src="/images/cursor-wait.gif" alt="Waiting" width={48} height={48} unoptimized />
      </div>
      <div className="text-4xl font-bold text-yellow-600 mb-2">{stats.pending}</div>
      <div className="text-gray-600">Pending Uploads</div>
    </div>
    {/* Completed */}
    <div className="bg-white rounded-lg shadow-lg p-6 text-center">
      <div className="flex justify-center mb-3">
        <Image src="/images/document.gif" alt="Document" width={48} height={48} unoptimized />
      </div>
      <div className="text-4xl font-bold text-green-600 mb-2">{stats.completed}</div>
      <div className="text-gray-600">Completed</div>
    </div>
  </div>
</div>

      {/* How It Works Section */}
      <div id="how-it-works"  className="bg-gray-100 shadow-md py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold  text-center text-pink-600 mb-12">How It Works</h2>
          
          <div className="grid grid-cols-1 shadow-md md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="text-5xl p-5 text-white bg-gradient-to-r from-pink-600 shadow-lg to-purple-600 font-bold mb-4">1</div>
              <h3 className="text-xl text-pink-600 font-semibold mb-2">Create Request</h3>
              <p className="text-purple-600 text-sm">
                Add customer details and send unique collection links via WhatsApp & Email
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="text-5xl p-5 text-white bg-gradient-to-r from-pink-600 shadow-lg to-purple-600 font-bold mb-4">2</div>
              <h3 className="text-xl text-pink-600 font-semibold mb-2">Customer Uploads</h3>
              <p className="text-purple-600 text-sm">
                Customers click the link and upload multiple PDF statements securely
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="text-5xl p-5 text-white bg-gradient-to-r from-pink-600 shadow-lg to-purple-600 font-bold mb-4">3</div>
              <h3 className="text-xl text-pink-600 font-semibold mb-2">Review & Process</h3>
              <p className="text-purple-600 text-sm">
                Review statements, approve or reject with automatic customer notifications
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      

<div className="max-w-7xl mx-auto px-4 py-16">
  <h2 className="text-3xl font-bold text-purple-600 text-center mb-12">Key Features</h2>

  <div className="grid grid-cols-1 md:grid-cols-2 shadow-md lg:grid-cols-4 gap-6">
    {/* WhatsApp Integration → phone-call.gif */}
    <div className="bg-white rounded-lg  border shadow-md border-gray-600 p-6 text-center">
      <div className="flex justify-center mb-4">
        <Image
          src="/images/phone-call.gif"
          alt="WhatsApp Integration"
          width={48}
          height={48}
          unoptimized
        />
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">WhatsApp Integration</h3>
      <p className="text-sm text-gray-600">Send links directly to customer's WhatsApp</p>
    </div>

    {/* Email Notifications → message.gif */}
    <div className="bg-white rounded-lg shadow border border-gray-600 p-6 text-center">
      <div className="flex justify-center mb-4">
        <Image
          src="/images/message.gif"
          alt="Email Notifications"
          width={48}
          height={48}
          unoptimized
        />
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">Email Notifications</h3>
      <p className="text-sm text-gray-600">Automatic email alerts for all activities</p>
    </div>

    {/* Multiple PDFs → folder.gif */}
    <div className="bg-white rounded-lg shadow-md border border-gray-600 p-6 text-center">
      <div className="flex justify-center mb-4">
        <Image
          src="/images/folder.gif"
          alt="Multiple PDFs"
          width={48}
          height={48}
          unoptimized
        />
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">Multiple PDFs</h3>
      <p className="text-sm text-gray-600">Upload several statements at once</p>
    </div>

    {/* Rejection Workflow → rejection.gif */}
    <div className="bg-white rounded-lg shadow-md border border-gray-600 p-6 text-center">
      <div className="flex justify-center mb-4">
        <Image
          src="/images/rejection.gif"
          alt="Rejection Workflow"
          width={48}
          height={48}
          unoptimized
        />
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">Rejection Workflow</h3>
      <p className="text-sm text-gray-600">Automatic reminders for resubmission</p>
    </div>
  </div>
</div>
    </div>
  );
}