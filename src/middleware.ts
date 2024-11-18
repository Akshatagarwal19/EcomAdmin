import { NextRequest, NextResponse } from 'next/server';
import { cors, handleOptions } from './middleware/cors';

export function middleware(req: NextRequest) {
  // Handle preflight OPTIONS requests
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  // Add CORS headers to the response
  const response = NextResponse.next();
  const headers = cors();
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// Apply middleware only to API routes
export const config = {
  matcher: '/api/:path*',
};
