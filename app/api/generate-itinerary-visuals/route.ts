// app/api/generate-itinerary-visuals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Add timeout configuration for long-running requests
export const maxDuration = 300; // 5 minutes (300 seconds)
export const runtime = 'nodejs';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper to get all days between two dates
function getDaysArray(start: Date, end: Date) {
  const arr = [];
  for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
    arr.push(new Date(dt));
  }
  return arr;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error: API key not set' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const location = formData.get('location') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    const style = (formData.get('style') as string) || 'photorealistic';

    if (!location || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const days = getDaysArray(new Date(startDate), new Date(endDate));
    
    // Add a reasonable limit to prevent extremely long trips from timing out
    if (days.length > 14) {
      return NextResponse.json(
        { success: false, error: 'Trip duration too long. Maximum 14 days supported for image generation.' },
        { status: 400 }
      );
    }

    console.log(`Generating ${days.length} images for ${location} from ${startDate} to ${endDate}`);
    const results = [];

    for (let i = 0; i < days.length; i++) {
      const dayNumber = i + 1;
      console.log(`Generating image for day ${dayNumber}/${days.length}`);
      
      const prompt = `
A ${style} image for a travel itinerary in ${location}, day ${dayNumber}.
Showcase:
- Geography: mountains, rivers, lakes, coastline, forests, or other natural features of ${location}
- Famous landmarks: monuments, buildings, bridges, or iconic sites
- Local architecture: style of houses, buildings, and streets
- Natural scenery: flora, fauna, and landscape features
- Climate and weather: typical conditions (snow, sun, rain, fog, etc.)
- Cultural elements: festivals, traditional clothing, local customs
- People: locals, tourists, and their activities
- Food and markets: street food, markets, cafes
- Transportation: bikes, trams, boats, cars, or other local means
- Language and signage: street signs, shop names in the local language
- Colors and atmosphere: vibrant, pastel, moody, or typical palette
- Time of day: sunrise, sunset, night, or midday
- Season: spring, summer, autumn, or winter
- Local wildlife: birds, animals
- Water features: lakes, rivers, fountains
- Sky and clouds: clear, dramatic, overcast
- Crowds or quietness: busy, tranquil
- Shops and markets: local businesses, open-air markets
- Unique activities: what people do there (e.g., skiing, surfing, hiking)
The overall scene should feel authentic, lively, and true to the spirit of ${location}.
      `.trim();

      try {
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt,
          n: 1,
          size: "1024x1024", // Using higher quality for better results
        });

        if (!response.data || !response.data[0]) {
          console.error(`No image data received for day ${dayNumber}`);
          return NextResponse.json(
            { success: false, error: 'No image data received from generation API' },
            { status: 500 }
          );
        }
        
        const imageUrl = response.data[0].url || `data:image/png;base64,${response.data[0].b64_json}`;
        results.push({
          day: dayNumber,
          imageUrl,
          prompt,
        });
        
        console.log(`Successfully generated image for day ${dayNumber}`);
      } catch (imageError: any) {
        console.error(`Error generating image for day ${dayNumber}:`, imageError);
        return NextResponse.json(
          { 
            success: false, 
            error: `Failed to generate image for day ${dayNumber}: ${imageError.message}`,
            details: imageError.status || 500
          },
          { status: 500 }
        );
      }
    }

    console.log(`Successfully generated all ${results.length} images`);
    return NextResponse.json(
      { success: true, results },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error generating itinerary visuals:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An error occurred while generating images',
        details: error instanceof Error ? error.stack : undefined
      },
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

    // Fetch only images of type 'generate-itinerary-visuals' for this user
    const { data, error } = await supabase
      .from('saved_images')
      .select('*')
      .eq('user_id', user_id)
      .in('type', ['generate-itinerary-visuals', 'generate-itinerary'])
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Map images to ensure image_url is a valid data URL if it's base64
    const images = (data || []).map(img => {
      let image_url = img.image_url;
      // If it's not a URL and looks like base64, prepend the data URL prefix
      if (image_url && !image_url.startsWith('http') && !image_url.startsWith('data:')) {
        image_url = `data:image/png;base64,${image_url}`;
      }
      return { ...img, image_url };
    });

    return NextResponse.json({ success: true, result: { images } }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}