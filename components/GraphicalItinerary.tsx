import React from "react";

const GraphicalItinerary = ({ days }) => {
  return (
    <div className="graphical-itinerary">
      <h2 className="text-2xl font-bold mb-4 text-center">Travel Itinerary</h2>
      <div className="itinerary-stack">
        {days.map((day, index) => (
          <div key={index} className="day-card">
            <h3 className="day-title">DAY {index + 1}</h3>
            <div className="time-activity">
              <div>
                <strong>Time:</strong>
                <ul>
                  <li>09:00 am</li>
                  <li>11:00 am</li>
                  <li>02:00 pm</li>
                  <li>04:00 pm</li>
                </ul>
              </div>
              <div>
                <strong>Activity:</strong>
                <ul>
                  <li>Activity name</li>
                  <li>Activity name</li>
                  <li>Activity name</li>
                  <li>Activity name</li>
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .graphical-itinerary {
          background-color: #f0faff;
          padding: 20px;
          border-radius: 8px;
        }
        .itinerary-stack {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .day-card {
          background-color: #e0f4ff;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .day-title {
          font-size: 1.5rem;
          color: #007acc;
          margin-bottom: 10px;
        }
        .time-activity {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
        }
        .time-activity strong {
          display: block;
          margin-bottom: 5px;
        }
        /* Mobile-friendly adjustments */
        @media (max-width: 600px) {
          .time-activity {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
};

export default GraphicalItinerary;
