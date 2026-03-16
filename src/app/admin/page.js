'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

  if (loading) return <div className="text-center py-12">Loading...</div>;

  const cards = [
    { label: 'Total Customers', value: stats?.totalCustomers, href: '/admin/customers', color: 'blue' },
    { label: 'Pending Statements', value: stats?.pendingStatements, href: '/admin/statements?status=PENDING', color: 'yellow' },
    { label: 'Approved Statements', value: stats?.approvedStatements, href: '/admin/statements?status=APPROVED', color: 'green' },
    { label: 'Rejected Statements', value: stats?.rejectedStatements, href: '/admin/statements?status=REJECTED', color: 'red' },
    { label: 'Total Reminders', value: stats?.totalReminders, href: '/admin/reminders', color: 'purple' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}>
            <div className={`bg-white rounded-xl shadow-sm border-l-4 border-${card.color}-500 p-6 hover:shadow-md transition`}>
              <p className="text-sm text-gray-500 uppercase">{card.label}</p>
              <p className="text-3xl font-bold mt-2">{card.value ?? '—'}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}