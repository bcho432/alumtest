'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Icon } from '@/components/ui/Icon';

export function Header() {
  const { user, signOut, isAdmin } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Training', href: '/training' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' }
  ];

  const userNavigation = [
    { name: 'Settings', href: '/settings' },
    { name: 'Sign out', href: '#' }
  ];

  return (
    <div className="bg-white shadow-lg sticky top-0 z-50">
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
              {navigation.map((item) => (
                <Link 
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-medium transition-all ${
                    isActive(item.href) 
                      ? 'text-indigo-600 border-b-2 border-indigo-600' 
                      : 'text-gray-500 hover:text-gray-900 hover:border-b-2 hover:border-gray-300'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="hidden md:flex md:items-center md:space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className={`btn-hover-effect inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 ${
                    isActive('/dashboard') ? 'bg-gray-50' : ''
                  }`}
                >
                  <Icon name="dashboard" className="mr-1.5 -ml-0.5" />
                  Dashboard
                </Link>
                
                <div className="relative">
                  <Link
                    href="/profile" 
                    className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                  >
                    <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user?.displayName?.[0] || user?.email?.[0] || '?'}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{user?.displayName || user?.email}</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 btn-hover-effect"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
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
              <Icon name={mobileMenuOpen ? 'close' : 'menu'} className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="space-y-1 px-2 pb-3 pt-2">
          {navigation.map((item) => (
            <Link 
              key={item.name}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-base font-medium ${
                isActive(item.href)
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
        {user && (
          <div className="border-t border-gray-200 pb-3 pt-4">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                {user.photoURL ? (
                  <img 
                    className="h-10 w-10 rounded-full"
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">
                  {user.displayName || 'User'}
                </div>
                <div className="text-sm font-medium text-gray-500">{user.email}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Link
                href="/dashboard"
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                Dashboard
              </Link>
              <Link
                href="/profile"
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                Your Profile
              </Link>
              <Link
                href="/settings"
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                Settings
              </Link>
              {isAdmin && (
                <Link
                  href="/profiles/new"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                >
                  New Profile
                </Link>
              )}
              <button
                onClick={() => signOut()}
                className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 