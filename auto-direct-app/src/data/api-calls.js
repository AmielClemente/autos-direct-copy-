// Environment-based API configuration
const getApiUrl = () => {
  // Check if we're running on Vercel (both preview and production)
  if (process.env.VERCEL) {
    return 'https://autos-direct-copy-7qecv5v6b-amielclementes-projects.vercel.app';
  }
  
  // Default to localhost for development
  return 'http://localhost:3000';
};

const api = getApiUrl();

export default api;