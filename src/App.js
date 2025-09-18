import './styles/app.css';
import Navbar from './components/Navbar';
import FloatingSOS from './components/FloatingSOS';
import Home from './pages/Home';
import Tutorial from './pages/Tutorial';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Main from './pages/Main';
import SOSInteraction from './pages/SOSInteraction';
import Moods from './pages/Moods';
import Chatbot from './pages/Chatbot';
import Medicines from './pages/Medicines';
import PhysicalActivities from './pages/PhysicalActivities';
import Profile from './components/Profile';
import Footer from './components/Footer';
import {Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged } from "firebase/auth";
import { auth} from "./Firebase/firebase";
import { getApiUrl, SERVER_CONFIG } from './config/server';
import './utils/devAuth'; // Clear auth state in development
import './utils/clearAuth'; // Manual auth clearing utility
import ForgotPassword from "./pages/ForgotPassword";




// Function to send activity update to server
const sendActivityUpdate = async (userId, type = 'general', details = {}) => {
  try {
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) {
      console.warn('No Firebase ID token available for activity update');
      return;
    }

    const apiUrl = getApiUrl(SERVER_CONFIG.ENDPOINTS.ACTIVITY_UPDATE);
    console.log('📡 Sending activity update:', { type, details, apiUrl });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        type,
        details: {
          ...details,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('Activity update failed:', response.status, errorText);
    } else {
      console.log('✅ Activity update sent successfully');
    }
  } catch (error) {
    console.warn('Failed to send activity update:', error);
  }
};

function App() {

  const location = useLocation();
  const hideChrome = location.pathname.startsWith('/app/chat');
  
  // Define which pages should show the footer
  const showFooter = ['/', '/signin', '/signup'].includes(location.pathname);
  
  // Activity tracking
  const [currentUser, setCurrentUser] = useState(null);
  
  // Track user activity
  const trackActivity = useCallback((type = 'general', details = {}) => {
    if (currentUser) {
      sendActivityUpdate(currentUser.uid, type, details);
    }
  }, [currentUser]);

  // Set up activity tracking
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Send initial activity update when user signs in
        sendActivityUpdate(user.uid, 'login', { 
          method: 'firebase_auth',
          timestamp: new Date().toISOString()
        });
      }
    });

    return () => unsub();
  }, []);

  // Track page navigation
  useEffect(() => {
    if (currentUser && location.pathname.startsWith('/app')) {
      trackActivity('page_navigation', { 
        path: location.pathname,
        timestamp: new Date().toISOString()
      });
    }
  }, [location.pathname, currentUser, trackActivity]);

  // Track user interactions
  useEffect(() => {
    if (!currentUser) return;

    const trackUserInteraction = () => {
      trackActivity('user_interaction', {
        type: 'activity',
        timestamp: new Date().toISOString()
      });
    };

    // Track various user interactions
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, trackUserInteraction, { passive: true });
    });

    // Track form submissions
    const trackFormSubmission = (e) => {
      if (e.target.tagName === 'FORM') {
        trackActivity('form_submission', {
          formAction: e.target.action || 'unknown',
          timestamp: new Date().toISOString()
        });
      }
    };
    document.addEventListener('submit', trackFormSubmission);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackUserInteraction);
      });
      document.removeEventListener('submit', trackFormSubmission);
    };
  }, [currentUser, trackActivity]);

  useEffect(() => {
    if (location.pathname === '/') {
      if (location.hash) {
        const id = location.hash.slice(1);
        const target = document.getElementById(id) || document.querySelector(id ? `.${id}` : '');
        if (target && typeof target.scrollIntoView === 'function') {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname, location.hash]);

  function RequireAuth({ children }) {
    const [checking, setChecking] = useState(true);
    const [user, setUser] = useState(null);
    useEffect(() => {
      const unsub = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setChecking(false);
      });
      return () => unsub();
    }, []);
    if (checking) return null; // could render a loader
    if (!user) return <Navigate to="/signin" replace />;
    return children;
  }

  return (
      <div className="App">
        {!hideChrome && <Navbar />}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tutorial" element={<Tutorial />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/app" element={<RequireAuth><Main /></RequireAuth>} />
          <Route path="/app/sos" element={<RequireAuth><SOSInteraction /></RequireAuth>} />
          <Route path="/app/mood" element={<RequireAuth><Moods /></RequireAuth>} />
          <Route path="/app/chat" element={<RequireAuth><Chatbot /></RequireAuth>} />
          <Route path="/app/medicines" element={<RequireAuth><Medicines /></RequireAuth>} />
          <Route path="/app/physical-activities" element={<RequireAuth><PhysicalActivities /></RequireAuth>} />
          <Route path="/app/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        
        <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
        {showFooter && <Footer />}
        <FloatingSOS />
      </div>
  );
}

export default App;
