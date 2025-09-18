# 🌟 Elderlyze - Comprehensive Elderly Care & Wellness Platform

> *Caring technology, human touch* - Your companion for wellness, safety, and care

Elderlyze is a React-based web application designed specifically for elderly care, combining wellness monitoring, emergency response, and health management features. It bridges the gap between elderly users and their caregivers through compassionate technology and accessible design.

## 🎯 Features

### 🤖 **Emotional Chatbot**
- Multilingual AI conversations (English & Urdu)
- Compassionate support powered by Together AI
- Mood-based chat initiation
- Context-aware responses

### 😊 **Mood Detection & Tracking**
- Simple emoji-based mood sensing
- Triggers helpful conversations based on emotional state
- Accessible interface designed for elderly users
- Mood history tracking

### 💊 **Smart Medicine Management**
- Intelligent reminder system with push notifications
- Timezone-aware scheduling across regions
- Dosage tracking and management
- Firebase Cloud Messaging integration
- Customizable reminder frequencies

### 🚨 **Advanced SOS Emergency System**
- **Manual SOS**: One-click emergency alerts
- **Auto SOS**: Automatic alerts after configurable inactivity periods (default: 3 hours)
- **Email Notifications**: Instant emergency emails to family/caregivers
- **GPS Location**: Real-time location sharing in emergencies
- **Contact Management**: Primary and secondary emergency contacts
- **Alert History**: Complete log of all emergency events

### 🏃‍♂️ **Physical Activities & Wellness**
- Guided exercises and yoga routines
- Meditation and wellness videos
- Activity tracking and encouragement
- Personalized wellness recommendations

### 🔒 **Safety & Security**
- Firebase Authentication with secure user management
- Real-time activity monitoring
- Automatic inactivity detection
- HIPAA-compliant data handling
- End-to-end encrypted communications

## 🏗️ Technical Architecture

### Frontend Stack
- **React 18** with modern functional components
- **React Router** for seamless navigation
- **Firebase SDK** (Auth, Firestore, Cloud Messaging)
- **Lucide React** for consistent iconography
- **Responsive Design** with mobile-first approach
- **Progressive Web App** capabilities

### Backend Stack
- **Node.js/Express** server
- **Firebase Admin SDK** for authentication
- **Gmail SMTP** for emergency notifications
- **Cron Jobs** for automated monitoring
- **RESTful API** architecture
- **Luxon** for timezone handling

### Database & Services
- **Firebase Firestore** for real-time data
- **Firebase Authentication** for user management
- **Firebase Cloud Messaging** for push notifications
- **Together AI** for chatbot functionality
- **Gmail API** for emergency communications

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Firebase project with service account
- Gmail account with app password
- Together AI API key

### Frontend Setup

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd elderlyze
   npm install
   ```

2. **Configure Firebase**
   - Update `src/Firebase/firebase.js` with your Firebase config
   - Ensure Firestore and Authentication are enabled

3. **Start development server**
   ```bash
   npm start
   ```
   Open [http://localhost:3000](http://localhost:3000)

### Backend Setup

1. **Navigate to server directory**
   ```bash
   cd Server
   npm install
   ```

2. **Environment Configuration**
   Create `.env` file:
   ```env
   # Gmail Configuration
   GMAIL_USER=your_gmail@gmail.com
   GMAIL_APP_PASSWORD=your_app_password
   
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   ```

3. **Firebase Service Account**
   - Place `serviceAccountKey.json` in Server folder
   - Ensure service account has Firestore permissions

4. **Start server**
   ```bash
   npm start
   ```
   Server runs on [http://localhost:3001](http://localhost:3001)

## 📱 User Experience

### Elderly-Friendly Design
- **Large Buttons**: Easy-to-tap interface elements
- **Clear Typography**: High contrast, readable fonts
- **Simple Navigation**: Intuitive menu structure
- **Voice Guidance**: Audio cues and instructions
- **Accessibility**: WCAG 2.1 AA compliant

### Multilingual Support
- **English**: Full interface and chatbot support
- **Urdu**: Native language support for better accessibility
- **Easy Switching**: One-click language toggle

## 🔧 Configuration

### Firebase Collections Structure
```
users/
  {userId}/
    sosContacts/           # Emergency contacts
    sosSettings/           # SOS configuration  
    sosAlerts/            # Emergency alert history
    lastActivity/         # User activity tracking
    fcmTokens/           # Push notification tokens
    medicines/           # Medicine reminders
