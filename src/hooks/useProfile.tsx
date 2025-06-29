
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

// This hook now just returns user email information
export const useProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Simple email validation with swear word check
  const containsSwearWords = (email: string) => {
    const swearWords = [
      'damn', 'hell', 'shit', 'fuck', 'bitch', 'ass', 'crap', 
      'piss', 'bastard', 'slut', 'whore', 'cock', 'dick', 'pussy'
    ];
    
    const emailLower = email.toLowerCase();
    return swearWords.some(word => emailLower.includes(word));
  };

  const profile = user ? {
    id: user.id,
    email: user.email,
    created_at: user.created_at,
    updated_at: user.updated_at || user.created_at
  } : null;

  return { 
    profile, 
    loading,
    containsSwearWords 
  };
};
