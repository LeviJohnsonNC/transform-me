import React from 'react';
import { ArrowLeft, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserHabits } from '@/hooks/useHabits';

interface AboutProps {
  onBack: () => void;
}

export const About: React.FC<AboutProps> = ({ onBack }) => {
  const { data: habits = [] } = useUserHabits();

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center justify-between p-4 max-w-lg mx-auto">
          <Button variant="ghost" size="sm" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft size={18} />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">About Transform Me</h1>
            <Info className="text-primary-neon" size={20} />
          </div>
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto space-y-6">
        <div className="bg-card/30 rounded-card p-6">
          <h2 className="text-lg font-semibold mb-4">App Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Habits</span>
              <span>{habits.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Storage</span>
              <span>Supabase</span>
            </div>
          </div>
        </div>

        <div className="bg-card/30 rounded-card p-6">
          <h2 className="text-lg font-semibold mb-4">Transform Your Habits</h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>Transform Me is designed to help you build lasting habits through simple, consistent daily actions. Track your progress and watch your streaks grow.</p>
            <p>Built with a focus on simplicity and effectiveness, Transform Me makes habit tracking effortless so you can focus on what matters most - building the life you want.</p>
          </div>
        </div>

        <div className="text-center py-8">
          <p className="text-xs text-muted-foreground">Made with ❤️ for habit transformation</p>
        </div>
      </div>
    </div>
  );
};
