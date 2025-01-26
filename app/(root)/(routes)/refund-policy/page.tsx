'use client';

export default function RefundPolicy() {
    return (
      <div className="max-w-4xl mx-auto p-8 bg-white min-h-screen">
        <h1 className="text-3xl font-bold mb-8">Refund Policy</h1>
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-4">Refund Eligibility</h2>
            <p className="text-gray-600">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent et mauris risus.</p>
          </section>
   
          <section>
            <h2 className="text-xl font-semibold mb-4">Refund Process</h2>
            <p className="text-gray-600">Suspendisse potenti. Sed auctor justo eu risus facilisis, eu pulvinar erat tincidunt.</p>
          </section>
   
          <section>
            <h2 className="text-xl font-semibold mb-4">Non-Refundable Items</h2>
            <p className="text-gray-600">Nulla facilisi. Donec euismod, nisl eget ultricies ultrices, nunc elit ultricies nunc.</p>
          </section>
        </div>
      </div>
    );
   }