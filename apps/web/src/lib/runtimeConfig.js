const normalizeBaseUrl = (value) => String(value || '').trim().replace(/\/+$/, '');

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function getApiBaseUrl() {
  return normalizeBaseUrl(API_URL);
}

export const API_BASE_URL = getApiBaseUrl();