```

### API Endpoints
- `POST /api/sos/trigger` - Manual SOS alert
- `POST /api/activity/update` - Update user activity
- `GET /api/sos/history` - Get SOS alert history
- `GET /test/gmail` - Test Gmail connection
- `POST /test/email` - Send test email

## 🛡️ Emergency Response Workflow

### Manual SOS Process
1. User clicks SOS button
2. GPS location automatically captured
3. Emergency emails sent to all contacts
4. Real-time status updates provided
5. Alert logged in system history

### Automatic SOS Process
1. System monitors user activity continuously
2. Detects inactivity beyond threshold (default: 3 hours)
3. Automatically triggers emergency alerts
4. Sends location and inactivity details
5. Notifies all emergency contacts

### Email Alert Format
```
🚨 EMERGENCY SOS ALERT 🚨

URGENT: [UserName] has triggered an emergency SOS alert!

LOCATION: [GPS Coordinates with Google Maps link]
TIME: [Timestamp]
REASON: [Manual trigger or Auto-inactivity]

IMMEDIATE RESPONSE REQUIRED
Please contact [UserName] immediately or call emergency services.

Sent via Elderlyze Emergency System
```

## 🔄 Automated Systems

### Medicine Reminders
- **Frequency**: Every minute check
- **Timezone Support**: Accurate across regions
- **Push Notifications**: Firebase Cloud Messaging
- **Deduplication**: Prevents spam notifications

### Inactivity Monitoring
- **Frequency**: Every 30 minutes
- **Activity Tracking**: Mouse, keyboard, scroll, touch events
- **Smart Detection**: Distinguishes between sleep and emergency
- **Configurable Thresholds**: 1-24 hour options

## 🧪 Testing & Troubleshooting

### Gmail Setup Testing
```bash
# Test Gmail connection
curl -X GET http://localhost:3001/test/gmail

# Send test email
curl -X POST http://localhost:3001/test/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Common Issues
1. **Gmail Authentication**: Ensure app passwords are enabled
2. **Firebase Permissions**: Verify service account roles
3. **Port Conflicts**: Check if ports 3000/3001 are available
4. **CORS Issues**: Verify frontend/backend URL configuration

## 📊 Monitoring & Analytics

### System Metrics
- User engagement patterns
- SOS alert frequency and response times
- Medicine adherence rates
- Activity levels and trends
- Emergency response effectiveness

### Health Insights
- Mood tracking over time
- Physical activity participation
- Medication compliance
- Social interaction levels

## 🤝 Contributing

We welcome contributions to make Elderlyze even better for elderly care!

### Development Guidelines
1. Follow React best practices
2. Maintain accessibility standards
3. Test with elderly users when possible
4. Document all new features
5. Ensure mobile responsiveness

### Code Style
- Use functional components with hooks
- Implement proper error handling
- Follow semantic HTML structure
- Maintain consistent naming conventions

## 📄 License

This project is part of the Elderlyze application suite for elderly care and wellness.

## 🆘 Support

For technical support or questions:
- Check the troubleshooting section
- Review Firebase and Gmail documentation
- Examine server logs for error details
- Verify environment configuration

## 🌟 Acknowledgments

Built with love for elderly care, combining modern technology with human compassion to create a safer, more connected world for our elders and their families.

---

*"Technology should serve humanity, especially those who need it most."*