'use client';
// src/app/team/upload/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import TeamLayout from '@/components/team/TeamLayout';
import { getGames } from '@/lib/db';
import { Game } from '@/types';
import { useDropzone } from 'react-dropzone';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Upload, FileImage, FileText, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';

type UploadStep = 'select-game' | 'upload-file' | 'processing' | 'done' | 'error';

export default function TeamUploadPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedGameId = searchParams.get('gameId');

  const [myGames, setMyGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<UploadStep>('select-game');
  const [loading, setLoading] = useState(true);
  const [processingMsg, setProcessingMsg] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'team')) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.teamId) {
      getGames({ teamId: user.teamId }).then(games => {
        // Only games that are completed but haven't been uploaded yet
        const eligible = games.filter(g => g.status === 'scheduled' || (g.status === 'completed' && !g.boxScoreUrl));
        setMyGames(eligible);
        if (preselectedGameId) {
          const pre = games.find(g => g.id === preselectedGameId);
          if (pre) { setSelectedGame(pre); setStep('upload-file'); }
        }
        setLoading(false);
      });
    }
  }, [user, preselectedGameId]);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'], 'application/pdf': ['.pdf'] },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  async function handleUpload() {
    if (!selectedGame || !file || !user) return;
    setStep('processing');
    setProcessingMsg('Uploading file...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('gameId', selectedGame.id);
      formData.append('teamId', user.teamId!);

      setProcessingMsg('Uploading to storage...');
      const res = await fetch('/api/upload-boxscore', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setProcessingMsg('Running AI extraction (this may take 20–30s)...');
      // Poll for processing completion
      let attempts = 0;
      const poll = async () => {
        const pollRes = await fetch(`/api/upload-boxscore/status?gameId=${selectedGame.id}`);
        const pollData = await pollRes.json();
        if (pollData.status === 'processed') {
          setStep('done');
          toast.success('Box score processed! Stats have been updated.');
        } else if (pollData.status === 'failed') {
          throw new Error('AI processing failed. Please try again or contact admin.');
        } else if (attempts++ < 20) {
          setTimeout(poll, 3000);
        } else {
          setStep('done');
          toast('File uploaded. Processing in background.', { icon: 'ℹ️' });
        }
      };
      await poll();
    } catch (e: any) {
      setStep('error');
      toast.error(e.message);
    }
  }

  const uploadableGames = myGames.filter(g => !g.boxScoreUrl);

  return (
    <TeamLayout>
      <div className="page-enter max-w-2xl">
        <div className="mb-8">
          <h1 className="ppl-heading text-3xl text-ppl-white">Upload Box Score</h1>
          <p className="text-ppl-gray text-sm mt-1">AI will automatically extract stats and update standings</p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-3 mb-8">
          {[
            { key: 'select-game', label: 'Select Game' },
            { key: 'upload-file', label: 'Upload File' },
            { key: 'processing', label: 'Processing' },
            { key: 'done', label: 'Complete' },
          ].map((s, i, arr) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                step === s.key ? 'bg-ppl-purple text-white' :
                ['done', 'processing', 'upload-file'].includes(step) && i < arr.findIndex(x => x.key === step) ? 'bg-ppl-green text-white' :
                'bg-ppl-black-border text-ppl-gray')}>
                {i + 1}
              </div>
              <span className={cn('text-xs font-semibold hidden sm:block uppercase tracking-wide',
                step === s.key ? 'text-ppl-white' : 'text-ppl-gray')}
                style={{ fontFamily: 'var(--font-display)' }}>
                {s.label}
              </span>
              {i < arr.length - 1 && <div className="w-8 h-px bg-ppl-black-border" />}
            </div>
          ))}
        </div>

        {/* Step 1: Select game */}
        {step === 'select-game' && (
          <div>
            <h2 className="ppl-subheading text-sm text-ppl-white mb-4">Select Your Game</h2>
            {loading ? (
              <div className="skeleton h-40 rounded-xl" />
            ) : uploadableGames.length === 0 ? (
              <div className="ppl-card p-8 text-center">
                <CheckCircle size={32} className="text-ppl-green mx-auto mb-3" />
                <p className="text-ppl-white font-semibold mb-1">All caught up!</p>
                <p className="text-ppl-gray text-sm">All your games have box scores uploaded.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {uploadableGames.map(g => (
                  <button key={g.id} onClick={() => { setSelectedGame(g); setStep('upload-file'); }}
                    className="w-full ppl-card border border-ppl-black-border hover:border-ppl-purple/50 p-4 text-left transition-all group">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-ppl-gray mb-1">{formatDate(g.scheduledDate)} · Week {g.week} · Group {g.group}</p>
                        <p className="font-semibold text-ppl-white">
                          {g.homeTeamName} <span className="text-ppl-gray font-normal">vs</span> {g.awayTeamName}
                        </p>
                      </div>
                      <div className="text-ppl-gray group-hover:text-ppl-purple-light transition-colors">→</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Upload file */}
        {step === 'upload-file' && selectedGame && (
          <div>
            <div className="ppl-card p-4 mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs text-ppl-gray mb-0.5">{formatDate(selectedGame.scheduledDate)} · Week {selectedGame.week}</p>
                <p className="font-semibold text-ppl-white text-sm">{selectedGame.homeTeamName} vs {selectedGame.awayTeamName}</p>
              </div>
              <button onClick={() => { setSelectedGame(null); setFile(null); setStep('select-game'); }}
                className="text-ppl-gray hover:text-ppl-white p-1 transition-colors">
                <X size={14} />
              </button>
            </div>

            <div {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all',
                isDragActive ? 'border-ppl-purple bg-ppl-purple/10' :
                file ? 'border-ppl-green/50 bg-ppl-green/5' :
                'border-ppl-black-border hover:border-ppl-purple/50 hover:bg-ppl-purple/5'
              )}>
              <input {...getInputProps()} />
              {file ? (
                <div>
                  <CheckCircle size={32} className="text-ppl-green mx-auto mb-3" />
                  <p className="font-semibold text-ppl-white mb-1">{file.name}</p>
                  <p className="text-xs text-ppl-gray">{(file.size / 1024 / 1024).toFixed(2)} MB · Click to change</p>
                </div>
              ) : (
                <div>
                  <Upload size={32} className="text-ppl-gray mx-auto mb-3" />
                  <p className="font-semibold text-ppl-white mb-2">Drop box score here</p>
                  <p className="text-ppl-gray text-sm mb-3">or click to browse</p>
                  <div className="flex items-center justify-center gap-4 text-xs text-ppl-gray/60">
                    <span className="flex items-center gap-1"><FileImage size={12} /> JPG, PNG, WebP</span>
                    <span className="flex items-center gap-1"><FileText size={12} /> PDF</span>
                    <span>Max 10MB</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 p-4 bg-ppl-purple/5 border border-ppl-purple/20 rounded-lg">
              <p className="text-xs text-ppl-purple-light font-semibold mb-1 uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
                AI Processing
              </p>
              <p className="text-xs text-ppl-gray">
                After upload, our AI will automatically read the box score, extract all player stats, and update standings. No manual entry needed.
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setFile(null); setStep('select-game'); }} className="ppl-btn-secondary flex-1">
                Back
              </button>
              <button onClick={handleUpload} disabled={!file} className="ppl-btn-primary flex-1 disabled:opacity-40">
                Upload & Process
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Processing */}
        {step === 'processing' && (
          <div className="ppl-card p-10 text-center">
            <Loader2 size={40} className="text-ppl-purple animate-spin mx-auto mb-4" />
            <p className="font-semibold text-ppl-white mb-2">Processing Box Score...</p>
            <p className="text-ppl-gray text-sm">{processingMsg}</p>
            <p className="text-xs text-ppl-gray/50 mt-3">Please don't close this window</p>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 'done' && (
          <div className="ppl-card p-10 text-center">
            <CheckCircle size={48} className="text-ppl-green mx-auto mb-4" />
            <p className="ppl-heading text-2xl text-ppl-white mb-2">Done!</p>
            <p className="text-ppl-gray text-sm mb-6">Stats, standings, and league leaders have been updated.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setStep('select-game'); setFile(null); setSelectedGame(null); }} className="ppl-btn-secondary">
                Upload Another
              </button>
              <button onClick={() => router.push('/team/dashboard')} className="ppl-btn-primary">
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div className="ppl-card border border-ppl-red/30 p-10 text-center">
            <AlertCircle size={40} className="text-ppl-red mx-auto mb-4" />
            <p className="font-semibold text-ppl-white mb-2">Upload Failed</p>
            <p className="text-ppl-gray text-sm mb-6">Please try again or contact the admin.</p>
            <button onClick={() => setStep('upload-file')} className="ppl-btn-secondary">Try Again</button>
          </div>
        )}
      </div>
    </TeamLayout>
  );
}
