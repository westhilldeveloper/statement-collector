'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Icons as simple SVG components (replace with any icon library if desired)
const icons = {
  total: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  pending: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  approved: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  rejected: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  reminders: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
};

// Color mapping for each card (soft, accessible shades)
const colorMap = {
  'Total Customers': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: 'text-blue-500' },
  'Pending Statements': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: 'text-amber-500' },
  'Approved Statements': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: 'text-emerald-500' },
  'Rejected Statements': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: 'text-rose-500' },
  'Total Reminders': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: 'text-purple-500' },
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) setStats(data.stats);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const cards = [
    { label: 'Total Customers', value: stats?.totalCustomers, href: '/admin/customers', icon: icons.total },
    { label: 'Pending Statements', value: stats?.pendingStatements, href: '/admin/statements?status=PENDING', icon: icons.pending },
    { label: 'Approved Statements', value: stats?.approvedStatements, href: '/admin/statements?status=APPROVED', icon: icons.approved },
    { label: 'Rejected Statements', value: stats?.rejectedStatements, href: '/admin/statements?status=REJECTED', icon: icons.rejected },
    { label: 'Total Reminders', value: stats?.totalReminders, href: '/admin/reminders', icon: icons.reminders },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-light text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your statement collection activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => {
          const colors = colorMap[card.label] || colorMap['Total Customers']; // fallback
          return (
            <Link key={card.label} href={card.href} className="block group">
              <div className={`
                ${colors.bg} border ${colors.border} rounded-xl p-6 
                hover:shadow-md transition-shadow duration-200
                flex items-start justify-between
              `}>
                <div>
                  <p className={`text-sm font-medium ${colors.text} uppercase tracking-wider`}>
                    {card.label}
                  </p>
                  <p className={`text-4xl font-light ${colors.text} mt-2`}>
                    {card.value ?? '—'}
                  </p>
                </div>
                <div className={`${colors.icon} p-2 bg-white rounded-lg shadow-sm`}>
                  {card.icon}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      
    </div>
  );
}