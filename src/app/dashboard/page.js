// app/dashboard/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext'; 

export default function DashboardPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    name: '',
    phone: '',
    email: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

   // Add socket hook
  const { on, emit, isConnected } = useSocket();
  
  // State for PDF preview modal
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewFileName, setPreviewFileName] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
    if (!isConnected) return;

    console.log('📡 Setting up socket listeners on dashboard');

    
   

    // Listen for batch updates (multiple changes at once)
    const unsubscribeFormUpdate = on('new-statement-upload', (data) => {
      console.log('📡 Received stats batch update:', data);
      fetchCustomers();
    });

    // Cleanup listeners
    return () => {
      
      unsubscribeFormUpdate?.();
    };
  }, [on, isConnected]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    
    try {
      const res = await fetch('/api/customers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Failed to create customer');
        return;
      }

       if (isConnected) {
        emit('new-customer-created', {
          customerId: data.customer?.id || formData.userId,
          timestamp: new Date().toISOString(),
          status: 'pending' // New customers start with pending status
        });
        console.log('📡 Emitted new-customer-created event');
      }

      alert(`Customer created! Link sent via ${data.warnings ? 'Email only (WhatsApp failed)' : 'Email and WhatsApp'}`);
      setFormData({ userId: '', name: '', phone: '', email: '' });
      setShowForm(false);
      fetchCustomers();
    } catch (error) {
      alert('Failed to create customer');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleReject = async (statementId, fileName) => {
    const reason = prompt(`Enter reason for rejecting "${fileName}":`);
    if (!reason) return;

    setActionLoading(prev => ({ ...prev, [`reject-${statementId}`]: true }));

    try {
      const res = await fetch('/api/statements/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statementId, reason }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Failed to reject');
        return;
      }

       // Emit socket event for stats update
      if (isConnected) {
        emit('statement-status-changed', {
          statementId,
          status: 'rejected',
          timestamp: new Date().toISOString()
        });
      }

      alert(`Statement rejected. Customer notified.${data.warnings ? ' Some notifications failed.' : ''}`);
      fetchCustomers();
    } catch (error) {
      alert('Failed to reject statement');
    } finally {
      setActionLoading(prev => ({ ...prev, [`reject-${statementId}`]: false }));
    }
  };

  const handleApprove = async (statementId) => {
    setActionLoading(prev => ({ ...prev, [`approve-${statementId}`]: true }));

    try {
      const res = await fetch('/api/statements/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statementId }),
      });

      if (!res.ok) {
        throw new Error('Failed to approve');
      }

       // Emit socket event for stats update
      if (isConnected) {
        emit('statement-status-changed', {
          statementId,
          status: 'approved',
          timestamp: new Date().toISOString()
        });
      }

      alert('Statement approved');
      fetchCustomers();
    } catch (error) {
      alert('Failed to approve statement');
    } finally {
      setActionLoading(prev => ({ ...prev, [`approve-${statementId}`]: false }));
    }
  };

  const sendReminder = async (customerId, phone, email) => {
    setActionLoading(prev => ({ ...prev, [`remind-${customerId}`]: true }));

    try {
      const res = await fetch('/api/reminders/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, phone, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Failed to send reminder');
        return;
      }

      alert(`Reminder sent via ${data.channels.join(', ')}`);
    } catch (error) {
      alert('Failed to send reminder');
    } finally {
      setActionLoading(prev => ({ ...prev, [`remind-${customerId}`]: false }));
    }
  };

  const handlePreview = (statement) => {
    setPreviewError(false);
    
    if (statement.cloudinaryUrl) {
      try {
        new URL(statement.cloudinaryUrl);
        setPreviewUrl(statement.cloudinaryUrl);
        setPreviewFileName(statement.fileName);
        setShowPreview(true);
      } catch (e) {
        handleDownload(statement);
      }
    } else {
      alert('Preview URL not available');
    }
  };

  const handleDownload = (statement) => {
    if (statement.cloudinaryUrl) {
      const link = document.createElement('a');
      link.href = statement.cloudinaryUrl;
      link.download = statement.fileName || 'statement.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('Download URL not available');
    }
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewUrl(null);
    setPreviewFileName('');
    setPreviewError(false);
  };

  const getStatusBadge = (status) => {
    const badges = {
      APPROVED: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      REJECTED: 'bg-rose-100 text-rose-800 border border-rose-200',
      PENDING: 'bg-amber-100 text-amber-800 border border-amber-200',
    };
    return badges[status] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-light text-gray-900">
              Statement Collection
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage customer statements and collection requests
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showForm 
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <svg 
              className={`w-5 h-5 mr-2 ${showForm ? 'rotate-45' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d={showForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} 
              />
            </svg>
            {showForm ? 'Cancel' : 'New Collection Request'}
          </button>
        </div>

        {/* Create Customer Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Create New Collection Request
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.userId}
                    onChange={(e) => setFormData({...formData, userId: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., USR001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., John Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., +44 20 7123 4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., john.smith@example.com"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                >
                  {formSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating & Sending...
                    </>
                  ) : (
                    'Create & Send Links'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Customers Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statements
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                      No customers found. Create your first collection request.
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-medium text-sm">
                                {customer.name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{customer.name}</div>
                            <div className="text-sm text-gray-500 mt-0.5">ID: {customer.userId}</div>
                            <div className="text-sm text-gray-500 mt-0.5">{customer.email}</div>
                            <div className="text-sm text-gray-500">{customer.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {customer.statements?.length > 0 ? (
                          <div className="space-y-2">
                            {customer.statements.map((stmt) => (
                              <div key={stmt.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                                    {stmt.fileName}
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(stmt.status)}`}>
                                    {stmt.status}
                                  </span>
                                </div>
                                
                                {/* Statement Actions */}
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <button
                                    onClick={() => handlePreview(stmt)}
                                    className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded"
                                  >
                                    Preview
                                  </button>
                                  <button
                                    onClick={() => handleDownload(stmt)}
                                    className="text-xs text-purple-600 hover:text-purple-800 bg-purple-50 px-2 py-1 rounded"
                                  >
                                    Download
                                  </button>
                                  {stmt.status === 'PENDING' && (
                                    <>
                                      <button
                                        onClick={() => handleApprove(stmt.id)}
                                        disabled={actionLoading[`approve-${stmt.id}`]}
                                        className="text-xs text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {actionLoading[`approve-${stmt.id}`] ? 'Approving...' : 'Approve'}
                                      </button>
                                      <button
                                        onClick={() => handleReject(stmt.id, stmt.fileName)}
                                        disabled={actionLoading[`reject-${stmt.id}`]}
                                        className="text-xs text-rose-600 hover:text-rose-800 bg-rose-50 px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {actionLoading[`reject-${stmt.id}`] ? 'Rejecting...' : 'Reject'}
                                      </button>
                                    </>
                                  )}
                                </div>
                                
                                {stmt.rejectionReason && (
                                  <p className="text-xs text-rose-600 mt-2 bg-rose-50 p-1.5 rounded">
                                    Reason: {stmt.rejectionReason}
                                  </p>
                                )}
                                {stmt.uploadedAt && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    Uploaded: {formatDate(stmt.uploadedAt)}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No statements uploaded</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusBadge(customer.status)}`}>
                            {customer.status}
                          </span>
                          <div className="text-xs text-gray-500 space-y-1">
                            <div className="flex items-center space-x-1">
                              <span className={`inline-block w-2 h-2 rounded-full ${customer.emailSent ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                              <span>Email {customer.emailSent ? 'sent' : 'pending'}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className={`inline-block w-2 h-2 rounded-full ${customer.whatsappSent ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                              <span>WhatsApp {customer.whatsappSent ? 'sent' : 'pending'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => window.open(`/collect/${customer.token}`, '_blank')}
                            className="text-sm text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            View Collection Page
                          </button>
                          {customer.statements?.some(s => s.status === 'REJECTED') && (
                            <button
                              onClick={() => sendReminder(customer.id, customer.phone, customer.email)}
                              disabled={actionLoading[`remind-${customer.id}`]}
                              className="text-sm text-amber-600 hover:text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {actionLoading[`remind-${customer.id}`] ? 'Sending...' : 'Send Reminder'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showPreview && previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[95vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {previewFileName}
              </h3>
              <button
                onClick={closePreview}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 p-4 bg-gray-100 overflow-auto">
              {previewError ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-red-600 mb-4">Failed to load PDF preview</p>
                  <a
                    href={previewUrl}
                    download
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Download Instead
                  </a>
                </div>
              ) : (
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewUrl)}&embedded=true`}
                  className="w-full h-full min-h-[80vh] border-0"
                  title="PDF Preview"
                  onError={() => setPreviewError(true)}
                />
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="flex justify-between items-center p-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Uploaded to Cloudinary
              </div>
              <div className="flex space-x-2">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Open in New Tab
                </a>
                <a
                  href={previewUrl}
                  download
                  className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Download
                </a>
                <button
                  onClick={closePreview}
                  className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}