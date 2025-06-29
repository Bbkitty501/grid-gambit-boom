
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export const useGameData = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user game data
  const { data: gameData, isLoading } = useQuery({
    queryKey: ['user-game-data', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      console.log('Fetching game data for user:', user.id);
      
      const { data, error } = await supabase
        .from('user_game_data')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching game data:', error);
        return null;
      }
      
      console.log('Game data loaded:', data);
      return data;
    },
    enabled: !!user,
    retry: 3,
    staleTime: 5000, // Consider data fresh for 5 seconds
  });

  // Update balance mutation
  const updateBalanceMutation = useMutation({
    mutationFn: async (newBalance: number) => {
      if (!user) throw new Error('User not authenticated');

      console.log('Updating balance to:', newBalance);

      const { data, error } = await supabase
        .from('user_game_data')
        .upsert({ 
          user_id: user.id,
          balance: newBalance,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Balance update error:', error);
        throw error;
      }
      
      console.log('Balance updated successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Balance update successful, updating cache');
      queryClient.setQueryData(['user-game-data', user?.id], data);
      
      // Optionally show success toast for significant balance changes
      if (Math.abs((data.balance || 0) - (gameData?.balance || 0)) > 100) {
        toast({
          title: "Balance Updated",
          description: `New balance: $${data.balance}`,
        });
      }
    },
    onError: (error) => {
      console.error('Error updating balance:', error);
      toast({
        title: "Balance Update Failed",
        description: "There was an issue updating your balance. Please try again.",
        variant: "destructive",
      });
      
      // Refetch the data to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['user-game-data', user?.id] });
    },
  });

  const updateBalance = (newBalance: number) => {
    console.log('updateBalance called with:', newBalance);
    updateBalanceMutation.mutate(newBalance);
  };

  return {
    gameData,
    isLoading,
    updateBalance,
    isUpdating: updateBalanceMutation.isPending,
  };
};
