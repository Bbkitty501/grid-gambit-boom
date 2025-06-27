
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useGameData } from "@/hooks/useGameData";
import { supabase } from "@/integrations/supabase/client";
import { Send, ArrowUpDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface MoneyTransfer {
  id: string;
  from_user_id: string;
  to_user_email: string;
  to_user_id: string | null;
  amount: number;
  status: string;
  created_at: string;
  completed_at: string | null;
}

export const MoneyTransfer = () => {
  const { user } = useAuth();
  const { gameData, updateBalance } = useGameData();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [sendAmount, setSendAmount] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const balance = gameData?.balance || 0;

  // Fetch user's money transfers
  const { data: transfers, refetch } = useQuery({
    queryKey: ['money-transfers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('money_transfers')
        .select('*')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching transfers:', error);
        return [];
      }
      
      return data as MoneyTransfer[];
    },
    enabled: !!user,
  });

  const handleSendMoney = async () => {
    if (!user || !sendAmount || !recipientEmail) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const amount = parseInt(sendAmount);
    if (amount <= 0 || amount > balance) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount within your balance",
        variant: "destructive",
      });
      return;
    }

    if (recipientEmail === user.email) {
      toast({
        title: "Error",
        description: "You cannot send money to yourself",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // First, deduct money from sender's balance
      const newBalance = balance - amount;
      updateBalance(newBalance);

      // Create the transfer record
      const { data: transfer, error: transferError } = await supabase
        .from('money_transfers')
        .insert({
          from_user_id: user.id,
          to_user_email: recipientEmail,
          amount: amount,
          status: 'pending'
        })
        .select()
        .single();

      if (transferError) {
        // Revert balance if transfer creation failed
        updateBalance(balance);
        throw transferError;
      }

      // Check if recipient exists and process transfer
      const { data: recipientData } = await supabase
        .from('user_game_data')
        .select('user_id, balance')
        .eq('user_id', `(SELECT id FROM auth.users WHERE email = '${recipientEmail}')`)
        .maybeSingle();

      if (recipientData) {
        // Recipient exists, complete the transfer
        const recipientNewBalance = recipientData.balance + amount;
        
        // Update recipient's balance
        await supabase
          .from('user_game_data')
          .update({ balance: recipientNewBalance })
          .eq('user_id', recipientData.user_id);

        // Mark transfer as completed
        await supabase
          .from('money_transfers')
          .update({ 
            status: 'completed',
            to_user_id: recipientData.user_id,
            completed_at: new Date().toISOString()
          })
          .eq('id', transfer.id);

        toast({
          title: "Transfer Completed",
          description: `Successfully sent $${amount} to ${recipientEmail}`,
        });
      } else {
        toast({
          title: "Transfer Pending",
          description: `$${amount} will be sent to ${recipientEmail} when they join the game`,
        });
      }

      setSendAmount("");
      setRecipientEmail("");
      setIsOpen(false);
      refetch();

    } catch (error) {
      console.error('Transfer error:', error);
      toast({
        title: "Transfer Failed",
        description: "There was an error processing your transfer",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Send className="w-4 h-4 mr-2" />
            Send Money
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-emerald-400">Send Money to Player</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center p-4 bg-slate-700 rounded-lg">
              <p className="text-sm text-gray-300">Your Balance</p>
              <p className="text-2xl font-bold text-emerald-400">${balance}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Email</Label>
              <Input
                id="recipient"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="Enter player's email"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                placeholder="Enter amount"
                min="1"
                max={balance}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <Button
              onClick={handleSendMoney}
              disabled={isSubmitting || !sendAmount || !recipientEmail}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? "Sending..." : "Send Money"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer History */}
      {transfers && transfers.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <ArrowUpDown className="w-5 h-5 mr-2" />
            Transfer History
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {transfers.map((transfer) => (
              <div
                key={transfer.id}
                className={`p-3 rounded-lg border ${
                  transfer.from_user_id === user?.id
                    ? 'bg-red-900/20 border-red-800'
                    : 'bg-green-900/20 border-green-800'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      {transfer.from_user_id === user?.id ? 'Sent to' : 'Received from'}: {transfer.to_user_email}
                    </p>
                    <p className="text-sm text-gray-400">
                      {new Date(transfer.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      transfer.from_user_id === user?.id ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {transfer.from_user_id === user?.id ? '-' : '+'}${transfer.amount}
                    </p>
                    <p className={`text-xs ${
                      transfer.status === 'completed' ? 'text-green-400' : 
                      transfer.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {transfer.status}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
