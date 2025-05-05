'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Icon } from '@/components/ui/Icon';

export function Header() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="bg-white shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <div className="flex items-center">
                <Icon name="candle" className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">Memory Vista</span>
              </div>
            </Link>
            <nav className="ml-10 hidden space-x-8 md:flex">
              <Link 
                href="/"
                className={`px-3 py-2 text-sm font-medium ${
                  isActive('/') 
                    ? 'text-indigo-600 border-b-2 border-indigo-600' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Home
              </Link>
              <Link 
                href="/memorial"
                className={`px-3 py-2 text-sm font-medium ${
                  isActive('/memorial') 
                    ? 'text-indigo-600 border-b-2 border-indigo-600' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Memorials
              </Link>
              <Link 
                href="/university"
                className={`px-3 py-2 text-sm font-medium ${
                  isActive('/university') 
                    ? 'text-indigo-600 border-b-2 border-indigo-600' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Universities
              </Link>
              <Link 
                href="/about"
                className={`px-3 py-2 text-sm font-medium ${
                  isActive('/about') 
                    ? 'text-indigo-600 border-b-2 border-indigo-600' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                About
              </Link>
            </nav>
          </div>
          
          <div className="hidden md:flex md:items-center md:space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                {user.email && (
                  <span className="text-sm text-gray-600">{user.email}</span>
                )}
                {pathname.includes('/university') && (
                  <Link
                    href="/university/dashboard"
                    className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={() => signOut()}
                  className="inline-flex items-center rounded-md bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-100"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/university"
                  className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
          
          <div className="flex -mr-2 md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              href="/"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/') 
                  ? 'text-white bg-indigo-600' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Home
            </Link>
            <Link 
              href="/memorial"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/memorial') 
                  ? 'text-white bg-indigo-600' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Memorials
            </Link>
            <Link 
              href="/university"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/university') 
                  ? 'text-white bg-indigo-600' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Universities
            </Link>
            <Link 
              href="/about"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/about') 
                  ? 'text-white bg-indigo-600' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              About
            </Link>
          </div>
          
          <div className="pt-4 pb-3 border-t border-gray-200">
            {user ? (
              <div className="px-4 space-y-3">
                {user.email && (
                  <div className="text-sm text-gray-600">{user.email}</div>
                )}
                {pathname.includes('/university') && (
                  <Link
                    href="/university/dashboard"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={() => signOut()}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="px-4 space-y-3">
                <Link
                  href="/university"
                  className="block px-3 py-2 rounded-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
} 