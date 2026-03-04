// app/providers/SocketProviderWrapper.js
'use client';

import { SocketProvider } from '../context/SocketContext';
import { useSession } from 'next-auth/react'; // If using NextAuth
import { useEffect, useState } from 'react';

export default function SocketProviderWrapper({ children }) {
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [customerId, setCustomerId] = useState(null);

  useEffect(() => {
    // Determine user role from session
    if (session?.user) {
      setIsAdmin(session.user.role === 'ADMIN');
      setCustomerId(session.user.role === 'CUSTOMER' ? session.user.id : null);
    }
  }, [session]);

  return (
    <SocketProvider isAdmin={isAdmin} customerId={customerId}>
      {children}
    </SocketProvider>
  );
}