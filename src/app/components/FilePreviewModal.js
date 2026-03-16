// src/app/components/FilePreviewModal.js
'use client';

import { useState } from 'react';

export default function FilePreviewModal({ isOpen, onClose, file }) {
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !file) return null;

  const { cloudinaryUrl, fileName, mimeType, password } = file;
  const isImage = mimeType?.startsWith('image/');

  const handleCopyPassword = () => {
    if (password) {
      navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[95vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium text-gray-900 truncate max-w-md">{fileName}</h3>
            {password && (
              <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full">
                <span className="text-sm font-mono">{password}</span>
                <button
                  onClick={handleCopyPassword}
                  className="text-gray-500 hover:text-blue-600"
                  title="Copy password"
                >
                  {copied ? (
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 p-4 bg-gray-100 overflow-auto flex items-center justify-center">
          {error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">Failed to load preview</p>
              {password && (
                <p className="text-sm text-gray-600 mb-2">
                  This document may be password-protected. Use password: <span className="font-mono bg-gray-200 px-2 py-1 rounded">{password}</span>
                </p>
              )}
              <a href={cloudinaryUrl} download className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg">
                Download Instead
              </a>
            </div>
          ) : isImage ? (
            <img
              src={cloudinaryUrl}
              alt={fileName}
              className="max-w-full max-h-full object-contain"
              onError={() => setError(true)}
            />
          ) : (
            // For PDF, use Google Docs viewer (may not handle password-protected PDFs)
            <iframe
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(cloudinaryUrl)}&embedded=true`}
              className="w-full h-full min-h-[80vh] border-0"
              title="File Preview"
              onError={() => setError(true)}
            />
          )}
        </div>
        <div className="flex justify-between items-center p-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {isImage ? 'Image' : 'Document'} uploaded to Cloudinary
            {password && (
              <span className="ml-2 text-amber-600">(Password protected)</span>
            )}
          </div>
          <div className="flex space-x-2">
            <a
              href={cloudinaryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg"
            >
              Open in New Tab
            </a>
            <a
              href={cloudinaryUrl}
              download
              className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg"
            >
              Download
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}