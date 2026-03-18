'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function CreateCustomerForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    userId: '',
    name: '',
    phone: '',
    email: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/customers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create customer');
      
      toast.success('Customer created!');
      setFormData({ userId: '', name: '', phone: '', email: '' });
      onSuccess?.();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <h2 className="text-lg font-medium text-pink-600 mb-4">Create New Collection Request</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-purple-600 mb-1">
              Customer ID <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.userId}
              onChange={(e) => setFormData({...formData, userId: e.target.value})}
              className="w-full border border-pink-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
              placeholder="e.g.,  COIN001"
            />
          </div>
         <div>
                  <label className="block text-sm font-medium text-purple-600 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border border-pink-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
                    placeholder="e.g., John Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-600 mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    
                    value={formData.phone}
                    onChange={(e) =>{ 
                      const numericValue = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormData({...formData, phone: numericValue})}}
                    className="w-full border border-pink-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g.,  90 7123 4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-600 mb-1">
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase()})}
                    className="w-full border border-pink-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., john.smith@example.com"
                  />
                </div>
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
          >
            {submitting ? 'Creating...' : 'Create & Send Links'}
          </button>
        </div>
      </form>
    </div>
  );
}