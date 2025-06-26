
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGameData } from "@/hooks/useGameData";
import { useToast } from "@/hooks/use-toast";

interface CaseItem {
  name: string;
  value: number;
  chance: number;
  emoji: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

interface CaseType {
  id: string;
  name: string;
  price: number;
  items: CaseItem[];
}

const cases: CaseType[] = [
  {
    id: 'basic',
    name: 'Basic Case',
    price: 10,
    items: [
      { name: 'Junk', value: 1, chance: 60, emoji: '❌', rarity: 'common' },
      { name: 'Small Coin', value: 5, chance: 25, emoji: '🪙', rarity: 'common' },
      { name: 'Medium Coin', value: 15, chance: 10, emoji: '💰', rarity: 'uncommon' },
      { name: 'Gold Coin', value: 25, chance: 4, emoji: '🟡', rarity: 'rare' },
      { name: 'Diamond', value: 50, chance: 1, emoji: '💎', rarity: 'legendary' },
    ]
  },
  {
    id: 'premium',
    name: 'Premium Case',
    price: 50,
    items: [
      { name: 'Junk', value: 5, chance: 45, emoji: '❌', rarity: 'common' },
      { name: 'Silver Coin', value: 25, chance: 30, emoji: '🥈', rarity: 'common' },
      { name: 'Gold Coin', value: 75, chance: 15, emoji: '🟡', rarity: 'uncommon' },
      { name: 'Ruby', value: 150, chance: 7, emoji: '🔴', rarity: 'rare' },
      { name: 'Diamond', value: 300, chance: 2.5, emoji: '💎', rarity: 'rare' },
      { name: 'Legendary Gem', value: 500, chance: 0.5, emoji: '✨', rarity: 'legendary' },
    ]
  },
  {
    id: 'elite',
    name: 'Elite Case',
    price: 100,
    items: [
      { name: 'Bronze', value: 20, chance: 40, emoji: '🥉', rarity: 'common' },
      { name: 'Silver', value: 75, chance: 25, emoji: '🥈', rarity: 'common' },
      { name: 'Gold', value: 150, chance: 20, emoji: '🥇', rarity: 'uncommon' },
      { name: 'Platinum', value: 300, chance: 10, emoji: '💍', rarity: 'rare' },
      { name: 'Diamond Crown', value: 600, chance: 4, emoji: '👑', rarity: 'rare' },
      { name: 'Legendary Crown', value: 1000, chance: 1, emoji: '💎👑', rarity: 'legendary' },
    ]
  }
];

const Cases = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { gameData, updateBalance } = useGameData();
  const { toast } = useToast();
  
  const [lastOpenedItem, setLastOpenedItem] = useState<CaseItem | null>(null);
  const [isOpening, setIsOpening] = useState(false);

  const balance = gameData?.balance || 1000;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400';
      case 'uncommon': return 'text-green-400';
      case 'rare': return 'text-blue-400';
      case 'legendary': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-700';
      case 'uncommon': return 'bg-green-800';
      case 'rare': return 'bg-blue-800';
      case 'legendary': return 'bg-purple-800';
      default: return 'bg-gray-700';
    }
  };

  const openCase = async (caseType: CaseType) => {
    if (caseType.price > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance to open this case.",
        variant: "destructive",
      });
      return;
    }

    setIsOpening(true);

    // Simulate opening delay
    setTimeout(() => {
      // Weighted random selection
      const random = Math.random() * 100;
      let cumulativeChance = 0;
      let selectedItem: CaseItem | null = null;

      for (const item of caseType.items) {
        cumulativeChance += item.chance;
        if (random <= cumulativeChance) {
          selectedItem = item;
          break;
        }
      }

      if (selectedItem) {
        setLastOpenedItem(selectedItem);
        const newBalance = balance - caseType.price + selectedItem.value;
        updateBalance(newBalance);

        const profit = selectedItem.value - caseType.price;
        toast({
          title: profit > 0 ? "🎉 Profit!" : profit === 0 ? "Break Even" : "💸 Loss",
          description: `You got ${selectedItem.emoji} ${selectedItem.name} worth $${selectedItem.value}! ${profit > 0 ? `+$${profit}` : profit < 0 ? `-$${Math.abs(profit)}` : '$0'}`,
          variant: profit >= 0 ? "default" : "destructive",
        });
      }

      setIsOpening(false);
    }, 1500);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
            CASES
          </h1>
          <p className="text-gray-400 mb-6">Please sign in to play</p>
          <Button
            onClick={() => navigate("/auth")}
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              Cases
            </h1>
          </div>

          {/* Balance Display */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-emerald-400">Balance: ${balance}</h2>
          </div>

          {/* Last Opened Item */}
          {lastOpenedItem && (
            <div className={`mb-8 p-6 rounded-2xl border-2 ${getRarityBg(lastOpenedItem.rarity)} border-opacity-50`}>
              <div className="text-center">
                <div className="text-4xl mb-2">{lastOpenedItem.emoji}</div>
                <div className={`text-xl font-bold ${getRarityColor(lastOpenedItem.rarity)}`}>
                  {lastOpenedItem.name}
                </div>
                <div className="text-emerald-400 text-lg">${lastOpenedItem.value}</div>
              </div>
            </div>
          )}

          {/* Cases Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cases.map((caseType) => (
              <div key={caseType.id} className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <div className="text-center mb-4">
                  <Package className="w-12 h-12 mx-auto mb-2 text-orange-400" />
                  <h3 className="text-xl font-bold mb-2">{caseType.name}</h3>
                  <p className="text-2xl font-bold text-orange-400">${caseType.price}</p>
                </div>

                {/* Items Preview */}
                <div className="space-y-2 mb-6">
                  <h4 className="text-sm font-semibold text-gray-300">Contains:</h4>
                  {caseType.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className={getRarityColor(item.rarity)}>
                        {item.emoji} {item.name}
                      </span>
                      <span className="text-emerald-400">${item.value}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => openCase(caseType)}
                  disabled={isOpening || caseType.price > balance}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold"
                >
                  {isOpening ? "Opening..." : "Open Case"}
                </Button>
              </div>
            ))}
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

export default Cases;
