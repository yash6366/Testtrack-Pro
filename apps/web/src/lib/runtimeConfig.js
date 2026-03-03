const normalizeBaseUrl = (value) =>
  String(value || '').trim().replace(/\/+$/, '');

const LOCAL_API_URL = 'http://localhost:3001';

export function getApiBaseUrl() {
  const configuredApiUrl = import.meta.env.VITE_API_URL;

  return normalizeBaseUrl(
    import.meta.env.DEV
      ? LOCAL_API_URL
      : configuredApiUrl || LOCAL_API_URL
  );
}

export const API_BASE_URL = getApiBaseUrl();