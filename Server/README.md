# 🚨 Elderlyze SOS Server with Twilio SMS

This server provides emergency SOS functionality for the Elderlyze application, including:
- **Manual SOS triggers** via the SOS button
- **Automatic inactivity monitoring** (configurable hours)
- **Twilio SMS integration** for emergency notifications
- **Firebase integration** for user management and data storage

## 🚀 Features

### SOS Alert System
- **Manual SOS**: Users can trigger emergency alerts via the SOS button
- **Auto SOS**: Automatic alerts when users are inactive for configured hours
- **Location tracking**: GPS coordinates included in emergency messages
- **Contact management**: Primary and secondary emergency contacts
- **SMS delivery**: Instant SMS notifications via Twilio

### Activity Monitoring
- **User interaction tracking**: Mouse, keyboard, scroll, touch events
- **Page navigation tracking**: Monitor user movement through the app
- **Form submission tracking**: Track user engagement with forms
- **Automatic updates**: Real-time activity updates sent to server

### Medicine Reminders
- **Scheduled notifications**: Firebase Cloud Messaging for medicine reminders
- **Timezone support**: Accurate timing across different regions
- **Deduplication**: Prevents duplicate notifications

## 📋 Prerequisites

- Node.js (v14 or higher)
- Firebase project with service account key
- Twilio account with:
  - Account SID
  - Auth Token
  - Phone number for sending SMS

## 🛠️ Installation

1. **Clone the repository and navigate to Server folder**
   ```bash
   cd Server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   Create a `.env` file in the Server folder:
   ```env
   # Twilio Configuration
   TWILIO_ACCOUNT_SID=your_account_sid_here
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   ```

4. **Configure Firebase**
   - Place your `serviceAccountKey.json` in the Server folder
   - Ensure the service account has Firestore read/write permissions

## 🔧 Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `TWILIO_ACCOUNT_SID` | Your Twilio Account SID | `AC9ad19bb39ec8399d723d3fc77fe7555e` |
| `TWILIO_AUTH_TOKEN` | Your Twilio Auth Token | `97d5584a40549915714d9317dbb85472` |
| `TWILIO_PHONE_NUMBER` | Your Twilio phone number | `+18124616359` |
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment mode | `development` |

### Firebase Collections Structure

```
users/
  {userId}/
    sosContacts/           # Emergency contacts
      {contactId}/
        name: string
        relation: string
        phone: string
        priority: 'primary' | 'secondary'
        createdAt: timestamp
        updatedAt: timestamp
    
    sosSettings/           # SOS configuration
      autoSos: boolean
      hours: number
      updatedAt: timestamp
    
    sosAlerts/            # SOS alert history
      {alertId}/
        triggeredAt: timestamp
        status: 'active' | 'resolved'
        contacts: array
        location: string
        reason: string
        smsResults: array
    
    lastActivity/         # User activity tracking
      timestamp: timestamp
      type: string
      details: object
      updatedAt: timestamp
    
    fcmTokens/           # Push notification tokens
      {tokenId}/
        token: string
        platform: string
        createdAt: timestamp
```

## 🚀 Running the Server

### Development Mode
```bash
npm start
```

### Production Mode
```bash
NODE_ENV=production npm start
```

The server will start on the configured port (default: 3001)

## 📡 API Endpoints

### Authentication
All endpoints require Firebase ID token in the Authorization header:
```
Authorization: Bearer {firebase_id_token}
```

### SOS Endpoints

#### POST `/api/sos/trigger`
Trigger manual SOS alert
```json
{
  "location": "40.7128, -74.0060",
  "reason": "Manual SOS trigger"
}
```

Response:
```json
{
  "success": true,
  "message": "SOS alert sent successfully",
  "contactsNotified": 3,
  "results": [...]
}
```

#### GET `/api/sos/history`
Get user's SOS alert history
```json
{
  "success": true,
  "alerts": [...]
}
```

### Activity Endpoints

#### POST `/api/activity/update`
Update user activity status
```json
{
  "type": "user_interaction",
  "details": {
    "timestamp": "2024-01-01T12:00:00Z",
    "userAgent": "..."
  }
}
```

## 🔄 Cron Jobs

### Medicine Reminders
- **Frequency**: Every minute
- **Purpose**: Check and send medicine reminders
- **Function**: `sendDueReminders()`

### Inactivity Monitoring
- **Frequency**: Every 30 minutes
- **Purpose**: Check user inactivity and trigger auto SOS
- **Function**: `checkUserInactivity()`

## 📱 SMS Message Format

Emergency SMS messages follow this format:
```
🚨 SOS ALERT 🚨

[UserName] has triggered an emergency SOS alert.

Reason: [Reason]
Location: [GPS Coordinates]
Time: [Timestamp]

This is an automated emergency message. Please respond immediately.

Sent via Elderlyze SOS System
```

## 🔒 Security Features

- **Firebase Authentication**: All API calls require valid Firebase ID tokens
- **User Isolation**: Users can only access their own data
- **Rate Limiting**: Built-in protection against spam
- **Secure Credentials**: Environment variables for sensitive data

## 🐛 Troubleshooting

### Common Issues

1. **Twilio SMS not sending**
   - Verify account SID and auth token
   - Check phone number format (must include country code)
   - Ensure sufficient Twilio credits

2. **Firebase connection issues**
   - Verify service account key permissions
   - Check Firebase project configuration
   - Ensure Firestore is enabled

3. **Port conflicts**
   - Change PORT in .env file
   - Check if port is already in use

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=true
```

## 📊 Monitoring

### Server Logs
- SOS trigger events
- SMS delivery status
- User activity updates
- Error logs

### Firebase Analytics
- SOS alert frequency
- User engagement patterns
- Contact notification success rates

## 🔄 Deployment

### Environment Setup
1. Set production environment variables
2. Configure production Firebase project
3. Set up production Twilio account
4. Configure production server URL

### Scaling Considerations
- Use PM2 or similar process manager
- Set up load balancing for multiple instances
- Configure database connection pooling
- Implement Redis for caching

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review Firebase and Twilio documentation
3. Check server logs for error details
4. Verify environment configuration

## 📄 License

This project is part of the Elderlyze application suite.
