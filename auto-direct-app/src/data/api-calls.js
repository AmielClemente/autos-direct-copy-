// Environment-based API configuration
const api = process.env.NODE_ENV === 'production' 
  ? 'https://autos-direct-copy.vercel.app/api' 
  : 'http://localhost:3000';

export default api;