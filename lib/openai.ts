// lib/api/openai.ts
export async function fetchOpenAI({ prompt, max_tokens }: { prompt: string; max_tokens: number }) {
    const response = await fetch('https://api.openai.com/v1/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'text-davinci-003', // Update to a newer model if needed
        prompt,
        max_tokens,
        temperature: 0.7,
      }),
    });
    return response.json();
  }