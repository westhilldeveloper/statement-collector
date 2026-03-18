// src/app/dashboard/page.js
'use client';

import { useState } from 'react';
import { useCustomers } from '../hooks/useCustomers';
import { useStatementActions } from '../hooks/useStatementActions';
import { useCustomerUpdates } from '../hooks/useSocketEvents';
import CreateCustomerForm from '../components/CreateCustomerForm';
import CustomerRow from '../components/CustomerRow';
import FilePreviewModal from '../components/FilePreviewModal';
import LoadingSpinner from '../components/LoadingSpinner';
import FilterBar from '../components/FilterBar'; 
import Pagination from '../components/Pagination'; 

export default function DashboardPage() {
  const {
    customers,
    loading,
    pagination,
    filters,
    setFilter,
    goToPage,
    refetch,
  } = useCustomers();

  const { approve, reject, sendReminder, loading: actionLoading } = useStatementActions(refetch);
  useCustomerUpdates(refetch);

  const [showForm, setShowForm] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const handlePreview = (statement) => {
    if (statement.cloudinaryUrl) {
      setPreviewFile(statement);
    } else {
      alert('Preview URL not available');
    }
  };

  const handleDownload = (statement) => {
    if (statement.cloudinaryUrl) {
      const link = document.createElement('a');
      link.href = statement.cloudinaryUrl;
      link.download = statement.fileName || 'file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('Download URL not available');
    }
  };

  const closePreview = () => setPreviewFile(null);

  if (loading && customers.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
    <div className="w-screen mx-auto py-6 px-4 sm:px-6 lg:px-8 flex-1 flex flex-col min-h-0">
        {/* Header with create button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-light text-pink-600">
              Statement Collection
            </h1>
            <p className="mt-1 text-sm text-purple-500">
              Manage customer statements and collection requests
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showForm
                ? 'bg-purple-600 text-white hover:bg-pink-600'
                : 'bg-pink-600 text-white hover:bg-purple-700'
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

        {showForm && (
          <CreateCustomerForm
            onSuccess={() => {
              setShowForm(false);
              refetch();
            }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Filter Bar */}
        <FilterBar filters={filters} setFilter={setFilter} />

        {/* Customers Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-0 mt-4">
           <div className="overflow-x-auto overflow-y-auto flex-1">
            
            <table className="min-w-full divide-y divide-pink-200">
              <thead className="bg-pink-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Upload Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statements
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Review Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <CustomerRow
                      key={customer.id}
                      customer={customer}
                      onAction={{ approve, reject, sendReminder }}
                      actionLoading={actionLoading}
                      onPreview={handlePreview}
                      onDownload={handleDownload}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <Pagination pagination={pagination} onPageChange={goToPage} />
      </div>

      <FilePreviewModal
        isOpen={!!previewFile}
        onClose={closePreview}
        file={previewFile}
      />
    </div>
  );
}