import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, max_tokens = 100 } = body;
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
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
      return NextResponse.json(
        { error: data.error.message },
        { status: 500 }
      );
    }
    
    // Transform the response to match the expected format in your component
    return NextResponse.json({
      id: data.id,
      object: 'text_completion',
      created: Date.now(),
      model: data.model,
      choices: [
        {
          text: data.choices[0].message.content,
          index: 0,
          logprobs: null,
          finish_reason: data.choices[0].finish_reason
        }
      ]
    });
    
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}