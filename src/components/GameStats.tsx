
import { GameData } from "@/pages/Index";

interface GameStatsProps {
  gameData: GameData;
}

const GameStats = ({ gameData }: GameStatsProps) => {
  const potentialWinnings = Math.floor(gameData.currentBet * gameData.currentMultiplier);
  const profit = potentialWinnings - gameData.currentBet;
  const totalTiles = gameData.gridSize * gameData.gridSize;
  const safeTilesRemaining = totalTiles - gameData.mineCount - gameData.revealedCount;

  return (
    <div className="bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-700 shadow-xl">
      <h3 className="text-lg sm:text-xl font-bold mb-4 text-center text-emerald-400">Game Stats</h3>
      
      <div className="space-y-3 sm:space-y-4">
        <div className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
          <span className="text-gray-300 text-sm sm:text-base">Balance</span>
          <span className="font-bold text-lg sm:text-xl text-emerald-400">${gameData.balance}</span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
          <span className="text-gray-300 text-sm sm:text-base">Bet Amount</span>
          <span className="font-bold text-yellow-400 text-sm sm:text-base">${gameData.currentBet}</span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-lg border border-purple-700">
          <span className="text-purple-300 text-sm sm:text-base font-medium">Multiplier</span>
          <span className="font-bold text-base sm:text-lg text-purple-400">{gameData.currentMultiplier.toFixed(2)}x</span>
        </div>
        
        {gameData.gameState === 'playing' && (
          <>
            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-emerald-900/30 to-green-900/30 rounded-lg border border-emerald-700">
              <span className="text-emerald-300 text-sm sm:text-base font-medium">Potential Win</span>
              <span className="font-bold text-emerald-400 text-sm sm:text-base">${potentialWinnings}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-emerald-900/30 to-green-900/30 rounded-lg border border-emerald-700">
              <span className="text-emerald-300 text-sm sm:text-base font-medium">Profit</span>
              <span className="font-bold text-emerald-400 text-sm sm:text-base">+${profit}</span>
            </div>

            <div className="p-3 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-lg border border-blue-700">
              <div className="text-center">
                <span className="text-blue-300 text-xs sm:text-sm">Safe Tiles Remaining</span>
                <div className="font-bold text-blue-400 text-lg">{safeTilesRemaining}</div>
              </div>
            </div>
          </>
        )}
        
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="text-center p-2 bg-slate-700 rounded">
            <div className="text-gray-400 text-xs sm:text-sm">Grid</div>
            <div className="font-bold text-blue-400 text-sm sm:text-base">{gameData.gridSize}x{gameData.gridSize}</div>
          </div>
          <div className="text-center p-2 bg-slate-700 rounded">
            <div className="text-gray-400 text-xs sm:text-sm">Mines</div>
            <div className="font-bold text-red-400 text-sm sm:text-base">{gameData.mineCount}</div>
          </div>
          <div className="text-center p-2 bg-slate-700 rounded">
            <div className="text-gray-400 text-xs sm:text-sm">Found</div>
            <div className="font-bold text-green-400 text-sm sm:text-base">{gameData.revealedCount}</div>
          </div>
        </div>

        {gameData.gameState === 'playing' && gameData.revealedCount > 0 && (
          <div className="mt-4 p-3 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-lg border border-yellow-700">
            <div className="text-center">
              <div className="text-yellow-300 text-xs mb-1">Risk Level</div>
              <div className="text-yellow-400 font-medium">
                {gameData.mineCount <= 3 ? "🟢 Safe" : 
                 gameData.mineCount <= 8 ? "🟡 Medium" : 
                 "🔴 High Risk"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameStats;
