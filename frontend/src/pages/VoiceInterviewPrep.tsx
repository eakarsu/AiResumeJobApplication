import { useEffect, useRef, useState } from 'react';
import api from '../services/api';

/**
 * Uses the browser's webkitSpeechRecognition (Chrome / Edge) for live STT.
 * The transcript + timing are sent to /api/voice-prep/analyze, which runs
 * the existing AI rubric scorer plus filler-word + WPM analytics.
 */
export default function VoiceInterviewPrep() {
  const [question, setQuestion] = useState('Tell me about a time you led a difficult project.');
  const [context, setContext] = useState('');
  const [transcript, setTranscript] = useState('');
  const [recording, setRecording] = useState(false);
  const [supported, setSupported] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const recRef = useRef<any>(null);

  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    setSupported(!!SR);
  }, []);

  const start = () => {
    setError(null);
    setTranscript('');
    setAnalysis(null);
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      setError('Speech recognition not supported in this browser. Use Chrome or Edge.');
      return;
    }
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = 'en-US';
    r.onresult = (ev: any) => {
      let final = '';
      for (let i = 0; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) final += ev.results[i][0].transcript + ' ';
      }
      setTranscript(final);
    };
    r.onerror = (ev: any) => setError(`Recognition error: ${ev.error}`);
    r.onend = () => setRecording(false);
    recRef.current = r;
    startedAtRef.current = Date.now();
    r.start();
    setRecording(true);
  };

  const stop = () => {
    try { recRef.current?.stop(); } catch {}
    setRecording(false);
  };

  const submit = async () => {
    if (!transcript.trim()) {
      setError('Record something first.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const durationSec = startedAtRef.current
        ? Math.round((Date.now() - startedAtRef.current) / 1000)
        : undefined;
      const res = await api.post('/voice-prep/analyze', {
        question,
        transcript,
        context,
        durationSec,
      });
      setAnalysis(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Analysis failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Voice Interview Practice</h1>
        <p className="text-gray-500 text-sm">
          Record your answer in-browser. The AI scores it on a 5-criterion rubric and reports filler words + speaking pace.
        </p>
      </div>

      {!supported && (
        <div className="bg-amber-50 text-amber-700 px-3 py-2 rounded text-sm">
          Live speech recognition isn't supported in this browser. You can still type or paste a transcript below.
        </div>
      )}
      {error && <div className="bg-red-50 text-red-700 px-3 py-2 rounded">{error}</div>}

      <div className="bg-white border rounded p-4 space-y-3">
        <input
          className="border p-2 rounded w-full"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Interview question"
        />
        <input
          className="border p-2 rounded w-full"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Optional role / context"
        />

        <div className="flex gap-2">
          {!recording ? (
            <button onClick={start} className="bg-emerald-600 text-white px-4 py-2 rounded">
              Start recording
            </button>
          ) : (
            <button onClick={stop} className="bg-red-600 text-white px-4 py-2 rounded">
              Stop
            </button>
          )}
          <button onClick={submit} disabled={busy || !transcript.trim()} className="bg-primary-600 text-white px-4 py-2 rounded">
            {busy ? 'Analysing…' : 'Analyse answer'}
          </button>
        </div>

        <textarea
          className="border p-2 rounded w-full h-32"
          placeholder="Live transcript appears here (or paste one)…"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
        />
      </div>

      {analysis && (
        <div className="bg-white border rounded p-4 space-y-3">
          <h2 className="font-semibold">Score: {analysis.evaluation?.score}/10</h2>
          <p className="text-sm whitespace-pre-wrap text-gray-700">{analysis.evaluation?.feedback}</p>
          {!!analysis.evaluation?.improvements?.length && (
            <ul className="list-disc ml-5 text-sm">
              {analysis.evaluation.improvements.map((s: string, i: number) => <li key={i}>{s}</li>)}
            </ul>
          )}

          <div className="text-sm bg-gray-50 p-3 rounded">
            <div><strong>Words:</strong> {analysis.voiceMetrics?.wordCount} · <strong>WPM:</strong> {analysis.voiceMetrics?.wpm} ({analysis.voiceMetrics?.paceLabel})</div>
            <div><strong>Filler words:</strong> {analysis.voiceMetrics?.totalFillers}</div>
            {analysis.voiceMetrics?.fillerBreakdown && (
              <pre className="text-xs mt-1">{JSON.stringify(analysis.voiceMetrics.fillerBreakdown, null, 2)}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
