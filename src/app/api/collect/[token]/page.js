// app/collect/[token]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CldUploadWidget } from 'next-cloudinary';

export default function CollectionPage({ params }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState('');
  const router = useRouter();

  // Verify token and get customer data
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/verify-token?token=${params.token}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Invalid or expired link');
        } else {
          setCustomer(data.customer);
          setUploadedFiles(data.statements || []);
          
          // Check if any statements are rejected
          const rejected = data.statements?.find(s => s.status === 'REJECTED');
          if (rejected) {
            setRejectionMessage(rejected.rejectionReason || 'Your statement was rejected. Please upload a new one.');
          }
        }
      } catch (err) {
        setError('Failed to verify link');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [params.token]);

  const handleUpload = async (result) => {
    if (!result || !result.info) return;

    try {
      setUploading(true);
      
      // Save to database
      const res = await fetch('/api/statements/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: params.token,
          cloudinaryUrl: result.info.secure_url,
          publicId: result.info.public_id,
          fileSize: result.info.bytes,
          fileName: result.info.original_filename,
          mimeType: result.info.format,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save upload');
      }

      // Update uploaded files list
      setUploadedFiles(prev => [...prev, data.statement]);
      
      // Clear rejection message if any
      setRejectionMessage('');

    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (statementId) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const res = await fetch(`/api/statements/${statementId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete file');
      }

      setUploadedFiles(prev => prev.filter(f => f.id !== statementId));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
        </div>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-lg shadow-lg p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome, {customer.name}!
          </h1>
          <p className="text-gray-600 mt-1">
            Please upload your bank statements. You can upload multiple PDFs.
          </p>
        </div>

        {/* Customer Info */}
        <div className="bg-white px-6 py-4 border-b">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">User ID</label>
              <p className="font-medium">{customer.userId}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Email</label>
              <p className="font-medium">{customer.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Phone</label>
              <p className="font-medium">{customer.phone}</p>
            </div>
          </div>
        </div>

        {/* Rejection Message */}
        {rejectionMessage && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400 text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{rejectionMessage}</p>
                <p className="text-xs text-red-500 mt-1">Please upload a new statement.</p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-b-lg shadow-lg p-6">
          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">
                Uploaded Files ({uploadedFiles.length})
              </h3>
              <div className="space-y-2">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      file.status === 'REJECTED' 
                        ? 'bg-red-50 border-red-200' 
                        : file.status === 'APPROVED'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">📄</span>
                      <div>
                        <p className="font-medium text-gray-700">{file.fileName}</p>
                        <p className="text-xs text-gray-500">
                          {(file.fileSize / 1024 / 1024).toFixed(2)} MB • 
                          Uploaded: {new Date(file.uploadedAt).toLocaleString()}
                        </p>
                        {file.status === 'REJECTED' && (
                          <p className="text-xs text-red-600 mt-1">
                            Rejected: {file.rejectionReason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => window.open(file.cloudinaryUrl, '_blank')}
                        className="text-blue-600 hover:text-blue-800 px-2 py-1 text-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="text-red-600 hover:text-red-800 px-2 py-1 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Widget */}
          <CldUploadWidget
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
            signatureEndpoint="/api/sign-cloudinary"
            onSuccess={handleUpload}
            options={{
              maxFiles: 10,
              maxFileSize: 10000000, // 10MB
              clientAllowedFormats: ['pdf'],
              resourceType: 'raw',
              multiple: true,
            }}
          >
            {({ open }) => (
              <div className="text-center">
                <div
                  onClick={() => open()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4 hover:border-blue-500 transition cursor-pointer"
                >
                  <div className="text-5xl mb-4">📤</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Click to upload statements
                  </h3>
                  <p className="text-gray-500 mb-4">
                    PDF files only (Max: 10MB each)
                  </p>
                  <button
                    type="button"
                    disabled={uploading}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                  >
                    {uploading ? 'Uploading...' : 'Select PDF Files'}
                  </button>
                </div>

                {uploading && (
                  <div className="mt-4">
                    <div className="animate-pulse text-blue-600">
                      Uploading...
                    </div>
                  </div>
                )}
              </div>
            )}
          </CldUploadWidget>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">📋 Guidelines</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Upload clear, readable PDF files</li>
              <li>• Maximum 10MB per file</li>
              <li>• You can upload multiple files</li>
              <li>• If rejected, you'll be notified to upload again</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}