// VITE_API_URL may be a full URL (with or without the trailing /api) or a bare
// hostname, which is the form Render's blueprint injects for the API service.
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const withScheme = /^https?:\/\//.test(rawApiUrl) ? rawApiUrl : `https://${rawApiUrl}`;

const FILE_BASE_URL = withScheme.replace(/\/+$/, '').replace(/\/api$/, '');
const API_BASE_URL = `${FILE_BASE_URL}/api`;

export { API_BASE_URL, FILE_BASE_URL };
