
import { useState } from "react";
import { GameData } from "@/pages/Index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GameControlsProps {
  gameData: GameData;
  onStartGame: (betAmount: number, mines: number, gridSize?: number) => void;
  onCashOut: () => void;
  onReset: () => void;
}

const GameControls = ({ gameData, onStartGame, onCashOut, onReset }: GameControlsProps) => {
  const [betAmount, setBetAmount] = useState(10);
  const [mineCount, setMineCount] = useState(3);
  const [gridSize, setGridSize] = useState(5);

  const handleStartGame = () => {
    if (betAmount <= 0 || betAmount > gameData.balance) return;
    onStartGame(betAmount, mineCount, gridSize);
  };

  const canCashOut = gameData.gameState === 'playing' && gameData.revealedCount > 0;
  const maxMines = (gridSize * gridSize) - 1;

  // Quick bet amounts
  const quickBets = [10, 25, 50, 100, 250];

  return (
    <div className="bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-700 shadow-xl">
      <h3 className="text-lg sm:text-xl font-bold mb-4 text-center text-emerald-400">Game Controls</h3>
      
      {gameData.gameState === 'idle' && (
        <div className="space-y-4">
          {/* Grid Size Selector */}
          <div>
            <Label htmlFor="grid-size" className="text-gray-300 text-sm sm:text-base font-medium">Grid Size</Label>
            <Select value={gridSize.toString()} onValueChange={(value) => setGridSize(Number(value))}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1 h-12 sm:h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="5">5x5 Grid (25 tiles)</SelectItem>
                <SelectItem value="8">8x8 Grid (64 tiles)</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
          
          {/* Mine Count */}
          <div>
            <Label htmlFor="mine-count" className="text-gray-300 text-sm sm:text-base font-medium">Number of Mines</Label>
            <Select value={mineCount.toString()} onValueChange={(value) => setMineCount(Number(value))}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1 h-12 sm:h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="1">1 Mine (Very Safe - Slow Growth)</SelectItem>
                <SelectItem value="3">3 Mines (Safe - Steady Growth)</SelectItem>
                <SelectItem value="5">5 Mines (Medium Risk - Good Growth)</SelectItem>
                <SelectItem value="8">8 Mines (High Risk - Fast Growth)</SelectItem>
                <SelectItem value="10">10 Mines (Very High Risk - Extreme Growth)</SelectItem>
                {gridSize === 8 && (
                  <>
                    <SelectItem value="15">15 Mines (Extreme Risk)</SelectItem>
                    <SelectItem value="20">20 Mines (Maximum Risk)</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400 mt-1">Max: {maxMines} mines</p>
          </div>
          
          <Button 
            onClick={handleStartGame}
            className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 active:from-emerald-800 active:to-green-800 text-white font-bold py-4 sm:py-3 text-base sm:text-sm shadow-lg transition-all duration-200"
            disabled={betAmount <= 0 || betAmount > gameData.balance || mineCount >= maxMines}
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
