import type { RequestHandler } from 'express';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function createOriginMiddleware(trustedOrigins: string | readonly string[]): RequestHandler {
  const trusted = new Set(
    typeof trustedOrigins === 'string' ? [trustedOrigins] : trustedOrigins,
  );
  return (request, response, next) => {
    const requestOrigin = request.get('origin');
    if (SAFE_METHODS.has(request.method) || !requestOrigin || trusted.has(requestOrigin)) {
      next();
      return;
    }

    response.status(403).json({
      statusCode: 403,
      message: '허용되지 않은 출처의 요청입니다.',
    });
  };
}
