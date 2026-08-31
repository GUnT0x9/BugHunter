import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { createOriginMiddleware } from './origin.middleware.js';

function request(method: string, origin?: string): Request {
  return {
    method,
    get: vi.fn().mockReturnValue(origin),
  } as unknown as Request;
}

function response() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return { json, response: { status } as unknown as Response, status };
}

describe('createOriginMiddleware', () => {
  const middleware = createOriginMiddleware('https://bughunter.vercel.app');

  it('allows mutations from the configured web origin', () => {
    const next = vi.fn() as NextFunction;
    middleware(request('POST', 'https://bughunter.vercel.app'), response().response, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('allows mutations from every explicitly trusted deployment origin', () => {
    const next = vi.fn() as NextFunction;
    const allowlist = createOriginMiddleware([
      'https://preview.example',
      'https://codetrace.vercel.app',
    ]);

    allowlist(
      request('POST', 'https://codetrace.vercel.app'),
      response().response,
      next,
    );

    expect(next).toHaveBeenCalledOnce();
  });

  it('allows safe requests and non-browser clients without an Origin header', () => {
    const next = vi.fn() as NextFunction;
    middleware(request('GET', 'https://attacker.example'), response().response, next);
    middleware(request('POST'), response().response, next);

    expect(next).toHaveBeenCalledTimes(2);
  });

  it('rejects cross-origin mutations before they reach a controller', () => {
    const next = vi.fn() as NextFunction;
    const testResponse = response();
    middleware(request('PATCH', 'https://attacker.example'), testResponse.response, next);

    expect(next).not.toHaveBeenCalled();
    expect(testResponse.status).toHaveBeenCalledWith(403);
    expect(testResponse.json).toHaveBeenCalledWith({
      statusCode: 403,
      message: '허용되지 않은 출처의 요청입니다.',
    });
  });
});
