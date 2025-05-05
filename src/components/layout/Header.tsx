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
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 group">
              <div className="flex items-center">
                <Icon name="candle" className="h-8 w-8 text-indigo-600 transition-transform duration-300 group-hover:scale-110" />
                <span className="ml-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Memory Vista</span>
              </div>
            </Link>
            <nav className="ml-10 hidden space-x-8 md:flex">
              <Link 
                href="/"
                className={`px-3 py-2 text-sm font-medium transition-all ${
                  isActive('/') 
                    ? 'text-indigo-600 border-b-2 border-indigo-600' 
                    : 'text-gray-500 hover:text-gray-900 hover:border-b-2 hover:border-gray-300'
                }`}
              >
                Home
              </Link>
              <Link 
                href="/profiles"
                className={`px-3 py-2 text-sm font-medium transition-all ${
                  isActive('/profiles') 
                    ? 'text-indigo-600 border-b-2 border-indigo-600' 
                    : 'text-gray-500 hover:text-gray-900 hover:border-b-2 hover:border-gray-300'
                }`}
              >
                Memorials
              </Link>
              <Link 
                href="/organizations"
                className={`px-3 py-2 text-sm font-medium transition-all ${
                  isActive('/organizations') 
                    ? 'text-indigo-600 border-b-2 border-indigo-600' 
                    : 'text-gray-500 hover:text-gray-900 hover:border-b-2 hover:border-gray-300'
                }`}
              >
                Organizations
              </Link>
              <Link 
                href="/about"
                className={`px-3 py-2 text-sm font-medium transition-all ${
                  isActive('/about') 
                    ? 'text-indigo-600 border-b-2 border-indigo-600' 
                    : 'text-gray-500 hover:text-gray-900 hover:border-b-2 hover:border-gray-300'
                }`}
              >
                About
              </Link>
            </nav>
          </div>
          
          <div className="hidden md:flex md:items-center md:space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="relative group">
                  <button className="inline-flex items-center rounded-full bg-gray-100 p-1 text-gray-700 hover:bg-gray-200 focus:outline-none">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || 'User'} 
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
                        {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </div>
                    )}
                  </button>
                  <div className="absolute right-0 w-48 mt-2 origin-top-right bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                    <div className="py-1">
                      <Link 
                        href="/profile" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Your Profile
                      </Link>
                      <Link 
                        href="/settings" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Settings
                      </Link>
                      <button
                        onClick={() => signOut()}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
                
                {pathname.startsWith('/[org]') && (
                  <Link
                    href={`/${pathname.split('/')[1]}/dashboard`}
                    className="btn-hover-effect inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    <Icon name="dashboard" className="mr-1.5 -ml-0.5" />
                    Dashboard
                  </Link>
                )}
                
                <Link
                  href="/new-memorial"
                  className="btn-hover-effect inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  <Icon name="plus" className="mr-1.5 -ml-0.5" />
                  New Memorial
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 btn-hover-effect"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 btn-hover-effect"
                >
                  Sign up
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
                className={`${mobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
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
              <svg
                className={`${mobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link 
            href="/"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/') 
                ? 'text-indigo-600 bg-indigo-50' 
                : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
            }`}
          >
            Home
          </Link>
          <Link 
            href="/profiles"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/profiles') 
                ? 'text-indigo-600 bg-indigo-50' 
                : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
            }`}
          >
            Memorials
          </Link>
          <Link 
            href="/organizations"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/organizations') 
                ? 'text-indigo-600 bg-indigo-50' 
                : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
            }`}
          >
            Organizations
          </Link>
          <Link 
            href="/about"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/about') 
                ? 'text-indigo-600 bg-indigo-50' 
                : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
            }`}
          >
            About
          </Link>
        </div>
        
        <div className="pt-4 pb-3 border-t border-gray-200">
          {user ? (
            <div className="px-2 space-y-3">
              <div className="flex items-center px-3">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">
                    {user.displayName || 'User'}
                  </div>
                  <div className="text-sm font-medium text-gray-500">
                    {user.email}
                  </div>
                </div>
              </div>
              <Link
                href="/profile"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
              >
                Your Profile
              </Link>
              <Link
                href="/settings"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
              >
                Settings
              </Link>
              <Link
                href="/new-memorial"
                className="block px-3 py-2 rounded-md text-base font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
              >
                New Memorial
              </Link>
              <button
                onClick={() => signOut()}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="px-2 space-y-3">
              <Link
                href="/login"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="block px-3 py-2 rounded-md text-base font-medium bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 