import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'TEOS Sentinel AI Engine',
    version: '2.4.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'production',
  });
}
