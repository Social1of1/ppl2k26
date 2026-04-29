// src/app/api/auth/create-user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { email, password, role, teamId } = await req.json();
    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Create Firebase Auth user
    const userRecord = await adminAuth.createUser({ email, password });

    // Get team name if team role
    let teamName = '';
    if (role === 'team' && teamId) {
      const teamDoc = await adminDb.collection('teams').doc(teamId).get();
      teamName = teamDoc.data()?.name || '';
    }

    // Store user profile in Firestore
    await adminDb.collection('users').doc(userRecord.uid).set({
      email,
      role,
      teamId: role === 'team' ? teamId : null,
      teamName: role === 'team' ? teamName : null,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ uid: userRecord.uid, success: true });
  } catch (err: any) {
    console.error('Create user error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
