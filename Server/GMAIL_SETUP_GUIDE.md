# 📧 Gmail Emergency Alert Setup Guide

This guide shows you how to set up Gmail for sending emergency SOS alerts in the Elderlyze system.

## 🚀 Quick Setup

### Step 1: Enable Gmail App Password

1. **Go to Google Account Settings**: https://myaccount.google.com/
2. **Navigate to Security**
3. **Enable 2-Step Verification** (if not already enabled)
4. **Generate App Password**:
   - Go to "App passwords"
   - Select "Mail" and "Other (Custom name)"
   - Name it "Elderlyze SOS"
   - Copy the generated 16-character password

### Step 2: Update Environment Variables

Create or update your `.env` file in the `Server/` directory:

```env
# Gmail Configuration
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password

# Server Configuration
PORT=3001
NODE_ENV=development
```

### Step 3: Test the Setup

1. **Restart your server**: `npm start`
2. **Test Gmail connection**: Visit `http://localhost:3001/test/gmail`
3. **Test email sending**: Use the SOS interface

## 📧 Email Alert Features

### Emergency Email Format:
```
🚨 EMERGENCY SOS ALERT 🚨

URGENT: [UserName] has triggered an emergency SOS alert!

📍 LOCATION: [GPS Coordinates]
🗺️ Map: https://maps.google.com/?q=[coordinates]
⏰ TIME: [Current Time]
📋 REASON: [Reason for alert]

💬 ADDITIONAL MESSAGE: [Custom message if provided]

⚠️ THIS IS AN EMERGENCY - IMMEDIATE RESPONSE REQUIRED ⚠️

Please contact [UserName] immediately or call emergency services if needed.

Sent via Elderlyze Emergency System
```

### Features:
- ✅ **Real GPS coordinates** with Google Maps link
- ✅ **Custom messages** support
- ✅ **Multiple recipients** (family members, caregivers)
- ✅ **Immediate delivery** (no delays)
- ✅ **Professional formatting** with HTML support

## 🔧 Frontend Integration

### Contact Management:
Users can add email contacts with:
- **Name**: Contact's full name
- **Email**: Gmail address
- **Relation**: How they're related (Daughter, Son, Caregiver, etc.)
- **Priority**: Primary or Secondary contact

### SOS Trigger:
- **Manual SOS**: Big red button for immediate alerts
- **Auto-SOS**: Automatic alerts after inactivity
- **Custom Message**: Optional additional message
- **Location Tracking**: Automatic GPS coordinates

## 🧪 Testing

### Test Gmail Connection:
```bash
curl http://localhost:3001/test/gmail
```

### Test Email Sending:
```bash
curl -X POST http://localhost:3001/test/email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "message": "Test emergency alert"}'
```

## 🔒 Security Features

- **Gmail App Password**: Secure authentication
- **Email Validation**: Proper email format checking
- **User Authentication**: Firebase ID token required
- **Data Isolation**: Users only see their own contacts

## 💡 Benefits of Gmail System

### Advantages:
- ✅ **No trial restrictions** - Works immediately
- ✅ **Free to use** - No SMS charges
- ✅ **Reliable delivery** - Gmail infrastructure
- ✅ **Rich formatting** - HTML email support
- ✅ **Easy setup** - No business accounts needed
- ✅ **Global reach** - Works worldwide

### vs SMS:
- 📧 **Email**: Free, rich formatting, reliable
- 📱 **SMS**: Paid, limited format, delivery issues

## 🎯 Usage Instructions

### For Elderly Users:
1. **Add family email addresses** in SOS settings
2. **Click SOS button** when emergency occurs
3. **Family receives immediate email** with location
4. **Click map link** to see exact location

### For Family Members:
1. **Receive emergency email** with all details
2. **Click Google Maps link** for exact location
3. **Contact emergency services** if needed
4. **Respond to the situation** immediately

## 🔄 Troubleshooting

### Common Issues:

1. **"Gmail service not configured"**
   - Check `.env` file has correct credentials
   - Verify Gmail app password is correct

2. **"Invalid email format"**
   - Ensure email addresses are valid
   - Check for typos in email addresses

3. **"Gmail connection failed"**
   - Verify 2-step verification is enabled
   - Regenerate app password if needed

### Gmail App Password Issues:
- **16 characters**: App password must be exactly 16 characters
- **No spaces**: Remove any spaces from the password
- **Case sensitive**: Use exact case as provided by Google

## 📱 Integration with Frontend

The frontend SOS interface now supports:
- **Email contact management** (add, edit, delete)
- **Custom message input** before SOS trigger
- **Email delivery status** feedback
- **Location sharing** with map links

## 🎉 System Ready

Your Elderlyze system is now configured for reliable Gmail emergency alerts!

- ✅ **No SMS costs**
- ✅ **Immediate delivery**
- ✅ **Rich formatting**
- ✅ **Location tracking**
- ✅ **Custom messages**
- ✅ **Multiple recipients**

Perfect for elderly care and emergency situations! 🚨


