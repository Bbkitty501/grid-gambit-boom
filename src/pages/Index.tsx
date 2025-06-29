import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GameBoard from "@/components/GameBoard";
import GameControls from "@/components/GameControls";
import GameStats from "@/components/GameStats";
import ProfitTracker from "@/components/ProfitTracker";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
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
  gridSize: number;
}

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
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
    gridSize: 5, // Fixed at 5x5
  });

  const [gameEndedForTracker, setGameEndedForTracker] = useState(false);

  // Update local balance when persistent data loads
  useEffect(() => {
    if (persistentGameData?.balance !== undefined && !isGameDataLoading) {
      setGameData(prev => ({
        ...prev,
        balance: persistentGameData.balance,
      }));
    }
  }, [persistentGameData?.balance, isGameDataLoading]);

  // Track when game ends for profit tracker
  useEffect(() => {
    if (gameData.gameState === 'won' || gameData.gameState === 'lost') {
      setGameEndedForTracker(true);
    } else {
      setGameEndedForTracker(false);
    }
  }, [gameData.gameState]);

  // Show loading state while checking auth
  if (loading || isGameDataLoading || profileLoading) {
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
    console.log('Resetting game');
    setGameData(prev => ({
      ...prev,
      grid: Array(5).fill(null).map(() => Array(5).fill('hidden')), // Fixed 5x5
      revealedCount: 0,
      currentMultiplier: 1.0,
      gameState: 'idle',
      minePositions: new Set(),
      gridSize: 5, // Fixed at 5x5
    }));
  };

  const startGame = (betAmount: number, mines: number) => { // Removed gridSize parameter
    console.log('Starting game with:', { betAmount, mines, balance: gameData.balance });
    
    if (betAmount > gameData.balance) {
      console.log('Insufficient balance');
      return;
    }

    const gridSize = 5; // Fixed at 5x5

    // Generate mine positions
    const minePositions = new Set<string>();
    const totalTiles = gridSize * gridSize;
    
    while (minePositions.size < mines) {
      const row = Math.floor(Math.random() * gridSize);
      const col = Math.floor(Math.random() * gridSize);
      minePositions.add(`${row}-${col}`);
    }

    const newBalance = gameData.balance - betAmount;
    console.log('New balance after bet:', newBalance);
    
    setGameData(prev => ({
      ...prev,
      currentBet: betAmount,
      mineCount: mines,
      balance: newBalance,
      gameState: 'playing',
      minePositions,
      grid: Array(gridSize).fill(null).map(() => Array(gridSize).fill('hidden')),
      revealedCount: 0,
      currentMultiplier: 1.0,
      gridSize,
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
      const newMultiplier = calculateMultiplier(newRevealedCount, gameData.mineCount, gameData.gridSize);
      
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

  const calculateMultiplier = (revealed: number, mines: number, gridSize: number): number => {
    if (revealed === 0) return 1.0;
    
    const totalTiles = gridSize * gridSize;
    const safeTiles = totalTiles - mines;
    
    // Calculate probability of surviving each click
    let multiplier = 1.0;
    
    for (let i = 1; i <= revealed; i++) {
      const safeTilesRemaining = safeTiles - (i - 1);
      const totalTilesRemaining = totalTiles - (i - 1);
      const surviveProbability = safeTilesRemaining / totalTilesRemaining;
      
      // House edge factor (97% RTP)
      const houseEdge = 0.97;
      
      // Calculate fair odds and apply house edge
      const fairOdds = 1 / surviveProbability;
      multiplier *= fairOdds * houseEdge;
    }
    
    return Math.max(1.0, multiplier);
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
      {/* Profit Tracker */}
      <ProfitTracker
        currentBet={gameData.currentBet}
        gameWon={gameData.gameState === 'won'}
        multiplier={gameData.currentMultiplier}
        gameEnded={gameEndedForTracker}
      />
      
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="text-center mb-6 sm:mb-8 relative">
          <h1 className="text-3xl sm:text-5xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
            MINESWEEPER
          </h1>
          <p className="text-gray-400 text-sm sm:text-lg">Find the safe tiles, avoid the mines, cash out before it's too late</p>
          
          <div className="absolute top-0 right-0 flex items-center gap-2">
            <span className="text-sm text-gray-400">
              Welcome, {profile?.email || 'Loading...'}
            </span>
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
