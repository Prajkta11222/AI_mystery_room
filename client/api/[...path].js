function getApiOrigin() {
  const value = process.env.API_ORIGIN;
  if (!value) throw new Error('API_ORIGIN is required for the Vercel API proxy.');

  let origin;
  try {
    origin = new URL(value);
  } catch {
    throw new Error('API_ORIGIN must be a valid HTTPS origin.');
  }
  if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) {
    throw new Error('API_ORIGIN must be an HTTPS origin without credentials, path, query, or fragment.');
  }
  return origin.origin;
}

function copyRequestHeaders(request) {
  const headers = new Headers();
  for (const name of ['accept', 'content-type', 'cookie', 'origin', 'user-agent', 'x-idempotency-key']) {
    const value = request.headers[name];
    if (value) headers.set(name, value);
  }
  return headers;
}

export default async function handler(request, response) {
  const origin = getApiOrigin();
  const path = Array.isArray(request.query?.path) ? request.query.path.join('/') : '';
  const target = `${origin}/api/${path}`;
  const method = request.method || 'GET';
  const body = method === 'GET' || method === 'HEAD' ? undefined : JSON.stringify(request.body);

  const upstream = await fetch(target, {
    method,
    headers: copyRequestHeaders(request),
    body,
  });

  response.status(upstream.status);
  for (const name of ['cache-control', 'content-type', 'etag', 'vary']) {
    const value = upstream.headers.get(name);
    if (value) response.setHeader(name, value);
  }
  const setCookies = typeof upstream.headers.getSetCookie === 'function'
    ? upstream.headers.getSetCookie()
    : [];
  if (setCookies.length) response.setHeader('set-cookie', setCookies);

  const payload = Buffer.from(await upstream.arrayBuffer());
  response.send(payload);
}
