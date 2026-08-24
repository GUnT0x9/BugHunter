import type { RequestHandler } from 'express';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function createOriginMiddleware(trustedOrigin: string): RequestHandler {
  return (request, response, next) => {
    const requestOrigin = request.get('origin');
    if (SAFE_METHODS.has(request.method) || !requestOrigin || requestOrigin === trustedOrigin) {
      next();
      return;
    }

    response.status(403).json({
      statusCode: 403,
      message: '허용되지 않은 출처의 요청입니다.',
    });
  };
}
