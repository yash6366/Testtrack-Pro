const normalizeBaseUrl = (value) => String(value || '').trim().replace(/\/+$/, '');

const LOCAL_API_URL = 'http://localhost:3001';

function getDefaultApiUrl() {
  if (import.meta.env.DEV) {
    return LOCAL_API_URL;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return LOCAL_API_URL;
}

export function getApiBaseUrl() {
  const configuredApiUrl = import.meta.env.VITE_API_URL;

  return normalizeBaseUrl(configuredApiUrl || getDefaultApiUrl());
}

export const API_BASE_URL = getApiBaseUrl();
