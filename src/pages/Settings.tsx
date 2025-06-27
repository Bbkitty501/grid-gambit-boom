
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Dice6, Package, Coins, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { MoneyTransfer } from "@/components/MoneyTransfer";

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
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-gray-400 text-sm">Signed in as: {user?.email}</p>
                </div>
                <MoneyTransfer />
              </div>
              <Button
                onClick={signOut}
                variant="outline"
                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
              >
                Sign Out
              </Button>
            </div>

            <div className="border-b border-slate-600 pb-4">
              <h2 className="text-xl font-semibold mb-4">Games</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm mb-2">
                    Roll dice with customizable targets and multipliers.
                  </p>
                  <Button
                    onClick={() => navigate("/dice")}
                    className="bg-purple-600 hover:bg-purple-700 text-white w-full"
                  >
                    <Dice6 className="w-4 h-4 mr-2" />
                    Dice Game
                  </Button>
                </div>

                <div>
                  <p className="text-gray-400 text-sm mb-2">
                    Open cases and win random prizes with different rarities.
                  </p>
                  <Button
                    onClick={() => navigate("/cases")}
                    className="bg-orange-600 hover:bg-orange-700 text-white w-full"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Cases
                  </Button>
                </div>

                <div>
                  <p className="text-gray-400 text-sm mb-2">
                    Create and trade meme coins with live multiplayer chat and real-time updates.
                  </p>
                  <Button
                    onClick={() => navigate("/meme-coins")}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white w-full"
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    Meme Coins (Multiplayer)
                  </Button>
                </div>

                <div>
                  <p className="text-gray-400 text-sm mb-2">
                    Drop balls through pegs and hit multiplier slots for big wins!
                  </p>
                  <Button
                    onClick={() => navigate("/plinko")}
                    className="bg-purple-600 hover:bg-purple-700 text-white w-full"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Plink Plank
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">
                <span 
                  onClick={() => navigate("/blackjack")}
                  className="cursor-pointer hover:text-green-400 transition-colors"
                  title="Click me!"
                >
                  About
                </span>
              </h2>
              <p className="text-gray-400 text-sm">
                Minesweeper - Find the safe tiles, avoid the mines, and cash out before it's too late!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
