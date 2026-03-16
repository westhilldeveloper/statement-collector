'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/app/utils/formatters';
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
      if(statementForm.status === "APPROVED"){
        approve(statementId,customer.id)
      }
      else if (statementForm.status === "REJECTED"){
        reject(statementId,statementForm.rejectionReason, customer.id)
      }
      else{
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

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!customer) return <div>Customer not found</div>;

  const statusOptions = ['APPROVED', 'REJECTED'];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Customer Details</h1>
      <div className="bg-white rounded-lg shadow p-6">
        {!editing ? (
          <div className="space-y-4">
            <p><strong>User ID:</strong> {customer.userId}</p>
            <p><strong>Name:</strong> {customer.name}</p>
            <p><strong>Email:</strong> {customer.email}</p>
            <p><strong>Phone:</strong> {customer.phone}</p>
            <p><strong>Status:</strong> {customer.status}</p>
            <p><strong>Created:</strong> {formatDate(customer.createdAt)}</p>
            <button onClick={() => setEditing(true)} className="px-4 py-2 bg-blue-600 text-white rounded">
              Edit
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="text"
              value={formData.userId}
              onChange={(e) => setFormData({...formData, userId: e.target.value})}
              className="border rounded px-3 py-2 w-full"
              placeholder="User ID"
            />
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="border rounded px-3 py-2 w-full"
              placeholder="Name"
            />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="border rounded px-3 py-2 w-full"
              placeholder="Email"
            />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="border rounded px-3 py-2 w-full"
              placeholder="Phone"
            />
            <div className="flex space-x-2">
              <button onClick={handleUpdate} className="px-4 py-2 bg-green-600 text-white rounded">
                Save
              </button>
              <button onClick={() => setEditing(false)} className="px-4 py-2 bg-gray-300 rounded">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Statements Section */}
      <h2 className="text-xl font-bold mt-8 mb-4">Statements</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">File Name</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Uploaded</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customer.statements?.map(s => (
              <tr key={s.id}>
                <td className="px-6 py-4">{s.fileName}</td>
                <td className="px-6 py-4">
                  {editingStatement === s.id ? (
                    <select
                      value={statementForm.status}
                      onChange={(e) => setStatementForm({...statementForm, status: e.target.value})}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      {statusOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    s.status
                  )}
                </td>
                <td className="px-6 py-4">{formatDate(s.uploadedAt)}</td>
                <td className="px-6 py-4">
                  {editingStatement === s.id ? (
                    <>
                      <button
                        onClick={() => handleStatementUpdate(s.id)}
                        disabled={actionLoading[`approve-${s.id}`] || actionLoading[`reject-${s.id}`]}
                        className="text-green-600 hover:text-green-800 mr-2"
                      >
                        {actionLoading[`approve-${s.id}`] || actionLoading[`reject-${s.id}`] ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelStatementEdit}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleStatementEdit(s)}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                      >
                        Edit
                      </button>
                      <a href={s.cloudinaryUrl} target="_blank" className="text-blue-600 mr-2">View</a>
                      <button
                        onClick={() => handleStatementDelete(s.id)}
                        disabled={statementDeleting[s.id]}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        {statementDeleting[s.id] ? 'Deleting...' : 'Delete'}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {(!customer.statements || customer.statements.length === 0) && (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  No statements uploaded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}