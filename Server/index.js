require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const cron = require('node-cron');
const { DateTime } = require('luxon');
const nodemailer = require('nodemailer');

// Debug logging
console.log('Starting Elderlyze SOS Server...');
console.log('Environment variables:');
console.log('- GMAIL_USER:', process.env.GMAIL_USER ? 'Set' : 'NOT SET');
console.log('- GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? 'Set' : 'NOT SET');
console.log('- PORT:', process.env.PORT || '3001 (default)');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');

// Initialize Gmail transporter
let gmailTransporter = null;
if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  gmailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
  console.log('Gmail service initialized');
} else {
  console.warn('Gmail credentials not set. Email alerts will not work.');
}

// Load service account (keep this file private!)
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error);
  process.exit(1);
}

const db = admin.firestore();
const messaging = admin.messaging();

// Express server setup
const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // Add your frontend URLs
  credentials: true
}));
app.use(express.json());

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// Test endpoint to verify server is running
app.get('/', (req, res) => {
  res.json({
    message: 'Elderlyze SOS Server is running!',
    timestamp: new Date().toISOString(),
    endpoints: {
      test: 'GET /',
      sosTrigger: 'POST /api/sos/trigger',
      activityUpdate: 'POST /api/activity/update',
      sosHistory: 'GET /api/sos/history'
    }
  });
});

// Test endpoint for Gmail connection
app.get('/test/gmail', async (req, res) => {
  try {
    console.log('Gmail test endpoint called');

    if (!gmailTransporter) {
      console.log('Gmail transporter not configured');
      return res.status(500).json({
        success: false,
        message: 'Gmail service not configured',
        error: 'Gmail credentials not set'
      });
    }

    console.log('Testing Gmail connection...');
    // Test Gmail connection by verifying credentials
    await gmailTransporter.verify();

    console.log('Gmail connection successful');
    res.json({
      success: true,
      message: 'Gmail connection successful',
      provider: 'gmail',
      account: {
        email: process.env.GMAIL_USER,
        type: 'Gmail'
      }
    });
  } catch (error) {
    console.error('Gmail test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Gmail connection failed',
      error: error.message
    });
  }
});

