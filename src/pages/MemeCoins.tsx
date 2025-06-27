
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, TrendingUp, TrendingDown, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGameData } from "@/hooks/useGameData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MemeCoin {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  marketCap: number;
  creator: string;
  description: string;
  emoji: string;
  created_at: string;
}

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  created_at: string;
}

interface UserPortfolio {
  [coinId: string]: number;
}

interface UserChatData {
  violations: number;
  bannedUntil?: Date;
}

const bannedWords = [
  'fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard', 'crap',
];

const MemeCoins = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { gameData, updateBalance } = useGameData();
  const { toast } = useToast();
  
  const [coins, setCoins] = useState<MemeCoin[]>([]);
  const [portfolio, setPortfolio] = useState<UserPortfolio>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userChatData, setUserChatData] = useState<UserChatData>({ violations: 0 });
  const [showCreateCoin, setShowCreateCoin] = useState(false);
  const [newCoin, setNewCoin] = useState({
    name: '',
    symbol: '',
    emoji: '',
    description: '',
    initialPrice: 0.01
  });

  const balance = gameData?.balance || 1000;

  // Load coins and chat from localStorage or set defaults
  useEffect(() => {
    const savedCoins = localStorage.getItem('meme-coins');
    const savedPortfolio = localStorage.getItem('meme-portfolio');
    const savedChat = localStorage.getItem('meme-chat');
    
    if (savedCoins) {
      setCoins(JSON.parse(savedCoins));
    } else {
      // Default coins
      const defaultCoins = [
        {
          id: '1',
          name: 'DogeFart',
          symbol: 'DOGE',
          price: 0.0032,
          change24h: 42,
          marketCap: 3200,
          creator: 'system',
          description: 'The fartiest dog coin',
          emoji: '🐶',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'ToiletPepe',
          symbol: 'TPEPE',
          price: 0.0007,
          change24h: -12,
          marketCap: 700,
          creator: 'system',
          description: 'Straight from the toilet',
          emoji: '🧻',
          created_at: new Date().toISOString()
        }
      ];
      setCoins(defaultCoins);
      localStorage.setItem('meme-coins', JSON.stringify(defaultCoins));
    }
    
    if (savedPortfolio) {
      setPortfolio(JSON.parse(savedPortfolio));
    }
    
    if (savedChat) {
      const parsedChat = JSON.parse(savedChat);
      setChatMessages(parsedChat.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })));
    }

    // Set up real-time sync across devices
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'meme-coins' && e.newValue) {
        setCoins(JSON.parse(e.newValue));
      }
      if (e.key === 'meme-chat' && e.newValue) {
        const parsedChat = JSON.parse(e.newValue);
        setChatMessages(parsedChat.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Save to localStorage whenever coins change
  useEffect(() => {
    localStorage.setItem('meme-coins', JSON.stringify(coins));
  }, [coins]);

  // Save portfolio to localStorage
  useEffect(() => {
    localStorage.setItem('meme-portfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  // Save chat to localStorage
  useEffect(() => {
    localStorage.setItem('meme-chat', JSON.stringify(chatMessages));
  }, [chatMessages]);

  const containsBannedWords = (message: string) => {
    const lowerMessage = message.toLowerCase();
    return bannedWords.some(word => lowerMessage.includes(word));
  };

  const isChatBanned = () => {
    return userChatData.bannedUntil && new Date() < userChatData.bannedUntil;
  };

  const sendMessage = () => {
    if (!newMessage.trim() || isChatBanned()) return;

    if (containsBannedWords(newMessage)) {
      const newViolations = userChatData.violations + 1;
      
      if (newViolations >= 3) {
        const bannedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        setUserChatData({ violations: newViolations, bannedUntil });
        toast({
          title: "Chat Banned",
          description: "You've been banned from chat for 30 minutes due to inappropriate language.",
          variant: "destructive",
        });
      } else {
        setUserChatData({ ...userChatData, violations: newViolations });
        toast({
          title: "Message Blocked",
          description: `Message contains inappropriate language. Violations: ${newViolations}/3`,
          variant: "destructive",
        });
      }
      
      setNewMessage('');
      return;
    }

    const message: ChatMessage = {
      id: Date.now().toString(),
      username: user?.email?.split('@')[0] || 'Anonymous',
      message: newMessage,
      timestamp: new Date(),
      created_at: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const buyCoin = (coinId: string, amount: number) => {
    const coin = coins.find(c => c.id === coinId);
    if (!coin) return;

    const cost = amount * coin.price;
    if (cost > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this purchase.",
        variant: "destructive",
      });
      return;
    }

    // Update balance
    updateBalance(balance - cost);
    
    // Update portfolio
    setPortfolio(prev => ({
      ...prev,
      [coinId]: (prev[coinId] || 0) + amount
    }));

    // Update coin price (simple demand logic)
    setCoins(prev => prev.map(c => 
      c.id === coinId 
        ? { ...c, price: c.price * 1.05, change24h: c.change24h + 2 }
        : c
    ));

    toast({
      title: "Purchase Successful",
      description: `Bought ${amount} ${coin.symbol} for $${cost.toFixed(4)}`,
    });
  };

  const sellCoin = (coinId: string, amount: number) => {
    const coin = coins.find(c => c.id === coinId);
    const holdings = portfolio[coinId] || 0;
    
    if (!coin || amount > holdings) return;

    const value = amount * coin.price;
    
    // Update balance
    updateBalance(balance + value);
    
    // Update portfolio
    setPortfolio(prev => ({
      ...prev,
      [coinId]: holdings - amount
    }));

    // Update coin price
    setCoins(prev => prev.map(c => 
      c.id === coinId 
        ? { ...c, price: c.price * 0.95, change24h: c.change24h - 2 }
        : c
    ));

    toast({
      title: "Sale Successful",
      description: `Sold ${amount} ${coin.symbol} for $${value.toFixed(4)}`,
    });
  };

  const createCoin = () => {
    if (!newCoin.name || !newCoin.symbol || !newCoin.emoji) return;

    const coin: MemeCoin = {
      id: Date.now().toString(),
      name: newCoin.name,
      symbol: newCoin.symbol.toUpperCase(),
      price: newCoin.initialPrice,
      change24h: 0,
      marketCap: newCoin.initialPrice * 1000000,
      creator: user?.email?.split('@')[0] || 'Anonymous',
      description: newCoin.description,
      emoji: newCoin.emoji,
      created_at: new Date().toISOString()
    };

    setCoins(prev => [...prev, coin]);
    setShowCreateCoin(false);
    setNewCoin({ name: '', symbol: '', emoji: '', description: '', initialPrice: 0.01 });

    // Add coin creation message to chat
    const creationMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      username: 'SYSTEM',
      message: `🎉 New coin launched: ${coin.name} (${coin.symbol}) by ${coin.creator}!`,
      timestamp: new Date(),
      created_at: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, creationMessage]);

    toast({
      title: "Coin Created!",
      description: `${coin.name} (${coin.symbol}) is now live on the market!`,
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            MEME COINS
          </h1>
          <p className="text-gray-400 mb-6">Please sign in to play</p>
          <Button
            onClick={() => navigate("/auth")}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Meme Coins
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Balance and Create Button */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-emerald-400">Balance: ${balance.toFixed(2)}</h2>
                <Button
                  onClick={() => setShowCreateCoin(true)}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Coin
                </Button>
              </div>

              {/* Create Coin Modal */}
              {showCreateCoin && (
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 mb-6">
                  <h3 className="text-xl font-bold mb-4">Create New Meme Coin</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Coin Name"
                      value={newCoin.name}
                      onChange={(e) => setNewCoin(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-slate-700 border-slate-600"
                    />
                    <Input
                      placeholder="Symbol (e.g. DOGE)"
                      value={newCoin.symbol}
                      onChange={(e) => setNewCoin(prev => ({ ...prev, symbol: e.target.value }))}
                      className="bg-slate-700 border-slate-600"
                    />
                    <Input
                      placeholder="Emoji"
                      value={newCoin.emoji}
                      onChange={(e) => setNewCoin(prev => ({ ...prev, emoji: e.target.value }))}
                      className="bg-slate-700 border-slate-600"
                    />
                    <Input
                      placeholder="Initial Price"
                      type="number"
                      step="0.001"
                      value={newCoin.initialPrice}
                      onChange={(e) => setNewCoin(prev => ({ ...prev, initialPrice: parseFloat(e.target.value) || 0.01 }))}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  <Input
                    placeholder="Description"
                    value={newCoin.description}
                    onChange={(e) => setNewCoin(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-slate-700 border-slate-600 mt-4"
                  />
                  <div className="flex gap-2 mt-4">
                    <Button onClick={createCoin} className="bg-green-600 hover:bg-green-700">
                      Create Coin
                    </Button>
                    <Button onClick={() => setShowCreateCoin(false)} variant="outline">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Coins List */}
              <div className="space-y-4">
                {coins.map((coin) => (
                  <div key={coin.id} className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{coin.emoji}</span>
                        <div>
                          <h3 className="text-xl font-bold">{coin.name} ({coin.symbol})</h3>
                          <p className="text-gray-400 text-sm">{coin.description}</p>
                          <p className="text-gray-500 text-xs">Created by: {coin.creator}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">${coin.price.toFixed(6)}</div>
                        <div className={`flex items-center ${coin.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {coin.change24h >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                          {coin.change24h.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 items-center">
                      <Button
                        onClick={() => buyCoin(coin.id, 1000)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Buy 1K
                      </Button>
                      {portfolio[coin.id] > 0 && (
                        <Button
                          onClick={() => sellCoin(coin.id, Math.min(1000, portfolio[coin.id]))}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Sell 1K
                        </Button>
                      )}
                      {portfolio[coin.id] > 0 && (
                        <span className="text-emerald-400 flex items-center ml-4">
                          Holdings: {portfolio[coin.id].toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Sidebar */}
            <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 h-fit">
              <h3 className="text-lg font-bold mb-4">Live Chat</h3>
              
              {/* Chat Messages */}
              <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="text-sm">
                    <span className={`font-semibold ${msg.username === 'SYSTEM' ? 'text-yellow-400' : 'text-blue-400'}`}>
                      {msg.username}:
                    </span>
                    <span className="ml-2">{msg.message}</span>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2">
                <Input
                  placeholder={isChatBanned() ? "Chat banned for 30 min" : "Type message..."}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  disabled={isChatBanned()}
                  className="bg-slate-700 border-slate-600 text-sm"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || isChatBanned()}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {isChatBanned() && (
                <p className="text-red-400 text-xs mt-2">
                  Chat banned until {userChatData.bannedUntil?.toLocaleTimeString()}
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

export default MemeCoins;
