// components/SavedTripView.tsx
export function SavedTripView({ tripResult }: { tripResult: any }) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-4">Trip Itinerary</h1>
          <pre className="whitespace-pre-wrap">
            {tripResult}
          </pre>
        </div>
      </div>
    );
  }