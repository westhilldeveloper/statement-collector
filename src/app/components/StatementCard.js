// src/app/components/StatementCard.js
'use client';

import { getStatusBadge, formatDate } from '../utils/formatters';

export default function StatementCard({ statement, onApprove, onReject, onPreview, onDownload, actionLoading }) {
  return (
    <div className="p-3 bg-gray-80 rounded-lg border border-gray-600 hover:bg-gray-100 transition-colors">
      {/* Header with filename and status badge */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900 truncate max-w-[160px]" title={statement.fileName}>
          {statement.fileName}
        </span>
        <span className={`text-xs px-2 py-1 rounded-sm border-1 border-gray-400 font-medium ${getStatusBadge(statement.status)}`}>
          {statement.status}
        </span>
      </div>

      {/* Action buttons as icons */}
      <div className="flex items-center gap-1 mt-2">
        <button
          onClick={() => onPreview(statement)}
          className="p-1.5 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
          title="Preview"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="sr-only">Preview</span>
        </button>

        <button
          onClick={() => onDownload(statement)}
          className="p-1.5 text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors"
          title="Download"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span className="sr-only">Download</span>
        </button>

        {statement.status === 'PENDING' && (
          <>
            <button
              onClick={() => onApprove(statement.id)}
              disabled={actionLoading[`approve-${statement.id}`]}
              className="p-1.5 text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors disabled:opacity-50 disabled:pointer-events-none"
              title="Approve"
            >
              {actionLoading[`approve-${statement.id}`] ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              <span className="sr-only">Approve</span>
            </button>

            <button
              onClick={() => onReject(statement.id, statement.fileName)}
              disabled={actionLoading[`reject-${statement.id}`]}
              className="p-1.5 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors disabled:opacity-50 disabled:pointer-events-none"
              title="Reject"
            >
              {actionLoading[`reject-${statement.id}`] ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className="sr-only">Reject</span>
            </button>
          </>
        )}
      </div>

      {/* Rejection reason (if any) */}
      {statement.rejectionReason && (
        <p className="text-xs text-rose-600 mt-2 bg-rose-50 p-1.5 rounded flex items-start gap-1">
          <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{statement.rejectionReason}</span>
        </p>
      )}

      {/* Upload timestamp */}
      {statement.uploadedAt && (
        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatDate(statement.uploadedAt)}
        </p>
      )}
    </div>
  );
}