// Development utility to clear authentication state
// This helps during development by ensuring users start logged out

import { auth } from '../Firebase/firebase';

const DEV_AUTH_CLEARED_KEY = 'dev_auth_cleared';

export const clearAuthInDevelopment = () => {
  // Only run in development mode
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  // Check if we've already cleared auth in this session
  if (sessionStorage.getItem(DEV_AUTH_CLEARED_KEY)) {
    return;
  }

  // Mark that we've cleared auth in this session
  sessionStorage.setItem(DEV_AUTH_CLEARED_KEY, 'true');

  console.log('🔧 Development mode: Clearing authentication state on first load...');

  // Sign out from Firebase Auth
  auth.signOut().catch((error) => {
    console.log('No user to sign out:', error.message);
  });

  // Clear all Firebase Auth related localStorage items
  const firebaseKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.startsWith('firebase:authUser:') ||
      key.startsWith('firebase:host:') ||
      key.includes('firebase')
    )) {
      firebaseKeys.push(key);
    }
  }

  firebaseKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log('🗑️ Removed:', key);
  });

  // Clear sessionStorage as well (but keep our flag)
  const sessionFirebaseKeys = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.includes('firebase') && key !== DEV_AUTH_CLEARED_KEY) {
      sessionFirebaseKeys.push(key);
    }
  }

  sessionFirebaseKeys.forEach(key => {
    sessionStorage.removeItem(key);
    console.log('🗑️ Removed from session:', key);
  });

  console.log('✅ Authentication state cleared for development');
};

// Auto-clear on import in development (only on first load)
if (process.env.NODE_ENV === 'development') {
  // Add a small delay to ensure Firebase is initialized
  setTimeout(() => {
    clearAuthInDevelopment();
    
    // Add a visual indicator in the console
    console.log('%c🔧 DEVELOPMENT MODE ACTIVE', 'color: #34caa1; font-size: 16px; font-weight: bold;');
    console.log('%cAuthentication state is cleared only on first page load', 'color: #666; font-size: 12px;');
    console.log('%cNavigation between pages will preserve login state', 'color: #666; font-size: 12px;');
    console.log('%cTo manually clear auth, run: clearAuth()', 'color: #666; font-size: 12px;');
  }, 100);
}
