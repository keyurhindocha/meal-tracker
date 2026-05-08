import { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, ChefHat } from 'lucide-react';
import { isGeminiConfigured, getRecommendations } from '../gemini';

export default function SuggestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [preferences, setPreferences] = useState('');
  const configured = isGeminiConfigured();

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setResult('');
    try {
      const text = await getRecommendations(preferences || undefined);
      setResult(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get recommendations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-md shadow-pink-500/30">
            <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-pink-700">AI Suggest</p>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">What should I eat?</h2>
        <p className="text-sm text-slate-500 mt-1">
          Personalized meal ideas based on your recent history
        </p>
      </div>

      {!configured && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-amber-900 font-semibold text-sm">Gemini API key not configured</p>
            <p className="text-amber-800 text-sm mt-1">
              Add your Google Gemini API key to <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">.env</code> as{' '}
              <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">VITE_GEMINI_API_KEY</code>, then restart the dev server.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl card-soft p-5 md:p-6">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
          Any preferences? <span className="text-slate-400 normal-case font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={preferences}
          onChange={e => setPreferences(e.target.value)}
          placeholder="e.g., vegetarian, high protein, Korean food…"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow mb-4"
        />

        <button
          onClick={handleGenerate}
          disabled={loading || !configured}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-primary-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Get Suggestions</>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-2xl p-4 scale-in">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {!result && !error && !loading && configured && (
        <div className="mt-6 flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center mb-3">
            <ChefHat className="w-7 h-7 text-primary-600" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Ready when you are</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Hit "Get Suggestions" to receive 5 ideas per meal type tailored to what you've eaten lately.
          </p>
        </div>
      )}

      {result && (
        <div className="mt-6 bg-white rounded-2xl card-soft p-5 md:p-6 scale-in">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-600" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">Recommendations</h3>
          </div>
          <div className="prose prose-sm prose-slate max-w-none whitespace-pre-line">
            {formatResult(result)}
          </div>
        </div>
      )}
    </div>
  );
}

function formatResult(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      return <h4 key={i} className="text-base font-bold text-slate-900 mt-5 mb-2 first:mt-0">{line.replace(/\*\*/g, '')}</h4>;
    }
    if (line.match(/^\d+\./)) {
      return <p key={i} className="text-slate-700 ml-1 mb-1.5 leading-relaxed">{line}</p>;
    }
    return line.trim() ? <p key={i} className="text-slate-600 leading-relaxed">{line}</p> : <br key={i} />;
  });
}
