import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

const DebugButton = () => {
  const handleDebug = async () => {
    try {
      const response = await fetch('/api/debug-user');
      const data = await response.json();
      console.log('Debug response:', data);
      if (data.success) {
        toast.success('Trip count reset successful');
      }
    } catch (error) {
      console.error('Debug error:', error);
      toast.error('Failed to reset trip count');
    }
  };

  return (
    <Button
      onClick={handleDebug}
      variant="outline"
      size="sm"
    >
      Reset Trip Count
    </Button>
  );
};

export default DebugButton;