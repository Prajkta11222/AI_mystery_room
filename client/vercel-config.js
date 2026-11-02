const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

export function createVercelConfig(apiOrigin) {
  if (!apiOrigin) throw new Error('Set API_ORIGIN to the HTTPS origin of the backend host.');

  let backend;
  try {
    backend = new URL(apiOrigin);
  } catch {
    throw new Error('API_ORIGIN must be a valid HTTPS origin.');
  }
  if (backend.protocol !== 'https:' || backend.username || backend.password || backend.pathname !== '/' || backend.search || backend.hash) {
    throw new Error('API_ORIGIN must be an HTTPS origin without credentials, path, query, or fragment.');
  }

  return {
    rewrites: [
      { source: '/api/:path*', destination: `${backend.origin}/api/:path*` },
      { source: '/(.*)', destination: '/index.html' },
    ],
    headers: [{
      source: '/(.*)',
      headers: [
        { key: 'Content-Security-Policy', value: contentSecurityPolicy },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'no-referrer' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    }],
  };
}
