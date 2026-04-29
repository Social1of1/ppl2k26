// src/app/api/upload-boxscore/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const gameId = req.nextUrl.searchParams.get('gameId');
  if (!gameId) return NextResponse.json({ error: 'Missing gameId' }, { status: 400 });
  const gameDoc = await adminDb.collection('games').doc(gameId).get();
  if (!gameDoc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { boxScoreStatus } = gameDoc.data()!;
  return NextResponse.json({ status: boxScoreStatus });
}
