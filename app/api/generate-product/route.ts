import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { toFile } from 'openai/uploads';
import { createClient } from '@supabase/supabase-js';

// Add timeout configuration for long-running requests
export const maxDuration = 300; // 5 minutes (300 seconds)
export const runtime = 'nodejs';

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

    let formData: FormData;
    try {
      formData = await req.formData();
      console.log('FormData received for product generation');
    } catch (error) {
      console.error('Failed to parse FormData:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid request format. Expected FormData.' },
        { status: 400 }
      );
    }

    const productType = formData.get('productType') as string;
    const designStyle = formData.get('designStyle') as string;
    const prompt = formData.get('prompt') as string;
    const imageFile = formData.get('image') as File | null;

    if (!productType) {
      return NextResponse.json(
        { success: false, error: 'Product type is required' },
        { status: 400 }
      );
    }
    if (!designStyle) {
      return NextResponse.json(
        { success: false, error: 'Design style is required' },
        { status: 400 }
      );
    }

    console.log(`Generating product design: ${productType}, style: ${designStyle}`);
    if (imageFile) {
      console.log(`Image file: ${imageFile.name}, size: ${imageFile.size} bytes`);
    }

    let enhancedPrompt;
    let response;

    try {
      if (imageFile) {
        if (!imageFile.type.startsWith('image/')) {
          return NextResponse.json(
            { success: false, error: 'File must be an image' },
            { status: 400 }
          );
        }
        if (imageFile.size > 10 * 1024 * 1024) {
          return NextResponse.json(
            { success: false, error: 'Image size must be less than 10MB' },
            { status: 400 }
          );
        }

        enhancedPrompt = `Create a photo realistic redesign of this ${productType} with a ${designStyle} style. The design should be clean, modern, and visually striking. Maintain the exact same perspective, proportions, and background as the original image. Only change the design style, colors, and decorative elements. ${prompt || ''}`;
        console.log('Enhanced prompt for reimagine:', enhancedPrompt);

        const openaiImageFile = await toFile(imageFile);

        response = await openai.images.edit({
          model: 'gpt-image-1',
          image: openaiImageFile,
          prompt: enhancedPrompt,
          n: 1,
          size: '1024x1024',
        });
      } else {
        enhancedPrompt = prompt;
        console.log('Prompt for product designer (user only):', enhancedPrompt);

        response = await openai.images.generate({
          model: 'gpt-image-1',
          prompt: enhancedPrompt,
          n: 1,
          size: '1024x1024',
        });
      }

      console.log('OpenAI API response:', JSON.stringify(response, null, 2));

      if (!response.data || response.data.length === 0) {
        console.error('No image data in response:', response);
        return NextResponse.json(
          { success: false, error: 'No image data received from generation API' },
          { status: 500 }
        );
      }

      let imageUrl: string;
      if (response.data[0].b64_json) {
        imageUrl = `data:image/png;base64,${response.data[0].b64_json}`;
      } else if (response.data[0].url) {
        imageUrl = response.data[0].url;
      } else {
        console.error('Missing image data in response:', response.data);
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid response format from image generation API',
            details: response.data,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        result: {
          imageUrl,
          productType,
          designStyle,
          prompt: enhancedPrompt,
        },
      });
    } catch (openaiError: any) {
      const hasResponse = (err: any): err is { response: { data: any } } =>
        'response' in err;

      console.error('OpenAI API error:', {
        message: openaiError.message,
        name: openaiError.name,
        status: openaiError.status,
        response: hasResponse(openaiError) ? openaiError.response?.data : undefined,
      });

      if (openaiError.status === 400) {
        return NextResponse.json(
          { success: false, error: `Invalid request to OpenAI API: ${openaiError.message}` },
          { status: 400 }
        );
      }
      if (openaiError.status === 429) {
        return NextResponse.json(
          { success: false, error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      if (openaiError.status === 401) {
        return NextResponse.json(
          { success: false, error: 'Authentication error with OpenAI API.' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: `OpenAI API error: ${openaiError.message}`,
          details: hasResponse(openaiError) ? openaiError.response?.data : undefined,
        },
        { status: openaiError.status || 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in generate-product API:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });

    return NextResponse.json(
      { success: false, error: 'Failed to generate product design: ' + error.message },
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

    // Fetch only images of type 'generate-product' for this user
    const { data, error } = await supabase
      .from('saved_images')
      .select('*')
      .eq('user_id', user_id)
      .eq('type', 'generate-product')
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