
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
      
      const { data, error } = await supabase
        .from('user_game_data')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching game data:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!user,
  });

  // Update balance mutation
  const updateBalanceMutation = useMutation({
    mutationFn: async (newBalance: number) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_game_data')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;
      return newBalance;
    },
    onSuccess: (newBalance) => {
      queryClient.setQueryData(['user-game-data', user?.id], (oldData: any) => ({
        ...oldData,
        balance: newBalance,
      }));
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update balance",
        variant: "destructive",
      });
      console.error('Error updating balance:', error);
    },
  });

  const updateBalance = (newBalance: number) => {
    updateBalanceMutation.mutate(newBalance);
  };

  return {
    gameData,
    isLoading,
    updateBalance,
    isUpdating: updateBalanceMutation.isPending,
  };
};
