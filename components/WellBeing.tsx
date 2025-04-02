// components/WellBeing.tsx
import { useState, useEffect } from 'react';
import { fetchOpenAI } from '../lib/api/openai';

export default function WellBeing() {
  const [showBreak, setShowBreak] = useState(false);
  const [mood, setMood] = useState('');
  const [tip, setTip] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setShowBreak(true), 2 * 60 * 60 * 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleMood = async () => {
    if (mood) {
      const response = await fetchOpenAI({
        prompt: `User feels ${mood}. Suggest a break activity.`,
        max_tokens: 50,
      });
      setTip(response.choices[0].text.trim());
    }
  };

  return (
    <div className="mt-4">
      {showBreak && <p className="text-green-700">Take a break!</p>}
      <select value={mood} onChange={(e) => setMood(e.target.value)} className="border p-2">
        <option value="">How are you?</option>
        <option value="Tired">Tired</option>
        <option value="Good">Good</option>
      </select>
      <button onClick={handleMood} className="ml-2 bg-green-500 text-white p-2">Get Tip</button>
      {tip && <p className="text-gray-700 dark:text-gray-300">{tip}</p>}
    </div>
  );
}