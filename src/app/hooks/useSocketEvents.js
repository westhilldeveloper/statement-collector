'use client';

import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

export function useCustomerUpdates(onUpdate) {
  const { on, off } = useSocket();

  useEffect(() => {
    if (!on || !off) return;
    on('new-statement-upload', onUpdate);
    on('statement-status-update', onUpdate);
    return () => {
      off('new-statement-upload', onUpdate);
      off('statement-status-update', onUpdate);
    };
  }, [on, off, onUpdate]); 
}