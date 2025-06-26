
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Dice6 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-8">
            <Button
              onClick={() => navigate("/")}
              variant="ghost"
              size="sm"
              className="mr-4 text-gray-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Game
            </Button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
              Settings
            </h1>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl space-y-6">
            <div className="border-b border-slate-600 pb-4">
              <h2 className="text-xl font-semibold mb-2">Account</h2>
              <p className="text-gray-400 text-sm mb-4">Signed in as: {user?.email}</p>
              <Button
                onClick={signOut}
                variant="outline"
                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
              >
                Sign Out
              </Button>
            </div>

            <div className="border-b border-slate-600 pb-4">
              <h2 className="text-xl font-semibold mb-4">Game Dice</h2>
              <p className="text-gray-400 text-sm mb-4">
                Access the game dice feature for additional gameplay options.
              </p>
              <Button
                onClick={() => navigate("/dice")}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Dice6 className="w-4 h-4 mr-2" />
                Go to Game Dice
              </Button>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">About</h2>
              <p className="text-gray-400 text-sm">
                Sheep Sweeper - Find the safe tiles, avoid the sheep, and build your flock!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
