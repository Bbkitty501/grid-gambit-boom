
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Play, RotateCcw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGameData } from "@/hooks/useGameData";
import { useToast } from "@/hooks/use-toast";

interface Card {
  suit: string;
  value: string;
  numValue: number;
}

interface Hand {
  cards: Card[];
  value: number;
  isBlackjack: boolean;
  isBust: boolean;
}

type GamePhase = 'betting' | 'playing' | 'dealer' | 'finished';

const Blackjack = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { gameData, updateBalance } = useGameData();
  const { toast } = useToast();
  
  const [betAmount, setBetAmount] = useState(10);
  const [gamePhase, setGamePhase] = useState<GamePhase>('betting');
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Hand>({ cards: [], value: 0, isBlackjack: false, isBust: false });
  const [dealerHand, setDealerHand] = useState<Hand>({ cards: [], value: 0, isBlackjack: false, isBust: false });
  const [canDouble, setCanDouble] = useState(false);
  const [gameResult, setGameResult] = useState<string>('');

  const balance = gameData?.balance || 1000;

  // Initialize deck
  useEffect(() => {
    const newDeck = createDeck();
    setDeck(shuffleDeck(newDeck));
  }, []);

  const createDeck = (): Card[] => {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck: Card[] = [];
    
    suits.forEach(suit => {
      values.forEach(value => {
        let numValue = parseInt(value);
        if (value === 'A') numValue = 11;
        else if (['J', 'Q', 'K'].includes(value)) numValue = 10;
        
        deck.push({ suit, value, numValue });
      });
    });
    
    return deck;
  };

  const shuffleDeck = (deck: Card[]): Card[] => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const calculateHandValue = (cards: Card[]): { value: number; isBlackjack: boolean; isBust: boolean } => {
    let value = 0;
    let aces = 0;
    
    cards.forEach(card => {
      if (card.value === 'A') {
        aces++;
        value += 11;
      } else {
        value += card.numValue;
      }
    });
    
    // Adjust for aces
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }
    
    const isBlackjack = cards.length === 2 && value === 21;
    const isBust = value > 21;
    
    return { value, isBlackjack, isBust };
  };

  const dealCard = (currentDeck: Card[]): { card: Card; newDeck: Card[] } => {
    const newDeck = [...currentDeck];
    const card = newDeck.pop()!;
    return { card, newDeck };
  };

  const startGame = () => {
    if (betAmount > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this bet.",
        variant: "destructive",
      });
      return;
    }

    // Deduct bet from balance
    updateBalance(balance - betAmount);

    let currentDeck = [...deck];
    const playerCards: Card[] = [];
    const dealerCards: Card[] = [];

    // Deal initial cards
    for (let i = 0; i < 2; i++) {
      const { card: playerCard, newDeck: deck1 } = dealCard(currentDeck);
      playerCards.push(playerCard);
      currentDeck = deck1;

      const { card: dealerCard, newDeck: deck2 } = dealCard(currentDeck);
      dealerCards.push(dealerCard);
      currentDeck = deck2;
    }

    setDeck(currentDeck);

    const playerHandValue = calculateHandValue(playerCards);
    const dealerHandValue = calculateHandValue(dealerCards);

    setPlayerHand({ cards: playerCards, ...playerHandValue });
    setDealerHand({ cards: dealerCards, ...dealerHandValue });

    setCanDouble(true);
    setGamePhase('playing');

    // Check for immediate blackjack
    if (playerHandValue.isBlackjack) {
      if (dealerHandValue.isBlackjack) {
        endGame('push');
      } else {
        endGame('blackjack');
      }
    }
  };

  const hit = () => {
    const { card, newDeck } = dealCard(deck);
    const newCards = [...playerHand.cards, card];
    const handValue = calculateHandValue(newCards);
    
    setDeck(newDeck);
    setPlayerHand({ cards: newCards, ...handValue });
    setCanDouble(false);

    if (handValue.isBust) {
      endGame('bust');
    }
  };

  const stand = () => {
    setGamePhase('dealer');
    dealerPlay();
  };

  const doubleDown = () => {
    if (betAmount * 2 > balance + betAmount) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance to double down.",
        variant: "destructive",
      });
      return;
    }

    // Double the bet
    updateBalance(balance - betAmount);
    setBetAmount(prev => prev * 2);

    // Hit once and stand
    const { card, newDeck } = dealCard(deck);
    const newCards = [...playerHand.cards, card];
    const handValue = calculateHandValue(newCards);
    
    setDeck(newDeck);
    setPlayerHand({ cards: newCards, ...handValue });

    if (handValue.isBust) {
      endGame('bust');
    } else {
      setGamePhase('dealer');
      setTimeout(() => dealerPlay(newCards, handValue), 1000);
    }
  };

  const dealerPlay = (finalPlayerCards?: Card[], finalPlayerValue?: any) => {
    let currentDeck = [...deck];
    let currentDealerCards = [...dealerHand.cards];
    let dealerValue = calculateHandValue(currentDealerCards);

    const playStep = () => {
      if (dealerValue.value < 17) {
        const { card, newDeck } = dealCard(currentDeck);
        currentDealerCards.push(card);
        currentDeck = newDeck;
        dealerValue = calculateHandValue(currentDealerCards);
        
        setDeck(currentDeck);
        setDealerHand({ cards: currentDealerCards, ...dealerValue });
        
        setTimeout(playStep, 1000);
      } else {
        // Dealer finished
        const playerFinalValue = finalPlayerValue || playerHand;
        
        if (dealerValue.isBust) {
          endGame('dealer-bust');
        } else if (dealerValue.value > playerFinalValue.value) {
          endGame('dealer-win');
        } else if (dealerValue.value < playerFinalValue.value) {
          endGame('player-win');
        } else {
          endGame('push');
        }
      }
    };

    setTimeout(playStep, 1000);
  };

  const endGame = (result: string) => {
    let winnings = 0;
    let message = '';

    switch (result) {
      case 'blackjack':
        winnings = Math.floor(betAmount * 2.5);
        message = 'Blackjack! You win!';
        break;
      case 'player-win':
        winnings = betAmount * 2;
        message = 'You win!';
        break;
      case 'dealer-bust':
        winnings = betAmount * 2;
        message = 'Dealer busts! You win!';
        break;
      case 'push':
        winnings = betAmount;
        message = 'Push! It\'s a tie.';
        break;
      case 'bust':
        message = 'Bust! You lose.';
        break;
      case 'dealer-win':
        message = 'Dealer wins.';
        break;
    }

    if (winnings > 0) {
      updateBalance(balance + winnings);
    }

    setGameResult(message);
    setGamePhase('finished');
    
    toast({
      title: message,
      description: winnings > betAmount ? `Won $${winnings - betAmount}` : winnings > 0 ? 'No money lost' : `Lost $${betAmount}`,
      variant: winnings >= betAmount ? 'default' : 'destructive'
    });
  };

  const resetGame = () => {
    setGamePhase('betting');
    setPlayerHand({ cards: [], value: 0, isBlackjack: false, isBust: false });
    setDealerHand({ cards: [], value: 0, isBlackjack: false, isBust: false });
    setCanDouble(false);
    setGameResult('');
    setBetAmount(10);
    
    // Reshuffle deck if less than 20 cards
    if (deck.length < 20) {
      const newDeck = createDeck();
      setDeck(shuffleDeck(newDeck));
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            BLACKJACK
          </h1>
          <p className="text-gray-400 mb-6">Please sign in to play</p>
          <Button
            onClick={() => navigate("/auth")}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Sign In / Sign Up
          </Button>
        </div>
      </div>
    );
  }

  const CardComponent = ({ card, hidden = false }: { card: Card; hidden?: boolean }) => (
    <div className={`w-16 h-24 rounded-lg border-2 flex items-center justify-center font-bold text-lg ${
      hidden 
        ? 'bg-blue-900 border-blue-700' 
        : card.suit === '♥' || card.suit === '♦' 
          ? 'bg-white text-red-600 border-gray-300' 
          : 'bg-white text-black border-gray-300'
    }`}>
      {hidden ? '?' : (
        <div className="text-center">
          <div>{card.value}</div>
          <div className="text-sm">{card.suit}</div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
              Blackjack
            </h1>
          </div>

          <div className="text-center mb-8">
            <div className="text-xl font-bold text-emerald-400 mb-4">
              Balance: ${balance.toFixed(2)}
            </div>
          </div>

          {/* Game Table */}
          <div className="bg-green-800 rounded-3xl p-8 border-4 border-yellow-600 shadow-2xl">
            
            {/* Dealer's Hand */}
            <div className="text-center mb-8">
              <h3 className="text-lg font-bold mb-4">Dealer {dealerHand.value > 0 && gamePhase !== 'playing' ? `(${dealerHand.value})` : ''}</h3>
              <div className="flex justify-center gap-2">
                {dealerHand.cards.map((card, index) => (
                  <CardComponent 
                    key={index} 
                    card={card} 
                    hidden={index === 1 && gamePhase === 'playing'}
                  />
                ))}
              </div>
            </div>

            {/* Game Controls */}
            <div className="text-center mb-8">
              {gamePhase === 'betting' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Bet Amount</label>
                    <Input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      max={balance}
                      className="bg-slate-700 border-slate-600 w-32 mx-auto"
                    />
                  </div>
                  <Button
                    onClick={startGame}
                    disabled={betAmount > balance}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Deal Cards
                  </Button>
                </div>
              )}

              {gamePhase === 'playing' && (
                <div className="space-x-4">
                  <Button
                    onClick={hit}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Hit
                  </Button>
                  <Button
                    onClick={stand}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Stand
                  </Button>
                  {canDouble && (
                    <Button
                      onClick={doubleDown}
                      className="bg-yellow-600 hover:bg-yellow-700"
                      disabled={betAmount * 2 > balance + betAmount}
                    >
                      Double Down
                    </Button>
                  )}
                </div>
              )}

              {gamePhase === 'dealer' && (
                <div className="text-yellow-400 font-bold">
                  Dealer is playing...
                </div>
              )}

              {gamePhase === 'finished' && (
                <div className="space-y-4">
                  <div className="text-2xl font-bold text-yellow-400">
                    {gameResult}
                  </div>
                  <Button
                    onClick={resetGame}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    New Game
                  </Button>
                </div>
              )}
            </div>

            {/* Player's Hand */}
            <div className="text-center">
              <h3 className="text-lg font-bold mb-4">Your Hand ({playerHand.value})</h3>
              <div className="flex justify-center gap-2">
                {playerHand.cards.map((card, index) => (
                  <CardComponent key={index} card={card} />
                ))}
              </div>
              {gamePhase === 'betting' && (
                <p className="text-gray-400 mt-4">
                  Get as close to 21 as possible without going over!
                </p>
              )}
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

export default Blackjack;
