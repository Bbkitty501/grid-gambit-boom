
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Play, Trophy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGameData } from "@/hooks/useGameData";
import { useToast } from "@/hooks/use-toast";

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  active: boolean;
}

interface Peg {
  x: number;
  y: number;
}

interface GameResult {
  bet: number;
  multiplier: number;
  payout: number;
  timestamp: Date;
}

const Plinko = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { gameData, updateBalance } = useGameData();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  const [betAmount, setBetAmount] = useState(10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isPlaying, setIsPlaying] = useState(false);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [pegs, setPegs] = useState<Peg[]>([]);
  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);
  const [ballId, setBallId] = useState(0);

  const balance = gameData?.balance || 1000;

  // Difficulty settings
  const difficultySettings = {
    easy: { rows: 8, multipliers: [0.5, 1, 1.5, 2, 2.5, 2, 1.5, 1, 0.5] },
    medium: { rows: 12, multipliers: [0.2, 0.5, 1, 2, 5, 10, 25, 10, 5, 2, 1, 0.5, 0.2] },
    hard: { rows: 16, multipliers: [0.1, 0.3, 0.5, 1, 2, 5, 15, 50, 100, 50, 15, 5, 2, 1, 0.5, 0.3, 0.1] }
  };

  const settings = difficultySettings[difficulty];
  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 500;
  const PEG_RADIUS = 4;
  const BALL_RADIUS = 6;

  // Initialize pegs based on difficulty
  useEffect(() => {
    const newPegs: Peg[] = [];
    const rows = settings.rows;
    
    for (let row = 0; row < rows; row++) {
      const pegsInRow = row + 3;
      const spacing = CANVAS_WIDTH / (pegsInRow + 1);
      const y = 80 + (row * 30);
      
      for (let col = 0; col < pegsInRow; col++) {
        const x = spacing * (col + 1);
        newPegs.push({ x, y });
      }
    }
    
    setPegs(newPegs);
  }, [difficulty, settings.rows]);

  // Game physics and rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      // Clear canvas
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Draw pegs
      ctx.fillStyle = '#64748b';
      pegs.forEach(peg => {
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, PEG_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Draw multiplier slots
      const slotWidth = CANVAS_WIDTH / settings.multipliers.length;
      settings.multipliers.forEach((multiplier, i) => {
        const x = i * slotWidth;
        const y = CANVAS_HEIGHT - 50;
        
        // Color based on multiplier value
        let color = '#64748b';
        if (multiplier >= 10) color = '#dc2626';
        else if (multiplier >= 5) color = '#ea580c';
        else if (multiplier >= 2) color = '#ca8a04';
        else if (multiplier >= 1) color = '#16a34a';
        else color = '#374151';
        
        ctx.fillStyle = color;
        ctx.fillRect(x, y, slotWidth, 40);
        
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${multiplier}x`, x + slotWidth / 2, y + 25);
      });
      
      // Update and draw balls
      setBalls(prevBalls => {
        return prevBalls.map(ball => {
          if (!ball.active) return ball;
          
          // Physics
          ball.vy += 0.3; // gravity
          ball.x += ball.vx;
          ball.y += ball.vy;
          
          // Bounce off pegs
          pegs.forEach(peg => {
            const dx = ball.x - peg.x;
            const dy = ball.y - peg.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < BALL_RADIUS + PEG_RADIUS) {
              const angle = Math.atan2(dy, dx);
              ball.vx = Math.cos(angle) * 3 + (Math.random() - 0.5) * 2;
              ball.vy = Math.abs(Math.sin(angle)) * 2;
              
              // Move ball away from peg
              ball.x = peg.x + Math.cos(angle) * (BALL_RADIUS + PEG_RADIUS + 1);
              ball.y = peg.y + Math.sin(angle) * (BALL_RADIUS + PEG_RADIUS + 1);
            }
          });
          
          // Bounce off walls
          if (ball.x <= BALL_RADIUS || ball.x >= CANVAS_WIDTH - BALL_RADIUS) {
            ball.vx *= -0.8;
            ball.x = Math.max(BALL_RADIUS, Math.min(CANVAS_WIDTH - BALL_RADIUS, ball.x));
          }
          
          // Check if ball reached bottom
          if (ball.y >= CANVAS_HEIGHT - 60) {
            const slotIndex = Math.floor(ball.x / (CANVAS_WIDTH / settings.multipliers.length));
            const multiplier = settings.multipliers[Math.max(0, Math.min(settings.multipliers.length - 1, slotIndex))];
            
            // Calculate payout
            const payout = betAmount * multiplier;
            const newBalance = balance + payout - betAmount;
            updateBalance(newBalance);
            
            // Add to history
            const result: GameResult = {
              bet: betAmount,
              multiplier,
              payout,
              timestamp: new Date()
            };
            setGameHistory(prev => [result, ...prev.slice(0, 9)]);
            
            // Show result
            if (payout > betAmount) {
              toast({
                title: "You Won!",
                description: `${multiplier}x multiplier! Won $${(payout - betAmount).toFixed(2)}`,
              });
            } else {
              toast({
                title: "You Lost",
                description: `${multiplier}x multiplier. Lost $${(betAmount - payout).toFixed(2)}`,
                variant: "destructive",
              });
            }
            
            ball.active = false;
            setIsPlaying(false);
          }
          
          return ball;
        });
      });
      
      // Draw active balls
      ctx.fillStyle = '#fbbf24';
      balls.forEach(ball => {
        if (ball.active) {
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [balls, pegs, settings.multipliers, betAmount, balance, updateBalance, toast]);

  const dropBall = () => {
    if (betAmount > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this bet.",
        variant: "destructive",
      });
      return;
    }
    
    if (isPlaying) return;
    
    setIsPlaying(true);
    
    const newBall: Ball = {
      id: ballId,
      x: CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 20,
      y: 20,
      vx: (Math.random() - 0.5) * 2,
      vy: 0,
      radius: BALL_RADIUS,
      active: true
    };
    
    setBalls([newBall]);
    setBallId(prev => prev + 1);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            PLINK PLANK
          </h1>
          <p className="text-gray-400 mb-6">Please sign in to play</p>
          <Button
            onClick={() => navigate("/auth")}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Sign In / Sign Up
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center mb-8">
            <Button
              onClick={() => navigate("/settings")}
              variant="ghost"
              size="sm"
              className="mr-4 text-gray-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Settings
            </Button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Plink Plank
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Game Controls */}
            <div className="space-y-6">
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <h2 className="text-xl font-bold mb-4 text-emerald-400">Balance: ${balance.toFixed(2)}</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Bet Amount</label>
                    <Input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      max={balance}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Difficulty</label>
                    <Select
                      value={difficulty}
                      onValueChange={(value: 'easy' | 'medium' | 'hard') => setDifficulty(value)}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy (Max 2.5x)</SelectItem>
                        <SelectItem value="medium">Medium (Max 25x)</SelectItem>
                        <SelectItem value="hard">Hard (Max 100x)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    onClick={dropBall}
                    disabled={isPlaying || betAmount > balance}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {isPlaying ? 'Ball Dropping...' : 'Drop Ball'}
                  </Button>
                </div>
              </div>

              {/* Game History */}
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <Trophy className="w-5 h-5 mr-2" />
                  Recent Results
                </h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {gameHistory.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border text-sm ${
                        result.payout > result.bet
                          ? 'bg-green-900/20 border-green-800'
                          : 'bg-red-900/20 border-red-800'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{result.multiplier}x</span>
                        <span className={result.payout > result.bet ? 'text-green-400' : 'text-red-400'}>
                          ${(result.payout - result.bet).toFixed(2)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Bet: ${result.bet} → Payout: ${result.payout.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Game Board */}
            <div className="lg:col-span-3">
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  className="w-full max-w-full h-auto border border-slate-600 rounded-lg"
                  style={{ aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}
                />
                
                <div className="mt-4 text-center">
                  <p className="text-gray-400 text-sm">
                    Drop a ball and watch it bounce through the pegs to land in a multiplier slot!
                  </p>
                  <div className="flex justify-center gap-2 mt-2 text-xs">
                    <span className="text-green-400">Green: 1x+</span>
                    <span className="text-yellow-400">Yellow: 2x+</span>
                    <span className="text-orange-400">Orange: 5x+</span>
                    <span className="text-red-400">Red: 10x+</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="border-emerald-600 text-emerald-400 hover:bg-emerald-600 hover:text-white"
            >
              Back to Minesweeper
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Plinko;
