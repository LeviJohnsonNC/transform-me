import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogIn, UserPlus, Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const Auth: React.FC = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<'auth' | 'forgot'>('auth');
  const [resetSent, setResetSent] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Could not send reset email',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setResetSent(true);
  };

  // If user is already logged in, redirect to main app
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    await signIn(email, password);
    setIsSubmitting(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    await signUp(email, password);
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-display text-[11px] tracking-[0.24em] text-faint">LOADING</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
      {/* Art slot: drops in behind the form once public/art/auth-hero.webp
          exists. A CSS background renders nothing when the file is missing, so
          the screen is designed to read either way. */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url('/art/auth-hero.webp')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
      </div>

      {/* Horizon anchoring the foot of the screen */}
      <div className="horizon h-[210px] opacity-70" aria-hidden="true">
        <div className="horizon__grid" />
        <div className="horizon__fade" />
        <div className="horizon__sun" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display font-bold text-[34px] tracking-[0.04em] leading-none text-foreground">
            TRANSFORM<span className="text-magenta">/</span>ME
          </h1>
          <p className="font-display text-[10px] tracking-[0.24em] text-faint mt-3">
            LIGHT THE BOARD. KEEP THE CHAIN.
          </p>
        </div>

        {/* Auth Form */}
        <Card className="p-6 surface chamfer-lg edge-rule relative rounded-none">
          {mode === 'forgot' ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => { setMode('auth'); setResetSent(false); }}
                className="flex items-center text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="mr-1" size={16} />
                Back to sign in
              </button>

              {resetSent ? (
                <div className="space-y-2 text-center py-4">
                  <Mail className="mx-auto text-primary-neon" size={28} />
                  <h2 className="text-lg font-semibold">Check your email</h2>
                  <p className="text-sm text-muted-foreground">
                    We sent a reset link to {email}. It can take a few minutes — check your spam folder too.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleResetRequest} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full h-12" disabled={isSubmitting || !email}>
                    <Mail className="mr-2" size={18} />
                    {isSubmitting ? 'Sending...' : 'Send reset link'}
                  </Button>
                </form>
              )}
            </div>
          ) : (
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 mt-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting || !email || !password}
                >
                  <LogIn className="mr-2" size={18} />
                  {isSubmitting ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
              <button
                type="button"
                onClick={() => { setMode('forgot'); setResetSent(false); }}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground py-2"
              >
                Forgot password?
              </button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting || !email || !password}
                >
                  <UserPlus className="mr-2" size={18} />
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          )}
        </Card>

        <div className="text-center mt-6 font-display text-[10px] tracking-[0.2em] text-dim">
          CYCLE 01 &middot; AWAITING OPERATOR
        </div>
      </div>
    </div>
  );
};