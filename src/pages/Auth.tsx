
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isSignIn) {
        // Sign In
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast({
            title: "Sign In Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success",
            description: "Signed in successfully!",
          });
          navigate("/");
        }
      } else {
        // Sign Up - no email confirmation needed
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          toast({
            title: "Sign Up Failed",
            description: error.message,
            variant: "destructive",
          });
        } else if (data.user && !data.session) {
          // Email confirmation is still enabled - show message
          toast({
            title: "Check Your Email",
            description: "Please check your email to verify your account before signing in.",
            variant: "default",
          });
          setIsSignIn(true);
        } else {
          // User was created and signed in immediately
          toast({
            title: "Account Created",
            description: "Welcome! You can now start playing!",
          });
          navigate("/");
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
            SHEEP SWEEPER
          </h1>
          <p className="text-gray-400">
            {isSignIn ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? "Loading..." : isSignIn ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignIn(!isSignIn)}
              className="text-emerald-400 hover:text-emerald-300 text-sm transition-colors"
            >
              {isSignIn ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
