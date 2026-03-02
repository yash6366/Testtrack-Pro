import cors from '@fastify/cors';
import { FRONTEND_URL, DEV_FRONTEND_ORIGINS } from '../lib/runtimeConfig.js';

export async function setupCors(fastify) {
  const normalizeOrigin = (value) => value.trim().replace(/\/+$/, '');
  const extractHostname = (value) => {
    try {
      return new URL(value).hostname.toLowerCase();
    } catch {
      return '';
    }
  };

  const allowList = new Set(
    [FRONTEND_URL, ...DEV_FRONTEND_ORIGINS]
      .filter(Boolean)
      .map(normalizeOrigin),
  );

  const allowPatterns = [/^http:\/\/localhost:\d+$/i, /^http:\/\/127\.0\.0\.1:\d+$/i];

  await fastify.register(cors, {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedOrigin = normalizeOrigin(origin);
      const hostname = extractHostname(normalizedOrigin);

      if (allowList.has(normalizedOrigin)) {
        callback(null, true);
        return;
      }

      if (hostname.endsWith('.vercel.app')) {
        callback(null, true);
        return;
      }

      if (allowPatterns.some((pattern) => pattern.test(normalizedOrigin))) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  });
}
