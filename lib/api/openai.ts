interface OpenAIRequest {
    prompt: string;
    max_tokens?: number;
    temperature?: number;
  }
  
  interface OpenAIChoice {
    text: string;
    index: number;
    logprobs: any;
    finish_reason: string;
  }
  
  interface OpenAIResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: OpenAIChoice[];
  }
  
  export async function fetchOpenAI({
    prompt,
    max_tokens = 100,
    temperature = 0.7,
  }: OpenAIRequest): Promise<OpenAIResponse> {
    // Instead of calling OpenAI directly, call our API route
    const response = await fetch('/api/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        max_tokens,
        temperature,
      }),
    });
  
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch from OpenAI API');
    }
  
    return response.json();
  }