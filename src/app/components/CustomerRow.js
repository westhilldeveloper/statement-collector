'use client';

import { useState } from 'react';
import StatementCard from './StatementCard';
import { getStatusBadge } from '@/app/utils/formatters';

export default function CustomerRow({ customer, onAction, actionLoading, onPreview, onDownload }) {
  const [showAllStatements, setShowAllStatements] = useState(false);

  const statements = customer.statements || [];
  const hasStatements = statements.length > 0;
  const overallStatus = hasStatements
    ? statements.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0].status
    : customer.status;

    console.log("customer===>", customer.statements[0])
  const uploadStatus = customer.status === 'APPROVED' ? 'UPLOADED' : 'PENDING';
  const uploadStatusColor = uploadStatus === 'UPLOADED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800';

  // Limit displayed statements
  const displayedStatements = showAllStatements ? statements : statements.slice(0, 3);
  const remainingCount = statements.length - 3;

  return (
    <tr className="hover:bg-gray-50/80 transition-colors group">
      {/* Customer Info */}
      <td className="px-6 py-5 align-top">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 via-pink-300 to-purple-600 flex items-center justify-center text-white font-semibold text-lg shadow-sm">
              {customer.name?.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-gray-900 text-lg leading-tight">
              {customer.name}
            </div>
            <div className="text-sm text-gray-500 mt-0.5 flex items-center">
              <span className="font-mono">ID: {customer.userId}</span>
            </div>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex items-center text-gray-600">
                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="truncate">{customer.email}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>{customer.phone}</span>
              </div>
            </div>
          </div>
        </div>
      </td>

      {/* Upload Status */}
      <td className="px-6 py-5 align-top">
        <span className={`inline-flex items-center px-3 py-1 rounded-sm border-1 border-gray-400 text-xs font-medium ${uploadStatusColor}`}>
          {hasStatements > 0 &&  customer.statements[0].status !== "REJECTED" ? (
            <>
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              UPLOADED
            </>
          ) : (
            <>
              <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              PENDING UPLOAD
            </>
          )}
        </span>
      </td>

      {/* Statements */}
      <td className="px-6 py-5 align-top max-w-xs">
        {hasStatements ? (
          <div className="space-y-2">
            {displayedStatements.map((stmt) => (
              <StatementCard
                key={stmt.id}
                statement={stmt}
                customerStatus={customer.status}
                onApprove={onAction.approve}
                onReject={onAction.reject}
                onPreview={onPreview}
                onDownload={onDownload}
                actionLoading={actionLoading}
              />
            ))}
            {!showAllStatements && remainingCount > 0 && (
              <button
                onClick={() => setShowAllStatements(true)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center mt-1"
              >
                + {remainingCount} more statement{remainingCount > 1 ? 's' : ''}
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-400 italic">No statements yet</div>
        )}
      </td>

      {/* Review Status */}
      <td className="px-6 py-5 align-top">
        <div className="space-y-3">
          {/* <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(overallStatus)}`}>
            {overallStatus}
          </span> */}
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${customer.emailSent ? 'bg-emerald-500' : 'bg-gray-300'}`} />
              <span className="text-gray-600">Email</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${customer.whatsappSent ? 'bg-emerald-500' : 'bg-gray-300'}`} />
              <span className="text-gray-600">WhatsApp</span>
            </div>
          </div>
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-5 align-top">
        <div className="flex flex-col space-y-2">
          <button
            onClick={() => window.open(`/collect/${customer.token}`, '_blank')}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Page
          </button>

          {statements.some(s => s.status === 'REJECTED') && (
            <button
              onClick={() => onAction.sendReminder(customer.id, customer.phone, customer.email)}
              disabled={actionLoading[`remind-${customer.id}`]}
              className="inline-flex items-center justify-center px-4 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading[`remind-${customer.id}`] ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Send Reminder
                </>
              )}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}