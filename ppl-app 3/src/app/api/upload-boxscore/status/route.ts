// src/app/api/upload-boxscore/status/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const gameId = req.nextUrl.searchParams.get('gameId');
  if (!gameId) return NextResponse.json({ error: 'Missing gameId' }, { status: 400 });
  const { adminDb } = await import('@/lib/firebase-admin');
  const gameDoc = await adminDb.collection('games').doc(gameId).get();
  if (!gameDoc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { boxScoreStatus } = gameDoc.data()!;
  return NextResponse.json({ status: boxScoreStatus });
}
