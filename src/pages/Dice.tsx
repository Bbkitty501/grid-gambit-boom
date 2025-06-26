
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGameData } from "@/hooks/useGameData";
import { useToast } from "@/hooks/use-toast";

const Dice = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { gameData, updateBalance } = useGameData();
  const { toast } = useToast();
  
  const [betAmount, setBetAmount] = useState(10);
  const [target, setTarget] = useState([50]);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<'win' | 'lose' | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const balance = gameData?.balance || 1000;
  const targetValue = target[0];
  const multiplier = 99 / targetValue;

  const rollDice = async () => {
    if (betAmount > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this bet.",
        variant: "destructive",
      });
      return;
    }

    if (betAmount <= 0) {
      toast({
        title: "Invalid Bet",
        description: "Bet amount must be greater than 0.",
        variant: "destructive",
      });
      return;
    }

    setIsRolling(true);
    
    // Generate random number between 0.00 and 99.99
    const roll = Math.random() * 100;
    setLastRoll(roll);

    // Check if player wins (roll is under target)
    const isWin = roll < targetValue;
    setLastResult(isWin ? 'win' : 'lose');

    let newBalance;
    if (isWin) {
      const winnings = Math.floor(betAmount * multiplier);
      newBalance = balance - betAmount + winnings;
      toast({
        title: "🎉 You Win!",
        description: `You won $${winnings - betAmount}!`,
      });
    } else {
      newBalance = balance - betAmount;
      toast({
        title: "💥 You Lose",
        description: `You lost $${betAmount}`,
        variant: "destructive",
      });
    }

    updateBalance(newBalance);
    setIsRolling(false);
  };

  // Redirect if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            DICE GAME
          </h1>
          <p className="text-gray-400 mb-6">Please sign in to play</p>
          <Button
            onClick={() => navigate("/auth")}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Sign In / Sign Up
          </Button>
        </div>
      </div>
    );
  }

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
              Dice Game
            </h1>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl space-y-6">
            {/* Balance Display */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-emerald-400">Balance: ${balance}</h2>
            </div>

            {/* Bet Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Bet Amount</label>
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                min="1"
                max={balance}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            {/* Target Slider */}
            <div className="space-y-4">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-gray-300">Target (Roll Under)</label>
                <span className="text-purple-400 font-bold">{targetValue.toFixed(0)}</span>
              </div>
              <Slider
                value={target}
                onValueChange={setTarget}
                min={2}
                max={98}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>2 (High Risk)</span>
                <span>98 (Low Risk)</span>
              </div>
            </div>

            {/* Multiplier Display */}
            <div className="text-center p-4 bg-slate-700 rounded-lg">
              <div className="text-sm text-gray-300">Multiplier</div>
              <div className="text-2xl font-bold text-yellow-400">{multiplier.toFixed(2)}x</div>
              <div className="text-xs text-gray-400">
                Potential Win: ${Math.floor(betAmount * multiplier)}
              </div>
            </div>

            {/* Roll Button */}
            <Button
              onClick={rollDice}
              disabled={isRolling || betAmount > balance || betAmount <= 0}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 text-lg"
            >
              {isRolling ? "Rolling..." : "Roll Dice"}
            </Button>

            {/* Result Display */}
            {lastRoll !== null && (
              <div className={`text-center p-4 rounded-lg border-2 ${
                lastResult === 'win' 
                  ? 'bg-emerald-900/50 border-emerald-500' 
                  : 'bg-red-900/50 border-red-500'
              }`}>
                <div className="text-2xl font-bold mb-2">
                  You Rolled: {lastRoll.toFixed(2)}
                </div>
                <div className={`text-xl font-bold ${
                  lastResult === 'win' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {lastResult === 'win' ? '🎉 WIN!' : '💥 LOSE!'}
                </div>
                {lastResult === 'win' && (
                  <div className="text-sm text-emerald-300 mt-1">
                    Multiplier: {multiplier.toFixed(2)}x
                  </div>
                )}
              </div>
            )}

            <div className="text-center">
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="border-emerald-600 text-emerald-400 hover:bg-emerald-600 hover:text-white"
              >
                Back to Minesweeper
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dice;
