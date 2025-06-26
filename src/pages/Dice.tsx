
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Dice = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-8">
            <Button
              onClick={() => navigate("/settings")}
              variant="ghost"
              size="sm"
              className="mr-4 text-gray-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Settings
            </Button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Game Dice
            </h1>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl text-center">
            <div className="mb-8">
              <div className="text-6xl mb-4">🎲</div>
              <h2 className="text-2xl font-bold mb-4">Coming Soon!</h2>
              <p className="text-gray-400">
                The dice game feature is currently in development. Check back soon for exciting dice-based gameplay!
              </p>
            </div>
            
            <Button
              onClick={() => navigate("/")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Back to Sheep Sweeper
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dice;
