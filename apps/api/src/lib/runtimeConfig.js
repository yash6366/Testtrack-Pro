const normalizeBaseUrl = (value) => String(value || '').trim().replace(/\/+$/, '');

export const FRONTEND_URL = normalizeBaseUrl(process.env.FRONTEND_URL || 'http://localhost:5173');
export const WEBHOOK_BASE_URL = normalizeBaseUrl(process.env.WEBHOOK_BASE_URL || 'http://localhost:3001');
export const API_DOCS_PRODUCTION_URL = normalizeBaseUrl(process.env.API_DOCS_PRODUCTION_URL || 'https://api.testtrackpro.com');
export const DEV_FRONTEND_ORIGINS = ['http://localhost:5173', 'http://localhost:5174'];
