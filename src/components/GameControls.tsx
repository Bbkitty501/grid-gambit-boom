
import { useState } from "react";
import { GameData } from "@/pages/Index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface GameControlsProps {
  gameData: GameData;
  onStartGame: (betAmount: number, mines: number, gridSize?: number) => void;
  onCashOut: () => void;
  onReset: () => void;
}

const GameControls = ({ gameData, onStartGame, onCashOut, onReset }: GameControlsProps) => {
  const [betAmount, setBetAmount] = useState(10);
  const [mineCount, setMineCount] = useState(3);
  const gridSize = 5; // Fixed grid size

  const handleStartGame = () => {
    console.log('Starting game with:', { betAmount, mineCount, balance: gameData.balance });
    if (betAmount <= 0 || betAmount > gameData.balance) {
      console.log('Invalid bet amount:', betAmount, 'Balance:', gameData.balance);
      return;
    }
    onStartGame(betAmount, mineCount, gridSize);
  };

  const canCashOut = gameData.gameState === 'playing' && gameData.revealedCount > 0;
  const maxMines = (gridSize * gridSize) - 1; // 24 for 5x5 grid

  // Quick bet amounts
  const quickBets = [10, 25, 50, 100, 250];

  const getMineRiskDescription = (mines: number) => {
    if (mines <= 3) return "🟢 Safe - Slow Growth";
    if (mines <= 8) return "🟡 Medium Risk - Good Growth";
    return "🔴 High Risk - Fast Growth";
  };

  return (
    <div className="bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-700 shadow-xl">
      <h3 className="text-lg sm:text-xl font-bold mb-4 text-center text-emerald-400">Game Controls</h3>
      
      {gameData.gameState === 'idle' && (
        <div className="space-y-4">
          {/* Bet Amount */}
          <div>
            <Label htmlFor="bet-amount" className="text-gray-300 text-sm sm:text-base font-medium">Bet Amount</Label>
            <Input
              id="bet-amount"
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              min={1}
              max={gameData.balance}
              className="bg-slate-700 border-slate-600 text-white mt-1 h-12 sm:h-10 text-base"
            />
            {/* Quick Bet Buttons */}
            <div className="grid grid-cols-5 gap-1 mt-2">
              {quickBets.map((amount) => (
                <Button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-gray-300 hover:bg-slate-700 active:bg-slate-600 text-xs h-8"
                  disabled={amount > gameData.balance}
                >
                  ${amount}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Mine Count Slider */}
          <div>
            <Label className="text-gray-300 text-sm sm:text-base font-medium">
              Number of Mines: {mineCount}
            </Label>
            <div className="mt-2 mb-1">
              <Slider
                value={[mineCount]}
                onValueChange={(value) => setMineCount(value[0])}
                min={1}
                max={Math.min(maxMines, 20)}
                step={1}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>1 (Safest)</span>
              <span>{Math.min(maxMines, 20)} (Riskiest)</span>
            </div>
            <p className="text-sm text-center p-2 bg-slate-700 rounded-lg border border-slate-600">
              {getMineRiskDescription(mineCount)}
            </p>
          </div>
          
          <Button 
            onClick={handleStartGame}
            className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 active:from-emerald-800 active:to-green-800 text-white font-bold py-4 sm:py-3 text-base sm:text-sm shadow-lg transition-all duration-200"
            disabled={betAmount <= 0 || betAmount > gameData.balance}
          >
            🎮 Start Game
          </Button>
        </div>
      )}
      
      {gameData.gameState === 'playing' && (
        <div className="space-y-4">
          <div className="text-center p-4 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-lg border border-yellow-700">
            <p className="text-yellow-300 text-sm mb-2 font-medium">🎯 Game in Progress</p>
            <p className="text-white text-sm">Click tiles to reveal them</p>
            <p className="text-gray-300 text-xs mt-1">
              {gameData.revealedCount} safe tiles found • {gameData.mineCount} mines hidden
            </p>
          </div>
          
          <Button 
            onClick={onCashOut}
            disabled={!canCashOut}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 active:from-green-800 active:to-emerald-800 text-white font-bold py-4 sm:py-3 text-base sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all duration-200"
          >
            {canCashOut ? `💰 Cash Out $${Math.floor(gameData.currentBet * gameData.currentMultiplier)}` : '⚠️ Reveal a tile first'}
          </Button>
        </div>
      )}
      
      {(gameData.gameState === 'lost' || gameData.gameState === 'won') && (
        <div className="space-y-4">
          {gameData.gameState === 'lost' && (
            <div className="text-center p-4 bg-gradient-to-r from-red-900/50 to-red-800/50 rounded-lg border border-red-700">
              <p className="text-red-300 text-sm font-medium">💥 Mine Hit!</p>
              <p className="text-red-400 text-xs">Lost ${gameData.currentBet}</p>
            </div>
          )}
          
          {gameData.gameState === 'won' && (
            <div className="text-center p-4 bg-gradient-to-r from-emerald-900/50 to-green-900/50 rounded-lg border border-emerald-700">
              <p className="text-emerald-300 text-sm font-medium">🎉 Successful Cash Out!</p>
              <p className="text-emerald-400 text-xs">Won ${Math.floor(gameData.currentBet * gameData.currentMultiplier)}!</p>
            </div>
          )}
          
          <Button 
            onClick={onReset}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 text-white font-bold py-4 sm:py-3 text-base sm:text-sm shadow-lg transition-all duration-200"
          >
            🔄 Play Again
          </Button>
        </div>
      )}
    </div>
  );
};

export default GameControls;
