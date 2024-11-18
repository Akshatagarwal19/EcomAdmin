import { NextRequest, NextResponse } from 'next/server';

// Middleware to handle CORS
export function cors() {
  return {
    'Access-Control-Allow-Origin': '*', // Allow all origins
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true', // Optional, enable if credentials are needed
  };
}

// Handle OPTIONS requests
export function handleOptions(req: NextRequest) {
  if (req.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    const headers = cors();
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }
  return null;
}
