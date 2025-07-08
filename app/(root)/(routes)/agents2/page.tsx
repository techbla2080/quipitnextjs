// app/room-dreamer/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Sidebar } from "@/components/sidebar";
import { supabase } from '@/lib/supabaseClient'; // adjust path if needed
import { useAuth } from "@clerk/nextjs";
import ImageGenProgress from '@/components/ImageGenProgress';
import ImageModal from '@/components/ImageModal';
import NextImage from 'next/image';
import { useEnforceFreeLimitRedirect } from "@/hooks/useEnforceFreeLimitRedirect";

type SavedImage = { image_url: string; category: string };

type ModelType = '3d-interior-creator' | 'product-designer' | 'recipe-generator' | 'travel-visuals';

const MODEL_OPTIONS = [
  { value: '3d-interior-creator', label: '3D Interior Creator' },
  { value: 'product-designer', label: 'Product Designer' },
  { value: 'recipe-generator', label: 'Recipe Generator' },
  { value: 'travel-visuals', label: 'Travel Visuals' },
];

interface ItineraryImage {
  day: number;
  imageUrl: string;
  prompt: string;
}

const STYLE_OPTIONS = [
  { value: 'Minimalist Japanese', label: 'Minimalist Japanese' },
  { value: 'Scandinavian', label: 'Scandinavian' },
  { value: 'Mid-Century Modern', label: 'Mid-Century Modern' },
  { value: 'Industrial', label: 'Industrial' },
  { value: 'Bohemian', label: 'Bohemian' },
  { value: 'Modern Farmhouse', label: 'Modern Farmhouse' },
  { value: 'Art Deco', label: 'Art Deco' },
  { value: 'Coastal', label: 'Coastal' },
];

const QUALITY_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
  { value: 'ultra', label: 'Ultra' },
];

const PRODUCT_TYPES = [
  { value: 'chair', label: 'Chair' },
  { value: 'lamp', label: 'Lamp' },
  { value: 'table', label: 'Table' },
  { value: 'sofa', label: 'Sofa' },
  { value: 'bed', label: 'Bed' },
  { value: 'shelf', label: 'Shelf' },
  { value: 'desk', label: 'Desk' },
  { value: 'cabinet', label: 'Cabinet' },
];

// Add mapping for function names and catchlines
const FUNCTION_INFO: Record<string, { name: string; catchline: string }> = {
  '3d-interior-creator': {
    name: '3D Interior Creator',
    catchline: 'Transform your space with AI-powered 3D interior designs!'
  },
  'product-designer': {
    name: 'Product Designer',
    catchline: 'Design unique products with the help of generative AI.'
  },
  'recipe-generator': {
    name: 'Recipe Generator',
    catchline: 'Discover new recipes and culinary inspiration instantly!'
  },
  'travel-visuals': {
    name: 'Travel Visuals',
    catchline: 'Visualize your dream itinerary with AI-generated images.'
  },
};

