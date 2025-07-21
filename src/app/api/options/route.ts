import { NextResponse } from 'next/server';

// Handle OPTIONS requests that might be coming from Vercel Analytics
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    },
  });
}

// Also handle GET in case it's needed
export async function GET() {
  return NextResponse.json({
    message: 'OPTIONS endpoint for CORS preflight requests',
    timestamp: new Date().toISOString(),
  });
}
