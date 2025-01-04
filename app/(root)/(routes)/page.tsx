"use client";

const agents = [
  {
    url: "https://quipitnextjs.vercel.app/agents1", // URL for the Travel Agent
    name: "Travel Agent",
    description: "Assists you in planning your trip",
  },
];

const AgentsPage = () => {
  return (
    <div className="h-full p-4 space-y-4 flex flex-col justify-between min-h-screen">
      {/* Main content */}
      <div>
        <h1 className="text-2xl font-bold">Build AI Agents That Work For You</h1>
        <p className="text-lg">
          Explore our intelligent agents that can assist you in various tasks and make your life easier.
          Whether you need a personal assistant, travel planner, or data expert, we have an agent for you!
        </p>
        <h2 className="text-xl font-semibold">Try Our Agents</h2>
        <div className="grid grid-cols-3 gap-4">
          {agents.map((agent) => (
            <a
              key={agent.name} // Use agent name for uniqueness
              href={agent.url} // Directly link to the agent's URL
              className="cursor-pointer border rounded-lg p-6 flex flex-col items-center bg-blue-500 text-white hover:bg-blue-600 transition"
            >
              <h2 className="text-lg font-semibold">{agent.name}</h2>
              <p className="text-sm">{agent.description}</p>
            </a>
          ))}
        </div>
      </div>

      {/* Footer Section */}
      <footer className="bg-gray-900 py-8 text-gray-300">
        <div className="container mx-auto px-4 grid grid-cols-3 gap-8 divide-x divide-gray-700">
          {/* Follow Us Section */}
          <div className="px-4">
            <h3 className="font-bold text-lg text-white mb-2">Follow Us</h3>
            <ul className="space-y-1">
              <li>Facebook</li>
              <li>Instagram</li>
              <li>Twitter</li>
              <li>Youtube</li>
            </ul>
          </div>

          {/* Legal Section */}
          <div className="px-4">
            <h3 className="font-bold text-lg text-white mb-2">Legal</h3>
            <ul className="space-y-1">
              <li>Privacy Policy</li>
              <li>Terms and Conditions</li>
              <li>Refund Policy</li>
            </ul>
          </div>

          {/* Call Us Section */}
          <div className="px-4">
            <h3 className="font-bold text-lg text-white mb-2">Call Us</h3>
            <p>1800 1238 1238</p>
            <p>Mon-Sat (9.30AM-6.30PM)</p>
            <h3 className="font-bold text-lg text-white mt-4">Write to us at:</h3>
            <p>customercare@quipit.com</p>
            <p>95A Park Street, Kolkata</p>
            <p>Kolkata 700016</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AgentsPage;
