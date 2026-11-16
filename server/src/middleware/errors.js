export function notFound(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'That case could not be found.', requestId: req.id } });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const rawStatus = Number(err?.statusCode || err?.status);
  const status = Number.isInteger(rawStatus) && rawStatus >= 400 && rawStatus < 600 ? rawStatus : 500;
  const isMalformedJson = err?.type === 'entity.parse.failed';
  const isLargeBody = err?.type === 'entity.too.large';
  const isDbError = err?.name === 'MongooseServerSelectionError' || err?.name === 'MongoNetworkError' || (err?.name === 'MongooseError' && /buffering timed out/i.test(err?.message)) || err?.code === 'DATABASE_UNAVAILABLE';
  const effectiveStatus = isDbError ? 503 : status;
  const generationUnavailable = effectiveStatus === 503 && err?.code === 'GENERATION_UNAVAILABLE';
  const dbUnavailable = effectiveStatus === 503 && (isDbError || err?.code === 'DATABASE_UNAVAILABLE');
  const aiProviderFailure = effectiveStatus === 502 && err?.code === 'AI_PROVIDER_ERROR';
  const translationUnavailable = effectiveStatus === 503 && err?.code === 'TRANSLATION_UNAVAILABLE';
  const aiRateLimited = effectiveStatus === 429 && err?.code === 'AI_RATE_LIMITED';
  const aiInvalidResponse = effectiveStatus === 502 && err?.code === 'AI_INVALID_RESPONSE';
  const response = effectiveStatus >= 500
    ? {
        code: dbUnavailable ? 'DATABASE_UNAVAILABLE' : generationUnavailable ? 'GENERATION_UNAVAILABLE' : translationUnavailable ? 'TRANSLATION_UNAVAILABLE' : aiInvalidResponse ? 'AI_INVALID_RESPONSE' : aiProviderFailure ? 'AI_PROVIDER_ERROR' : 'SERVER_ERROR',
        message: dbUnavailable ? 'The database is currently unreachable. Please try again shortly.' : generationUnavailable || aiProviderFailure ? 'Case generation is temporarily unavailable. Please try again.' : aiInvalidResponse ? 'The AI service returned an invalid case. Please retry.' : translationUnavailable ? 'The explanation could not be translated. Please retry.' : 'Something went wrong. Please try again.',
      }
    : {
        code: aiRateLimited ? 'AI_RATE_LIMITED' : isMalformedJson ? 'INVALID_JSON' : isLargeBody ? 'PAYLOAD_TOO_LARGE' : 'INVALID_REQUEST',
        message: aiRateLimited ? 'The AI service is temporarily rate limited. Please wait before retrying.' : isMalformedJson ? 'Request body must contain valid JSON.' : isLargeBody ? 'Request body is too large.' : 'The request could not be processed.',
      };

  if (effectiveStatus >= 500) {
    console.error(JSON.stringify({ requestId: req.id, errorName: err?.name || 'Error', errorCode: typeof err?.code === 'string' ? err.code : undefined, status: effectiveStatus }));
  }
  if ((generationUnavailable || dbUnavailable) && Number.isFinite(err.retryAfterMs) && err.retryAfterMs > 0) res.setHeader('Retry-After', String(Math.max(1, Math.ceil(Math.min(err.retryAfterMs, 30_000) / 1_000))));
  if (aiRateLimited && Number.isFinite(err.retryAfterMs) && err.retryAfterMs > 0) res.setHeader('Retry-After', String(Math.max(1, Math.ceil(Math.min(err.retryAfterMs, 30_000) / 1_000))));
  res.status(effectiveStatus).json({ error: { ...response, requestId: req.id } });
}
