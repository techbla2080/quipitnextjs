// components/UserInfo.tsx
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";

const UserInfo = () => {
  const { userId } = useAuth();

  useEffect(() => {
    const logUserId = () => {
      console.log("Current User ID on page refresh/load:", userId);
    };

    // Log immediately when component mounts
    logUserId();

    // Add event listener for page refresh
    window.addEventListener('load', logUserId);

    // Cleanup
    return () => {
      window.removeEventListener('load', logUserId);
    };
  }, [userId]);

  return (
    <div className="text-sm text-gray-600 mb-4 p-2 bg-gray-100 rounded">
      {userId ? (
        <div>
          <span className="font-semibold">Current User ID:</span> {userId}
        </div>
      ) : (
        <div>Please login to save trips</div>
      )}
    </div>
  );
};

export default UserInfo;