export default function Agents2Page() {
  useEnforceFreeLimitRedirect();
  const [selectedModel, setSelectedModel] = useState<ModelType>('3d-interior-creator');
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedStyle, setSelectedStyle] = useState(STYLE_OPTIONS[0].value);
  const [selectedQuality, setSelectedQuality] = useState(QUALITY_OPTIONS[0].value);
  const [productType, setProductType] = useState(PRODUCT_TYPES[0].value);
  const [prompt, setPrompt] = useState('');
  const [dishName, setDishName] = useState('');
  const [recipePrompt, setRecipePrompt] = useState('');
  const [generatedRecipe, setGeneratedRecipe] = useState<string | null>(null);
  const [generatedRecipeImage, setGeneratedRecipeImage] = useState<string | null>(null);
  const [travelLocation, setTravelLocation] = useState('');
  const [travelStartDate, setTravelStartDate] = useState('');
  const [travelEndDate, setTravelEndDate] = useState('');
  const [travelStyle, setTravelStyle] = useState('photorealistic');
  const [itineraryImages, setItineraryImages] = useState<ItineraryImage[]>([]);
  const [isTravelLoading, setIsTravelLoading] = useState(false);
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [selectedSidebarImage, setSelectedSidebarImage] = useState<string | null>(null);
  const { userId } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);

  // Add this useEffect to fetch saved images on component mount
  useEffect(() => {
    const fetchSavedImages = async () => {
      try {
        const response = await fetch('/api/saved-images');
        if (!response.ok) throw new Error('Failed to fetch saved images');
        
        const data = await response.json();
        if (data.success && data.result.images) {
          setSavedImages(data.result.images);
        }
      } catch (error) {
        console.error('Error in fetchSavedImages:', error);
      }
    };

    fetchSavedImages();
  }, []); // Empty dependency array means this runs once on mount

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) setRoomImage(event.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Generate image (API endpoint can be dynamic based on model)
  const generateImage = async () => {
    setIsGenerating(true);

    try {
      let formData = new FormData();
      let endpoint = '';
      switch (selectedModel) {
        case '3d-interior-creator': {
          if (!roomImage) return;
          const arr = roomImage.split(',');
          const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) u8arr[n] = bstr.charCodeAt(n);
          const blob = new Blob([u8arr], { type: mime });
          const imageFile = new File([blob], 'input-image.png', { type: 'image/png' });

          formData.append('image', imageFile);
          formData.append('style', selectedStyle);
          formData.append('quality', selectedQuality);
          endpoint = '/api/generate-room';
          break;
        }
        case 'product-designer': {
          if (!productType || !selectedStyle || !prompt.trim()) {
            alert('Please fill out all fields for Product Designer.');
            setIsGenerating(false);
            return;
          }
          formData.append('productType', productType);
          formData.append('designStyle', selectedStyle);
          formData.append('prompt', prompt);
          endpoint = '/api/generate-product';
          break;
        }
        case 'recipe-generator': {
          formData.append('dishName', dishName);
          formData.append('prompt', recipePrompt);
          endpoint = '/api/generate-recipe-image';
          break;
        }
        case 'travel-visuals': {
          formData.append('location', travelLocation);
          formData.append('startDate', travelStartDate);
          formData.append('endDate', travelEndDate);
          formData.append('style', travelStyle);
          endpoint = '/api/generate-itinerary-visuals';
          break;
        }
      }

      if (!endpoint) throw new Error('No endpoint selected');
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (data.limitReached) {
          // Trigger subscription modal
          window.dispatchEvent(new CustomEvent('showSubscriptionModal', {
            detail: { type: 'image', currentImages: data.currentImages }
          }));
          return;
        }
        throw new Error(data.error || 'Failed to process image');
      }
      
      if (data.success) {
        const newImageUrl = data.result?.imageBase64
          ? `data:image/png;base64,${data.result.imageBase64}`
          : data.result?.imageUrl || null;
        setGeneratedImage(newImageUrl);

        // Handle recipe text if present
        if (data.result.recipe) {
          setGeneratedRecipe(data.result.recipe);
        }

        // --- AUTOSAVE LOGIC: always run after generation ---
        if (newImageUrl) {
          let category = '';
          let type = '';
          switch (selectedModel) {
            case '3d-interior-creator':
              category = selectedStyle;
              type = 'generate-room';
              break;
            case 'product-designer':
              category = productType;
              type = 'generate-product';
              break;
            case 'recipe-generator':
              category = 'Recipe';
              type = 'generate-recipe';
              break;
            case 'travel-visuals':
              category = 'Travel Visual';
              type = 'generate-itinerary';
              break;
          }

          // Save to Supabase
          const { error } = await supabase
            .from('saved_images')
            .insert([
              {
                image_url: newImageUrl,
                category,
                type,
                user_id: userId,
              }
            ]);
          if (!error) {
            setSavedImages(prev => [{ image_url: newImageUrl, category, type }, ...prev]);
            window.dispatchEvent(new Event('imageSaved'));
          }
        }
        // --- END AUTOSAVE LOGIC ---
      }
    } catch (error) {
      alert('Error processing image');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateRecipe = async () => {
    setIsGenerating(true);
    setGeneratedRecipe(null);
    setGeneratedRecipeImage(null);
    try {
      const formData = new FormData();
      formData.append('dishName', dishName);
      formData.append('prompt', recipePrompt);
      const response = await fetch('/api/generate-recipe-image', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to generate recipe');
      const data = await response.json();
      
      // Get the image URL directly from the response
      const recipeImageUrl = data.result?.imageBase64 ? `data:image/png;base64,${data.result.imageBase64}` : null;
      
      // Update states
      setGeneratedRecipe(data.result?.recipe || null);
      setGeneratedRecipeImage(recipeImageUrl);

      // Autosave if we have an image
      if (recipeImageUrl) {
        const { error } = await supabase
          .from('saved_images')
          .insert([
            {
              image_url: recipeImageUrl,
              category: 'Recipe',
              type: 'generate-recipe',
              user_id: userId,
            }
          ]);
        if (!error) {
          setSavedImages(prev => [{ image_url: recipeImageUrl, category: 'Recipe', type: 'generate-recipe' }, ...prev]);
          window.dispatchEvent(new Event('imageSaved'));
        }
      }
    } catch (error) {
      alert('Error generating recipe');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateTravelVisuals = async () => {
    setIsTravelLoading(true);
    setItineraryImages([]);
    try {
      const formData = new FormData();
      formData.append('location', travelLocation);
      formData.append('startDate', travelStartDate);
      formData.append('endDate', travelEndDate);
      formData.append('style', travelStyle);
      const response = await fetch('/api/generate-itinerary-visuals', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to generate itinerary visuals');
      const data = await response.json();
      setItineraryImages(data.results || []);

      for (const item of data.results || []) {
        const { error } = await supabase
          .from('saved_images')
          .insert([
            {
              image_url: item.imageUrl,
              category: 'Travel Visual',
              type: 'generate-itinerary',
              user_id: userId,
            }
          ]);
        if (!error) {
          setSavedImages(prev => [{ image_url: item.imageUrl, category: 'Travel Visual', type: 'generate-itinerary' }, ...prev]);
          window.dispatchEvent(new Event('imageSaved'));
        }
      }
    } catch (error) {
      alert('Error generating travel visuals');
    } finally {
      setIsTravelLoading(false);
    }
  };

  // Reset
  const reset = () => {
    setRoomImage(null);
    setGeneratedImage(null);
  };

  // Remove image from sidebar
  const handleRemoveImage = (img: string) => {
    setSavedImages(savedImages.filter(i => i.image_url !== img));
    if (selectedSidebarImage === img) setSelectedSidebarImage(null);
  };

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar isPro={false} />
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center py-8 relative bg-gradient-to-b from-gray-50 to-gray-100">
        {/* Function Name and Catchline */}
        <div className="mb-8 text-center z-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {FUNCTION_INFO[selectedModel]?.name || ''}
          </h1>
          <p className="text-gray-500 text-base font-medium">
            {FUNCTION_INFO[selectedModel]?.catchline || ''}
          </p>
        </div>
        {/* Centered Dropdowns */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 justify-center z-10">
          <select
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value as ModelType)}
            className="text-base px-4 py-2 rounded-lg shadow border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-200 font-medium"
          >
            {MODEL_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {/* Only show style and quality dropdowns for 3D Interior Creator and similar models */}
          {selectedModel === '3d-interior-creator' && (
            <>
              <select
                value={selectedStyle}
                onChange={e => setSelectedStyle(e.target.value)}
                className="text-base px-4 py-2 rounded-lg shadow border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-200 font-medium"
              >
                {STYLE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select
                value={selectedQuality}
                onChange={e => setSelectedQuality(e.target.value)}
                className="text-base px-4 py-2 rounded-lg shadow border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-200 font-medium"
              >
                {QUALITY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </>
          )}
        </div>
        {/* Main UI for selected model */}
        <div className="relative bg-white/70 backdrop-blur-md rounded-2xl shadow-xl p-10 w-full max-w-lg flex flex-col items-center border border-gray-200 z-10" style={{boxShadow: '0 4px 32px 0 rgba(80,80,180,0.10)'}}>
          {selectedModel === 'recipe-generator' && (
            <div className="w-full mb-4 flex flex-col items-center">
              <input
                type="text"
                value={dishName}
                onChange={e => setDishName(e.target.value)}
                placeholder="Dish Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm mb-2"
              />
              <textarea
                value={recipePrompt}
                onChange={e => setRecipePrompt(e.target.value)}
                placeholder="Extra details (optional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm mb-2"
              />
              <button
                onClick={generateRecipe}
                disabled={isGenerating}
                className="mt-2 bg-green-600 text-white px-6 py-2 rounded shadow hover:bg-green-700 transition"
              >
                {isGenerating ? 'Generating...' : 'Generate Recipe'}
              </button>
              {generatedRecipeImage && (
                <NextImage
                  src={generatedRecipeImage}
                  alt="Generated Recipe"
                  width={300}
                  height={300}
                  className="max-w-full rounded mt-4 cursor-zoom-in"
                  onClick={() => setModalImage(generatedRecipeImage)}
                  unoptimized={generatedRecipeImage.startsWith('data:')}
                />
              )}
              {generatedRecipe && (
                <div className="w-full mt-6">
                  <h2 className="text-xl font-semibold mb-2">Generated Recipe</h2>
                  <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap text-sm">{generatedRecipe}</pre>
                </div>
              )}
            </div>
          )}
          {selectedModel !== 'product-designer' && selectedModel !== 'recipe-generator' && !roomImage && (
            <div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="mb-4"
              />
              <p className="text-gray-500">Upload an image to get started.</p>
            </div>
          )}
          {selectedModel === 'product-designer' && (
            <div className="w-full mb-4 flex flex-col items-center">
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Describe your product design..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              {isGenerating ? <ImageGenProgress /> : (
                <button
                  onClick={generateImage}
                  className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded shadow hover:bg-indigo-700 transition"
                >
                  Generate
                </button>
              )}
              {generatedImage && isValidImageUrl(generatedImage) && (
                <div className="flex flex-col items-center">
                  <h2 className="text-xl font-semibold mt-6 mb-2">Output</h2>
                  <NextImage
                    src={generatedImage}
                    alt="Generated Product Design"
                    width={400}
                    height={400}
                    className="max-w-full rounded mb-4 cursor-zoom-in"
                    onClick={() => setModalImage(generatedImage)}
                    unoptimized={generatedImage.startsWith('data:')}
                  />
                  <button
                    onClick={reset}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition"
                  >
                    Start Over
                  </button>
                </div>
              )}
            </div>
          )}
          {selectedModel === 'travel-visuals' && (
            <div className="w-full mb-4 flex flex-col items-center">
              <input
                type="text"
                value={travelLocation}
                onChange={e => setTravelLocation(e.target.value)}
                placeholder="Location (e.g. Paris, Tokyo)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm mb-2"
              />
              <div className="flex gap-2 w-full mb-2">
                <input
                  type="date"
                  value={travelStartDate}
                  onChange={e => setTravelStartDate(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                />
                <input
                  type="date"
                  value={travelEndDate}
                  onChange={e => setTravelEndDate(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                />
              </div>
              <select
                value={travelStyle}
                onChange={e => setTravelStyle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm mb-2"
              >
                <option value="photorealistic">Photorealistic</option>
                <option value="watercolor">Watercolor</option>
                <option value="vintage">Vintage</option>
                <option value="cyberpunk">Cyberpunk</option>
                <option value="cartoon">Cartoon</option>
              </select>
              <button
                onClick={generateTravelVisuals}
                disabled={isTravelLoading}
                className="mt-2 bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 transition"
              >
                {isTravelLoading ? 'Generating...' : 'Generate Itinerary Visuals'}
              </button>
              {itineraryImages.length > 0 && (
                <div className="w-full mt-6 overflow-x-auto">
                  <div className="flex gap-4">
                    {itineraryImages.map((item, idx) => (
                      <div key={idx} className="flex flex-col items-center min-w-[220px]">
                        <div className="font-semibold mb-2">Day {item.day}</div>
                        <NextImage
                          src={item.imageUrl}
                          alt={`Day ${item.day} Travel Visual`}
                          width={220}
                          height={240}
                          className="rounded shadow max-w-xs max-h-60 cursor-zoom-in"
                          onClick={() => setModalImage(item.imageUrl)}
                          unoptimized={item.imageUrl.startsWith('data:')}
                        />
                        <div className="text-xs text-gray-500 mt-2">{item.prompt.slice(0, 80)}...</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {roomImage && (
            <div className="flex flex-col items-center">
              <NextImage
                src={roomImage}
                alt="Input Room"
                width={400}
                height={300}
                className="max-w-full rounded mb-4"
                unoptimized={roomImage.startsWith('data:')}
              />
              {isGenerating ? <ImageGenProgress /> : (
                <button
                  onClick={generateImage}
                  className="bg-indigo-600 text-white px-6 py-2 rounded shadow hover:bg-indigo-700 transition"
                >
                  Generate
                </button>
              )}
              {generatedImage && isValidImageUrl(generatedImage) && (
                <>
                  <h2 className="text-xl font-semibold mt-6 mb-2">Output</h2>
                  <NextImage
                    src={generatedImage}
                    alt="Generated Interior Design"
                    width={400}
                    height={400}
                    className="max-w-full rounded mb-4 cursor-zoom-in"
                    onClick={() => setModalImage(generatedImage)}
                    unoptimized={generatedImage.startsWith('data:')}
                  />
                  <button
                    onClick={reset}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition"
                  >
                    Start Over
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        {/* Modal for viewing sidebar image large */}
        {selectedSidebarImage && (
          <ImageModal src={selectedSidebarImage} onClose={() => setSelectedSidebarImage(null)} />
        )}
        {/* New immersive modal for generated images */}
        {modalImage && (
          <ImageModal src={modalImage} onClose={() => setModalImage(null)} />
        )}
      </div>
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Sidebar for mobile */}
      <div className={`fixed top-0 left-0 h-screen w-64 bg-white border-r z-50 transform transition-transform duration-300 md:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar isPro={false} />
      </div>
      {/* Hamburger Menu Button (Mobile Only) */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-white rounded-full p-2 shadow"
        onClick={() => setSidebarOpen(true)}
      >
        <svg className="h-6 w-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
  );
}

function isValidImageUrl(url: string | null): boolean {
  return !!url && (url.startsWith('data:image/') || url.startsWith('http'));
}