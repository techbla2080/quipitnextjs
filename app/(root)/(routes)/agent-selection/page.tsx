"use client";

import { Plane, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import UsageIndicator from "@/components/UsageIndicator";

export default function AgentSelectionPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 bg-gray-50">
      <h1 className="text-4xl font-bold mb-8 text-blue-700">Choose an Agent</h1>
      
      {/* Usage Indicator */}
      <div className="mb-8 w-full max-w-md">
        <UsageIndicator />
      </div>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Travel Agent */}
        <Card className="p-8 bg-white shadow-lg rounded-lg flex flex-col items-center w-80">
          <Plane className="w-12 h-12 text-blue-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Travel Agent</h2>
          <p className="text-gray-600 mb-6 text-center">Get a personalized travel plan in seconds.</p>
          <Button className="bg-blue-600 text-white w-full" onClick={() => router.push("/agents1")}>Go to Travel Agent</Button>
        </Card>
        {/* Image Generator */}
        <Card className="p-8 bg-white shadow-lg rounded-lg flex flex-col items-center w-80">
          <Image className="w-12 h-12 text-blue-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Image Generator</h2>
          <p className="text-gray-600 mb-6 text-center">Create images, 3D interiors, products, and more with AI.</p>
          <Button className="bg-blue-600 text-white w-full" onClick={() => router.push("/agents2")}>Go to Image Generator</Button>
        </Card>
      </div>
    </div>
  );
} 