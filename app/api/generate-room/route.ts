export const maxDuration = 300; // 5 minutes (300 seconds)
export const runtime = 'nodejs';
 
 // app/api/generate-room/route.ts
  import { NextRequest, NextResponse } from 'next/server';
  import OpenAI from 'openai';
  import { toFile } from 'openai/uploads';
  import { createClient } from '@supabase/supabase-js';

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Quality settings map to control generation parameters
  const qualitySettings = {
    'standard': {
      size: "1024x1024"
    },
    'premium': {
      size: "1024x1024"
    },
    'ultra': {
      size: "1024x1024"
    }
  };

  export async function POST(req: NextRequest) {
    try {
      // Check if API key is configured
      if (!process.env.OPENAI_API_KEY) {
        console.error('Missing OpenAI API key');
        return NextResponse.json(
          { success: false, error: 'Server configuration error: API key not set' },
          { status: 500 }
        );
      }

      // Check subscription limits
      const { auth } = await import("@clerk/nextjs/server");
      const { userId } = auth();
      
      if (!userId) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }

      // Import and check user limits
      const { connectDB } = await import('@/lib/mongodb');
      const { User } = await import('@/models/User');
      
      await connectDB();
      let user = await User.findOne({ userId });
      
      if (!user) {
        user = await User.create({
          userId,
          tripCount: 0,
          imageCount: 0,
          subscriptionStatus: 'free'
        });
      }

      // Check if subscription has expired
      if (user.subscriptionStatus === 'pro' && user.subscriptionEndDate) {
        const now = new Date();
        if (now > user.subscriptionEndDate) {
          user = await User.findOneAndUpdate(
            { userId },
            {
              $set: {
                subscriptionStatus: 'free',
                subscriptionStartDate: undefined,
                subscriptionEndDate: undefined,
              },
            },
            { new: true }
          );
        }
      }

      // Get actual image count from Supabase
      const { data: images, error: imageError } = await supabase
        .from('saved_images')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);
      
      const actualImageCount = images?.length || 0;

      // Check if user can create more images
      if (user.subscriptionStatus === 'free' && actualImageCount >= 1) {
        return NextResponse.json({ 
          success: false, 
          error: 'Image limit reached. Upgrade to Pro for unlimited images.',
          limitReached: true,
          currentImages: actualImageCount,
          limit: 1
        }, { status: 403 });
      }

      // Parse FormData
      let formData: FormData;
      try {
        formData = await req.formData();
        console.log("FormData received for room generation");
      } catch (error) {
        console.error('Failed to parse FormData:', error);
        return NextResponse.json(
          { success: false, error: 'Invalid request format. Expected FormData.' },
          { status: 400 }
        );
      }

      // Get values from formData
      const imageFile = formData.get('image') as File;
      const style = formData.get('style') as string;
      const prompt = formData.get('prompt') as string;
      const quality = (formData.get('quality') as string) || 'standard';

      // Validate required fields
      if (!imageFile) {
        return NextResponse.json(
          { success: false, error: 'Room image file is required' },
          { status: 400 }
        );
      }

      if (!style) {
        return NextResponse.json(
          { success: false, error: 'Style selection is required' },
          { status: 400 }
        );
      }

      // Set quality parameters based on selected tier
      const qualitySetting = qualitySettings[quality as keyof typeof qualitySettings] || qualitySettings.standard;
      
      console.log(`Generating room design with style: ${style}, quality: ${quality}`);
      console.log(`Prompt: ${prompt}`);
      console.log(`Image file: ${imageFile.name}, size: ${imageFile.size} bytes`);

      try {
        // Convert the image file to an OpenAI-compatible format
        const openaiImageFile = await toFile(imageFile);
        
        // Build the enhanced prompt that includes style and quality cues
        let enhancedPrompt = `Transform this room into a ${style} style. Maintain the exact same camera angle, perspective, and architectural features (including window placement, door positions, room dimensions, and structural elements). Only change the design style, furnishings, colors, and decorative elements.`;
        
        // Add quality cues based on the selected tier
        if (quality === 'premium') {
          enhancedPrompt += " Create a high-quality rendering with good lighting and detailed textures while preserving the original spatial arrangement and perspective.";
        } else if (quality === 'ultra') {
          enhancedPrompt += " Create an ultra-detailed photorealistic rendering with professional lighting, realistic materials, and fine details. Ensure the room's proportions and viewing angle remain identical to the original image.";
        }
        
        // Add the user's custom prompt if provided
        if (prompt && prompt.trim()) {
          enhancedPrompt += " It is absolutely critical that the output maintains the exact same viewing angle and perspective as the input image to ensure realism.";
        }
        
        console.log("Enhanced prompt:", enhancedPrompt);
        
        console.log("Starting OpenAI image edit call...");
        const response = await openai.images.edit({
          model: "gpt-image-1",
          image: openaiImageFile, // Pass the processed image file
          prompt: enhancedPrompt,
          size: "1024x1024", // Using only the valid size for the current API
        });
        console.log("OpenAI image edit call finished.");
        
        if (!response.data || response.data.length === 0) {
          console.error('No image data in response:', response);
          return NextResponse.json(
            { success: false, error: 'No image data received from generation API' },
            { status: 500 }
          );
        }

        // Check if we have b64_json or url in the response
        let imageUrl: string;
        
        if (response.data[0].b64_json) {
          imageUrl = `data:image/png;base64,${response.data[0].b64_json}`;
        } else if (response.data[0].url) {
          imageUrl = response.data[0].url;
        } else {
          console.error('Missing image data in response');
          return NextResponse.json(
            { success: false, error: 'Invalid response format from image generation API' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          result: {
            imageUrl,
            style,
            quality
          },
        });
      } catch (openaiError: any) {
        console.error('OpenAI API error:', {
          message: openaiError.message,
          name: openaiError.name,
          status: openaiError.status,
          response: openaiError.response?.data
        });
        
        // Check for specific API-related errors
        if (openaiError.status === 400) {
          return NextResponse.json(
            { 
              success: false, 
              error: `Invalid request to OpenAI API: ${openaiError.message}`,
            },
            { status: 400 }
          );
        }
        
        return NextResponse.json(
          { 
            success: false, 
            error: `OpenAI API error: ${openaiError.message}`,
            details: openaiError.status
          },
          { status: openaiError.status || 500 }
        );
      }
    } catch (error: any) {
      // General error handling
      console.error('Error in generate-room API:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });

      return NextResponse.json(
        { success: false, error: 'Failed to generate room design: ' + error.message },
        { status: 500 }
      );
    }
  }

  export async function GET(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url);
      const user_id = searchParams.get('user_id');
      if (!user_id) {
        return NextResponse.json({ success: false, error: 'Missing user_id' }, { status: 400 });
      }
      const { data, error } = await supabase
        .from('saved_images')
        .select('*')
        .eq('user_id', user_id)
        .eq('type', 'generate-room')
        .order('created_at', { ascending: false });
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, result: { images: data } });
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  }