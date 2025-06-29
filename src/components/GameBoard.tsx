
import { GameData } from "@/pages/Index";
import { cn } from "@/lib/utils";

interface GameBoardProps {
  gameData: GameData;
  onTileClick: (row: number, col: number) => void;
}

const GameBoard = ({ gameData, onTileClick }: GameBoardProps) => {
  const getTileContent = (row: number, col: number) => {
    const tileState = gameData.grid[row][col];
    const position = `${row}-${col}`;
    
    // Show mines after cashing out successfully
    if (gameData.gameState === 'won' && gameData.minePositions.has(position)) {
      return '💣';
    }
    
    if (tileState === 'safe') {
      return '💎';
    } else if (tileState === 'mine') {
      return '💥';
    }
    return '';
  };

  const getTileStyle = (row: number, col: number) => {
    const tileState = gameData.grid[row][col];
    const position = `${row}-${col}`;
    
    // Style for revealed mines after winning
    if (gameData.gameState === 'won' && gameData.minePositions.has(position) && tileState === 'hidden') {
      return "bg-gradient-to-br from-orange-500 to-orange-600 border-2 border-orange-400 scale-105 animate-pulse";
    }
    
    if (tileState === 'hidden') {
      return cn(
        "bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600",
        "border-2 border-slate-500 hover:border-slate-400",
        "transform hover:scale-105 active:scale-95 transition-all duration-200",
        "hover:shadow-lg hover:shadow-emerald-500/20",
        gameData.gameState === 'playing' && "cursor-pointer",
        gameData.gameState !== 'playing' && "cursor-not-allowed opacity-50"
      );
    } else if (tileState === 'safe') {
      return "bg-gradient-to-br from-emerald-500 to-green-600 border-2 border-emerald-400 scale-105 shadow-lg shadow-emerald-500/30 animate-fade-in";
    } else if (tileState === 'mine') {
      return "bg-gradient-to-br from-red-600 to-red-700 border-2 border-red-500 scale-105 animate-pulse shadow-lg shadow-red-500/50";
    }
  };

  const getGridSizeClass = () => {
    switch (gameData.gridSize) {
      case 8:
        return "grid-cols-8 gap-1 sm:gap-2 max-w-sm sm:max-w-lg";
      case 5:
      default:
        return "grid-cols-5 gap-2 sm:gap-3 max-w-sm sm:max-w-md";
    }
  };

  const getTileSizeClass = () => {
    switch (gameData.gridSize) {
      case 8:
        return "min-h-[40px] sm:min-h-[50px] text-lg sm:text-xl";
      case 5:
      default:
        return "min-h-[60px] sm:min-h-[70px] text-xl sm:text-2xl";
    }
  };

  return (
    <div className="bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-700 shadow-2xl">
      {/* Game Info Header */}
      <div className="text-center mb-4">
        <div className="flex justify-center items-center gap-4 text-sm text-gray-400">
          <span>🎯 {gameData.gridSize}x{gameData.gridSize} Grid</span>
          <span>💣 {gameData.mineCount} Mines</span>
          <span>💎 {gameData.revealedCount} Safe</span>
        </div>
      </div>

      <div className={cn("grid mx-auto", getGridSizeClass())}>
        {gameData.grid.map((row, rowIndex) =>
          row.map((_, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              className={cn(
                "aspect-square rounded-lg font-bold flex items-center justify-center",
                "transition-all duration-200 ease-out",
                "touch-manipulation select-none",
                getTileSizeClass(),
                getTileStyle(rowIndex, colIndex)
              )}
              onClick={() => onTileClick(rowIndex, colIndex)}
              disabled={gameData.gameState !== 'playing' || gameData.grid[rowIndex][colIndex] !== 'hidden'}
            >
              {getTileContent(rowIndex, colIndex)}
            </button>
          ))
        )}
      </div>
      
      {gameData.gameState === 'lost' && (
        <div className="text-center mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-red-900/50 to-red-800/50 rounded-lg border border-red-700 animate-fade-in">
          <h3 className="text-lg sm:text-xl font-bold text-red-400 mb-2">💥 BOOM! You hit a mine!</h3>
          <p className="text-sm sm:text-base text-red-300">Better luck next time!</p>
          <div className="mt-2 text-xs text-red-400">
            Lost ${gameData.currentBet} • {gameData.revealedCount} safe tiles found
          </div>
        </div>
      )}
      
      {gameData.gameState === 'won' && (
        <div className="text-center mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-emerald-900/50 to-green-900/50 rounded-lg border border-emerald-700 animate-fade-in">
          <h3 className="text-lg sm:text-xl font-bold text-emerald-400 mb-2">🎉 Cashed Out Successfully!</h3>
          <p className="text-sm sm:text-base text-emerald-300">
            Won ${Math.floor(gameData.currentBet * gameData.currentMultiplier)} at {gameData.currentMultiplier.toFixed(2)}x!
          </p>
          <p className="text-xs sm:text-sm text-orange-300 mt-2">💣 Orange tiles show where the mines were</p>
          <div className="mt-2 text-xs text-emerald-400">
            {gameData.revealedCount} safe tiles • {gameData.mineCount} mines avoided
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
