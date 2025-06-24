
import { GameData } from "@/pages/Index";

interface GameStatsProps {
  gameData: GameData;
}

const GameStats = ({ gameData }: GameStatsProps) => {
  const potentialWinnings = Math.floor(gameData.currentBet * gameData.currentMultiplier);
  const profit = potentialWinnings - gameData.currentBet;

  return (
    <div className="bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-700 shadow-xl">
      <h3 className="text-lg sm:text-xl font-bold mb-4 text-center">Game Stats</h3>
      
      <div className="space-y-3 sm:space-y-4">
        <div className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
          <span className="text-gray-300 text-sm sm:text-base">Balance</span>
          <span className="font-bold text-lg sm:text-xl text-emerald-400">${gameData.balance}</span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
          <span className="text-gray-300 text-sm sm:text-base">Current Bet</span>
          <span className="font-bold text-yellow-400 text-sm sm:text-base">${gameData.currentBet}</span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
          <span className="text-gray-300 text-sm sm:text-base">Multiplier</span>
          <span className="font-bold text-base sm:text-lg text-purple-400">{gameData.currentMultiplier.toFixed(2)}x</span>
        </div>
        
        {gameData.gameState === 'playing' && (
          <>
            <div className="flex justify-between items-center p-3 bg-emerald-900/30 rounded-lg border border-emerald-700">
              <span className="text-emerald-300 text-sm sm:text-base">Potential Win</span>
              <span className="font-bold text-emerald-400 text-sm sm:text-base">${potentialWinnings}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-emerald-900/30 rounded-lg border border-emerald-700">
              <span className="text-emerald-300 text-sm sm:text-base">Profit</span>
              <span className="font-bold text-emerald-400 text-sm sm:text-base">+${profit}</span>
            </div>
          </>
        )}
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="text-center p-2 bg-slate-700 rounded">
            <div className="text-gray-400 text-xs sm:text-sm">Mines</div>
            <div className="font-bold text-red-400 text-sm sm:text-base">{gameData.mineCount}</div>
          </div>
          <div className="text-center p-2 bg-slate-700 rounded">
            <div className="text-gray-400 text-xs sm:text-sm">Revealed</div>
            <div className="font-bold text-blue-400 text-sm sm:text-base">{gameData.revealedCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameStats;
