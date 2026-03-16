'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';

export function useStatementActions(onSuccess) {
  const [loading, setLoading] = useState({});
  const { emit } = useSocket();

  const approve = async (statementId, customerId) => {
    setLoading(prev => ({ ...prev, [`approve-${statementId}`]: true }));
    try {
      const res = await fetch('/api/statements/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statementId }),
      });
      if (!res.ok) throw new Error('Approval failed');
      emit('statement-status-changed', {
        statementId,
        customerId,
        status: 'APPROVED',
      });
      toast.success('Statement approved');
      onSuccess?.();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(prev => ({ ...prev, [`approve-${statementId}`]: false }));
    }
  };

  const reject = async (statementId, fileName, customerId) => {
    const reason = prompt(`Enter reason for rejecting "${fileName}":`);
    if (!reason) return;

    setLoading(prev => ({ ...prev, [`reject-${statementId}`]: true }));
    try {
      const res = await fetch('/api/statements/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statementId, reason }),
      });
      if (!res.ok) throw new Error('Rejection failed');

       emit('statement-status-changed', {                           
        statementId,
        customerId,
        status: 'REJECTED',
        rejectionReason: reason,
      });
      toast.success('Statement rejected');
      onSuccess?.();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(prev => ({ ...prev, [`reject-${statementId}`]: false }));
    }
  };

  const sendReminder = async (customerId, phone, email) => {
    setLoading(prev => ({ ...prev, [`remind-${customerId}`]: true }));
    try {
      const res = await fetch('/api/reminders/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, phone, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reminder');
      toast.success(`Reminder sent via ${data.channels.join(', ')}`);
      onSuccess?.();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(prev => ({ ...prev, [`remind-${customerId}`]: false }));
    }
  };

  return { approve, reject, sendReminder, loading };
}