// Environment-based API configuration
const api = process.env.NODE_ENV === 'production' 
  ? 'https://autos-direct-copy-dw3pes44v-amielclementes-projects.vercel.app' 
  : 'http://localhost:3000';

export default api;