import { NextResponse } from 'next/server';

// Liveness probe for container healthchecks / load balancers.
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
