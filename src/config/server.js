// Server configuration
export const SERVER_CONFIG = {
  // Development server
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-server.com' 
    : 'http://localhost:3001',
  
  // API endpoints
  ENDPOINTS: {
    BASE: '', // Empty string for base URL
    SOS_TRIGGER: '/api/sos/trigger',
    ACTIVITY_UPDATE: '/api/activity/update',
    SOS_HISTORY: '/api/sos/history',
    TEST_GMAIL: '/test/gmail',
    TEST_EMAIL: '/test/email'
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  return `${SERVER_CONFIG.BASE_URL}${endpoint}`;
};
