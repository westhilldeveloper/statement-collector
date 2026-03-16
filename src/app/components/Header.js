'use client';

import { usePathname } from 'next/navigation';
import NavBar from './NavBar';

export default function Header() {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');
  if (isAdminPage) return null; // Don't show regular navbar on admin pages
  return <NavBar />;
}