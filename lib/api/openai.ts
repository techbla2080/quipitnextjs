// lib/api/openai.ts
export async function fetchOpenAI({ prompt, max_tokens }: { prompt: string; max_tokens: number }) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Use the latest model (as of March 2025)
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt },
        ],
        max_tokens,
        temperature: 0.7,
      }),
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    return data;
  }