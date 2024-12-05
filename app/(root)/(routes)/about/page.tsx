export default function AboutPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="w-full max-w-4xl p-8 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-center mb-6">About Us</h1>
        <p className="text-lg leading-relaxed mb-4">
          We are an AI startup dedicated to building intelligent solutions that work for you.
          Our focus is on leveraging the latest advancements in Large Language Models (LLMs)
          and cutting-edge AI technologies to create smart, reliable, and innovative products.
        </p>
        <p className="text-lg leading-relaxed mb-4">
          From automating tasks to generating creative outputs, our solutions are designed to
          streamline workflows and deliver impactful results. We are committed to pushing the 
          boundaries of what&apos;s possible with AI, empowering businesses and individuals to unlock 
          new levels of efficiency and creativity.
        </p>
        <p className="text-lg leading-relaxed">
          With our expertise in LLM tech, we build tools that not only meet but exceed expectations,
          delivering real value in the modern digital landscape.
        </p>
      </div>
    </div>
  );
}