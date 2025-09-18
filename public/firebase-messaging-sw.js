// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
// Replace 10.13.2 with latest version of the Firebase JS SDK.
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
    apiKey: "AIzaSyAJjAKpPitclofHTco0KbHa0wy-6OscsU0",
    authDomain: "locationtracker-5a2af.firebaseapp.com",
    projectId: "locationtracker-5a2af",
    storageBucket: "locationtracker-5a2af.firebasestorage.app",
    messagingSenderId: "571475505762",
    appId: "1:571475505762:web:42002608e0fd00f846973b",
    measurementId: "G-RTC302SGY7"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
    console.log(
      '[firebase-messaging-sw.js] Received background message ',
      payload
    );
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: payload.notification.icon || '/elderlyze-logo.png',
      badge: payload.notification.badge || '/elderlyze-logo.png',
    }; 
  
    self.registration.showNotification(notificationTitle, notificationOptions);
  });