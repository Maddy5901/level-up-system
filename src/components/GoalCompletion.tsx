import { useState } from 'react';
import { completeGoal } from '../core/gamification/gamificationService.js';

interface GoalCompletionProps {
  goalId: string;
  goalTitle?: string;
}

export function GoalCompletion({ goalId, goalTitle = 'Goal' }: GoalCompletionProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [quality, setQuality] = useState(7);

  async function handleCompleteGoal() {
    setLoading(true);
    setError(null);
    
    try {
      // ✅ Generate FRESH UUID on every button press (idempotency)
      const completionRequestId = crypto.randomUUID();

      const result = await completeGoal({
        goalId,
        quality,
        completionRequestId
      });

      setResult(result);
      console.log('✅ Goal completed!', {
        xpEarned: result.xpEarned,
        leveledUp: result.leveledUp,
        newLevel: result.newLevel
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(message);
      console.error('❌ Failed to complete goal:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 border border-slate-300 rounded-lg">
      <h3 className="text-lg font-bold mb-4">{goalTitle}</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Quality Rating: {quality}/10
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={quality}
          onChange={(e) => setQuality(Number(e.target.value))}
          className="w-full"
          disabled={loading}
        />
      </div>

      <button
        onClick={handleCompleteGoal}
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
      >
        {loading ? 'Completing...' : 'Complete Goal'}
      </button>

      {result && (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 rounded-lg text-green-800">
          <p className="font-bold">✅ Success!</p>
          <p>+{result.xpEarned} XP earned</p>
          {result.leveledUp && <p>🎉 Level up! Now level {result.newLevel}</p>}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 rounded-lg text-red-800">
          <p className="font-bold">❌ Error</p>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}