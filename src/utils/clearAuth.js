// Manual utility to clear authentication state
// Run this in browser console: import('./utils/clearAuth.js').then(m => m.clearAuth())

import { auth } from '../Firebase/firebase';

export const clearAuth = () => {
  console.log('🧹 Manually clearing authentication state...');

  // Sign out from Firebase Auth
  auth.signOut().then(() => {
    console.log('✅ Signed out from Firebase Auth');
  }).catch((error) => {
    console.log('ℹ️ No user to sign out:', error.message);
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
    console.log('🗑️ Removed from localStorage:', key);
  });

  // Clear sessionStorage as well
  const sessionFirebaseKeys = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.includes('firebase')) {
      sessionFirebaseKeys.push(key);
    }
  }

  sessionFirebaseKeys.forEach(key => {
    sessionStorage.removeItem(key);
    console.log('🗑️ Removed from sessionStorage:', key);
  });

  console.log('✅ Authentication state cleared manually');
  console.log('🔄 Please refresh the page to see the changes');
};

// Make it available globally for easy access
if (typeof window !== 'undefined') {
  window.clearAuth = clearAuth;
  console.log('💡 You can now use clearAuth() in the console to manually clear authentication');
}
