
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Trophy, X } from "lucide-react";

interface ProfitData {
  totalProfit: number;
  biggestWin: number;
  totalGames: number;
}

interface ProfitTrackerProps {
  currentBet: number;
  gameWon: boolean;
  multiplier: number;
  gameEnded: boolean;
}

const ProfitTracker = ({ currentBet, gameWon, multiplier, gameEnded }: ProfitTrackerProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [profitData, setProfitData] = useState<ProfitData>({
    totalProfit: 0,
    biggestWin: 0,
    totalGames: 0
  });

  // Load profit data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('minesweeper-profit-data');
    if (savedData) {
      setProfitData(JSON.parse(savedData));
    }
  }, []);

  // Update profit data when game ends
  useEffect(() => {
    if (!gameEnded) return;

    const winnings = gameWon ? Math.floor(currentBet * multiplier) : 0;
    const profit = winnings - currentBet;

    setProfitData(prev => {
      const newData = {
        totalProfit: prev.totalProfit + profit,
        biggestWin: Math.max(prev.biggestWin, winnings - currentBet),
        totalGames: prev.totalGames + 1
      };
      
      // Save to localStorage
      localStorage.setItem('minesweeper-profit-data', JSON.stringify(newData));
      
      return newData;
    });
  }, [gameEnded, gameWon, currentBet, multiplier]);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 bg-slate-800 border border-slate-600 hover:bg-slate-700"
      >
        <TrendingUp className="w-4 h-4" />
      </Button>
    );
  }

  const isProfitable = profitData.totalProfit >= 0;

  return (
    <div className="fixed top-4 left-4 z-50 bg-slate-800 border border-slate-600 rounded-lg p-4 min-w-[200px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white">Profit Tracker</h3>
        <Button
          onClick={() => setIsOpen(false)}
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-slate-700"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Total Profit:</span>
          <div className="flex items-center">
            {isProfitable ? (
              <TrendingUp className="w-3 h-3 text-green-400 mr-1" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-400 mr-1" />
            )}
            <span className={isProfitable ? 'text-green-400' : 'text-red-400'}>
              ${profitData.totalProfit.toFixed(2)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Biggest Win:</span>
          <div className="flex items-center">
            <Trophy className="w-3 h-3 text-yellow-400 mr-1" />
            <span className="text-yellow-400">
              ${profitData.biggestWin.toFixed(2)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Games Played:</span>
          <span className="text-white">{profitData.totalGames}</span>
        </div>
      </div>
    </div>
  );
};

export default ProfitTracker;
