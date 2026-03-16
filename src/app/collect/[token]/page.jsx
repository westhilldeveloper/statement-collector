// app/collect/[token]/page.js
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSocket } from '../../context/SocketContext'; 



// Helper function for status badge styling
const getStatusBadge = (status) => {
  switch(status) {
    case 'APPROVED':
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      };
    case 'REJECTED':
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      };
    case 'PENDING':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        icon: null
      };
  }
};

export default function StatementCollectionForm({ params }) {
  // Unwrap params using React.use() in Next.js 15
  const unwrappedParams = React.use(params);
  const token = unwrappedParams.token;
  const {on, emit, isConnected } = useSocket();
  
  const [customer, setCustomer] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [previousStatements, setPreviousStatements] = useState([]);
  const [loadingStatements, setLoadingStatements] = useState(false);
  const [selectedStatement, setSelectedStatement] = useState(null);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [filePassword, setFilePassword] = useState('');
  const router = useRouter();



  const fetchCustomerStatements = useCallback(async () => {
    setLoadingStatements(true);
    try {
      const res = await fetch(`/api/statements/by-token/${token}`);
      const data = await res.json();
      
      if (data.success) {
        setPreviousStatements(data.data.statements || []);
        console.log("statement data===>", data.data);
      }
    } catch (error) {
      console.error('Error fetching statements:', error);
    } finally {
      setLoadingStatements(false);
    }
  }, [token]);


  useEffect(() => {
    if (!isConnected) return;

    console.log('📡 Setting up socket listeners on homepage');

   
    // Listen for statement status changes
    const unsubscribeStatusChange = on('statement-status-update', (data) => {
      console.log('📡 Received statement-status-changed event:', data);
      
     fetchCustomerStatements();
      });

    
    
    // Cleanup listeners
    return () => {
    
      unsubscribeStatusChange?.();
    
    };
  }, [on, isConnected, fetchCustomerStatements]);

  // Fetch customer details using the token
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
       
        const res = await fetch(`/api/customer-by-token/${token}`);
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Invalid or expired link');
        }
        
        console.log('Customer data:', data.customer);
        setCustomer(data.customer);
        setCustomerName(data.customer.name);

         if (data.customer.id) {
          fetchCustomerStatements();
        }

       
      } catch (err) {
        console.error('Error fetching customer:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchCustomer();
    }
  }, [token]);

  

  // Function to view a specific statement
  const viewStatement = (statement) => {
    setSelectedStatement(statement);
    setShowStatementModal(true);
  };

  const validateFiles = (fileList) => {
  const errors = [];
  const validFiles = [];
  
  // Check maximum files (limit to 10)
  if (fileList.length > 10) {
    errors.push(`Maximum 10 files allowed (you selected ${fileList.length})`);
    return { errors, validFiles: [] };
  }

  // Check total size (max 50MB total)
  const totalSize = Array.from(fileList).reduce((sum, file) => sum + file.size, 0);
  if (totalSize > 50 * 1024 * 1024) {
    errors.push('Total file size exceeds 50MB limit');
  }

  // Allowed MIME types
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/tiff'
  ];

  // Validate each file
  Array.from(fileList).forEach((file, index) => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File ${index + 1} (${file.name}): Only PDF and image files allowed (JPEG, PNG, GIF, BMP, TIFF)`);
    }
    // Check individual file size (10MB limit)
    else if (file.size > 10 * 1024 * 1024) {
      errors.push(`File ${index + 1} (${file.name}): Exceeds 10MB limit`);
    }
    // Check for duplicate filenames in the same batch
    else if (Array.from(fileList).filter(f => f.name === file.name).length > 1) {
      errors.push(`Duplicate filename: ${file.name}`);
    }
    else {
      validFiles.push(file);
    }
  });

  return { errors, validFiles };
};

  const handleFileChange = (e) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const { errors, validFiles } = validateFiles(selectedFiles);
      
      if (errors.length > 0) {
        setValidationErrors(errors);
        // Still add valid files
        setFiles(prev => [...prev, ...validFiles]);
      } else {
        setValidationErrors([]);
        setFiles(prev => [...prev, ...validFiles]);
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      const { errors, validFiles } = validateFiles(droppedFiles);
      
      if (errors.length > 0) {
        setValidationErrors(errors);
        if (validFiles.length > 0) {
          setFiles(prev => [...prev, ...validFiles]);
        }
      } else {
        setValidationErrors([]);
        setFiles(prev => [...prev, ...validFiles]);
      }
    }
  };

  const removeFile = (indexToRemove) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
    setValidationErrors([]); // Clear errors when removing files
  };

  const clearAllFiles = () => {
    setFiles([]);
    setValidationErrors([]);
    setUploadResults(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0 || !customer) {
      alert('Please select at least one file to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadResults(null);
    
    const formData = new FormData();
    
    // Append all files with the same field name 'statements'
    files.forEach(file => {
      formData.append('statements', file);
    });
    
    formData.append('customerId', customer.id);
    formData.append('customerName', customerName);
    formData.append('accountNumber', accountNumber);
    formData.append('filePassword', filePassword);
    formData.append('token', token);

    try {
      // Simulate progress (since fetch doesn't support progress natively)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      const res = await fetch('/api/upload-statement', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await res.json();

      if (res.ok || res.status === 207) {
         if (isConnected) {
        emit('statement-uploaded', {
         customerId: customer.id,
          timestamp: new Date().toISOString(),
          status: 'pending' // New customers start with pending status
        });
        console.log('📡 Emitted statement-uploaded event');
      }
        
        // 207 Multi-Status
        setUploadResults({
          success: data.success,
          message: data.message,
          uploaded: data.data?.uploaded || [],
          warnings: data.warnings
        });

        // If some files uploaded successfully, show results
        if (data.data?.uploaded?.length > 0) {

          
          // Don't redirect immediately, show results first
          setTimeout(() => {
            router.push('/thank-you');
          }, 3000);
        } else {
          // No files uploaded successfully
          alert('Upload failed: ' + (data.error || 'Unknown error'));
        }
      } else {
        // Handle error response
        const errorMessage = data.error || 'Upload failed';
        const errorDetails = data.details ? `\n\nDetails: ${data.details}` : '';
        alert(`${errorMessage}${errorDetails}`);
        setUploadProgress(0);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please check your connection and try again.');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your secure collection page...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid or Expired Link</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-light text-gray-900 mb-2">
            Upload Your Bank Statements
          </h1>
          <p className="text-gray-600">
            Please provide your statements for verification purposes
          </p>
        </div>

        {/* Welcome Card */}
        {customer && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Welcome back, {customer.name}!</span> Your secure upload link is ready.
              </p>
            </div>
          </div>
        )}

        {/* ===== NEW SECTION: Statement History ===== */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold text-gray-900">
                Statement History
              </h2>
              {!loadingStatements && previousStatements.length > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {previousStatements.length} total
                </span>
              )}
            </div>
            
            {/* Refresh button (optional) */}
            <button
              onClick={fetchCustomerStatements}
              className="text-gray-400 hover:text-blue-600 transition-colors"
              disabled={loadingStatements}
            >
              <svg className={`w-5 h-5 ${loadingStatements ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Loading state */}
          {loadingStatements ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Empty state */}
              {previousStatements.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">No statements yet</h3>
                  <p className="text-sm text-gray-500">
                    Upload your first statement using the form below
                  </p>
                </div>
              ) : (
                /* Statements list - with fixed height and scroll */
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                  {previousStatements.map((statement, index) => {
                    const badgeStyle = getStatusBadge(statement.status);
                    
                    return (
                      <div 
                        key={statement.id || index}
                        className="group flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all cursor-pointer"
                        onClick={() => viewStatement(statement)}
                      >
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          {/* File Icon */}
                          <div className="flex-shrink-0">
                            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          
                          {/* File Info */}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {statement.fileName}
                            </p>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>{formatFileSize(statement.fileSize)}</span>
                              <span>•</span>
                              <span>{formatDate(statement.uploadedAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badgeStyle.bg} ${badgeStyle.text}`}>
                            {badgeStyle.icon}
                            {statement.status}
                          </span>
                          
                          {/* View Icon */}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              viewStatement(statement);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* ===== END NEW SECTION ===== */}

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                required
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">
                Name is auto-filled from your profile
              </p>
            </div>

            {/* Account Number Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                placeholder="e.g., GB29NWBK60161331926819"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your IBAN or account number
              </p>
            </div>

            {/* Password Field (for protected PDFs) */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Document Password <span className="text-gray-400 text-xs">(optional)</span>
  </label>
  <input
    type="password"
    id="filePassword"
    name="filePassword"
    value={filePassword}
    onChange={(e) => setFilePassword(e.target.value)}
    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    placeholder="Enter password if your statements are protected"
  />
  <p className="text-xs text-gray-500 mt-1">
    If your PDF files require a password to open, enter it here. It will be stored securely and used when you view the documents.
  </p>
</div>

            {/* File Upload Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Statements (PDF) <span className="text-rose-500">*</span>
              </label>
              
              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-amber-800 mb-1">Please fix the following:</p>
                      <ul className="text-xs text-amber-700 list-disc list-inside space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Area */}
              {files.length === 0 ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.tiff"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    multiple
                  />
                  <label 
                    htmlFor="file-upload"
                    className="cursor-pointer"
                  >
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-gray-600 mb-1">
                      <span className="text-blue-600 font-medium">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      Multiple PDF files allowed (Max 10 files, 10MB each)
                    </p>
                  </label>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700">
                      Selected Files ({files.length})
                    </h3>
                    <button
                      type="button"
                      onClick={clearAllFiles}
                      className="text-xs text-rose-600 hover:text-rose-800 bg-rose-50 px-2 py-1 rounded"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  {/* File List */}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className="flex-shrink-0">
                            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="ml-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Uploading...</span>
                  <span className="text-gray-900 font-medium">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Upload Results */}
            {uploadResults && (
              <div className={`p-4 rounded-lg ${
                uploadResults.uploaded.length > 0 
                  ? 'bg-emerald-50 border border-emerald-200' 
                  : 'bg-amber-50 border border-amber-200'
              }`}>
                <div className="flex items-start space-x-2">
                  <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    uploadResults.uploaded.length > 0 
                      ? 'text-emerald-600' 
                      : 'text-amber-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {uploadResults.uploaded.length > 0 ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    )}
                  </svg>
                  <div>
                    <p className={`text-sm font-medium ${
                      uploadResults.uploaded.length > 0 
                        ? 'text-emerald-800' 
                        : 'text-amber-800'
                    }`}>
                      {uploadResults.message}
                    </p>
                    {uploadResults.uploaded.length > 0 && (
                      <p className="text-xs text-emerald-600 mt-1">
                        Redirecting to confirmation page...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Notice */}
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p>
                  Your documents will be securely encrypted and stored. 
                  We only use this information for verification purposes.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading || files.length === 0}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Uploading {files.length} file{files.length > 1 ? 's' : ''}...</span>
                </>
              ) : (
                <>
                  <span>Upload {files.length} Statement{files.length > 1 ? 's' : ''}</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>

            {/* Security Badge */}
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500 pt-4">
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>256-bit SSL Encrypted</span>
              </div>
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>GDPR Compliant</span>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          © {new Date().getFullYear()} Your Company Name. All rights reserved.
        </p>
      </div>

      {/* Statement Details Modal */}
      {showStatementModal && selectedStatement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Statement Details
                </h3>
                <button
                  onClick={() => setShowStatementModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">File Name</label>
                  <p className="mt-1 text-sm text-gray-900 break-all">{selectedStatement.fileName}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">File Size</label>
                    <p className="mt-1 text-sm text-gray-900">{formatFileSize(selectedStatement.fileSize)}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Upload Date</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedStatement.uploadedAt)}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    {(() => {
                      const badgeStyle = getStatusBadge(selectedStatement.status);
                      return (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badgeStyle.bg} ${badgeStyle.text}`}>
                          {badgeStyle.icon}
                          {selectedStatement.status}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                
                {selectedStatement.rejectionReason && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Rejection Reason</label>
                    <p className="mt-1 text-sm text-red-600 bg-red-50 p-3 rounded">
                      {selectedStatement.rejectionReason}
                    </p>
                  </div>
                )}
                
                {selectedStatement.reviewedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Reviewed At</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedStatement.reviewedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
              
              {selectedStatement.cloudinaryUrl && (
                <div className="mt-6">
                  <a
                    href={selectedStatement.cloudinaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Statement
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

{/* Add this CSS to your global styles or in a style tag */}
<style jsx>{`
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #a1a1a1;
  }
`}</style>