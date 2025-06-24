
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
    
    // Show bombs after cashing out successfully
    if (gameData.gameState === 'won' && gameData.minePositions.has(position)) {
      return '💣';
    }
    
    if (tileState === 'safe') {
      return '💎';
    } else if (tileState === 'mine') {
      return '💣';
    }
    return '';
  };

  const getTileStyle = (row: number, col: number) => {
    const tileState = gameData.grid[row][col];
    const position = `${row}-${col}`;
    
    // Style for revealed bombs after winning
    if (gameData.gameState === 'won' && gameData.minePositions.has(position) && tileState === 'hidden') {
      return "bg-gradient-to-br from-orange-500 to-orange-600 border-2 border-orange-400 scale-105";
    }
    
    if (tileState === 'hidden') {
      return cn(
        "bg-gradient-to-br from-slate-600 to-slate-700 active:from-slate-500 active:to-slate-600",
        "border-2 border-slate-500 active:border-slate-400",
        "transform active:scale-95 transition-all duration-150",
        gameData.gameState === 'playing' && "cursor-pointer",
        gameData.gameState !== 'playing' && "cursor-not-allowed opacity-50"
      );
    } else if (tileState === 'safe') {
      return "bg-gradient-to-br from-emerald-500 to-green-600 border-2 border-emerald-400 scale-105";
    } else if (tileState === 'mine') {
      return "bg-gradient-to-br from-red-600 to-red-700 border-2 border-red-500 scale-105 animate-pulse";
    }
  };

  return (
    <div className="bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-700 shadow-2xl">
      <div className="grid grid-cols-5 gap-2 sm:gap-3 max-w-sm sm:max-w-md mx-auto">
        {gameData.grid.map((row, rowIndex) =>
          row.map((_, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              className={cn(
                "aspect-square rounded-lg text-xl sm:text-2xl font-bold flex items-center justify-center",
                "transition-all duration-150 ease-out min-h-[60px] sm:min-h-[70px]",
                "touch-manipulation select-none",
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
        <div className="text-center mt-4 sm:mt-6 p-3 sm:p-4 bg-red-900/50 rounded-lg border border-red-700">
          <h3 className="text-lg sm:text-xl font-bold text-red-400 mb-2">💥 BOOM! You hit a mine!</h3>
          <p className="text-sm sm:text-base text-red-300">Better luck next time!</p>
        </div>
      )}
      
      {gameData.gameState === 'won' && (
        <div className="text-center mt-4 sm:mt-6 p-3 sm:p-4 bg-emerald-900/50 rounded-lg border border-emerald-700">
          <h3 className="text-lg sm:text-xl font-bold text-emerald-400 mb-2">🎉 Cashed Out Successfully!</h3>
          <p className="text-sm sm:text-base text-emerald-300">Winnings added to your balance!</p>
          <p className="text-xs sm:text-sm text-orange-300 mt-2">💣 Orange tiles show where the mines were</p>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
