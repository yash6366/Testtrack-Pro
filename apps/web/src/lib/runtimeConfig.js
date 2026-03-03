const normalizeBaseUrl = (value) =>
  String(value || '').trim().replace(/\/+$/, '');

function getApiBaseUrl() {
  const url =
    import.meta.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return normalizeBaseUrl(url);
}

export const API_BASE_URL = getApiBaseUrl();