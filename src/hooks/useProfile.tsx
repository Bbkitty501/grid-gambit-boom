
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Profile {
  id: string;
  username: string;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchOrCreateProfile = async () => {
      try {
        // First try to fetch existing profile
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
          setLoading(false);
          return;
        }

        if (data) {
          setProfile(data);
        } else {
          // Profile doesn't exist, create one
          console.log('Profile not found, creating new profile for user:', user.id);
          
          // Generate a random username
          const adjectives = [
            'Swift', 'Brave', 'Clever', 'Mighty', 'Silent', 'Golden', 'Silver', 'Cosmic', 
            'Mystic', 'Noble', 'Wild', 'Fierce', 'Gentle', 'Bright', 'Dark', 'Storm',
            'Fire', 'Ice', 'Thunder', 'Lightning', 'Shadow', 'Crystal', 'Diamond', 'Ruby'
          ];
          
          const animals = [
            'Wolf', 'Eagle', 'Tiger', 'Lion', 'Bear', 'Fox', 'Hawk', 'Owl', 'Shark',
            'Dolphin', 'Whale', 'Falcon', 'Raven', 'Phoenix', 'Dragon', 'Unicorn', 'Griffin',
            'Panther', 'Jaguar', 'Cheetah', 'Leopard', 'Lynx', 'Puma', 'Cougar', 'Bobcat'
          ];

          const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
          const animal = animals[Math.floor(Math.random() * animals.length)];
          const number = Math.floor(Math.random() * 900) + 100;
          const username = `The${adjective}${animal}${number}`;

          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              username: username
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error creating profile:', insertError);
          } else {
            setProfile(newProfile);
          }
        }
      } catch (error) {
        console.error('Error in fetchOrCreateProfile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrCreateProfile();
  }, [user]);

  return { profile, loading };
};
