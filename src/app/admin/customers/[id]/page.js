'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDate, formatFileSize } from '@/app/utils/formatters';
import { getStatusBadge } from '@/app/utils/formatters'; // assume this returns bg/text classes
import toast from 'react-hot-toast';
import { useCustomers } from '@/app/hooks/useCustomers';
import { useStatementActions } from '@/app/hooks/useStatementActions';
import { useCustomerUpdates } from '@/app/hooks/useSocketEvents';

export default function CustomerDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [statementDeleting, setStatementDeleting] = useState({});
  const [editingStatement, setEditingStatement] = useState(null);
  const [statementForm, setStatementForm] = useState({});

  const {
    customers,
    pagination,
    filters,
    setFilter,
    goToPage,
    refetch,
  } = useCustomers();
  const { approve, reject, sendReminder, loading: actionLoading } = useStatementActions(refetch);
  useCustomerUpdates(refetch);

  useEffect(() => {
    fetch(`/api/admin/customers/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCustomer(data.customer);
          setFormData({
            name: data.customer.name,
            email: data.customer.email,
            phone: data.customer.phone,
            userId: data.customer.userId,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = async () => {
    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setCustomer({ ...customer, ...formData });
        setEditing(false);
        toast.success('Customer updated');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Update failed');
      }
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const handleStatementDelete = async (statementId) => {
    if (!confirm('Are you sure you want to delete this statement?')) return;
    setStatementDeleting(prev => ({ ...prev, [statementId]: true }));
    try {
      const res = await fetch(`/api/admin/statements/${statementId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCustomer({
          ...customer,
          statements: customer.statements.filter(s => s.id !== statementId),
        });
        toast.success('Statement deleted');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Delete failed');
      }
    } catch (error) {
      toast.error('Delete failed');
    } finally {
      setStatementDeleting(prev => ({ ...prev, [statementId]: false }));
    }
  };

  const handleStatementEdit = (statement) => {
    setEditingStatement(statement.id);
    setStatementForm({
      status: statement.status,
      rejectionReason: statement.rejectionReason || '',
      password: statement.password || '',
    });
  };

  const handleStatementUpdate = async (statementId) => {
    try {
      if (statementForm.status === "APPROVED") {
        approve(statementId, customer.id);
      } else if (statementForm.status === "REJECTED") {
        reject(statementId, statementForm.rejectionReason, customer.id);
      } else {
        const res = await fetch(`/api/admin/statements/${statementId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(statementForm),
        });
        if (res.ok) {
          setCustomer({
            ...customer,
            statements: customer.statements.map(s =>
              s.id === statementId ? { ...s, ...statementForm } : s
            ),
          });
          setEditingStatement(null);
          toast.success('Statement updated');
        } else {
          const data = await res.json();
          toast.error(data.error || 'Update failed');
        }
      }
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const cancelStatementEdit = () => {
    setEditingStatement(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Customer not found.</p>
        <Link href="/admin/customers" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Back to customers
        </Link>
      </div>
    );
  }

  const statusOptions = ['PENDING', 'APPROVED', 'REJECTED'];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Header with back button */}
      <div className="mb-6 flex items-center">
        <Link
          href="/admin/customers"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to customers
        </Link>
      </div>

      {/* Customer Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-semibold shadow-sm">
              {customer.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{customer.name}</h1>
              <p className="text-sm text-gray-500">Customer since {formatDate(customer.createdAt)}</p>
            </div>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit Profile
            </button>
          )}
        </div>

        {!editing ? (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">User ID</p>
                <p className="text-sm font-mono text-gray-900">{customer.userId}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Email</p>
                <p className="text-sm text-gray-900">{customer.email}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Phone</p>
                <p className="text-sm text-gray-900">{customer.phone}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                {/* <p className="text-xs text-gray-500 uppercase tracking-wider">Status</p> */}
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getStatusBadge(customer.statements[0]?.status || customer.status)}`}>
                  { customer.statements[0]?.status || customer.status}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">User ID</label>
                <input
                  type="text"
                  value={formData.userId}
                  onChange={(e) => setFormData({...formData, userId: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleUpdate}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-5 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Statements Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Bank Statements
          {customer.statements?.length > 0 && (
            <span className="ml-3 text-sm font-normal text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
              {customer.statements.length} total
            </span>
          )}
        </h2>

        {!customer.statements || customer.statements.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500">No statements have been uploaded yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {customer.statements.map((statement) => {
              const badgeClasses = getStatusBadge(statement.status);
              const isEditingThis = editingStatement === statement.id;

              return (
                <div
                  key={statement.id}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-100 transition-all"
                >
                  {/* Left side: file info */}
                  <div className="flex items-center space-x-3 mb-3 sm:mb-0 min-w-0 flex-1">
                    <div className="flex-shrink-0">
                      <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{statement.fileName}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{formatFileSize(statement.fileSize)}</span>
                        <span>•</span>
                        <span>Uploaded {formatDate(statement.uploadedAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right side: status and actions */}
                  <div className="flex items-center justify-between sm:justify-end space-x-4">
                    {!isEditingThis ? (
                      <>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badgeClasses.bg} ${badgeClasses.text}`}>
                          {badgeClasses.icon}
                          {statement.status}
                        </span>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleStatementEdit(statement)}
                            className="p-1 text-gray-400 hover:text-blue-600 rounded"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <a
                            href={statement.cloudinaryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-gray-400 hover:text-blue-600 rounded"
                            title="View"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </a>
                          <button
                            onClick={() => handleStatementDelete(statement.id)}
                            disabled={statementDeleting[statement.id]}
                            className="p-1 text-gray-400 hover:text-red-600 rounded disabled:opacity-50"
                            title="Delete"
                          >
                            {statementDeleting[statement.id] ? (
                              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </>
                    ) : (
                      // Inline edit form
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                        <select
                          value={statementForm.status}
                          onChange={(e) => setStatementForm({...statementForm, status: e.target.value})}
                          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {statusOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        {statementForm.status === 'REJECTED' && (
                          <input
                            type="text"
                            placeholder="Rejection reason"
                            value={statementForm.rejectionReason}
                            onChange={(e) => setStatementForm({...statementForm, rejectionReason: e.target.value})}
                            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleStatementUpdate(statement.id)}
                            disabled={actionLoading[`approve-${statement.id}`] || actionLoading[`reject-${statement.id}`]}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                          >
                            {actionLoading[`approve-${statement.id}`] || actionLoading[`reject-${statement.id}`] ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={cancelStatementEdit}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}