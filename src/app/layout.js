// app/layout.js
import { SocketProvider } from './context/SocketContext';
import './globals.css';

export const metadata = {
  title: 'Finovest Careers - Bank Statement Collection',
  description: 'Secure bank statement upload portal',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        {/* Navigation Bar */}
        <SocketProvider>
        <nav className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <span className="text-2xl font-bold text-blue-600">Finovest</span>
                <span className="ml-2 text-gray-600">Careers</span>
              </div>
              <div className="flex items-center space-x-4">
                <a href="/" className="text-gray-700 hover:text-blue-600 px-3 py-2">Home</a>
                <a href="/dashboard" className="text-gray-700 hover:text-blue-600 px-3 py-2">Dashboard</a>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="min-h-screen">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t mt-12">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <p className="text-center text-gray-500 text-sm">
              © 2024 Finovest Careers. All rights reserved.
            </p>
          </div>
        </footer>
        </SocketProvider>
      </body>
    </html>
  );
}