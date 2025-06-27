
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, TrendingUp, TrendingDown, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGameData } from "@/hooks/useGameData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface MemeCoin {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change_24h: number;
  market_cap: number;
  creator_id: string;
  creator_name: string;
  description: string;
  emoji: string;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  message: string;
  created_at: string;
}

interface UserPortfolio {
  id: string;
  user_id: string;
  coin_id: string;
  amount: number;
}

const bannedWords = [
  'fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard', 'crap',
];

const MemeCoins = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { gameData, updateBalance } = useGameData();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userChatData, setUserChatData] = useState({ violations: 0, bannedUntil: undefined as Date | undefined });
  const [showCreateCoin, setShowCreateCoin] = useState(false);
  const [newCoin, setNewCoin] = useState({
    name: '',
    symbol: '',
    emoji: '',
    description: '',
    initialPrice: 0.01
  });

  const balance = gameData?.balance || 1000;

  // Fetch meme coins from Supabase
  const { data: coins = [], refetch: refetchCoins } = useQuery({
    queryKey: ['meme-coins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meme_coins')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as MemeCoin[];
    },
  });

  // Fetch user's portfolio
  const { data: portfolio = [] } = useQuery({
    queryKey: ['user-portfolio', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_portfolios')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as UserPortfolio[];
    },
    enabled: !!user,
  });

  // Fetch chat messages
  const { data: messages = [] } = useQuery({
    queryKey: ['chat-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as ChatMessage[];
    },
  });

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to new coins
    const coinsChannel = supabase
      .channel('meme_coins_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'meme_coins'
      }, () => {
        refetchCoins();
      })
      .subscribe();

    // Subscribe to chat messages
    const chatChannel = supabase
      .channel('chat_messages_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        const newMessage = payload.new as ChatMessage;
        queryClient.setQueryData(['chat-messages'], (old: ChatMessage[] = []) => [...old, newMessage]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(coinsChannel);
      supabase.removeChannel(chatChannel);
    };
  }, [user, refetchCoins, queryClient]);

  const createCoinMutation = useMutation({
    mutationFn: async (coinData: typeof newCoin) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('meme_coins')
        .insert({
          name: coinData.name,
          symbol: coinData.symbol.toUpperCase(),
          price: coinData.initialPrice,
          change_24h: 0,
          market_cap: coinData.initialPrice * 1000000,
          creator_id: user.id,
          creator_name: user.email?.split('@')[0] || 'Anonymous',
          description: coinData.description,
          emoji: coinData.emoji,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newCoinData) => {
      setShowCreateCoin(false);
      setNewCoin({ name: '', symbol: '', emoji: '', description: '', initialPrice: 0.01 });
      
      // Add system message to chat
      sendSystemMessage(`🎉 New coin launched: ${newCoinData.name} (${newCoinData.symbol}) by ${newCoinData.creator_name}!`);
      
      toast({
        title: "Coin Created!",
        description: `${newCoinData.name} (${newCoinData.symbol}) is now live on the market!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create coin",
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          username: user.email?.split('@')[0] || 'Anonymous',
          message: message,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });

  const sendSystemMessage = async (message: string) => {
    await supabase
      .from('chat_messages')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        username: 'SYSTEM',
        message: message,
      });
  };

  const buyCoinMutation = useMutation({
    mutationFn: async ({ coinId, amount }: { coinId: string, amount: number }) => {
      if (!user) throw new Error('User not authenticated');
      
      const coin = coins.find(c => c.id === coinId);
      if (!coin) throw new Error('Coin not found');

      const cost = amount * coin.price;
      if (cost > balance) throw new Error('Insufficient balance');

      // Update balance
      updateBalance(balance - cost);

      // Update or create portfolio entry
      const existingPortfolio = portfolio.find(p => p.coin_id === coinId);
      
      if (existingPortfolio) {
        const { error } = await supabase
          .from('user_portfolios')
          .update({ amount: existingPortfolio.amount + amount })
          .eq('id', existingPortfolio.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_portfolios')
          .insert({
            user_id: user.id,
            coin_id: coinId,
            amount: amount,
          });
        if (error) throw error;
      }

      // Update coin price
      const { error: coinError } = await supabase
        .from('meme_coins')
        .update({
          price: coin.price * 1.05,
          change_24h: coin.change_24h + 2,
        })
        .eq('id', coinId);
      
      if (coinError) throw coinError;

      return { coin, amount, cost };
    },
    onSuccess: ({ coin, amount, cost }) => {
      queryClient.invalidateQueries({ queryKey: ['user-portfolio'] });
      toast({
        title: "Purchase Successful",
        description: `Bought ${amount} ${coin.symbol} for $${cost.toFixed(4)}`,
      });
    },
  });

  const sellCoinMutation = useMutation({
    mutationFn: async ({ coinId, amount }: { coinId: string, amount: number }) => {
      if (!user) throw new Error('User not authenticated');
      
      const coin = coins.find(c => c.id === coinId);
      const portfolioEntry = portfolio.find(p => p.coin_id === coinId);
      
      if (!coin || !portfolioEntry || amount > portfolioEntry.amount) {
        throw new Error('Invalid sell amount');
      }

      const value = amount * coin.price;
      
      // Update balance
      updateBalance(balance + value);

      // Update portfolio
      const newAmount = portfolioEntry.amount - amount;
      if (newAmount === 0) {
        const { error } = await supabase
          .from('user_portfolios')
          .delete()
          .eq('id', portfolioEntry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_portfolios')
          .update({ amount: newAmount })
          .eq('id', portfolioEntry.id);
        if (error) throw error;
      }

      // Update coin price
      const { error: coinError } = await supabase
        .from('meme_coins')
        .update({
          price: coin.price * 0.95,
          change_24h: coin.change_24h - 2,
        })
        .eq('id', coinId);
      
      if (coinError) throw coinError;

      return { coin, amount, value };
    },
    onSuccess: ({ coin, amount, value }) => {
      queryClient.invalidateQueries({ queryKey: ['user-portfolio'] });
      toast({
        title: "Sale Successful",
        description: `Sold ${amount} ${coin.symbol} for $${value.toFixed(4)}`,
      });
    },
  });

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

    sendMessageMutation.mutate(newMessage);
    setNewMessage('');
  };

  const getPortfolioAmount = (coinId: string) => {
    const portfolioEntry = portfolio.find(p => p.coin_id === coinId);
    return portfolioEntry?.amount || 0;
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
              Meme Coins (Multiplayer)
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
                    <Button 
                      onClick={() => createCoinMutation.mutate(newCoin)} 
                      className="bg-green-600 hover:bg-green-700"
                      disabled={createCoinMutation.isPending}
                    >
                      {createCoinMutation.isPending ? 'Creating...' : 'Create Coin'}
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
                          <p className="text-gray-500 text-xs">Created by: {coin.creator_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">${coin.price.toFixed(6)}</div>
                        <div className={`flex items-center ${coin.change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {coin.change_24h >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                          {coin.change_24h.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 items-center">
                      <Button
                        onClick={() => buyCoinMutation.mutate({ coinId: coin.id, amount: 1000 })}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={buyCoinMutation.isPending}
                      >
                        Buy 1K
                      </Button>
                      {getPortfolioAmount(coin.id) > 0 && (
                        <Button
                          onClick={() => sellCoinMutation.mutate({ coinId: coin.id, amount: Math.min(1000, getPortfolioAmount(coin.id)) })}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={sellCoinMutation.isPending}
                        >
                          Sell 1K
                        </Button>
                      )}
                      {getPortfolioAmount(coin.id) > 0 && (
                        <span className="text-emerald-400 flex items-center ml-4">
                          Holdings: {getPortfolioAmount(coin.id).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Sidebar */}
            <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 h-fit">
              <h3 className="text-lg font-bold mb-4">Live Chat (Multiplayer)</h3>
              
              {/* Chat Messages */}
              <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                {messages.map((msg) => (
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
                  disabled={isChatBanned() || sendMessageMutation.isPending}
                  className="bg-slate-700 border-slate-600 text-sm"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || isChatBanned() || sendMessageMutation.isPending}
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
