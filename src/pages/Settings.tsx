import React, { useState } from 'react';
import { Settings as SettingsIcon, Info, Database, Dumbbell, ChevronRight, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { About } from './settings/About';
import { DataManagement } from './settings/DataManagement';
import { WeightliftingPlan } from './settings/WeightliftingPlan';

type SettingsView = 'main' | 'about' | 'data' | 'weightlifting';

export const Settings: React.FC = () => {
  const [currentView, setCurrentView] = useState<SettingsView>('main');
  const { signOut } = useAuth();

  if (currentView === 'about') {
    return <About onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'data') {
    return <DataManagement onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'weightlifting') {
    return <WeightliftingPlan onBack={() => setCurrentView('main')} />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center justify-between p-4 max-w-lg mx-auto">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your Transform app
            </p>
          </div>
          <SettingsIcon className="text-primary-neon" size={24} />
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto space-y-6">
        {/* Settings Menu */}
        <div className="bg-card/30 rounded-card p-6">
          <h2 className="text-lg font-semibold mb-4">Settings</h2>
          <div className="space-y-3">
            <Button
              onClick={() => setCurrentView('about')}
              className="w-full justify-between"
              variant="ghost"
            >
              <div className="flex items-center">
                <Info size={18} className="mr-3" />
                About Transform
              </div>
              <ChevronRight size={18} />
            </Button>
            
            <Button
              onClick={() => setCurrentView('data')}
              className="w-full justify-between"
              variant="ghost"
            >
              <div className="flex items-center">
                <Database size={18} className="mr-3" />
                Data Management
              </div>
              <ChevronRight size={18} />
            </Button>

            <Button
              onClick={() => setCurrentView('weightlifting')}
              className="w-full justify-between"
              variant="ghost"
            >
              <div className="flex items-center">
                <Dumbbell size={18} className="mr-3" />
                Weightlifting Plan
              </div>
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>

        {/* Account Section */}
        <div className="bg-card/30 rounded-card p-6">
          <h2 className="text-lg font-semibold mb-4">Account</h2>
          <div className="space-y-3">
            <Button
              onClick={() => signOut()}
              className="w-full justify-between"
              variant="ghost"
            >
              <div className="flex items-center">
                <LogOut size={18} className="mr-3" />
                Sign Out
              </div>
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-xs text-muted-foreground">
            Made with ❤️ for habit transformation
          </p>
        </div>
      </div>
    </div>
  );
};