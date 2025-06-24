
import { useState } from "react";
import { GameData } from "@/pages/Index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GameControlsProps {
  gameData: GameData;
  onStartGame: (betAmount: number, mines: number) => void;
  onCashOut: () => void;
  onReset: () => void;
}

const GameControls = ({ gameData, onStartGame, onCashOut, onReset }: GameControlsProps) => {
  const [betAmount, setBetAmount] = useState(10);
  const [mineCount, setMineCount] = useState(3);

  const handleStartGame = () => {
    if (betAmount <= 0 || betAmount > gameData.balance) return;
    onStartGame(betAmount, mineCount);
  };

  const canCashOut = gameData.gameState === 'playing' && gameData.revealedCount > 0;

  return (
    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
      <h3 className="text-xl font-bold mb-4 text-center">Game Controls</h3>
      
      {gameData.gameState === 'idle' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="bet-amount" className="text-gray-300">Bet Amount</Label>
            <Input
              id="bet-amount"
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              min={1}
              max={gameData.balance}
              className="bg-slate-700 border-slate-600 text-white mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="mine-count" className="text-gray-300">Number of Mines</Label>
            <Select value={mineCount.toString()} onValueChange={(value) => setMineCount(Number(value))}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="1">1 Mine (Low Risk)</SelectItem>
                <SelectItem value="3">3 Mines (Medium Risk)</SelectItem>
                <SelectItem value="5">5 Mines (High Risk)</SelectItem>
                <SelectItem value="8">8 Mines (Extreme Risk)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={handleStartGame}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3"
            disabled={betAmount <= 0 || betAmount > gameData.balance}
          >
            Start Game
          </Button>
        </div>
      )}
      
      {gameData.gameState === 'playing' && (
        <div className="space-y-4">
          <div className="text-center p-4 bg-yellow-900/30 rounded-lg border border-yellow-700">
            <p className="text-yellow-300 text-sm mb-2">Game in progress...</p>
            <p className="text-white">Click tiles to reveal them</p>
          </div>
          
          <Button 
            onClick={onCashOut}
            disabled={!canCashOut}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 disabled:opacity-50"
          >
            {canCashOut ? `Cash Out $${Math.floor(gameData.currentBet * gameData.currentMultiplier)}` : 'Reveal a tile first'}
          </Button>
        </div>
      )}
      
      {(gameData.gameState === 'lost' || gameData.gameState === 'won') && (
        <div className="space-y-4">
          {gameData.gameState === 'lost' && (
            <div className="text-center p-4 bg-red-900/30 rounded-lg border border-red-700">
              <p className="text-red-300">You lost ${gameData.currentBet}</p>
            </div>
          )}
          
          {gameData.gameState === 'won' && (
            <div className="text-center p-4 bg-emerald-900/30 rounded-lg border border-emerald-700">
              <p className="text-emerald-300">You won ${Math.floor(gameData.currentBet * gameData.currentMultiplier)}!</p>
            </div>
          )}
          
          <Button 
            onClick={onReset}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3"
          >
            Play Again
          </Button>
        </div>
      )}
      
      <div className="mt-6 pt-4 border-t border-slate-600">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <Button 
            onClick={() => setBetAmount(10)}
            variant="outline"
            size="sm"
            className="border-slate-600 text-gray-300 hover:bg-slate-700"
            disabled={gameData.gameState === 'playing'}
          >
            $10
          </Button>
          <Button 
            onClick={() => setBetAmount(50)}
            variant="outline"
            size="sm"
            className="border-slate-600 text-gray-300 hover:bg-slate-700"
            disabled={gameData.gameState === 'playing'}
          >
            $50
          </Button>
          <Button 
            onClick={() => setBetAmount(100)}
            variant="outline"
            size="sm"
            className="border-slate-600 text-gray-300 hover:bg-slate-700"
            disabled={gameData.gameState === 'playing'}
          >
            $100
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GameControls;
