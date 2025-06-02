import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('Missing OpenAI API key');
      return NextResponse.json(
        { success: false, error: 'Server configuration error: API key not set' },
        { status: 500 }
      );
    }

    const contentType = req.headers.get('content-type') || '';
    let description = '';
    let cuisineType = '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      description = body.description || '';
    } else {
      try {
        const formData = await req.formData();
        console.log("FormData received for recipe generation");

        const dishName = formData.get('dishName') as string;
        const cuisine = formData.get('cuisine') as string;
        const dishType = formData.get('dishType') as string;
        const customPrompt = formData.get('prompt') as string;

        let ingredients: string[] = [];
        const ingredientsStr = formData.get('ingredients') as string;
        if (ingredientsStr) {
          try {
            ingredients = JSON.parse(ingredientsStr);
          } catch (e) {
            console.warn('Failed to parse ingredients JSON:', e);
          }
        }

        description = `${dishName}, a ${dishType} dish in ${cuisine} cuisine`;
        if (ingredients && ingredients.length > 0) {
          description += ` with ${ingredients.join(', ')}`;
        }
        if (customPrompt && customPrompt.trim()) {
          description += ". " + customPrompt;
        }

        cuisineType = cuisine;

        console.log(`Parsed FormData: dish="${dishName}", cuisine="${cuisine}", type="${dishType}"`);
        console.log(`Ingredients: ${ingredients.join(', ')}`);
      } catch (error) {
        console.error('Failed to parse FormData:', error);
        return NextResponse.json(
          { success: false, error: 'Invalid request format. Failed to parse request data.' },
          { status: 400 }
        );
      }
    }

    if (!description) {
      return NextResponse.json(
        { success: false, error: 'Recipe description/dish name is required' },
        { status: 400 }
      );
    }

    console.log(`Generating recipe image for: ${description}`);

    let enhancedPrompt = `Create a photo realistic image clearly illustrating all the ingredients needed for ${description}. All ingredients should be neatly arranged and clearly visible in a clean, minimalist layout. Each ingredient should be separate, properly proportioned, with clean lighting on a neutral light background. No finished dish should be shown, only the raw ingredients. Each ingredient should be identifiable and placed in its own section of the frame.`;

    console.log("Enhanced prompt:", enhancedPrompt);

    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: enhancedPrompt,
      size: "1024x1024",
      n: 1
    });

    console.log("OpenAI API response received");

    if (!response.data || response.data.length === 0) {
      console.error('No image data in response:', response);
      return NextResponse.json(
        { success: false, error: 'No image data received from generation API' },
        { status: 500 }
      );
    }

    const imageBase64 = response.data[0].b64_json;

    if (!imageBase64) {
      console.error('Missing image data in response');
      return NextResponse.json(
        { success: false, error: 'Invalid response format from image generation API' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      result: {
        imageBase64,
        prompt: enhancedPrompt
      },
    });
  } catch (error: any) {
    // Type guard to check if error has a response property
    const hasResponse = (err: any): err is { response: { data: any } } => 'response' in err;

    if (error instanceof OpenAI.APIError) {
      console.error('OpenAI API error:', {
        message: error.message,
        name: error.name,
        status: error.status,
        response: hasResponse(error) ? error.response?.data : undefined // Safely access response
      });

      if (error.status === 400) {
        return NextResponse.json(
          { success: false, error: `Invalid request to OpenAI API: ${error.message}` },
          { status: 400 }
        );
      }

      if (error.status === 429) {
        return NextResponse.json(
          { success: false, error: `Rate limit exceeded. Please try again later.` },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { success: false, error: `OpenAI API error: ${error.message}`, details: error.status },
        { status: error.status || 500 }
      );
    }

    console.error('Error in generate-recipe-image API:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });

    return NextResponse.json(
      { success: false, error: 'Failed to generate recipe image: ' + error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get('user_id');
    if (!user_id) {
      return NextResponse.json({ success: false, error: 'Missing user_id' }, { status: 400 });
    }

    // Fetch only images of type 'generate-recipe-image' for this user
    const { data, error } = await supabase
      .from('saved_images')
      .select('*')
      .eq('user_id', user_id)
      .in('type', ['generate-recipe-image', 'generate-recipe'])
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, result: { images: data } }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}