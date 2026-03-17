'use client';

import { usePathname } from 'next/navigation';
import NavBar from './NavBar';

export default function NavBarWrapper() {
  const pathname = usePathname();

  // Define routes where NavBar should be hidden
  const hideNavBarRoutes = [
    '/collect',           // base collect path
    '/collect/success',   // success page
  ];

  // Check if the current pathname starts with any of the hide routes
  const shouldHide = hideNavBarRoutes.some(route => 
    pathname?.startsWith(route)
  );

  if (shouldHide) return null;

  return <NavBar />;
}