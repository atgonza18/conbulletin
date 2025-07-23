'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserCircleIcon, ChevronDownIcon } from '@heroicons/react/24/solid';

interface HeaderProps {
  userName?: string;
}

export default function Header({ userName = 'User' }: HeaderProps) {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return; // Prevent double-clicking
    
    setIsSigningOut(true);
    setDropdownOpen(false); // Close dropdown immediately
    
    try {
      await signOut();
      // Clear any cached data
      if (typeof window !== 'undefined') {
        // Clear any local storage if needed
        localStorage.clear();
        sessionStorage.clear();
      }
      router.push('/auth/login');
      router.refresh(); // Force refresh to clear any cached state
    } catch (error) {
      console.error('Error during sign out:', error);
      // Still redirect even if there's an error
      router.push('/auth/login');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="fixed top-4 left-72 right-4 z-20">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Midpoint
            </h1>
          </div>
          
          <div className="flex items-center">
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                disabled={isSigningOut}
                className="flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors focus:outline-none disabled:opacity-50"
              >
                <div className="text-right">
                  <p className="font-medium text-gray-900">{userName}</p>
                  {profile && (
                    <p className="text-xs text-gray-500">
                      {profile.role} • {profile.scope}
                    </p>
                  )}
                </div>
                <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <UserCircleIcon className="h-5 w-5 text-gray-600" />
                </div>
                <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && !isSigningOut && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-3">
                    <div className="px-3 py-2 border-b border-gray-100 mb-2">
                      <p className="font-medium text-gray-900">{profile?.full_name}</p>
                      <p className="text-sm text-gray-600">{profile?.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {profile?.role}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {profile?.scope}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {isSigningOut && (
              <div className="flex items-center gap-2 ml-4">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600"></div>
                <span className="text-sm text-gray-600">Signing out...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay to close dropdown when clicking outside */}
      {dropdownOpen && !isSigningOut && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </header>
  );
}
