const normalizeBaseUrl = (value) => String(value || '').trim().replace(/\/+$/, '');

const DEFAULT_API_URL = 'http://localhost:3001';

export function getApiBaseUrl() {
  return normalizeBaseUrl(import.meta.env.VITE_API_URL || DEFAULT_API_URL);
}

export const API_BASE_URL = getApiBaseUrl();