// Test endpoint to send a test email
app.post('/test/email', async (req, res) => {
  try {
    console.log('Test email endpoint called with body:', req.body);
    const { email, message } = req.body;

    if (!email) {
      console.log('No email provided in request');
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    if (!validateEmail(email)) {
      console.log('Invalid email format:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    const testMessage = message || 'TEST EMAIL - Elderlyze Emergency System\n\nLocation: Test Coordinates (40.7128, -74.0060)\nMap: https://maps.google.com/?q=40.7128,-74.0060\nTime: ' + new Date().toLocaleString() + '\n\nThis is a test email. Your Gmail setup is working correctly!';

    console.log(`Sending test email to ${email}`);
    const result = await sendEmergencyEmail(email, 'Test User', '40.7128, -74.0060', 'Test emergency alert', testMessage, {
      accuracy: 10,
      timestamp: new Date().toISOString()
    });

    if (result.success) {
      console.log('Test email sent successfully:', result);
      res.json({
        success: true,
        message: 'Test email sent successfully',
        result: result
      });
    } else {
      console.log('Test email failed:', result);
      res.status(400).json({
        success: false,
        message: 'Failed to send test email',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Middleware to verify Firebase ID token
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Function to validate email format
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Function to send emergency email alert
async function sendEmergencyEmail(toEmail, userName, location, reason, customMessage = '', locationDetails = {}) {
  try {
    if (!gmailTransporter) {
      throw new Error('Gmail service not configured');
    }

    if (!validateEmail(toEmail)) {
      throw new Error('Invalid email format');
    }

    console.log(`Sending emergency email to ${toEmail}...`);

    const currentTime = new Date().toLocaleString();

    // Enhanced location formatting with accuracy and details
    let locationText = location;
    let locationAccuracy = '';
    
    if (location && location.includes(',') && !location.includes('Location unavailable') && !location.includes('access denied')) {
      const coords = location.replace(/\s/g, '');
      locationText = `${location}`;
      
      // Add accuracy information if available
      if (locationDetails.accuracy) {
        locationAccuracy = `\nAccuracy: ±${Math.round(locationDetails.accuracy)}m`;
      }
      
      // Add timestamp if available
      if (locationDetails.timestamp) {
        locationAccuracy += `\nLocation Time: ${new Date(locationDetails.timestamp).toLocaleString()}`;
      }
      
      // Add Google Maps links
      locationText += `\nGoogle Maps: https://maps.google.com/?q=${coords}`;
      locationText += `\nApple Maps: https://maps.apple.com/?q=${coords}`;
      locationText += locationAccuracy;
      
      // Add additional details if available
      if (locationDetails.altitude && locationDetails.altitude !== null) {
        locationText += `\nAltitude: ${Math.round(locationDetails.altitude)}m`;
      }
      
      if (locationDetails.speed && locationDetails.speed !== null && locationDetails.speed > 0) {
        locationText += `\nSpeed: ${Math.round(locationDetails.speed * 3.6)} km/h`;
      }
    }

    const emailContent = `
EMERGENCY SOS ALERT

URGENT: ${userName} has triggered an emergency SOS alert!

LOCATION: ${locationText}
TIME: ${currentTime}
REASON: ${reason}

${customMessage ? `ADDITIONAL MESSAGE: ${customMessage}\n` : ''}

THIS IS AN EMERGENCY - IMMEDIATE RESPONSE REQUIRED

Please contact ${userName} immediately or call emergency services if needed.

Sent via Elderlyze Emergency System
    `.trim();

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border: 2px solid #ef4444; border-radius: 8px;">
      <div style="background: #ef4444; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">🚨 EMERGENCY SOS ALERT 🚨</h1>
      </div>
      
      <div style="padding: 20px;">
        <div style="background: #fef2f2; border: 1px solid #ef4444; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
          <h2 style="color: #dc2626; margin: 0 0 10px 0;">URGENT: Emergency Alert Triggered</h2>
          <p style="margin: 0; font-size: 16px; font-weight: bold;">${userName} has triggered an emergency SOS alert!</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; margin: 0 0 10px 0;">📍 Location:</h3>
          <p style="margin: 0; padding: 10px; background: #f9fafb; border-radius: 4px;">${locationText}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; margin: 0 0 10px 0;">⏰ Time:</h3>
          <p style="margin: 0; padding: 10px; background: #f9fafb; border-radius: 4px;">${currentTime}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; margin: 0 0 10px 0;">📋 Reason:</h3>
          <p style="margin: 0; padding: 10px; background: #f9fafb; border-radius: 4px;">${reason}</p>
        </div>
        
        ${customMessage ? `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; margin: 0 0 10px 0;">💬 Additional Message:</h3>
          <p style="margin: 0; padding: 10px; background: #f9fafb; border-radius: 4px;">${customMessage}</p>
        </div>
        ` : ''}
        
        <div style="background: #dc2626; color: white; padding: 16px; border-radius: 6px; text-align: center; margin-bottom: 20px;">
          <h3 style="margin: 0; font-size: 18px;">⚠️ IMMEDIATE RESPONSE REQUIRED ⚠️</h3>
          <p style="margin: 8px 0 0 0;">Please contact ${userName} immediately or call emergency services if needed.</p>
        </div>
        
        <div style="text-align: center; color: #6b7280; font-size: 14px;">
          <p style="margin: 0;">Sent via Elderlyze Emergency System</p>
        </div>
      </div>
    </div>
    `;

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: toEmail,
      subject: `🚨 EMERGENCY SOS ALERT - ${userName}`,
      text: emailContent,
      html: htmlContent
    };

    const result = await gmailTransporter.sendMail(mailOptions);

    console.log(`Emergency email sent successfully to ${toEmail}:`, result.messageId);

    return {
      success: true,
      messageId: result.messageId,
      status: 'sent',
      provider: 'gmail'
    };
  } catch (error) {
    console.error(`Failed to send emergency email to ${toEmail}:`, error);

    return {
      success: false,
      error: error.message,
      provider: 'gmail'
    };
  }
}

// Function to send SOS alerts to all email contacts
async function sendSOSAlerts(userId, location = 'Location unavailable', reason = 'Manual SOS trigger', customMessage = '', locationDetails = {}) {
  try {
    console.log(`Starting SOS email alert process for user ${userId}`, { location, reason });

    // Get user's SOS email contacts
    const contactsSnapshot = await db.collection(`users/${userId}/sosContacts`).get();

    if (contactsSnapshot.empty) {
      console.log(`No email contacts found for user ${userId}`);
      return { success: false, message: 'No email contacts found' };
    }

    console.log(`Found ${contactsSnapshot.size} email contacts for user ${userId}`);

    // Get user info
    const userDoc = await admin.auth().getUser(userId);
    const userName = userDoc.displayName || userDoc.email || 'Unknown User';

    const results = [];
    const contacts = [];

    for (const contactDoc of contactsSnapshot.docs) {
      const contact = contactDoc.data();
      contacts.push({
        id: contactDoc.id,
        name: contact.name,
        email: contact.email,
        relation: contact.relation,
        priority: contact.priority
      });

      // Validate email
      if (!validateEmail(contact.email)) {
        console.error(`Invalid email for ${contact.name}: ${contact.email}`);
        results.push({
          contact: contact.name,
          email: contact.email,
          success: false,
          messageId: null,
          error: 'Invalid email format',
          errorCode: 'INVALID_EMAIL'
        });
        continue; // Skip this contact and continue with the next one
      }

      // Send emergency email
      console.log(`Sending emergency email to contact ${contact.name} at ${contact.email}`);
      const emailResult = await sendEmergencyEmail(contact.email, userName, location, reason, customMessage, locationDetails);

      const result = {
        contact: contact.name,
        email: contact.email,
        success: emailResult.success,
        messageId: emailResult.messageId || null,
        error: emailResult.error || null
      };

      console.log(`Email result for ${contact.name}:`, result);
      results.push(result);
    }

    // Log SOS alert in database
    const sosRef = db.collection(`users/${userId}/sosAlerts`).doc();

    // Clean up results to remove undefined values before saving to Firestore
    const cleanResults = results.map(result => ({
      contact: result.contact,
      email: result.email,
      success: result.success,
      messageId: result.messageId || null,
      error: result.error || null
    }));

    const sosData = {
      triggeredAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active',
      contacts: contacts,
      location: location,
      reason: reason,
      customMessage: customMessage,
      userId: userId,
      userEmail: userDoc.email || 'Unknown',
      userName: userName,
      emailResults: cleanResults
    };

    console.log(`Saving SOS alert to database for user ${userId}:`, sosData);
    await sosRef.set(sosData);
    console.log(`SOS alert saved successfully with ID: ${sosRef.id}`);

    // Count successful email sends
    const successfulSends = results.filter(r => r.success).length;
    const failedSends = results.filter(r => !r.success).length;

    console.log(`SOS email alert completed. Successful: ${successfulSends}, Failed: ${failedSends}`);

    return {
      success: true,
      contactsNotified: successfulSends,
      totalContacts: results.length,
      results: results,
      summary: {
        total: results.length,
        successful: successfulSends,
        failed: failedSends
      }
    };

  } catch (error) {
    console.error('Error sending SOS email alerts:', error);
    return { success: false, error: error.message };
  }
}

// API Endpoint: Manual SOS trigger
app.post('/api/sos/trigger', authenticateUser, async (req, res) => {
  try {
    const { location, locationDetails, reason, customMessage, timestamp } = req.body;
    const userId = req.user.uid;

    console.log(`Manual SOS triggered by user ${userId}`, { 
      location, 
      locationDetails, 
      reason, 
      customMessage, 
      timestamp 
    });

    const result = await sendSOSAlerts(userId, location, reason || 'Manual SOS trigger', customMessage || '', locationDetails);

    if (result.success) {
      console.log(`SOS email alert sent successfully for user ${userId}`, {
        contactsNotified: result.contactsNotified,
        resultsCount: result.results.length
      });
      res.json({
        success: true,
        message: 'SOS email alert sent successfully',
        contactsNotified: result.contactsNotified,
        totalContacts: result.totalContacts,
        results: result.results,
        summary: result.summary
      });
    } else {
      console.error(`Failed to send SOS email alerts for user ${userId}:`, result.error);
      res.status(500).json({
        success: false,
        message: 'Failed to send SOS email alerts',
        error: result.error
      });
    }

  } catch (error) {
    console.error('SOS trigger error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Function to check user inactivity and send auto SOS
async function checkUserInactivity() {
  try {
    console.log('Checking for user inactivity...');

    // Get all users with SOS settings
    const usersSnapshot = await db.collectionGroup('sosSettings').get();

    for (const docSnap of usersSnapshot.docs) {
      const settings = docSnap.data();
      const userId = docSnap.ref.parent.parent.id;

      if (!settings.autoSos || !settings.hours) continue;

      // Get user's last activity (you'll need to implement activity tracking)
      const lastActivityRef = db.collection(`users/${userId}/lastActivity`).doc('current');
      const lastActivityDoc = await lastActivityRef.get();

      if (!lastActivityDoc.exists) continue;

      const lastActivity = lastActivityDoc.data().timestamp;
      const hoursSinceActivity = DateTime.now().diff(DateTime.fromJSDate(lastActivity.toDate()), 'hours').hours;

      if (hoursSinceActivity >= settings.hours) {
        console.log(`User ${userId} inactive for ${hoursSinceActivity} hours, sending auto SOS`);

        // Send auto SOS
        await sendSOSAlerts(
          userId,
          'Location unavailable (Auto SOS)',
          `No activity detected for ${Math.floor(hoursSinceActivity)} hours`
        );

        // Update last activity to prevent spam
        await lastActivityRef.set({
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          lastAutoSOS: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
  } catch (error) {
    console.error('Error checking user inactivity:', error);
  }
}

// Function to send medicine reminders (existing functionality)
async function sendDueReminders() {
  const nowUtc = DateTime.utc();

  const medsSnap = await db
    .collection('medicines')
    .where('alertsEnabled', '==', true)
    .get();

  const tasks = [];

  for (const docSnap of medsSnap.docs) {
    const m = docSnap.data();
    const medicineId = docSnap.id;
    const userId = m.userId;
    if (!userId || !Array.isArray(m.times) || m.times.length === 0) continue;

    const zone = m.timeZone || 'UTC';
    const nowLocal = nowUtc.setZone(zone);
    const todayISO = nowLocal.toISODate();

    const startOk = !m.startDate || todayISO >= m.startDate;
    const endOk = !m.endDate || todayISO <= m.endDate;
    if (!startOk || !endOk) continue;

    for (const timeStr of m.times) {
      if (!timeStr) continue;
      const targetLocal = DateTime.fromISO(`${todayISO}T${timeStr}`, { zone });
      const diffSec = Math.abs(nowLocal.diff(targetLocal, 'seconds').seconds);
      if (diffSec > 60) continue; // within ±60s window

      const dedupeId = `${userId}:${medicineId}:${todayISO}:${timeStr}`;
      const dedupeRef = db.doc(`notificationRuns/${todayISO}/sent/${dedupeId}`);
      const dedupeDoc = await dedupeRef.get();
      if (dedupeDoc.exists) continue;

      const tokensSnap = await db.collection(`users/${userId}/fcmTokens`).get();
      const tokens = tokensSnap.docs.map((d) => d.id).filter(Boolean);
      if (tokens.length === 0) continue;

      const title = 'Medicine reminder';
      const body = `${m.name || 'Medicine'} • ${timeStr} (${zone})${m.mealTiming ? ` • ${m.mealTiming} meal` : ''}`;

      tasks.push(
        messaging
          .sendEachForMulticast({
            tokens,
            notification: {
              title,
              body,
              icon: '/elderlyze-logo.png',
              badge: '/elderlyze-logo.png',
            },
            data: {
              medicineId,
              time: timeStr,
              zone,
            },
          })
          .then(() => dedupeRef.set({ sentAt: new Date(), medicineId, time: timeStr }))
          .catch((err) => {
            console.error('FCM send error', { userId, medicineId, timeStr, error: err && err.message });
          })
      );
    }
  }

  await Promise.all(tasks);
}

// API Endpoint: Update user activity
app.post('/api/activity/update', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { type, details } = req.body;

    // Create a document in the lastActivity collection with a specific ID
    await db.collection(`users/${userId}/lastActivity`).doc('current').set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      type: type || 'general',
      details: details || {},
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true, message: 'Activity updated' });
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API Endpoint: Get SOS alerts history
app.get('/api/sos/history', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const alertsSnapshot = await db.collection(`users/${userId}/sosAlerts`)
      .orderBy('triggeredAt', 'desc')
      .limit(20)
      .get();

    const alerts = [];
    alertsSnapshot.forEach(doc => {
      alerts.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({ success: true, alerts });
  } catch (error) {
    console.error('Error fetching SOS history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cron jobs
// Check medicine reminders every minute
cron.schedule('* * * * *', () => {
  sendDueReminders().catch(e => console.error('sendDueReminders error', e));
});

// Check user inactivity every 30 minutes
cron.schedule('*/30 * * * *', () => {
  checkUserInactivity().catch(e => console.error('checkUserInactivity error', e));
});

// Start server
app.listen(PORT, () => {
  console.log(`SOS Server running on port ${PORT}`);
  console.log('Medicine reminders: Every minute');
  console.log('Inactivity checks: Every 30 minutes');
  console.log('Email service: Ready');
  console.log('Firebase: Connected');
  console.log('Express: Running');
  console.log(`Server URL: http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log(`   - POST /api/sos/trigger`);
  console.log(`   - POST /api/activity/update`);
  console.log(`   - GET /api/sos/history`);
  console.log(`   - GET /test/gmail`);
  console.log(`   - POST /test/email`);
}).on('error', (error) => {
  console.error('Failed to start server:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please try a different port.`);
  }
  process.exit(1);
});

// Optional: run once at startup
sendDueReminders().catch(() => { });
checkUserInactivity().catch(() => { });