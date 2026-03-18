'use client';

import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function NavBar() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        toast.success('Logged out');
        router.push('/login');
      }
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <nav className="sticky top-0 z-10 bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
             <Image
              src="/images/lg_finovest.png"
              alt="Finovest Logo"
              width={100}        // Adjust as needed
              height={100}       // Adjust as needed
              className="object-contain"
            />
            {/* <span className="text-2xl font-bold text-pink-600">Finovest</span> */}
            
            {/* <span className="ml-2 text-purple-900">Chits & Kuries</span> */}
          </div>
          <div className="flex items-center space-x-4">
            <a href="/" className="text-pink-700 font-bold hover:text-purple-600 px-3 py-2">
              Home
            </a>
            <a href="/dashboard" className="text-pink-700 font-bold hover:text-purple-600 px-3 py-2">
              Dashboard
            </a>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-pink-600 text-white hover:bg-purple-600 ml-2"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}