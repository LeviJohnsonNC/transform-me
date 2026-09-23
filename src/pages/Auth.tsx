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

  // The hero makes the stock button styling look pasted on; all three submits
  // share the same magenta as the rest of the app.
  const submitClass =
    'w-full h-12 rounded-[3px] font-display font-bold tracking-[0.12em] ' +
    'bg-magenta text-[#1A0210] hover:bg-magenta-soft ' +
    'disabled:bg-[#1B1230] disabled:text-dim disabled:border disabled:border-magenta/25 disabled:opacity-100';

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
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col justify-center pb-[18vh] pt-6">
      {/* Hero art, full bleed. The piece is composed with the skyline and the
          figure along its bottom edge and open sky above, so it is anchored to
          the bottom and the form sits in that sky rather than on top of the
          city. Content is padded off the bottom to keep the skyline clear. */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* The art is portrait and fills the viewport height exactly, so
            object-position does nothing vertically — the figure's height on
            screen is fixed by the composition. Scaling from the bottom edge
            lifts him up behind the form while the skyline stays anchored. */}
        <img
          src="/art/auth-hero.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: 'center bottom', transform: 'scale(1.45)', transformOrigin: 'center bottom' }}
        />
        {/* Lift the sky slightly so the wordmark has something to sit on, and
            keep the very top dark where the status bar lives. */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/75 via-background/25 to-transparent" />
      </div>

      <div className="w-full max-w-md mx-auto relative z-10 px-4">
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
        <Card className="p-6 surface-veiled rounded-[3px] edge-rule relative">
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
                  <Button type="submit" className={submitClass} disabled={isSubmitting || !email}>
                    <Mail className="mr-2" size={18} />
                    {isSubmitting ? 'SENDING' : 'SEND RESET LINK'}
                  </Button>
                </form>
              )}
            </div>
          ) : (
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2 rounded-[3px] bg-[#150E28] p-1">
              <TabsTrigger
                value="signin"
                className="rounded-[3px] font-display text-[11px] tracking-[0.18em] data-[state=active]:bg-cyan/15 data-[state=active]:text-cyan"
              >
                SIGN IN
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="rounded-[3px] font-display text-[11px] tracking-[0.18em] data-[state=active]:bg-cyan/15 data-[state=active]:text-cyan"
              >
                SIGN UP
              </TabsTrigger>
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
                  className={submitClass}
                  disabled={isSubmitting || !email || !password}
                >
                  <LogIn className="mr-2" size={18} />
                  {isSubmitting ? 'SIGNING IN' : 'SIGN IN'}
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
                  className={submitClass}
                  disabled={isSubmitting || !email || !password}
                >
                  <UserPlus className="mr-2" size={18} />
                  {isSubmitting ? 'CREATING ACCOUNT' : 'CREATE ACCOUNT'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          )}
        </Card>

        {/* Sits over the skyline now that the card has moved down, so it needs
            its own shadow to stay legible against the neon. */}
        <div
          className="text-center mt-6 font-display text-[10px] tracking-[0.2em] text-faint"
          style={{ textShadow: '0 1px 10px rgba(6,3,16,0.95), 0 0 24px rgba(6,3,16,0.8)' }}
        >
          CYCLE 01 &middot; AWAITING OPERATOR
        </div>
      </div>
    </div>
  );
};