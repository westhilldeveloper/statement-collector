import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './context/SocketContext';
import './globals.css';
import NavBarWrapper from './components/NavBarWrapper';

export const metadata = {
  title: 'Finovest Careers - Bank Statement Collection',
  description: 'Secure bank statement upload portal',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="bg-gray-50 h-full">
        <SocketProvider>
          <div className="flex flex-col min-h-full">
          <NavBarWrapper />
          <main className="flex-1">
            {children}
            <Toaster position="top-right" />
          </main>
          <footer className="bg-white border-t ">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <p className="text-center text-gray-500 text-sm">
                © 2024 Finovest Careers. All rights reserved.
              </p>
            </div>
          </footer>
          </div>
        </SocketProvider>
      </body>
    </html>
  );
}