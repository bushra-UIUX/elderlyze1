// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAJjAKpPitclofHTco0KbHa0wy-6OscsU0",
  authDomain: "locationtracker-5a2af.firebaseapp.com",
  projectId: "locationtracker-5a2af",
  storageBucket: "locationtracker-5a2af.firebasestorage.app",
  messagingSenderId: "571475505762",
  appId: "1:571475505762:web:42002608e0fd00f846973b",
  measurementId: "G-RTC302SGY7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Analytics only in browser environments
let analytics;
try {
  analytics = getAnalytics(app);
} catch (_) {
  // no-op when analytics isn't available (e.g., in non-browser contexts)
}

// Initialize and export Auth and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = getMessaging(app);


export const generateMessagingToken = async () => {
  try {
    if (!('serviceWorker' in navigator)) {
      return null;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return null;
    }
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const token = await getToken(messaging, {
      vapidKey: "BCUDBMCrCTTB6iR2pm4HB3F5cL3v2dimnN1pAV1E_Tf6J5qATXxqSz84vZorHjDGGLKkT0YmlECh4Zhygc5f9C4",
      serviceWorkerRegistration: registration,
    });
    console.log('FCM token:', token);
    // Persist token under the authenticated user for server-side targeting
    const user = auth.currentUser;
    if (user && token) {
      const tokenRef = doc(db, `users/${user.uid}/fcmTokens/${token}`);
      await setDoc(tokenRef, {
        token,
        platform: 'web',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
    return token;
  } catch (error) {
    console.error('Failed to generate FCM token', error);
    return null;
  }
};
export default app;