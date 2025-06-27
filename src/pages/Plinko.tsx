
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
  trail: { x: number; y: number }[];
}

interface Peg {
  x: number;
  y: number;
  glowing: boolean;
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

  // Difficulty settings with higher multipliers on the edges
  const difficultySettings = {
    easy: { rows: 8, multipliers: [5, 2, 1.5, 1, 0.5, 1, 1.5, 2, 5] },
    medium: { rows: 12, multipliers: [25, 10, 5, 2, 1, 0.5, 0.2, 0.5, 1, 2, 5, 10, 25] },
    hard: { rows: 16, multipliers: [100, 50, 25, 10, 5, 2, 1, 0.5, 0.2, 0.5, 1, 2, 5, 10, 25, 50, 100] }
  };

  const settings = difficultySettings[difficulty];
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const PEG_RADIUS = 6;
  const BALL_RADIUS = 8;

  // Initialize pegs based on difficulty
  useEffect(() => {
    const newPegs: Peg[] = [];
    const rows = settings.rows;
    
    for (let row = 0; row < rows; row++) {
      const pegsInRow = row + 3;
      const spacing = (CANVAS_WIDTH - 100) / (pegsInRow + 1);
      const y = 120 + (row * 35);
      
      for (let col = 0; col < pegsInRow; col++) {
        const x = 50 + spacing * (col + 1);
        newPegs.push({ x, y, glowing: false });
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
      // Clear canvas with gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      gradient.addColorStop(0, '#1e1b4b');
      gradient.addColorStop(1, '#0f172a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Draw pegs with glow effect
      pegs.forEach(peg => {
        if (peg.glowing) {
          // Glow effect
          ctx.shadowColor = '#60a5fa';
          ctx.shadowBlur = 20;
        } else {
          ctx.shadowBlur = 0;
        }
        
        ctx.fillStyle = peg.glowing ? '#60a5fa' : '#94a3b8';
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, PEG_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        
        // Reset glow
        peg.glowing = false;
      });
      
      ctx.shadowBlur = 0;
      
      // Draw multiplier slots with enhanced visuals
      const slotWidth = (CANVAS_WIDTH - 100) / settings.multipliers.length;
      settings.multipliers.forEach((multiplier, i) => {
        const x = 50 + i * slotWidth;
        const y = CANVAS_HEIGHT - 80;
        
        // Color based on multiplier value with gradient
        let color1, color2;
        if (multiplier >= 50) {
          color1 = '#dc2626'; color2 = '#991b1b';
        } else if (multiplier >= 10) {
          color1 = '#ea580c'; color2 = '#c2410c';
        } else if (multiplier >= 5) {
          color1 = '#ca8a04'; color2 = '#a16207';
        } else if (multiplier >= 2) {
          color1 = '#16a34a'; color2 = '#15803d';
        } else if (multiplier >= 1) {
          color1 = '#2563eb'; color2 = '#1d4ed8';
        } else {
          color1 = '#64748b'; color2 = '#475569';
        }
        
        const slotGradient = ctx.createLinearGradient(x, y, x, y + 60);
        slotGradient.addColorStop(0, color1);
        slotGradient.addColorStop(1, color2);
        
        ctx.fillStyle = slotGradient;
        ctx.fillRect(x, y, slotWidth - 2, 60);
        
        // Border
        ctx.strokeStyle = '#ffffff30';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, slotWidth - 2, 60);
        
        // Text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${multiplier}x`, x + slotWidth / 2, y + 35);
      });
      
      // Update and draw balls
      setBalls(prevBalls => {
        return prevBalls.map(ball => {
          if (!ball.active) return ball;
          
          // Slower physics for suspenseful gameplay
          ball.vy += 0.15; // reduced gravity
          ball.x += ball.vx * 0.8; // reduced horizontal speed
          ball.y += ball.vy * 0.8; // reduced vertical speed
          
          // Add to trail
          ball.trail.push({ x: ball.x, y: ball.y });
          if (ball.trail.length > 15) {
            ball.trail.shift();
          }
          
          // Bounce off pegs
          pegs.forEach(peg => {
            const dx = ball.x - peg.x;
            const dy = ball.y - peg.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < BALL_RADIUS + PEG_RADIUS) {
              const angle = Math.atan2(dy, dx);
              ball.vx = Math.cos(angle) * 2 + (Math.random() - 0.5) * 1.5;
              ball.vy = Math.abs(Math.sin(angle)) * 1.5;
              
              // Move ball away from peg
              ball.x = peg.x + Math.cos(angle) * (BALL_RADIUS + PEG_RADIUS + 2);
              ball.y = peg.y + Math.sin(angle) * (BALL_RADIUS + PEG_RADIUS + 2);
              
              // Make peg glow
              peg.glowing = true;
            }
          });
          
          // Bounce off walls
          if (ball.x <= 50 + BALL_RADIUS || ball.x >= CANVAS_WIDTH - 50 - BALL_RADIUS) {
            ball.vx *= -0.7;
            ball.x = Math.max(50 + BALL_RADIUS, Math.min(CANVAS_WIDTH - 50 - BALL_RADIUS, ball.x));
          }
          
          // Check if ball reached bottom
          if (ball.y >= CANVAS_HEIGHT - 90) {
            const slotIndex = Math.floor((ball.x - 50) / ((CANVAS_WIDTH - 100) / settings.multipliers.length));
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
      
      // Draw ball trails
      balls.forEach(ball => {
        if (ball.active && ball.trail.length > 1) {
          for (let i = 0; i < ball.trail.length - 1; i++) {
            const alpha = i / ball.trail.length;
            ctx.strokeStyle = `rgba(251, 191, 36, ${alpha * 0.5})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(ball.trail[i].x, ball.trail[i].y);
            ctx.lineTo(ball.trail[i + 1].x, ball.trail[i + 1].y);
            ctx.stroke();
          }
        }
      });
      
      // Draw active balls with glow
      balls.forEach(ball => {
        if (ball.active) {
          // Glow effect
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 15;
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
          ctx.fill();
          
          // Inner highlight
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(ball.x - 2, ball.y - 2, ball.radius * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      
      ctx.shadowBlur = 0;
      
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
      x: CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 30,
      y: 50,
      vx: (Math.random() - 0.5) * 1,
      vy: 0,
      radius: BALL_RADIUS,
      active: true,
      trail: []
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
        <div className="max-w-7xl mx-auto">
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

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Sidebar - Betting Controls */}
            <div className="lg:col-span-1 space-y-6">
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
                    <label className="block text-sm font-medium mb-2">Risk Level</label>
                    <Select
                      value={difficulty}
                      onValueChange={(value: 'easy' | 'medium' | 'hard') => setDifficulty(value)}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Low Risk (Max 5x)</SelectItem>
                        <SelectItem value="medium">Medium Risk (Max 25x)</SelectItem>
                        <SelectItem value="hard">High Risk (Max 100x)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    onClick={dropBall}
                    disabled={isPlaying || betAmount > balance}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-lg py-3"
                  >
                    <Play className="w-5 h-5 mr-2" />
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
            <div className="lg:col-span-4">
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  className="w-full max-w-full h-auto border-2 border-slate-600 rounded-lg"
                  style={{ aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}
                />
                
                <div className="mt-4 text-center">
                  <p className="text-gray-400 text-sm">
                    Watch your ball bounce through the pegs! Higher multipliers are on the edges.
                  </p>
                  <div className="flex justify-center gap-4 mt-2 text-xs">
                    <span className="text-red-400">● Red: 50x+</span>
                    <span className="text-orange-400">● Orange: 10x+</span>
                    <span className="text-yellow-400">● Yellow: 5x+</span>
                    <span className="text-green-400">● Green: 2x+</span>
                    <span className="text-blue-400">● Blue: 1x+</span>
                    <span className="text-gray-400">● Gray: &lt;1x</span>
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
