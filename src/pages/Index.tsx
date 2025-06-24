
import { useState } from "react";
import GameBoard from "@/components/GameBoard";
import GameControls from "@/components/GameControls";
import GameStats from "@/components/GameStats";

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

    setGameData(prev => ({
      ...prev,
      currentBet: betAmount,
      mineCount: mines,
      balance: prev.balance - betAmount,
      gameState: 'playing',
      minePositions,
      grid: Array(5).fill(null).map(() => Array(5).fill('hidden')),
      revealedCount: 0,
      currentMultiplier: 1.0,
    }));
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
      const totalSafeTiles = 25 - gameData.mineCount;
      const newMultiplier = calculateMultiplier(newRevealedCount, totalSafeTiles, gameData.mineCount);
      
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

  const calculateMultiplier = (revealed: number, totalSafe: number, mines: number): number => {
    if (revealed === 0) return 1.0;
    // Progressive multiplier based on risk
    const riskFactor = mines / 25;
    const progressFactor = revealed / totalSafe;
    return 1 + (progressFactor * riskFactor * 10);
  };

  const cashOut = () => {
    const winnings = Math.floor(gameData.currentBet * gameData.currentMultiplier);
    setGameData(prev => ({
      ...prev,
      balance: prev.balance + winnings,
      gameState: 'won',
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
            MINESWEEPER
          </h1>
          <p className="text-gray-400 text-lg">Find the safe tiles, avoid the mines, cash out before it's too late</p>
        </div>

        <div className="max-w-4xl mx-auto grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <GameBoard 
              gameData={gameData} 
              onTileClick={revealTile}
            />
          </div>
          
          <div className="space-y-6">
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
