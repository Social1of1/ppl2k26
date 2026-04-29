// src/app/api/upload-boxscore/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { adminDb, adminStorage } = await import('@/lib/firebase-admin');
    const { FieldValue } = await import('firebase-admin/firestore');

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const gameId = formData.get('gameId') as string;
    const teamId = formData.get('teamId') as string;

    if (!file || !gameId || !teamId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const gameDoc = await adminDb.collection('games').doc(gameId).get();
    if (!gameDoc.exists) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    const game = gameDoc.data()!;
    if (game.homeTeamId !== teamId && game.awayTeamId !== teamId) {
      return NextResponse.json({ error: 'Not authorized for this game' }, { status: 403 });
    }
    if (game.boxScoreUrl) {
      return NextResponse.json({ error: 'Box score already submitted' }, { status: 409 });
    }

    const bucket = adminStorage.bucket();
    const fileName = `boxscores/${gameId}_${Date.now()}.${file.name.split('.').pop()}`;
    const fileRef = bucket.file(fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fileRef.save(buffer, { contentType: file.type });
    await fileRef.makePublic();
    const fileUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    await adminDb.collection('games').doc(gameId).update({
      boxScoreUrl: fileUrl,
      boxScoreStatus: 'processing',
      uploadedBy: teamId,
      uploadedAt: new Date().toISOString(),
    });

    processBoxScoreAI(gameId, fileUrl, file.type, game, adminDb, adminStorage, FieldValue).catch(console.error);

    return NextResponse.json({ success: true, fileUrl });
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function processBoxScoreAI(
  gameId: string,
  fileUrl: string,
  mimeType: string,
  game: any,
  adminDb: any,
  adminStorage: any,
  FieldValue: any
) {
  try {
    const GOOGLE_VISION_KEY = process.env.GOOGLE_VISION_API_KEY;
    let extractedText = '';

    if (mimeType !== 'application/pdf') {
      const visionRes = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{
              image: { source: { imageUri: fileUrl } },
              features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
            }],
          }),
        }
      );
      const visionData = await visionRes.json();
      extractedText = visionData.responses?.[0]?.fullTextAnnotation?.text || '';
    }

    if (!extractedText) {
      await adminDb.collection('games').doc(gameId).update({ boxScoreStatus: 'failed' });
      return;
    }

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `Parse this NBA 2K box score and return ONLY valid JSON, no markdown.

Box score:
${extractedText}

Return:
{
  "homeScore": number,
  "awayScore": number,
  "homePlayers": [{"name":"","number":"","position":"","minutes":0,"points":0,"rebounds":0,"assists":0,"steals":0,"blocks":0,"fouls":0,"turnovers":0,"fgm":0,"fga":0,"threePm":0,"threePa":0,"ftm":0,"fta":0}],
  "awayPlayers": []
}`,
        }],
      }),
    });

    const anthropicData = await anthropicRes.json();
    const rawJson = anthropicData.content?.[0]?.text || '';

    let parsed;
    try {
      parsed = JSON.parse(rawJson.replace(/```json\n?|```/g, '').trim());
    } catch {
      await adminDb.collection('games').doc(gameId).update({ boxScoreStatus: 'failed' });
      return;
    }

    await adminDb.collection('boxscores').doc(gameId).set({
      gameId,
      homeTeamId: game.homeTeamId,
      awayTeamId: game.awayTeamId,
      homeScore: parsed.homeScore,
      awayScore: parsed.awayScore,
      homePlayerStats: parsed.homePlayers,
      awayPlayerStats: parsed.awayPlayers,
      rawExtraction: extractedText,
      processedAt: new Date().toISOString(),
    });

    const homeWon = parsed.homeScore > parsed.awayScore;
    await adminDb.collection('games').doc(gameId).update({
      status: 'completed',
      homeScore: parsed.homeScore,
      awayScore: parsed.awayScore,
      boxScoreStatus: 'processed',
    });

    const batch = adminDb.batch();
    batch.update(adminDb.collection('teams').doc(game.homeTeamId), {
      wins: FieldValue.increment(homeWon ? 1 : 0),
      losses: FieldValue.increment(homeWon ? 0 : 1),
      pointsFor: FieldValue.increment(parsed.homeScore),
      pointsAgainst: FieldValue.increment(parsed.awayScore),
    });
    batch.update(adminDb.collection('teams').doc(game.awayTeamId), {
      wins: FieldValue.increment(homeWon ? 0 : 1),
      losses: FieldValue.increment(homeWon ? 1 : 0),
      pointsFor: FieldValue.increment(parsed.awayScore),
      pointsAgainst: FieldValue.increment(parsed.homeScore),
    });
    await batch.commit();

    for (const ps of [...parsed.homePlayers, ...parsed.awayPlayers]) {
      if (!ps.name) continue;
      const teamId = parsed.homePlayers.includes(ps) ? game.homeTeamId : game.awayTeamId;
      const snapshot = await adminDb.collection('players')
        .where('teamId', '==', teamId)
        .where('name', '==', ps.name)
        .limit(1)
        .get();
      if (snapshot.empty) continue;
      await snapshot.docs[0].ref.update({
        gamesPlayed: FieldValue.increment(1),
        totalPoints: FieldValue.increment(ps.points || 0),
        totalRebounds: FieldValue.increment(ps.rebounds || 0),
        totalAssists: FieldValue.increment(ps.assists || 0),
        totalSteals: FieldValue.increment(ps.steals || 0),
        totalBlocks: FieldValue.increment(ps.blocks || 0),
        totalFouls: FieldValue.increment(ps.fouls || 0),
        totalTurnovers: FieldValue.increment(ps.turnovers || 0),
        totalFgm: FieldValue.increment(ps.fgm || 0),
        totalFga: FieldValue.increment(ps.fga || 0),
        total3pm: FieldValue.increment(ps.threePm || 0),
        total3pa: FieldValue.increment(ps.threePa || 0),
        totalFtm: FieldValue.increment(ps.ftm || 0),
        totalFta: FieldValue.increment(ps.fta || 0),
      });
    }

  } catch (err) {
    console.error('AI processing error:', err);
    await adminDb.collection('games').doc(gameId).update({ boxScoreStatus: 'failed' });
  }
}
