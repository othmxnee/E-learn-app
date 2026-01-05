const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const FILE_BASE_URL = API_BASE_URL.replace('/api', '');

export { API_BASE_URL, FILE_BASE_URL };
