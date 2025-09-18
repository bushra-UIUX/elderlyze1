import React, { useState, useEffect } from 'react';
import { auth, db } from '../Firebase/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { getApiUrl, SERVER_CONFIG } from '../config/server';
import '../Assets/Css/FloatingSOS.css';

function FloatingSOS() {
  const [user, setUser] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);

  // Handle authentication state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        loadContacts(user);
      } else {
        setContacts([]);
      }
    });
    return () => unsub();
  }, []);

  // Load contacts from Firebase
  const loadContacts = async (currentUser) => {
    if (!currentUser) return;

    try {
      setContactsLoading(true);
      const contactsRef = collection(db, `users/${currentUser.uid}/sosContacts`);
      const q = query(contactsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const loadedContacts = [];
      querySnapshot.forEach((doc) => {
        loadedContacts.push({ id: doc.id, ...doc.data() });
      });

      setContacts(loadedContacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
      setContacts([]);
    } finally {
      setContactsLoading(false);
    }
  };

  // Don't render if user is not logged in
  if (!user) return null;

  // SOS Emergency function
  const triggerSOS = async () => {
    if (!user) {
      setResult({
        success: false,
        message: 'Please sign in to use SOS feature'
      });
      return;
    }

    if (contacts.length === 0) {
      setResult({
        success: false,
        message: 'No emergency contacts found. Please add emergency contacts in SOS Settings first.',
        isContactError: true
      });
      return;
    }

    try {
      setIsLoading(true);
      setResult(null);
      console.log('Starting SOS trigger process...');

      // Get current location with enhanced accuracy
      let location = 'Location unavailable';
      let locationDetails = {};

      try {
        console.log('Requesting high-accuracy location...');

        // First, check if geolocation is supported
        if (!navigator.geolocation) {
          throw new Error('Geolocation is not supported by this browser');
        }

        // Request location with high accuracy settings
        const position = await new Promise((resolve, reject) => {
          const options = {
            enableHighAccuracy: true,    // Use GPS if available
            timeout: 15000,              // Increased timeout for better accuracy
            maximumAge: 0                // Don't use cached location
          };

          navigator.geolocation.getCurrentPosition(
            (pos) => {
              console.log('Location success:', {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                timestamp: new Date(pos.timestamp).toISOString()
              });
              resolve(pos);
            },
            (error) => {
              console.error('Geolocation error:', {
                code: error.code,
                message: error.message
              });
              reject(error);
            },
            options
          );
        });

        // Format location with high precision
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        location = `${lat}, ${lng}`;

        // Store additional location details
        locationDetails = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: new Date(position.timestamp).toISOString()
        };

        console.log('High-precision location obtained:', {
          coordinates: location,
          accuracy: `${position.coords.accuracy}m`,
          details: locationDetails
        });

      } catch (geoError) {
        console.error('Failed to get location:', geoError);

        // Provide specific error messages based on error type
        let errorMessage = 'Location access denied or unavailable';
        if (geoError.code === 1) {
          errorMessage = 'Location access denied by user';
        } else if (geoError.code === 2) {
          errorMessage = 'Location unavailable (network/GPS error)';
        } else if (geoError.code === 3) {
          errorMessage = 'Location request timed out';
        }

        location = errorMessage;
        console.warn('Location error details:', {
          code: geoError.code,
          message: geoError.message,
          fallback: location
        });
      }

      // Get Firebase ID token for authentication
      const idToken = await auth.currentUser.getIdToken();
      console.log('Firebase ID token obtained');

      // Prepare request data with enhanced location information
      const requestData = {
        location: location,
        locationDetails: locationDetails,
        reason: 'Manual SOS trigger (Floating Button)',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };

      const apiUrl = getApiUrl(SERVER_CONFIG.ENDPOINTS.SOS_TRIGGER);
      console.log('Calling API:', apiUrl);
      console.log('Request data:', requestData);

      // Call backend server to send SOS alerts via Email
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(requestData)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const responseResult = await response.json();
      console.log('Response data:', responseResult);

      if (responseResult.success) {
        setResult({
          success: true,
          message: 'SOS Alert sent successfully!',
          contactsNotified: responseResult.contactsNotified,
          totalContacts: responseResult.totalContacts,
          results: responseResult.results
        });
      } else {
        setResult({
          success: false,
          message: `Failed to trigger SOS: ${responseResult.message || 'Unknown error'}`
        });
      }

    } catch (error) {
      console.error('Error triggering SOS:', error);
      setResult({
        success: false,
        message: `Failed to trigger SOS: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setResult(null);
  };

  return (
    <>
      {/* Floating SOS Button */}
      <button
        className="floating-sos-btn"
        onClick={() => setShowPopup(true)}
        aria-label="Emergency SOS"
        title="Emergency SOS"
      >
        🚨
      </button>

      {/* SOS Popup */}
      {showPopup && (
        <div className="sos-popup-overlay" onClick={closePopup}>
          <div className="sos-popup" onClick={(e) => e.stopPropagation()}>
            <div className="sos-popup-header">
              <h2>🚨 Emergency SOS</h2>
              <button
                className="close-btn"
                onClick={closePopup}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="sos-popup-content">
              {!result ? (
                <>
                  {contactsLoading ? (
                    <div className="loading-contacts">
                      <span className="loading-spinner"></span>
                      <p>Loading emergency contacts...</p>
                    </div>
                  ) : contacts.length === 0 ? (
                    <div className="no-contacts-message">
                      <div className="warning-icon">⚠️</div>
                      <h3>No Emergency Contacts</h3>
                      <p>You need to add emergency contacts before using the SOS feature.</p>
                      <div className="sos-popup-actions">
                        <button
                          className="btn-setup-contacts"
                          onClick={() => {
                            closePopup();
                            window.location.href = '/app/sos';
                          }}
                        >
                          📞 Setup Emergency Contacts
                        </button>
                        <button
                          className="btn-cancel"
                          onClick={closePopup}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="sos-warning">
                        This will immediately send emergency alerts to <strong>{contacts.length} emergency contact{contacts.length !== 1 ? 's' : ''}</strong> with your current location.
                      </p>

                      <div className="contacts-preview">
                        <h4>Contacts to be notified:</h4>
                        <ul>
                          {contacts.slice(0, 3).map(contact => (
                            <li key={contact.id}>
                              {contact.name} ({contact.email})
                            </li>
                          ))}
                          {contacts.length > 3 && (
                            <li>... and {contacts.length - 3} more</li>
                          )}
                        </ul>
                      </div>

                      <div className="sos-popup-actions">
                        <button
                          className="btn-emergency-popup"
                          onClick={triggerSOS}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <span className="loading-spinner"></span>
                              Sending Alert...
                            </>
                          ) : (
                            '🚨 SEND SOS ALERT'
                          )}
                        </button>

                        <button
                          className="btn-cancel"
                          onClick={closePopup}
                          disabled={isLoading}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="sos-result">
                  <div className={`result-message ${result.success ? 'success' : 'error'}`}>
                    <div className="result-icon">
                      {result.success ? '✅' : '❌'}
                    </div>
                    <div className="result-text">
                      <strong>{result.message}</strong>
                      {result.success && result.contactsNotified !== undefined && (
                        <p>
                          {result.contactsNotified}/{result.totalContacts} contacts notified successfully
                        </p>
                      )}
                    </div>
                  </div>

                  {result.success && result.results && result.results.length > 0 && (
                    <div className="email-results">
                      <h4>Email Results:</h4>
                      {result.results.map((emailResult, index) => (
                        <div key={index} className={`email-result ${emailResult.success ? 'success' : 'error'}`}>
                          {emailResult.success ? '✅' : '❌'} {emailResult.contact} ({emailResult.email})
                          {!emailResult.success && emailResult.error && (
                            <div className="error-detail">Error: {emailResult.error}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {result.isContactError ? (
                    <div className="contact-error-actions">
                      <button
                        className="btn-setup-contacts"
                        onClick={() => {
                          closePopup();
                          window.location.href = '/app/sos';
                        }}
                      >
                        📞 Setup Emergency Contacts
                      </button>
                      <button
                        className="btn-close"
                        onClick={closePopup}
                      >
                        Close
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn-close"
                      onClick={closePopup}
                    >
                      Close
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default FloatingSOS;