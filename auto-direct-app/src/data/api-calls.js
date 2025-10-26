// Environment-based API configuration
const getApiUrl = () => {
  // Check if we're in Vercel preview environment
  if (process.env.VERCEL_ENV === 'preview') {
    return 'https://autos-direct-copy-boechuaep-amielclementes-projects.vercel.app';
  }
  
  // Check if we're in production
  if (process.env.NODE_ENV === 'production') {
    return 'https://autos-direct.com.au';
  }
  
  // Default to localhost for development
  return 'http://localhost:3000';
};

const api = getApiUrl();

export default api;