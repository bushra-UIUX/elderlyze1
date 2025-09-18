import React, { useMemo, useState, useEffect } from 'react';
import { auth, db } from '../Firebase/firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, getDoc, addDoc, updateDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { getApiUrl, SERVER_CONFIG } from '../config/server';
import '../Assets/Css/SOS.css';

function emptyContact() {
  return { id: '', name: '', relation: '', email: '', priority: 'primary' };
}

function SOSInteraction() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState(emptyContact());
  const [autoSos, setAutoSos] = useState(true);
  const [hours, setHours] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);

  const isEditing = useMemo(() => {
    // Check if we're editing an existing contact (not a temporary one)
    return form.id && form.id !== '' && !form.id.startsWith('temp_') && contacts.some(c => c.id === form.id);
  }, [contacts, form.id]);

  // Handle authentication state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Load contacts from Firebase when user changes
  useEffect(() => {
    if (user) {
      loadContacts();
      loadSettings();
      loadSosAlerts();
    } else {
      setContacts([]);
      setSosAlerts([]);
    }
  }, [user]);

  // Load contacts from Firebase
  const loadContacts = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const contactsRef = collection(db, `users/${user.uid}/sosContacts`);
      const q = query(contactsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const loadedContacts = [];
      querySnapshot.forEach((doc) => {
        loadedContacts.push({ id: doc.id, ...doc.data() });
      });
      
      setContacts(loadedContacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
      alert('Failed to load contacts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load user settings from Firebase
  const loadSettings = async () => {
    if (!user) return;
    
    try {
      console.log('Loading SOS settings for user:', user.uid);
      
      // Load from the main user document
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const sosSettings = userData.sosSettings;
        
        if (sosSettings) {
          console.log('Found SOS settings:', sosSettings);
          setAutoSos(sosSettings.autoSos ?? true);
          setHours(sosSettings.hours ?? 3);
        } else {
          console.log('No SOS settings found, using defaults');
          setAutoSos(true);
          setHours(3);
        }
      } else {
        console.log('User document does not exist, using defaults');
        setAutoSos(true);
        setHours(3);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Don't show alert for settings loading failure, just use defaults
      setAutoSos(true);
      setHours(3);
    }
  };

  // Load SOS alerts from Firebase
  const loadSosAlerts = async () => {
    if (!user) return;
    
    try {
      const alertsRef = collection(db, `users/${user.uid}/sosAlerts`);
      const q = query(alertsRef, orderBy('triggeredAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const loadedAlerts = [];
      querySnapshot.forEach((doc) => {
        loadedAlerts.push({ id: doc.id, ...doc.data() });
      });
      
      setSosAlerts(loadedAlerts);
    } catch (error) {
      console.error('Error loading SOS alerts:', error);
    }
  };

  // Save settings to Firebase
  const saveSettings = async (newAutoSos, newHours) => {
    if (!user) return;
    
    try {
      console.log('Saving SOS settings:', { autoSos: newAutoSos, hours: newHours });
      
      // Save to the main user document
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        sosSettings: {
          autoSos: newAutoSos,
          hours: newHours,
          updatedAt: serverTimestamp()
        }
      });
      
      console.log('SOS settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      
      // If updateDoc fails (document doesn't exist), try setDoc
      try {
        console.log('Trying setDoc as fallback...');
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          sosSettings: {
            autoSos: newAutoSos,
            hours: newHours,
            updatedAt: serverTimestamp()
          },
          userId: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          createdAt: serverTimestamp()
        }, { merge: true });
        
        console.log('SOS settings saved with setDoc');
      } catch (setDocError) {
        console.error('Error with setDoc fallback:', setDocError);
        alert('Failed to save settings. Please try again.');
      }
    }
  };

  // Handle auto SOS toggle
  const handleAutoSosToggle = async (checked) => {
    setAutoSos(checked);
    setIsLoading(true);
    try {
      await saveSettings(checked, hours);
      console.log('Auto SOS setting updated successfully');
    } catch (error) {
      console.error('Failed to update Auto SOS setting:', error);
      // Revert the state if save failed
      setAutoSos(!checked);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle hours change
  const handleHoursChange = async (newHours) => {
    setHours(newHours);
    setIsLoading(true);
    try {
      await saveSettings(autoSos, newHours);
      console.log('Inactivity hours updated successfully');
    } catch (error) {
      console.error('Failed to update inactivity hours:', error);
      // Revert the state if save failed
      setHours(hours);
    } finally {
      setIsLoading(false);
    }
  };

  // Save contact to Firebase
  const saveContactToFirebase = async (contactData) => {
    if (!user) return null;
    
    console.log('Saving contact:', contactData); // Debug log
    
    try {
      const contactsRef = collection(db, `users/${user.uid}/sosContacts`);
      
      if (contactData.id && contactData.id !== '' && !contactData.id.startsWith('temp_')) {
        // Update existing contact
        const contactRef = doc(contactsRef, contactData.id);
        const contactToUpdate = {
          ...contactData,
          updatedAt: serverTimestamp(),
          userId: user.uid
        };
        
        await updateDoc(contactRef, contactToUpdate);
        return contactData.id;
      } else {
        // Add new contact
        const contactToAdd = {
          ...contactData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          userId: user.uid
        };
        
        // Remove the temporary id since addDoc will generate a real one
        delete contactToAdd.id;
        
        const docRef = await addDoc(contactsRef, contactToAdd);
        return docRef.id;
      }
    } catch (error) {
      console.error('Error saving contact:', error);
      throw new Error('Failed to save contact');
    }
  };

  // Delete contact from Firebase
  const deleteContactFromFirebase = async (contactId) => {
    if (!user) return;
    
    try {
      const contactRef = doc(db, `users/${user.uid}/sosContacts/${contactId}`);
      await deleteDoc(contactRef);
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw new Error('Failed to delete contact');
    }
  };

  function startAdd() {
    setForm({ ...emptyContact(), id: `temp_${Date.now()}` });
  }

  function edit(id) {
    const c = contacts.find(x => x.id === id);
    if (c) setForm(c);
  }

  async function remove(id) {
    try {
      await deleteContactFromFirebase(id);
      setContacts(prev => prev.filter(x => x.id !== id));
      if (form.id === id) setForm(emptyContact());
    } catch (error) {
      alert(error.message);
    }
  }

  async function submit(e) {
    e.preventDefault();
    const payload = { ...form, name: form.name.trim(), relation: form.relation.trim(), email: form.email.trim() };
    if (!payload.name || !payload.email) return;
    
    console.log('Submitting form with payload:', payload); // Debug log
    console.log('isEditing:', isEditing); // Debug log
    
    try {
      setIsLoading(true);
      const savedId = await saveContactToFirebase(payload);
      
      if (savedId) {
        // Update the payload with the correct ID
        const updatedPayload = { ...payload, id: savedId };
        
        setContacts(prev => {
          if (isEditing) {
            // Update existing contact - find by the original ID from the form
            const originalId = form.id;
            return prev.map(x => (x.id === originalId ? updatedPayload : x));
          } else {
            // Add new contact
            return [updatedPayload, ...prev];
          }
        });
        setForm(emptyContact());
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  // Test Gmail connection function
  const testGmailConnection = async () => {
    if (!user) return;
    
    try {
      setTestResult(null);
      setTestLoading(true);
      console.log('Testing Gmail connection...');
      
      const idToken = await auth.currentUser.getIdToken();
      const apiUrl = getApiUrl('/test/gmail');
      
      console.log('Testing Gmail connection at:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      const result = await response.json();
      setTestResult(result);
      
      if (result.success) {
        console.log('Gmail connection successful:', result.account);
      } else {
        console.error('Gmail connection failed:', result.error);
      }
      
    } catch (error) {
      console.error('Gmail connection test error:', error);
      setTestResult({
        success: false,
        message: 'Failed to test Gmail connection',
        error: error.message
      });
    } finally {
      setTestLoading(false);
    }
  };

  // Test email function
  const testEmailSend = async () => {
    if (!user || !testEmail) return;
    
    try {
      setTestResult(null);
      setTestLoading(true);
      console.log('Testing email to:', testEmail);
      
      const idToken = await auth.currentUser.getIdToken();
      const apiUrl = getApiUrl('/test/email');
      
      console.log('Testing email at:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          email: testEmail,
          message: 'TEST EMAIL - Elderlyze Emergency System\n\nLocation: Test Coordinates (40.7128, -74.0060)\nTime: ' + new Date().toLocaleString() + '\n\nThis is a test email. Your Gmail setup is working!'
        })
      });
      
      const result = await response.json();
      setTestResult(result);
      
      if (result.success) {
        console.log('Test email sent successfully');
      } else {
        console.error('Test email failed:', result.error);
      }
      
    } catch (error) {
      console.error('Test email error:', error);
      setTestResult({
        success: false,
        message: 'Failed to send test email',
        error: error.message
      });
    } finally {
      setTestLoading(false);
    }
  };

  // SOS Emergency function
  const triggerSOS = async () => {
    if (!user) {
      alert('Please sign in to use SOS feature');
      return;
    }
    
    if (contacts.length === 0) {
      alert('Please add emergency contacts first');
      return;
    }
    
    try {
      console.log('Starting SOS trigger process...');
      
      // Get current location
      let location = 'Location unavailable';
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          });
        });
        
        location = `${position.coords.latitude}, ${position.coords.longitude}`;
        console.log('Location obtained:', location);
      } catch (geoError) {
        console.warn('Could not get location:', geoError);
        location = 'Location access denied or unavailable';
      }

      // Get Firebase ID token for authentication
      const idToken = await auth.currentUser.getIdToken();
      console.log('Firebase ID token obtained');
      
      // Prepare request data
      const requestData = {
        location: location,
        reason: 'Manual SOS trigger'
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
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Response data:', result);
      
      if (result.success) {
        // Show detailed success message with email results
        let successMessage = `SOS Alert triggered successfully!\n\n`;
        successMessage += `Email Results:\n`;
        
        if (result.results && result.results.length > 0) {
          result.results.forEach((emailResult, index) => {
            const status = emailResult.success ? 'Sent' : 'Failed';
            successMessage += `${status}: ${emailResult.contact} (${emailResult.email})\n`;
            if (!emailResult.success) {
              successMessage += `   Error: ${emailResult.error}\n`;
            }
          });
        }
        
        successMessage += `\nSummary: ${result.contactsNotified}/${result.totalContacts} contacts notified successfully`;
        
        // Show detailed alert
        alert(successMessage);
        
        // Refresh the alerts list
        await loadSosAlerts();
        
        // Set test result to show detailed information
        setTestResult({
          success: true,
          message: 'SOS Alert triggered successfully',
          results: result.results,
          summary: result.summary
        });
        
      } else {
        alert(`Failed to trigger SOS: ${result.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error('Error triggering SOS:', error);
      alert(`Failed to trigger SOS: ${error.message}`);
    }
  };

  // Show loading state while user authentication is being determined
  if (loading) {
    return (
      <main className="sos">
        <div className="container">
          <div className="sos-header">
            <h1 className="sos-title">Loading...</h1>
          </div>
        </div>
      </main>
    );
  }

  // Show sign-in prompt if user is not authenticated
  if (!user) {
    return (
      <main className="sos">
        <div className="container">
          <div className="sos-header">
            <h1 className="sos-title">SOS Settings</h1>
            <p className="sos-sub">Please sign in to manage your emergency contacts and SOS settings.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="sos">
      <div className="container">
        <div className="sos-header">
          <div>
            <h1 className="sos-title">SOS Settings</h1>
            <p className="sos-sub">Add emergency contacts and configure inactivity alerts.</p>
          </div>
          <div className="sos-actions">
            {!isEditing ? (
              <button className="btn btn-primary" onClick={startAdd}>Add contact</button>
            ) : (
              <button className="btn btn-ghost" onClick={() => setForm(emptyContact())}>Cancel Edit</button>
            )}
          </div>
        </div>

        {/* System Status Summary */}
        <section className="sos-card" style={{background: '#f8fafc', border: '1px solid #e2e8f0'}}>
          <h2 className="section-title">System Status</h2>
          <div className="status-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            marginTop: '12px'
          }}>
            <div className="status-item" style={{
              padding: '8px 4px',
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{fontSize: '20px', marginBottom: '2px'}}>👥</div>
              <strong style={{fontSize: '14px'}}>{contacts.length}</strong>
              <div style={{fontSize: '10px', color: '#64748b', lineHeight: '1.2'}}>Emergency Contacts</div>
            </div>
            
            <div className="status-item" style={{
              padding: '8px 4px',
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{fontSize: '20px', marginBottom: '2px'}}>🚨</div>
              <strong style={{fontSize: '14px'}}>{sosAlerts.length}</strong>
              <div style={{fontSize: '10px', color: '#64748b', lineHeight: '1.2'}}>SOS Alerts Triggered</div>
            </div>
            
            <div className="status-item" style={{
              padding: '8px 4px',
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{fontSize: '20px', marginBottom: '2px'}}>⚙️</div>
              <strong style={{fontSize: '14px'}}>{autoSos ? 'Enabled' : 'Disabled'}</strong>
              <div style={{fontSize: '10px', color: '#64748b', lineHeight: '1.2'}}>Auto SOS</div>
            </div>
            
            <div className="status-item" style={{
              padding: '8px 4px',
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{fontSize: '20px', marginBottom: '2px'}}>⏰</div>
              <strong style={{fontSize: '14px'}}>{hours}h</strong>
              <div style={{fontSize: '10px', color: '#64748b', lineHeight: '1.2'}}>Inactivity Threshold</div>
            </div>
          </div>
        </section>

        {/* SOS Emergency Button */}
        <section className="sos-card emergency-section">
          <h2 className="section-title">Emergency SOS</h2>
          
          {/* Email Status Indicator */}
          <div className="email-status" style={{
            marginBottom: '16px',
            padding: '8px 12px',
            background: '#f0f9ff',
            border: '1px solid #0ea5e9',
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            <strong>Gmail Status:</strong> 
            <button 
              className="btn btn-ghost" 
              onClick={testGmailConnection}
              disabled={isLoading || testLoading}
              style={{marginLeft: '8px', padding: '4px 8px', fontSize: '12px'}}
            >
              {testLoading ? 'Checking...' : 'Check Connection'}
            </button>
          </div>
          
          <div className="sos-emergency">
            <button 
              className="btn btn-emergency" 
              onClick={triggerSOS}
              disabled={contacts.length === 0 || isLoading}
            >
              🚨 TRIGGER SOS ALERT 🚨
            </button>
            <p className="emergency-info">
              {contacts.length === 0 
                ? 'Add emergency contacts to enable SOS feature' 
                : 'Click to send emergency email alert to all your contacts'
              }
            </p>
          </div>
          
          {/* SOS Trigger Results */}
          {testResult && testResult.message && testResult.message.includes('SOS Alert triggered') && (
            <div className="sos-results" style={{marginTop: '20px', padding: '16px', background: '#f0fdf4', border: '1px solid #22c55e', borderRadius: '12px'}}>
              <h4 style={{margin: '0 0 12px 0', color: '#166534'}}>Email Alert Results</h4>
              
              {testResult.results && testResult.results.length > 0 && (
                <div className="email-results">
                  {testResult.results.map((emailResult, index) => (
                    <div key={index} className={`email-result ${emailResult.success ? 'success' : 'error'}`} style={{
                      padding: '8px 12px',
                      margin: '4px 0',
                      borderRadius: '8px',
                      background: emailResult.success ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${emailResult.success ? '#22c55e' : '#ef4444'}`,
                      color: emailResult.success ? '#166534' : '#991b1b'
                    }}>
                      <strong>{emailResult.success ? '✅' : '❌'} {emailResult.contact}</strong>
                      <br/>
                      <span style={{fontSize: '12px'}}>
                        Email: {emailResult.email}
                        {emailResult.success && emailResult.messageId && (
                          <span> • Message ID: {emailResult.messageId}</span>
                        )}
                        {!emailResult.success && emailResult.error && (
                          <span> • Error: {emailResult.error}</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              {testResult.summary && (
                <div className="summary" style={{marginTop: '12px', padding: '8px 12px', background: 'rgba(255,255,255,0.5)', borderRadius: '8px'}}>
                  <strong>Summary:</strong> {testResult.summary.successful}/{testResult.summary.total} contacts notified successfully
                </div>
              )}
            </div>
          )}
        </section>

        {/* SOS Alerts History */}
        <section className="sos-card">
          <div className="section-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
            <h2 className="section-title" style={{margin: 0}}>SOS Alerts History</h2>
            <button 
              className="btn btn-ghost" 
              onClick={() => setShowHistory(!showHistory)}
              style={{padding: '8px 16px'}}
            >
              {showHistory ? 'Hide History' : 'Show History'} ({sosAlerts.length})
            </button>
          </div>
          
          {showHistory && (
            <div className="alerts-history">
              {sosAlerts.length === 0 ? (
                <div className="empty" style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: '#64748b',
                  background: '#f8fafc',
                  borderRadius: '8px'
                }}>
                  No SOS alerts have been triggered yet.
                </div>
              ) : (
                <div className="alerts-list">
                  {sosAlerts.map((alert, index) => (
                    <div key={alert.id || index} className="alert-item" style={{
                      padding: '16px',
                      margin: '8px 0',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      background: '#fff'
                    }}>
                      <div className="alert-header" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '8px'
                      }}>
                        <div className="alert-status">
                          <span className="status-badge" style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            background: alert.status === 'active' ? '#fef2f2' : '#f0fdf4',
                            color: alert.status === 'active' ? '#dc2626' : '#166534',
                            border: `1px solid ${alert.status === 'active' ? '#fecaca' : '#bbf7d0'}`
                          }}>
                            🚨 {alert.status === 'active' ? 'ACTIVE' : 'RESOLVED'}
                          </span>
                        </div>
                        <div className="alert-time" style={{fontSize: '12px', color: '#64748b'}}>
                          {alert.triggeredAt && alert.triggeredAt.toDate ? 
                            alert.triggeredAt.toDate().toLocaleString() : 
                            'Unknown time'
                          }
                        </div>
                      </div>
                      
                      <div className="alert-details">
                        <p style={{margin: '4px 0', fontSize: '14px'}}>
                          <strong>Reason:</strong> {alert.reason || 'Unknown'}
                        </p>
                        <p style={{margin: '4px 0', fontSize: '14px'}}>
                          <strong>Location:</strong> {alert.location || 'Not available'}
                        </p>
                        {alert.contacts && alert.contacts.length > 0 && (
                          <p style={{margin: '4px 0', fontSize: '14px'}}>
                            <strong>Contacts Notified:</strong> {alert.contacts.length} contact(s)
                          </p>
                        )}
                        
                        {alert.emailResults && alert.emailResults.length > 0 && (
                          <div className="email-results" style={{marginTop: '12px'}}>
                            <strong style={{fontSize: '14px'}}>Email Results:</strong>
                            <div style={{marginTop: '8px'}}>
                              {alert.emailResults.map((result, idx) => (
                                <div key={idx} style={{
                                  padding: '6px 8px',
                                  margin: '4px 0',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  background: result.success ? '#f0fdf4' : '#fef2f2',
                                  border: `1px solid ${result.success ? '#bbf7d0' : '#fecaca'}`,
                                  color: result.success ? '#166534' : '#dc2626'
                                }}>
                                  {result.success ? '✅' : '❌'} {result.contact} ({result.email})
                                  {!result.success && result.error && (
                                    <div style={{fontSize: '11px', marginTop: '2px'}}>
                                      Error: {result.error}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="sos-card">
          <h2 className="section-title">Auto SOS</h2>
          <div className="sos-row">
            <label className="switch">
              <input 
                type="checkbox" 
                checked={autoSos} 
                onChange={(e) => handleAutoSosToggle(e.target.checked)}
                disabled={isLoading}
              />
              <span>Enable auto alert on inactivity</span>
              {isLoading && <span className="loading-spinner" style={{marginLeft: '8px'}}></span>}
            </label>
            <div className="inline">
              <label htmlFor="inactivity-hours">Inactivity window (hours)</label>
              <select 
                id="inactivity-hours"
                value={hours} 
                onChange={(e)=> handleHoursChange(Number(e.target.value))} 
                disabled={!autoSos || isLoading}
              >
                {[1,2,3,4,6,8,12,24].map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>
          <p className="muted">
            {isLoading ? (
              'Saving settings...'
            ) : autoSos ? (
              `An alert will be sent after ${hours} hour${hours !== 1 ? 's' : ''} of inactivity.`
            ) : (
              'By default, an alert is sent after 3 hours of inactivity.'
            )}
          </p>
        </section>

        <section className="sos-card">
          <h2 className="section-title">Contacts</h2>
          <form className="sos-form" onSubmit={submit}>
            <div className="grid">
              <label>
                Name
                <input value={form.name} onChange={(e)=> setForm({ ...form, name: e.target.value })} placeholder="e.g., Sara Khan" required />
              </label>
              <label>
                Relation
                <input value={form.relation} onChange={(e)=> setForm({ ...form, relation: e.target.value })} placeholder="e.g., Daughter" />
              </label>
              <label>
                Email
                <input type="email" value={form.email} onChange={(e)=> setForm({ ...form, email: e.target.value })} placeholder="e.g., family@gmail.com" required />
              </label>
              <label>
                Priority
                <select value={form.priority} onChange={(e)=> setForm({ ...form, priority: e.target.value })}>
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                </select>
              </label>
            </div>
            <div className="form-actions">
              {isEditing && <button type="button" className="btn btn-ghost" onClick={()=> setForm(emptyContact())}>Cancel</button>}
              <button className="btn btn-primary" type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : (isEditing ? 'Update' : 'Save')}
              </button>
            </div>
          </form>

          <div className="contact-list" role="list">
            {isLoading && contacts.length === 0 && <div className="empty">Loading contacts...</div>}
            {!isLoading && contacts.length === 0 && <div className="empty">No contacts yet. Add a primary contact to begin.</div>}
            {contacts.map(c => (
              <article key={c.id} className="contact-item" role="listitem">
                <div className="contact-main">
                  <div className="contact-name">{c.name}</div>
                  <div className="contact-meta">
                    {c.relation && <span className="pill">{c.relation}</span>}
                    <span className="pill">{c.priority === 'primary' ? 'Primary' : 'Secondary'}</span>
                    {c.email && <span className="pill">{c.email}</span>}
                  </div>
                </div>
                <div className="contact-actions">
                  <button className="btn btn-ghost" onClick={() => edit(c.id)} disabled={isLoading}>Edit</button>
                  <button className="btn btn-secondary" onClick={() => remove(c.id)} disabled={isLoading}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Gmail Test Section */}
        <section className="sos-card">
          <h2 className="section-title">Gmail Test</h2>
          <p className="muted">Test your Gmail setup to ensure emergency emails are being sent correctly.</p>
          
          <div className="test-email-section">
            
            <div className="form-row">
              <button 
                className="btn btn-ghost" 
                onClick={testGmailConnection}
                disabled={isLoading || testLoading}
              >
                {testLoading ? 'Testing...' : 'Test Gmail Connection'}
              </button>
            </div>
            
            <div className="form-row">
              <input
                type="email"
                placeholder="Enter email address (e.g., test@gmail.com)"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="test-email-input"
                style={{marginRight: '8px', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px'}}
              />
              <button 
                className="btn btn-secondary" 
                onClick={testEmailSend}
                disabled={!testEmail || !testEmail.includes('@') || isLoading || testLoading}
              >
                {testLoading ? 'Testing...' : 'Test Email'}
              </button>
            </div>
            
            {testResult && (
              <div className={`test-result ${testResult.success ? 'success' : 'error'}`} style={{
                marginTop: '16px',
                padding: '16px',
                borderRadius: '8px',
                background: testResult.success ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${testResult.success ? '#22c55e' : '#ef4444'}`
              }}>
                <strong>{testResult.success ? '✅' : '❌'} {testResult.message}</strong>
                
                {testResult.success && testResult.account && (
                  <div className="account-info" style={{marginTop: '12px'}}>
                    <p><strong>Account:</strong> {testResult.account.email || 'N/A'}</p>
                    <p><strong>Type:</strong> {testResult.account.type || 'Gmail'}</p>
                    <p><strong>Provider:</strong> {testResult.provider || 'Gmail'}</p>
                  </div>
                )}
                
                {testResult.success && testResult.result && (
                  <div className="email-info" style={{marginTop: '12px'}}>
                    <p><strong>Message ID:</strong> {testResult.result.messageId || 'N/A'}</p>
                    <p><strong>Status:</strong> {testResult.result.status || 'Sent'}</p>
                  </div>
                )}
                
                {testResult.error && <p style={{marginTop: '12px'}}><strong>Error:</strong> {testResult.error}</p>}
                
                {/* Debug: Raw Response */}
                <details style={{marginTop: '12px', fontSize: '12px'}}>
                  <summary style={{cursor: 'pointer', color: '#666'}}>Debug: Raw Response</summary>
                  <pre style={{background: '#f5f5f5', padding: '8px', borderRadius: '4px', overflow: 'auto', maxHeight: '200px'}}>
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
          
          <div className="troubleshooting-tips" style={{marginTop: '20px'}}>
            <h4>Troubleshooting Tips:</h4>
            <ul>
              <li><strong>Gmail App Password:</strong> Use app-specific password, not regular Gmail password</li>
              <li><strong>Email Format:</strong> Ensure all email addresses are valid</li>
              <li><strong>Spam Folder:</strong> Check spam/junk folders for emergency emails</li>
              <li><strong>Account Security:</strong> Enable 2-factor authentication on Gmail account</li>
            </ul>
          </div>
        </section>


      </div>
    </main>
  );
}

export default SOSInteraction;