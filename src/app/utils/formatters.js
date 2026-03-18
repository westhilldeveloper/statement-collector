// src/app/utils/formatters.js

export function getStatusBadge(status) {
  const badges = {
    APPROVED: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    REJECTED: 'bg-rose-100 text-rose-800 border border-rose-200',
    UPLOADED: 'bg-amber-100 text-amber-800 border border-amber-200',
    PENDING: 'bg-gray-100 text-gray-800 border border-gray-200',
  };
  return badges[status] || 'bg-gray-100 text-gray-800 border border-gray-200';
}

export function getStatusDisplay(status) {
  const displayMap = {
    UPLOADED: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    PENDING: 'Pending',
  };
  return displayMap[status] || status;
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getCustomerStatusBadge(status) {
  const badges = {
    PENDING: 'bg-amber-100 text-amber-800 border border-amber-200',
    APPROVED: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    REJECTED: 'bg-rose-100 text-rose-800 border border-rose-200',
    EXPIRED: 'bg-gray-100 text-gray-800 border border-gray-200',
  };
  return badges[status] || 'bg-gray-100 text-gray-800 border border-gray-200';
}

export function getCustomerStatusDisplay(status) {
  const displayMap = {
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    EXPIRED: 'Expired',
  };
  return displayMap[status] || status;
}

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}