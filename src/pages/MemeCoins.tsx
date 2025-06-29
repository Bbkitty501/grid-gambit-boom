
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, TrendingDown, MessageCircle, Send, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MemeCoin {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change_24h: number;
  market_cap: number;
  emoji: string;
  description: string | null;
  creator_name: string;
}

interface ChatMessage {
  id: string;
  message: string;
  username: string;
  created_at: string;
}

const MemeCoins = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, containsSwearWords } = useProfile();
  const { toast } = useToast();
  
  const [coins, setCoins] = useState<MemeCoin[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCoin, setNewCoin] = useState({
    name: "",
    symbol: "",
    emoji: "",
    description: ""
  });

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            MEME COINS
          </h1>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user) {
    navigate("/auth");
    return null;
  }

  // Check for swear words in email
  if (user.email && containsSwearWords(user.email)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
            ACCESS DENIED
          </h1>
          <p className="text-gray-400 mb-4">Your email contains inappropriate content.</p>
          <p className="text-gray-400 mb-8">Please create a new account with a different email address.</p>
          <Button
            onClick={() => navigate("/auth")}
            className="bg-red-600 hover:bg-red-700"
          >
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!user) return;

    // Load initial data
    loadCoins();
    loadChatMessages();

    // Set up realtime subscriptions
    const coinsChannel = supabase
      .channel('meme-coins-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'meme_coins'
      }, (payload) => {
        console.log('Coins change received:', payload);
        loadCoins();
      })
      .subscribe();

    const chatChannel = supabase
      .channel('chat-messages-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        console.log('New chat message:', payload);
        const newMessage = payload.new as ChatMessage;
        setChatMessages(prev => [...prev, newMessage]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(coinsChannel);
      supabase.removeChannel(chatChannel);
    };
  }, [user]);

  const loadCoins = async () => {
    const { data, error } = await supabase
      .from('meme_coins')
      .select('*')
      .order('market_cap', { ascending: false });

    if (error) {
      console.error('Error loading coins:', error);
    } else {
      setCoins(data || []);
    }
  };

  const loadChatMessages = async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) {
      console.error('Error loading chat messages:', error);
    } else {
      setChatMessages(data || []);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        message: newMessage.trim(),
        user_id: user.id,
        username: user.email || 'Anonymous'
      });

    if (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } else {
      setNewMessage("");
    }
  };

  const createCoin = async () => {
    if (!user) return;
    
    if (!newCoin.name || !newCoin.symbol || !newCoin.emoji) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('meme_coins')
      .insert({
        name: newCoin.name,
        symbol: newCoin.symbol.toUpperCase(),
        emoji: newCoin.emoji,
        description: newCoin.description || null,
        creator_id: user.id,
        creator_name: user.email || 'Anonymous',
        price: 0.01,
        market_cap: 1000,
        change_24h: 0
      });

    if (error) {
      console.error('Error creating coin:', error);
      toast({
        title: "Error",
        description: "Failed to create meme coin",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Meme coin created successfully!",
      });
      setNewCoin({ name: "", symbol: "", emoji: "", description: "" });
      setShowCreateForm(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            size="sm"
            className="mr-4 text-gray-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Games
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Meme Coins Trading
          </h1>
          <div className="ml-auto">
            <span className="text-sm text-gray-400 mr-4">
              Trading as: {user.email}
            </span>
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Coin
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coins List */}
          <div className="lg:col-span-2 space-y-4">
            {showCreateForm && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-green-400">Create New Meme Coin</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Coin Name"
                      value={newCoin.name}
                      onChange={(e) => setNewCoin({...newCoin, name: e.target.value})}
                      className="bg-slate-700 border-slate-600"
                    />
                    <Input
                      placeholder="Symbol (e.g., DOGE)"
                      value={newCoin.symbol}
                      onChange={(e) => setNewCoin({...newCoin, symbol: e.target.value})}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  <Input
                    placeholder="Emoji (e.g., 🚀)"
                    value={newCoin.emoji}
                    onChange={(e) => setNewCoin({...newCoin, emoji: e.target.value})}
                    className="bg-slate-700 border-slate-600"
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={newCoin.description}
                    onChange={(e) => setNewCoin({...newCoin, description: e.target.value})}
                    className="bg-slate-700 border-slate-600"
                  />
                  <div className="flex gap-2">
                    <Button onClick={createCoin} className="bg-green-600 hover:bg-green-700">
                      Create Coin
                    </Button>
                    <Button 
                      onClick={() => setShowCreateForm(false)} 
                      variant="outline"
                      className="border-slate-600"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {coins.map((coin) => (
              <Card key={coin.id} className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-3xl">{coin.emoji}</span>
                      <div>
                        <h3 className="text-xl font-bold text-white">{coin.name}</h3>
                        <p className="text-gray-400">{coin.symbol}</p>
                        <p className="text-sm text-gray-500">by {coin.creator_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">${coin.price.toFixed(4)}</p>
                      <div className="flex items-center space-x-2">
                        {coin.change_24h >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        )}
                        <span className={coin.change_24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {coin.change_24h.toFixed(2)}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">
                        Cap: ${coin.market_cap.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {coin.description && (
                    <p className="mt-3 text-gray-300 text-sm">{coin.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Live Chat */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800 border-slate-700 h-[600px] flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-yellow-400">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Live Chat
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-4">
                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className="text-sm">
                      <span className="font-semibold text-yellow-400">{msg.username}:</span>
                      <span className="text-gray-300 ml-2">{msg.message}</span>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="bg-slate-700 border-slate-600"
                  />
                  <Button onClick={sendMessage} size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemeCoins;
