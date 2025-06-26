import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GameBoard from "@/components/GameBoard";
import GameControls from "@/components/GameControls";
import GameStats from "@/components/GameStats";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGameData } from "@/hooks/useGameData";

export type GameState = 'idle' | 'playing' | 'won' | 'lost';

export interface GameData {
  grid: ('hidden' | 'safe' | 'mine')[][];
  mineCount: number;
  revealedCount: number;
  currentMultiplier: number;
  balance: number;
  currentBet: number;
  gameState: GameState;
  minePositions: Set<string>;
}

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const { gameData: persistentGameData, isLoading: isGameDataLoading, updateBalance } = useGameData();
  const navigate = useNavigate();

  const [gameData, setGameData] = useState<GameData>({
    grid: Array(5).fill(null).map(() => Array(5).fill('hidden')),
    mineCount: 3,
    revealedCount: 0,
    currentMultiplier: 1.0,
    balance: 1000,
    currentBet: 10,
    gameState: 'idle',
    minePositions: new Set(),
  });

  // Update local balance when persistent data loads
  useEffect(() => {
    if (persistentGameData?.balance !== undefined && !isGameDataLoading) {
      setGameData(prev => ({
        ...prev,
        balance: persistentGameData.balance,
      }));
    }
  }, [persistentGameData?.balance, isGameDataLoading]);

  // Show loading state while checking auth
  if (loading || isGameDataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
            MINESWEEPER
          </h1>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
            MINESWEEPER
          </h1>
          <p className="text-gray-400 mb-6">Please sign in to play</p>
          <Button
            onClick={() => navigate("/auth")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Sign In / Sign Up
          </Button>
        </div>
      </div>
    );
  }

  const resetGame = () => {
    setGameData(prev => ({
      ...prev,
      grid: Array(5).fill(null).map(() => Array(5).fill('hidden')),
      revealedCount: 0,
      currentMultiplier: 1.0,
      gameState: 'idle',
      minePositions: new Set(),
    }));
  };

  const startGame = (betAmount: number, mines: number) => {
    if (betAmount > gameData.balance) return;

    // Generate mine positions
    const minePositions = new Set<string>();
    while (minePositions.size < mines) {
      const row = Math.floor(Math.random() * 5);
      const col = Math.floor(Math.random() * 5);
      minePositions.add(`${row}-${col}`);
    }

    const newBalance = gameData.balance - betAmount;
    setGameData(prev => ({
      ...prev,
      currentBet: betAmount,
      mineCount: mines,
      balance: newBalance,
      gameState: 'playing',
      minePositions,
      grid: Array(5).fill(null).map(() => Array(5).fill('hidden')),
      revealedCount: 0,
      currentMultiplier: 1.0,
    }));

    // Update persistent balance
    updateBalance(newBalance);
  };

  const revealTile = (row: number, col: number) => {
    if (gameData.gameState !== 'playing') return;
    if (gameData.grid[row][col] !== 'hidden') return;

    const position = `${row}-${col}`;
    const isMine = gameData.minePositions.has(position);

    if (isMine) {
      // Hit a mine - game over
      const newGrid = [...gameData.grid];
      newGrid[row][col] = 'mine';
      
      setGameData(prev => ({
        ...prev,
        grid: newGrid,
        gameState: 'lost',
      }));
    } else {
      // Safe tile - calculate new multiplier
      const newRevealedCount = gameData.revealedCount + 1;
      const newMultiplier = calculateMultiplier(newRevealedCount, gameData.mineCount, gameData.currentBet);
      
      const newGrid = [...gameData.grid];
      newGrid[row][col] = 'safe';

      setGameData(prev => ({
        ...prev,
        grid: newGrid,
        revealedCount: newRevealedCount,
        currentMultiplier: newMultiplier,
      }));
    }
  };

  const calculateMultiplier = (revealed: number, mines: number, betAmount: number): number => {
    if (revealed === 0) return 1.0;
    
    // Base multiplier increases with mine count
    let baseMineMultiplier;
    switch (mines) {
      case 1:
        baseMineMultiplier = 1.1; // Low risk, low reward
        break;
      case 3:
        baseMineMultiplier = 1.3; // Medium risk, medium reward
        break;
      case 5:
        baseMineMultiplier = 1.6; // High risk, high reward
        break;
      case 8:
        baseMineMultiplier = 2.2; // Extreme risk, extreme reward
        break;
      default:
        baseMineMultiplier = 1.0;
    }
    
    // Bet amount multiplier - higher bets get better returns per gem
    const betMultiplier = 1 + (betAmount / 100) * 0.1; // Every 100 coins adds 10% bonus
    
    // Each revealed gem compounds the multiplier
    const compoundRate = baseMineMultiplier * betMultiplier;
    return Math.pow(compoundRate, revealed);
  };

  const cashOut = () => {
    const winnings = Math.floor(gameData.currentBet * gameData.currentMultiplier);
    const newBalance = gameData.balance + winnings;
    
    setGameData(prev => ({
      ...prev,
      balance: newBalance,
      gameState: 'won',
    }));

    // Update persistent balance
    updateBalance(newBalance);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="text-center mb-6 sm:mb-8 relative">
          <h1 className="text-3xl sm:text-5xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
            MINESWEEPER
          </h1>
          <p className="text-gray-400 text-sm sm:text-lg">Find the safe tiles, avoid the mines, cash out before it's too late</p>
          
          <div className="absolute top-0 right-0 flex items-center gap-2">
            <span className="text-sm text-gray-400">Welcome, {user.email}</span>
            <Button
              onClick={() => navigate("/settings")}
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2 order-2 lg:order-1">
            <GameBoard 
              gameData={gameData} 
              onTileClick={revealTile}
            />
          </div>
          
          <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
            <GameStats gameData={gameData} />
            <GameControls 
              gameData={gameData}
              onStartGame={startGame}
              onCashOut={cashOut}
              onReset={resetGame}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
