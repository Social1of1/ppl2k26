// src/app/api/upload-boxscore/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const gameId = formData.get('gameId') as string;
    const teamId = formData.get('teamId') as string;

    if (!file || !gameId || !teamId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    // Check game exists and team is authorized
    const gameDoc = await adminDb.collection('games').doc(gameId).get();
    if (!gameDoc.exists) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    const game = gameDoc.data()!;
    if (game.homeTeamId !== teamId && game.awayTeamId !== teamId) {
      return NextResponse.json({ error: 'Not authorized for this game' }, { status: 403 });
    }
    if (game.boxScoreUrl) {
      return NextResponse.json({ error: 'Box score already submitted for this game' }, { status: 409 });
    }

    // Upload to Firebase Storage
    const bucket = adminStorage.bucket();
    const fileName = `boxscores/${gameId}_${Date.now()}.${file.name.split('.').pop()}`;
    const fileRef = bucket.file(fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fileRef.save(buffer, { contentType: file.type });
    await fileRef.makePublic();
    const fileUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Update game with pending status
    await adminDb.collection('games').doc(gameId).update({
      boxScoreUrl: fileUrl,
      boxScoreStatus: 'processing',
      uploadedBy: teamId,
      uploadedAt: new Date().toISOString(),
    });

    // Run AI extraction asynchronously
    processBoxScoreAI(gameId, fileUrl, file.type, game).catch(console.error);

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
  game: any
) {
  try {
    const GOOGLE_VISION_KEY = process.env.GOOGLE_VISION_API_KEY;
    let extractedText = '';

    if (mimeType !== 'application/pdf') {
      // Use Google Vision OCR for images
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
    } else {
      // For PDFs, use Document AI or a simplified OCR approach
      extractedText = `PDF uploaded. Manual review may be needed.`;
    }

    if (!extractedText) {
      await adminDb.collection('games').doc(gameId).update({ boxScoreStatus: 'failed' });
      return;
    }

    // Use Claude/Anthropic API to parse box score from OCR text
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
          content: `Parse this NBA 2K box score text and return ONLY valid JSON (no markdown, no explanation).

Box score text:
${extractedText}

Return this exact JSON structure:
{
  "homeScore": number,
  "awayScore": number,
  "homePlayers": [
    {
      "name": "string",
      "number": "string",
      "position": "string",
      "minutes": number,
      "points": number,
      "rebounds": number,
      "assists": number,
      "steals": number,
      "blocks": number,
      "fouls": number,
      "turnovers": number,
      "fgm": number,
      "fga": number,
      "threePm": number,
      "threePa": number,
      "ftm": number,
      "fta": number
    }
  ],
  "awayPlayers": [ /* same structure */ ]
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

    // Save box score document
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

    // Update game result
    const homeWon = parsed.homeScore > parsed.awayScore;
    await adminDb.collection('games').doc(gameId).update({
      status: 'completed',
      homeScore: parsed.homeScore,
      awayScore: parsed.awayScore,
      boxScoreStatus: 'processed',
    });

    // Update team standings
    const batch = adminDb.batch();
    const homeRef = adminDb.collection('teams').doc(game.homeTeamId);
    const awayRef = adminDb.collection('teams').doc(game.awayTeamId);
    batch.update(homeRef, {
      wins: FieldValue.increment(homeWon ? 1 : 0),
      losses: FieldValue.increment(homeWon ? 0 : 1),
      pointsFor: FieldValue.increment(parsed.homeScore),
      pointsAgainst: FieldValue.increment(parsed.awayScore),
    });
    batch.update(awayRef, {
      wins: FieldValue.increment(homeWon ? 0 : 1),
      losses: FieldValue.increment(homeWon ? 1 : 0),
      pointsFor: FieldValue.increment(parsed.awayScore),
      pointsAgainst: FieldValue.increment(parsed.homeScore),
    });
    await batch.commit();

    // Update player stats — match by name
    const updatePlayerStats = async (playerStats: any[], teamId: string) => {
      for (const ps of playerStats) {
        if (!ps.name) continue;
        const snapshot = await adminDb.collection('players')
          .where('teamId', '==', teamId)
          .where('name', '==', ps.name)
          .limit(1)
          .get();
        if (snapshot.empty) continue;
        const playerRef = snapshot.docs[0].ref;
        await playerRef.update({
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
    };

    await Promise.all([
      updatePlayerStats(parsed.homePlayers, game.homeTeamId),
      updatePlayerStats(parsed.awayPlayers, game.awayTeamId),
    ]);

  } catch (err) {
    console.error('AI processing error:', err);
    await adminDb.collection('games').doc(gameId).update({ boxScoreStatus: 'failed' });
  }
}
